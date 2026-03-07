const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const { sendModLog } = require('./modsetup.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vcmute')
    .setDescription('Mute a user in voice channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to mute')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the mute')
        .setRequired(false)),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const usuario = interaction.options.getUser('user');
    const razon = interaction.options.getString('reason') || (lang === 'es' ? 'No especificada' : 'Not specified');

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

    if (miembro.voice.serverMute) {
      return await interaction.reply({
        content: lang === 'es' 
          ? '❌ El usuario ya está muteado.'
          : '❌ User is already muted.',
        ephemeral: true
      });
    }

    try {
      await miembro.voice.setMute(true, razon);

      const embed = new EmbedBuilder()
        .setTitle(lang === 'es' ? '🔇 Usuario Muteado en Voz' : '🔇 User Muted in Voice')
        .setDescription(`**${usuario.tag}** ${lang === 'es' ? 'ha sido muteado en voz' : 'has been muted in voice'}`)
        .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: lang === 'es' ? '👤 Usuario' : '👤 User', value: `${usuario}`, inline: true },
          { name: lang === 'es' ? '📍 Canal' : '📍 Channel', value: miembro.voice.channel.name, inline: true },
          { name: lang === 'es' ? '👮 Moderador' : '👮 Moderator', value: `${interaction.user}`, inline: true },
          { name: lang === 'es' ? '📝 Razón' : '📝 Reason', value: razon, inline: false }
        )
        .setColor(0xED4245)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      await sendModLog(interaction.client, interaction.guild.id, 'timeouts', embed);

      // Mensaje en canal
      const channelMessage = lang === 'es'
        ? `🔇 ${usuario} ha sido muteado en voz\n📝 **Razón:** ${razon}\n👮 **Moderador:** ${interaction.user}`
        : `🔇 ${usuario} has been muted in voice\n📝 **Reason:** ${razon}\n👮 **Moderator:** ${interaction.user}`;

      await interaction.channel.send(channelMessage);

    } catch (error) {
      console.error('Error en vcmute:', error);
      await interaction.reply({
        content: lang === 'es' ? '❌ Hubo un error al mutear al usuario.' : '❌ There was an error muting the user.',
        ephemeral: true
      });
    }
  },
};
