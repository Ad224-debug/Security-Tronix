// Sistema AFK - Solo funciona con prefijo, no con slash commands
const { EmbedBuilder } = require('discord.js');
const afkUsers = new Map();

function setupAFKSystem(client) {
  // Detectar cuando alguien menciona a un usuario AFK
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Verificar si el usuario que escribe está AFK y lo quitamos
    if (afkUsers.has(message.author.id)) {
      const afkData = afkUsers.get(message.author.id);
      afkUsers.delete(message.author.id);
      
      // Restaurar nickname
      try {
        const member = message.guild.members.cache.get(message.author.id);
        if (member && member.nickname && member.nickname.startsWith('[AFK] ')) {
          const originalNick = member.nickname.replace('[AFK] ', '');
          await member.setNickname(originalNick.substring(0, 32));
        }
      } catch (error) {
        console.log('No se pudo restaurar el nickname:', error.message);
      }

      const welcomeEmbed = new EmbedBuilder()
        .setTitle('👋 Bienvenido de vuelta')
        .setDescription(`${message.author} ya no está AFK`)
        .setColor(0x57F287)
        .setThumbnail(message.author.displayAvatarURL({ size: 128 }))
        .setTimestamp();

      await message.reply({
        embeds: [welcomeEmbed],
        allowedMentions: { repliedUser: false }
      });
      return;
    }

    // Verificar si mencionaron a alguien AFK
    const mentions = message.mentions.users;
    if (mentions.size > 0) {
      mentions.forEach(async (user) => {
        if (afkUsers.has(user.id)) {
          const afkData = afkUsers.get(user.id);
          const timeAFK = Date.now() - afkData.timestamp;
          const timeString = formatTime(timeAFK);

          const afkEmbed = new EmbedBuilder()
            .setTitle('💤 Usuario AFK')
            .setDescription(`**${user.username}** está ausente`)
            .addFields(
              { name: '⏰ Tiempo AFK', value: timeString, inline: true },
              { name: '📝 Razón', value: afkData.reason, inline: false }
            )
            .setThumbnail(user.displayAvatarURL({ size: 128 }))
            .setColor(0xFEE75C)
            .setTimestamp();

          await message.reply({
            embeds: [afkEmbed],
            allowedMentions: { repliedUser: false }
          });
        }
      });
    }

    // Verificar si respondieron a un mensaje de alguien AFK
    if (message.reference) {
      try {
        const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
        if (repliedMessage && afkUsers.has(repliedMessage.author.id)) {
          const afkData = afkUsers.get(repliedMessage.author.id);
          const timeAFK = Date.now() - afkData.timestamp;
          const timeString = formatTime(timeAFK);

          const afkEmbed = new EmbedBuilder()
            .setTitle('💤 Usuario AFK')
            .setDescription(`**${repliedMessage.author.username}** está ausente`)
            .addFields(
              { name: '⏰ Tiempo AFK', value: timeString, inline: true },
              { name: '📝 Razón', value: afkData.reason, inline: false }
            )
            .setThumbnail(repliedMessage.author.displayAvatarURL({ size: 128 }))
            .setColor(0xFEE75C)
            .setTimestamp();

          await message.reply({
            embeds: [afkEmbed],
            allowedMentions: { repliedUser: false }
          });
        }
      } catch (error) {
        // Ignorar si no se puede obtener el mensaje
      }
    }
  });
}

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} día(s), ${hours % 24} hora(s)`;
  } else if (hours > 0) {
    return `${hours} hora(s), ${minutes % 60} minuto(s)`;
  } else if (minutes > 0) {
    return `${minutes} minuto(s), ${seconds % 60} segundo(s)`;
  } else {
    return `${seconds} segundo(s)`;
  }
}

module.exports = {
  data: {
    name: 'afk',
    description: 'Marca que estás AFK (solo funciona con prefijo)',
    prefixOnly: true,
  },
  async execute(interaction) {
    // Si es un comando slash, rechazar
    if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
      return await interaction.reply({
        content: '❌ Este comando solo funciona con prefijo de texto. Usa `!afk [razón]` o el prefijo configurado.',
        ephemeral: true
      });
    }

    // Obtener la razón del AFK
    let reason = 'No especificada';
    
    if (interaction.content) {
      const args = interaction.content.split(' ').slice(1);
      if (args.length > 0) {
        reason = args.join(' ');
      }
    }

    // Guardar usuario como AFK
    afkUsers.set(interaction.user.id, {
      reason: reason,
      timestamp: Date.now(),
      username: interaction.user.username
    });

    // Cambiar nickname
    try {
      const member = interaction.guild.members.cache.get(interaction.user.id);
      if (member) {
        const currentNick = member.nickname || member.user.username;
        if (!currentNick.startsWith('[AFK] ')) {
          const newNick = `[AFK] ${currentNick}`.substring(0, 32);
          await member.setNickname(newNick);
        }
      }
    } catch (error) {
      console.log('No se pudo cambiar el nickname:', error.message);
    }

    // Crear embed de confirmación
    const afkEmbed = new EmbedBuilder()
      .setTitle('💤 Estado AFK Activado')
      .setDescription(`**${interaction.user.username}** ahora está ausente`)
      .addFields(
        { name: '📝 Razón', value: reason, inline: false },
        { name: '💡 Nota', value: 'Escribe cualquier mensaje para desactivar el modo AFK', inline: false }
      )
      .setThumbnail(interaction.user.displayAvatarURL({ size: 128 }))
      .setColor(0x5865F2)
      .setTimestamp();

    if (interaction.reply) {
      await interaction.reply({ embeds: [afkEmbed] });
    } else if (interaction.channel) {
      await interaction.channel.send({ embeds: [afkEmbed] });
    }
  },
  setupAFKSystem,
  afkUsers,
};
