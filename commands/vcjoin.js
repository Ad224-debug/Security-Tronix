const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vcjoin')
    .setDescription('Bot joins your voice channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);

    if (!interaction.member.voice.channel) {
      return await interaction.reply({
        content: lang === 'es' 
          ? '❌ Debes estar en un canal de voz para usar este comando.'
          : '❌ You must be in a voice channel to use this command.',
        ephemeral: true
      });
    }

    const channel = interaction.member.voice.channel;

    try {
      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: false
      });

      connection.on(VoiceConnectionStatus.Ready, () => {
        console.log(`Bot joined voice channel: ${channel.name}`);
      });

      // Guardar conexión en el cliente para acceso posterior
      if (!interaction.client.voiceConnections) {
        interaction.client.voiceConnections = new Map();
      }
      interaction.client.voiceConnections.set(interaction.guild.id, connection);

      const embed = new EmbedBuilder()
        .setTitle(lang === 'es' ? '🔊 Bot Conectado a Voz' : '🔊 Bot Connected to Voice')
        .setDescription(lang === 'es' 
          ? `El bot se ha unido a **${channel.name}**`
          : `Bot has joined **${channel.name}**`)
        .addFields(
          { name: lang === 'es' ? '📍 Canal' : '📍 Channel', value: channel.name, inline: true },
          { name: lang === 'es' ? '👥 Usuarios' : '👥 Users', value: `${channel.members.size}`, inline: true },
          { name: lang === 'es' ? '👮 Moderador' : '👮 Moderator', value: `${interaction.user}`, inline: true }
        )
        .setColor(0x57F287)
        .setFooter({ text: lang === 'es' ? 'Usa /vcleave para desconectar' : 'Use /vcleave to disconnect' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error joining voice channel:', error);
      await interaction.reply({
        content: lang === 'es' 
          ? '❌ No pude unirme al canal de voz. Verifica mis permisos.'
          : '❌ Could not join voice channel. Check my permissions.',
        ephemeral: true
      });
    }
  },
};
