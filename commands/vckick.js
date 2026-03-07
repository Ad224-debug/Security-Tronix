const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const { sendModLog } = require('./modsetup.js');
const { createCase } = require('./case.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vckick')
    .setDescription('Kick a user from voice channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to kick from voice')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the kick')
        .setRequired(true)),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const usuario = interaction.options.getUser('user');
    const razon = interaction.options.getString('reason');

    const connection = getVoiceConnection(interaction.guild.id);
    if (!connection) {
      return await interaction.reply({
        content: lang === 'es' 
          ? '❌ El bot debe estar en un canal de voz para usar este comando. Usa `/vcjoin` primero.'
          : '❌ Bot must be in a voice channel to use this command. Use `/vcjoin` first.',
        ephemeral: true
      });
    }

    const miembro = await interaction.guild.members.fetch(usuario.id).catch(() => null);
    if (!miembro) {
      return await interaction.reply({
        content: lang === 'es' ? '❌ Usuario no encontrado.' : '❌ User not found.',
        ephemeral: true
      });
    }

    if (!miembro.voice.channel) {
      return await interaction.reply({
        content: lang === 'es' 
          ? '❌ El usuario no está en un canal de voz.'
          : '❌ User is not in a voice channel.',
        ephemeral: true
      });
    }

    const voiceChannel = miembro.voice.channel;

    // Validaciones de seguridad
    if (usuario.id === interaction.user.id) {
      return await interaction.reply({
        content: lang === 'es' ? '❌ No puedes expulsarte a ti mismo.' : '❌ You cannot kick yourself.',
        ephemeral: true
      });
    }

    if (usuario.id === interaction.guild.ownerId) {
      return await interaction.reply({
        content: lang === 'es' ? '❌ No puedes expulsar al dueño del servidor.' : '❌ You cannot kick the server owner.',
        ephemeral: true
      });
    }

    if (miembro.roles.highest.position >= interaction.member.roles.highest.position) {
      return await interaction.reply({
        content: lang === 'es' 
          ? '❌ No puedes expulsar a alguien con un rol igual o superior al tuyo.'
          : '❌ You cannot kick someone with an equal or higher role.',
        ephemeral: true
      });
    }

    try {
      // Enviar DM al usuario
      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle(lang === 'es' ? '🔊 Expulsado del Canal de Voz' : '🔊 Kicked from Voice Channel')
          .setDescription(lang === 'es' 
            ? `Has sido expulsado del canal de voz **${voiceChannel.name}** en **${interaction.guild.name}**`
            : `You have been kicked from voice channel **${voiceChannel.name}** in **${interaction.guild.name}**`)
          .addFields(
            { name: lang === 'es' ? '📝 Razón' : '📝 Reason', value: razon },
            { name: lang === 'es' ? '👮 Moderador' : '👮 Moderator', value: interaction.user.tag }
          )
          .setColor(0xFEE75C)
          .setTimestamp();

        await usuario.send({ embeds: [dmEmbed] });
      } catch (error) {
        // Usuario tiene DMs desactivados
      }

      // Desconectar del canal de voz
      await miembro.voice.disconnect(razon);

      // Crear caso de moderación
      const caseId = createCase(
        interaction.guild.id,
        'vckick',
        usuario.id,
        interaction.user.id,
        razon
      );

      // Embed de confirmación
      const embed = new EmbedBuilder()
        .setTitle(lang === 'es' ? '🔊 Usuario Expulsado de Voz' : '🔊 User Kicked from Voice')
        .setDescription(`**${usuario.tag}** ${lang === 'es' ? 'ha sido expulsado del canal de voz' : 'has been kicked from voice channel'}`)
        .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: lang === 'es' ? '👤 Usuario' : '👤 User', value: `${usuario} (${usuario.id})`, inline: true },
          { name: lang === 'es' ? '📍 Canal' : '📍 Channel', value: voiceChannel.name, inline: true },
          { name: lang === 'es' ? '👮 Moderador' : '👮 Moderator', value: `${interaction.user}`, inline: true },
          { name: lang === 'es' ? '📝 Razón' : '📝 Reason', value: razon, inline: false },
          { name: lang === 'es' ? '📋 Caso' : '📋 Case', value: `#${caseId}`, inline: true }
        )
        .setColor(0xFEE75C)
        .setFooter({ text: lang === 'es' ? 'Expulsión de voz' : 'Voice kick' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      // Enviar a logs
      await sendModLog(interaction.client, interaction.guild.id, 'kicks', embed);

      // Enviar mensaje en el canal de texto mencionando al usuario
      const channelMessage = lang === 'es'
        ? `🔊 ${usuario} ha sido expulsado del canal de voz **${voiceChannel.name}**\n📝 **Razón:** ${razon}\n👮 **Moderador:** ${interaction.user}`
        : `🔊 ${usuario} has been kicked from voice channel **${voiceChannel.name}**\n📝 **Reason:** ${razon}\n👮 **Moderator:** ${interaction.user}`;

      await interaction.channel.send(channelMessage);

    } catch (error) {
      console.error('Error en vckick:', error);
      await interaction.reply({
        content: lang === 'es' ? '❌ Hubo un error al expulsar al usuario.' : '❌ There was an error kicking the user.',
        ephemeral: true
      });
    }
  },
};
