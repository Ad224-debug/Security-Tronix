const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function buildEventEmbed(event, client, guildId) {
  const lang = client.getLanguage(guildId);
  
  const embed = new EmbedBuilder()
    .setTitle(event.title)
    .setColor(event.status === 'cancelled' ? 0xFF0000 : 0x3498DB)
    .setTimestamp();

  if (event.description) {
    embed.setDescription(event.description);
  }

  // Fecha y hora
  const startText = lang === 'en' ? '🕐 Start' : '🕐 Inicio';
  embed.addFields({
    name: startText,
    value: `<t:${Math.floor(event.startTime / 1000)}:F>`,
    inline: true
  });

  if (event.endTime) {
    const endText = lang === 'en' ? '🕐 End' : '🕐 Fin';
    embed.addFields({
      name: endText,
      value: `<t:${Math.floor(event.endTime / 1000)}:F>`,
      inline: true
    });
  }

  // Ubicación
  if (event.location) {
    const locationText = lang === 'en' ? '📍 Location' : '📍 Ubicación';
    embed.addFields({
      name: locationText,
      value: event.location,
      inline: false
    });
  }

  // Asistentes
  const attendingCount = event.attendees.filter(a => a.status === 'attending').length;
  const maybeCount = event.attendees.filter(a => a.status === 'maybe').length;
  const waitlistCount = event.attendees.filter(a => a.status === 'waitlist').length;

  let attendeeText;
  if (event.maxAttendees) {
    attendeeText = `${attendingCount}/${event.maxAttendees}`;
    if (attendingCount >= event.maxAttendees) {
      attendeeText += ' 🔴 LLENO';
    }
  } else {
    attendeeText = `${attendingCount}`;
  }

  const attendeesLabel = lang === 'en' ? '✅ Confirmed' : '✅ Confirmados';
  embed.addFields({
    name: attendeesLabel,
    value: attendeeText,
    inline: true
  });

  if (maybeCount > 0) {
    const maybeLabel = lang === 'en' ? '❓ Maybe' : '❓ Tal vez';
    embed.addFields({
      name: maybeLabel,
      value: `${maybeCount}`,
      inline: true
    });
  }

  if (waitlistCount > 0) {
    const waitlistLabel = lang === 'en' ? '⏳ Waitlist' : '⏳ Lista de espera';
    embed.addFields({
      name: waitlistLabel,
      value: `${waitlistCount}`,
      inline: true
    });
  }

  // Estado
  if (event.status === 'cancelled') {
    const cancelledText = lang === 'en' ? '❌ CANCELLED' : '❌ CANCELADO';
    embed.addFields({
      name: 'Estado',
      value: cancelledText,
      inline: false
    });
  } else if (event.status === 'completed') {
    const completedText = lang === 'en' ? '✅ COMPLETED' : '✅ COMPLETADO';
    embed.addFields({
      name: 'Estado',
      value: completedText,
      inline: false
    });
  } else if (event.status === 'ongoing') {
    const ongoingText = lang === 'en' ? '🔴 IN PROGRESS' : '🔴 EN CURSO';
    embed.addFields({
      name: 'Estado',
      value: ongoingText,
      inline: false
    });
  }

  // Imagen
  if (event.imageUrl) {
    embed.setImage(event.imageUrl);
  }

  // Footer
  embed.setFooter({ text: `ID: ${event.id}` });

  return embed;
}

function buildRSVPButtons(event, client, guildId) {
  const lang = client.getLanguage(guildId);
  
  const confirmLabel = lang === 'en' ? 'Confirm' : 'Confirmar';
  const maybeLabel = lang === 'en' ? 'Maybe' : 'Tal vez';
  const cancelLabel = lang === 'en' ? 'Cancel' : 'Cancelar';

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`event_rsvp_${event.id}_attending`)
        .setLabel(confirmLabel)
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅')
        .setDisabled(event.status !== 'scheduled'),
      new ButtonBuilder()
        .setCustomId(`event_rsvp_${event.id}_maybe`)
        .setLabel(maybeLabel)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('❓')
        .setDisabled(event.status !== 'scheduled'),
      new ButtonBuilder()
        .setCustomId(`event_rsvp_${event.id}_not_attending`)
        .setLabel(cancelLabel)
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌')
        .setDisabled(event.status !== 'scheduled')
    );

  return row;
}

async function updateEventEmbed(client, event) {
  try {
    const guild = await client.guilds.fetch(event.guildId);
    const channel = await guild.channels.fetch(event.channelId);
    const message = await channel.messages.fetch(event.messageId);

    const embed = buildEventEmbed(event, client, event.guildId);
    const buttons = buildRSVPButtons(event, client, event.guildId);

    await message.edit({
      embeds: [embed],
      components: [buttons]
    });

    return true;
  } catch (error) {
    console.error('Error updating event embed:', error);
    return false;
  }
}

module.exports = {
  buildEventEmbed,
  buildRSVPButtons,
  updateEventEmbed
};
