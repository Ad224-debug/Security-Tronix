const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event')
    .setDescription('Manage server events')
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Create a new event')
        .addStringOption(option =>
          option.setName('title')
            .setDescription('Event title (max 100 characters)')
            .setRequired(true)
            .setMaxLength(100))
        .addStringOption(option =>
          option.setName('start')
            .setDescription('Start time (e.g., "2024-12-25 18:00" or "tomorrow 3pm")')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('description')
            .setDescription('Event description (max 2000 characters)')
            .setMaxLength(2000))
        .addStringOption(option =>
          option.setName('end')
            .setDescription('End time (optional)'))
        .addStringOption(option =>
          option.setName('location')
            .setDescription('Event location'))
        .addIntegerOption(option =>
          option.setName('max_attendees')
            .setDescription('Maximum number of attendees')
            .setMinValue(1))
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('Role to assign to attendees'))
        .addStringOption(option =>
          option.setName('image')
            .setDescription('Image URL for the event'))
        .addStringOption(option =>
          option.setName('recurrence')
            .setDescription('Recurrence pattern')
            .addChoices(
              { name: 'Daily', value: 'daily' },
              { name: 'Weekly', value: 'weekly' },
              { name: 'Monthly', value: 'monthly' }
            ))
        .addIntegerOption(option =>
          option.setName('recurrence_interval')
            .setDescription('Recurrence interval (e.g. every 2 weeks)')
            .setMinValue(1)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('edit')
        .setDescription('Edit an existing event')
        .addStringOption(option =>
          option.setName('event_id')
            .setDescription('Event ID')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('title')
            .setDescription('New title'))
        .addStringOption(option =>
          option.setName('description')
            .setDescription('New description'))
        .addStringOption(option =>
          option.setName('start')
            .setDescription('New start time'))
        .addStringOption(option =>
          option.setName('location')
            .setDescription('New location')))
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Delete an event')
        .addStringOption(option =>
          option.setName('event_id')
            .setDescription('Event ID')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List upcoming events')
        .addStringOption(option =>
          option.setName('filter')
            .setDescription('Filter events')
            .addChoices(
              { name: 'All', value: 'all' },
              { name: 'Scheduled', value: 'scheduled' },
              { name: 'Ongoing', value: 'ongoing' },
              { name: 'My Events', value: 'mine' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('View detailed event information')
        .addStringOption(option =>
          option.setName('event_id')
            .setDescription('Event ID')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('View event participation statistics')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User to view stats for (defaults to you)')))
    .addSubcommand(subcommand =>
      subcommand
        .setName('leaderboard')
        .setDescription('View top event attendees')),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    // Cargar managers
    const EventManager = require('../events/managers/EventManager');
    const RSVPManager = require('../events/managers/RSVPManager');
    const RoleManager = require('../events/managers/RoleManager');
    const ReminderScheduler = require('../events/managers/ReminderScheduler');
    const StatisticsTracker = require('../events/managers/StatisticsTracker');
    const { buildEventEmbed, buildRSVPButtons } = require('../events/utils/embedBuilder');

    const eventManager = new EventManager();
    const rsvpManager = new RSVPManager(eventManager);
    const roleManager = new RoleManager(interaction.client);
    const reminderScheduler = new ReminderScheduler(interaction.client, eventManager);
    const statsTracker = new StatisticsTracker(eventManager);

    try {
      if (subcommand === 'create') {
        await handleCreate(interaction, eventManager, reminderScheduler);
      } else if (subcommand === 'edit') {
        await handleEdit(interaction, eventManager, reminderScheduler);
      } else if (subcommand === 'delete') {
        await handleDelete(interaction, eventManager, reminderScheduler, roleManager);
      } else if (subcommand === 'list') {
        await handleList(interaction, eventManager);
      } else if (subcommand === 'info') {
        await handleInfo(interaction, eventManager);
      } else if (subcommand === 'stats') {
        await handleStats(interaction, statsTracker);
      } else if (subcommand === 'leaderboard') {
        await handleLeaderboard(interaction, statsTracker);
      }
    } catch (error) {
      console.error('Error executing event command:', error);
      const errorMsg = error.message || 'Hubo un error al ejecutar este comando';
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: `❌ ${errorMsg}`, ephemeral: true });
      } else {
        await interaction.reply({ content: `❌ ${errorMsg}`, ephemeral: true });
      }
    }
  }
};

async function handleCreate(interaction, eventManager, reminderScheduler) {
  const title = interaction.options.getString('title');
  const startStr = interaction.options.getString('start');
  const description = interaction.options.getString('description');
  const endStr = interaction.options.getString('end');
  const location = interaction.options.getString('location');
  const maxAttendees = interaction.options.getInteger('max_attendees');
  const role = interaction.options.getRole('role');
  const imageUrl = interaction.options.getString('image');
  const recurrenceType = interaction.options.getString('recurrence');
  const recurrenceInterval = interaction.options.getInteger('recurrence_interval') || 1;

  // Parsear fechas
  const startTime = parseDateTime(startStr);
  if (!startTime) {
    return await interaction.reply({
      content: '❌ Formato de fecha inválido. Usa formato como "2024-12-25 18:00" o "tomorrow 3pm"',
      ephemeral: true
    });
  }

  let endTime = null;
  if (endStr) {
    endTime = parseDateTime(endStr);
    if (!endTime) {
      return await interaction.reply({
        content: '❌ Formato de fecha de fin inválido',
        ephemeral: true
      });
    }
  }

  // Crear evento
  const eventData = {
    title,
    description,
    startTime,
    endTime,
    location,
    maxAttendees,
    roleId: role?.id,
    imageUrl,
    recurrence: recurrenceType ? { type: recurrenceType, interval: recurrenceInterval } : undefined,
    guildId: interaction.guild.id,
    channelId: interaction.channel.id,
    creatorId: interaction.user.id,
    creatorUsername: interaction.user.username
  };

  const event = eventManager.createEvent(eventData);

  // Crear embed y enviar
  const { buildEventEmbed, buildRSVPButtons } = require('../events/utils/embedBuilder');
  const embed = buildEventEmbed(event, interaction.client, interaction.guild.id);
  const buttons = buildRSVPButtons(event, interaction.client, interaction.guild.id);

  const message = await interaction.channel.send({
    embeds: [embed],
    components: [buttons]
  });

  // Guardar messageId
  event.messageId = message.id;
  eventManager.updateEvent(event.id, { messageId: message.id });

  // Programar recordatorios
  reminderScheduler.scheduleReminders(event);

  // Log de auditoría
  try {
    const { EmbedBuilder } = require('discord.js');
    const logEmbed = new EmbedBuilder()
      .setTitle('📅 Evento Creado')
      .setColor(0x57F287)
      .addFields(
        { name: 'Evento', value: `${event.title} (\`${event.id}\`)`, inline: false },
        { name: 'Creador', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Inicio', value: `<t:${Math.floor(event.startTime / 1000)}:F>`, inline: true }
      )
      .setTimestamp();
    await interaction.client.sendLog(interaction.guild, logEmbed);
  } catch {}

  await interaction.reply({
    content: `✅ Evento creado exitosamente! ID: \`${event.id}\``,
    ephemeral: true
  });
}

async function handleEdit(interaction, eventManager, reminderScheduler) {
  const eventId = interaction.options.getString('event_id');
  const event = eventManager.getEvent(eventId);

  if (!event) {
    return await interaction.reply({
      content: '❌ Evento no encontrado',
      ephemeral: true
    });
  }

  // Verificar permisos
  if (event.creatorId !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return await interaction.reply({
      content: '❌ Solo el creador del evento o un administrador puede editarlo',
      ephemeral: true
    });
  }

  const updates = {};
  const title = interaction.options.getString('title');
  const description = interaction.options.getString('description');
  const startStr = interaction.options.getString('start');
  const location = interaction.options.getString('location');

  if (title) updates.title = title;
  if (description) updates.description = description;
  if (location) updates.location = location;

  if (startStr) {
    const startTime = parseDateTime(startStr);
    if (!startTime) {
      return await interaction.reply({
        content: '❌ Formato de fecha inválido',
        ephemeral: true
      });
    }
    updates.startTime = startTime;

    // Reprogramar recordatorios
    reminderScheduler.cancelReminders(eventId);
    reminderScheduler.scheduleReminders({ ...event, ...updates });
  }

  eventManager.updateEvent(eventId, updates);

  // Actualizar embed
  const { updateEventEmbed } = require('../events/utils/embedBuilder');
  await updateEventEmbed(interaction.client, eventManager.getEvent(eventId));

  // Log de auditoría
  try {
    const { EmbedBuilder } = require('discord.js');
    const changedFields = Object.keys(updates).join(', ');
    const logEmbed = new EmbedBuilder()
      .setTitle('✏️ Evento Editado')
      .setColor(0xFEE75C)
      .addFields(
        { name: 'Evento', value: `${event.title} (\`${eventId}\`)`, inline: false },
        { name: 'Editor', value: `<@${interaction.user.id}>`, inline: true },
        { name: 'Campos modificados', value: changedFields || 'ninguno', inline: true }
      )
      .setTimestamp();
    await interaction.client.sendLog(interaction.guild, logEmbed);
  } catch {}

  await interaction.reply({
    content: '✅ Evento actualizado exitosamente',
    ephemeral: true
  });
}

async function handleDelete(interaction, eventManager, reminderScheduler, roleManager) {
  const eventId = interaction.options.getString('event_id');
  const event = eventManager.getEvent(eventId);

  if (!event) {
    return await interaction.reply({
      content: '❌ Evento no encontrado',
      ephemeral: true
    });
  }

  // Verificar permisos
  if (event.creatorId !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return await interaction.reply({
      content: '❌ Solo el creador del evento o un administrador puede eliminarlo',
      ephemeral: true
    });
  }

  // Cancelar recordatorios
  reminderScheduler.cancelReminders(eventId);

  // Remover roles
  if (event.roleId) {
    await roleManager.removeAllEventRoles(interaction.guild, event);
  }

  // Marcar como cancelado
  eventManager.deleteEvent(eventId);

  // Actualizar embed
  const { updateEventEmbed } = require('../events/utils/embedBuilder');
  await updateEventEmbed(interaction.client, eventManager.getEvent(eventId));

  // Log de auditoría
  try {
    const { EmbedBuilder } = require('discord.js');
    const logEmbed = new EmbedBuilder()
      .setTitle('🗑️ Evento Eliminado')
      .setColor(0xED4245)
      .addFields(
        { name: 'Evento', value: `${event.title} (\`${eventId}\`)`, inline: false },
        { name: 'Eliminado por', value: `<@${interaction.user.id}>`, inline: true }
      )
      .setTimestamp();
    await interaction.client.sendLog(interaction.guild, logEmbed);
  } catch {}

  await interaction.reply({
    content: '✅ Evento cancelado exitosamente',
    ephemeral: true
  });
}

async function handleList(interaction, eventManager) {
  const filter = interaction.options.getString('filter') || 'all';
  let events;

  if (filter === 'mine') {
    events = eventManager.getGuildEvents(interaction.guild.id, {
      creatorId: interaction.user.id
    });
  } else if (filter === 'all') {
    events = eventManager.getGuildEvents(interaction.guild.id);
  } else {
    events = eventManager.getGuildEvents(interaction.guild.id, {
      status: filter
    });
  }

  if (events.length === 0) {
    return await interaction.reply({
      content: '📅 No hay eventos para mostrar',
      ephemeral: true
    });
  }

  const { EmbedBuilder } = require('discord.js');
  const embed = new EmbedBuilder()
    .setTitle('📅 Lista de Eventos')
    .setColor(0x3498DB)
    .setTimestamp();

  events.slice(0, 10).forEach(event => {
    const attendingCount = event.attendees.filter(a => a.status === 'attending').length;
    const statusEmoji = event.status === 'scheduled' ? '🟢' : event.status === 'ongoing' ? '🔴' : '⚪';
    
    embed.addFields({
      name: `${statusEmoji} ${event.title}`,
      value: `ID: \`${event.id}\`\nInicio: <t:${Math.floor(event.startTime / 1000)}:R>\nAsistentes: ${attendingCount}${event.maxAttendees ? `/${event.maxAttendees}` : ''}`,
      inline: false
    });
  });

  if (events.length > 10) {
    embed.setFooter({ text: `Mostrando 10 de ${events.length} eventos` });
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleInfo(interaction, eventManager) {
  const eventId = interaction.options.getString('event_id');
  const event = eventManager.getEvent(eventId);

  if (!event) {
    return await interaction.reply({
      content: '❌ Evento no encontrado',
      ephemeral: true
    });
  }

  const { buildEventEmbed } = require('../events/utils/embedBuilder');
  const embed = buildEventEmbed(event, interaction.client, interaction.guild.id);

  // Agregar lista de asistentes
  const attending = event.attendees.filter(a => a.status === 'attending');
  if (attending.length > 0) {
    const attendeeList = attending.slice(0, 10).map(a => `<@${a.userId}>`).join(', ');
    embed.addFields({
      name: '👥 Asistentes',
      value: attendeeList + (attending.length > 10 ? ` y ${attending.length - 10} más` : ''),
      inline: false
    });
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleStats(interaction, statsTracker) {
  const user = interaction.options.getUser('user') || interaction.user;
  const stats = statsTracker.getUserStats(interaction.guild.id, user.id);

  const { EmbedBuilder } = require('discord.js');
  const embed = new EmbedBuilder()
    .setTitle(`📊 Estadísticas de ${user.username}`)
    .setColor(0x3498DB)
    .setThumbnail(user.displayAvatarURL())
    .addFields(
      { name: '✅ Eventos Asistidos', value: `${stats.eventsAttended}`, inline: true },
      { name: '📝 Eventos Creados', value: `${stats.eventsCreated}`, inline: true },
      { name: '📈 Tasa de Asistencia', value: `${stats.attendanceRate}%`, inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleLeaderboard(interaction, statsTracker) {
  const topUsers = statsTracker.getTopAttendees(interaction.guild.id, 10);

  if (topUsers.length === 0) {
    return await interaction.reply({
      content: '📊 No hay estadísticas disponibles aún',
      ephemeral: true
    });
  }

  const { EmbedBuilder } = require('discord.js');
  const embed = new EmbedBuilder()
    .setTitle('🏆 Top Asistentes a Eventos')
    .setColor(0xFFD700)
    .setTimestamp();

  topUsers.forEach((user, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
    embed.addFields({
      name: `${medal} ${user.username}`,
      value: `Eventos: ${user.eventsAttended} | Creados: ${user.eventsCreated} | Asistencia: ${user.attendanceRate}%`,
      inline: false
    });
  });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

function parseDateTime(str) {
  // Intentar parsear diferentes formatos
  try {
    // Formato ISO o similar
    const date = new Date(str);
    if (!isNaN(date.getTime())) {
      return date.getTime();
    }

    // Formato "tomorrow 3pm", "today 5pm", etc.
    const lowerStr = str.toLowerCase();
    const now = new Date();
    
    if (lowerStr.includes('tomorrow')) {
      now.setDate(now.getDate() + 1);
    }
    
    // Extraer hora
    const hourMatch = str.match(/(\d{1,2})\s*(am|pm|:)/i);
    if (hourMatch) {
      let hour = parseInt(hourMatch[1]);
      if (lowerStr.includes('pm') && hour < 12) hour += 12;
      if (lowerStr.includes('am') && hour === 12) hour = 0;
      now.setHours(hour, 0, 0, 0);
      return now.getTime();
    }

    return null;
  } catch (error) {
    return null;
  }
}
