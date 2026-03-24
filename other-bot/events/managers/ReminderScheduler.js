const fs = require('fs');
const path = require('path');

class ReminderScheduler {
  constructor(client, eventManager) {
    this.client = client;
    this.eventManager = eventManager;
    this.remindersPath = path.join(__dirname, '../../data/reminders.json');
    this.config = eventManager.config;
    this.loadReminders();
  }

  loadReminders() {
    try {
      if (fs.existsSync(this.remindersPath)) {
        const data = JSON.parse(fs.readFileSync(this.remindersPath, 'utf8'));
        this.pending = data.pending || [];
        this.sent = data.sent || [];
      } else {
        this.pending = [];
        this.sent = [];
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
      this.pending = [];
      this.sent = [];
    }
  }

  saveReminders() {
    try {
      const data = {
        pending: this.pending,
        sent: this.sent
      };
      fs.writeFileSync(this.remindersPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving reminders:', error);
    }
  }

  scheduleReminders(event) {
    if (!this.config.reminders.enabled) return;

    const reminders = [];
    const now = Date.now();

    this.config.reminders.intervals.forEach(interval => {
      let reminderTime;
      
      if (interval.hours === 0) {
        // Recordatorio al inicio del evento
        reminderTime = event.startTime;
      } else {
        // Recordatorio X horas antes
        reminderTime = event.startTime - (interval.hours * 60 * 60 * 1000);
      }

      // Solo crear recordatorios futuros
      if (reminderTime > now) {
        reminders.push({
          id: `${event.id}-${interval.label}`,
          eventId: event.id,
          scheduledTime: reminderTime,
          type: interval.label,
          createdAt: now
        });
      }
    });

    // Agregar a pending
    this.pending.push(...reminders);
    this.saveReminders();

    return reminders;
  }

  cancelReminders(eventId) {
    this.pending = this.pending.filter(r => r.eventId !== eventId);
    this.saveReminders();
  }

  async checkAndSendReminders() {
    const now = Date.now();
    const dueReminders = this.pending.filter(r => r.scheduledTime <= now);

    if (dueReminders.length === 0) return 0;

    let sent = 0;

    for (const reminder of dueReminders) {
      try {
        const success = await this.sendReminder(reminder);
        if (success) {
          // Mover a sent
          this.pending = this.pending.filter(r => r.id !== reminder.id);
          reminder.sentAt = now;
          this.sent.push(reminder);
          sent++;
        }
      } catch (error) {
        console.error(`Error sending reminder ${reminder.id}:`, error);
      }
    }

    if (sent > 0) {
      this.saveReminders();
      console.log(`✅ Sent ${sent} reminders`);
    }

    return sent;
  }

  async sendReminder(reminder) {
    const event = this.eventManager.getEvent(reminder.eventId);
    if (!event) return false;

    if (event.status === 'cancelled') {
      return true; // Marcar como enviado para no reintentar
    }

    const attendees = event.attendees.filter(a => a.status === 'attending');
    if (attendees.length === 0) return true;

    const guild = await this.client.guilds.fetch(event.guildId);
    if (!guild) return false;

    // Obtener texto del recordatorio
    const reminderText = this.getReminderText(event, reminder.type, guild.id);

    // Enviar en lotes de 10
    const batches = [];
    for (let i = 0; i < attendees.length; i += 10) {
      batches.push(attendees.slice(i, i + 10));
    }

    for (const batch of batches) {
      await Promise.all(batch.map(attendee => 
        this.sendReminderToUser(guild, attendee.userId, reminderText, event)
      ));
      
      // Esperar 1 segundo entre lotes
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return true;
  }

  async sendReminderToUser(guild, userId, text, event) {
    try {
      const user = await this.client.users.fetch(userId);
      if (!user) return;

      const { EmbedBuilder } = require('discord.js');
      const embed = new EmbedBuilder()
        .setTitle('🔔 Recordatorio de Evento')
        .setDescription(text)
        .setColor(0x3498DB)
        .addFields(
          { name: '📅 Evento', value: event.title, inline: false },
          { name: '🕐 Inicio', value: `<t:${Math.floor(event.startTime / 1000)}:F>`, inline: false }
        )
        .setTimestamp();

      if (event.location) {
        embed.addFields({ name: '📍 Ubicación', value: event.location, inline: false });
      }

      if (event.imageUrl) {
        embed.setThumbnail(event.imageUrl);
      }

      await user.send({ embeds: [embed] });
    } catch (error) {
      // Si no se puede enviar DM, intentar mencionar en el canal
      if (error.code === 50007) {
        try {
          const channel = await guild.channels.fetch(event.channelId);
          if (channel) {
            await channel.send(`<@${userId}> ${text}`);
          }
        } catch (channelError) {
          console.error('Could not send reminder to user:', userId);
        }
      }
    }
  }

  getReminderText(event, type, guildId) {
    const lang = this.client.getLanguage(guildId);
    const attendingCount = event.attendees.filter(a => a.status === 'attending').length;

    if (lang === 'en') {
      if (type === '24h') {
        return `⏰ The event **${event.title}** starts in 24 hours! ${attendingCount} people confirmed.`;
      } else if (type === '1h') {
        return `⏰ The event **${event.title}** starts in 1 hour! ${attendingCount} people confirmed.`;
      } else {
        return `🎉 The event **${event.title}** is starting now! ${attendingCount} people confirmed.`;
      }
    } else {
      if (type === '24h') {
        return `⏰ ¡El evento **${event.title}** comienza en 24 horas! ${attendingCount} personas confirmadas.`;
      } else if (type === '1h') {
        return `⏰ ¡El evento **${event.title}** comienza en 1 hora! ${attendingCount} personas confirmadas.`;
      } else {
        return `🎉 ¡El evento **${event.title}** está comenzando ahora! ${attendingCount} personas confirmadas.`;
      }
    }
  }

  cleanupOldReminders() {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 días
    this.sent = this.sent.filter(r => r.sentAt > cutoff);
    this.saveReminders();
  }
}

module.exports = ReminderScheduler;
