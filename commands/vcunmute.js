const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vcunmute')
    .setDescription('Unmute a user in voice channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to unmute')
        .setRequired(true)),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const usuario = interaction.options.getUser('user');

    const connection = getVoiceConnection(interaction.guild.id);
    if (!connection) {
      return await interaction.reply({
        content: lang === 'es' 
          ? '❌ El bot debe estar en un canal de voz para usar este comando.'
          : '❌ Bot must be in a voice channel to use this command.',
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

    if (!miembro.voice.serverMute) {
      return await interaction.reply({
        content: lang === 'es' 
          ? '❌ El usuario no está muteado.'
          : '❌ User is not muted.',
        ephemeral: true
      });
    }

    try {
      await miembro.voice.setMute(false);

      const embed = new EmbedBuilder()
        .setTitle(lang === 'es' ? '🔊 Usuario Desmuteado en Voz' : '🔊 User Unmuted in Voice')
        .setDescription(`**${usuario.tag}** ${lang === 'es' ? 'ha sido desmuteado en voz' : 'has been unmuted in voice'}`)
        .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: lang === 'es' ? '👤 Usuario' : '👤 User', value: `${usuario}`, inline: true },
          { name: lang === 'es' ? '📍 Canal' : '📍 Channel', value: miembro.voice.channel.name, inline: true },
          { name: lang === 'es' ? '👮 Moderador' : '👮 Moderator', value: `${interaction.user}`, inline: true }
        )
        .setColor(0x57F287)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error en vcunmute:', error);
      await interaction.reply({
        content: lang === 'es' ? '❌ Hubo un error al desmutear al usuario.' : '❌ There was an error unmuting the user.',
        ephemeral: true
      });
    }
  },
};
