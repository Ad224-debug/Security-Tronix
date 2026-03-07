const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vcleave')
    .setDescription('Bot leaves the voice channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const connection = getVoiceConnection(interaction.guild.id);

    if (!connection) {
      return await interaction.reply({
        content: lang === 'es' 
          ? '❌ El bot no está en ningún canal de voz.'
          : '❌ Bot is not in any voice channel.',
        ephemeral: true
      });
    }

    const channelId = connection.joinConfig.channelId;
    const channel = interaction.guild.channels.cache.get(channelId);

    connection.destroy();

    // Limpiar del mapa de conexiones
    if (interaction.client.voiceConnections) {
      interaction.client.voiceConnections.delete(interaction.guild.id);
    }

    const embed = new EmbedBuilder()
      .setTitle(lang === 'es' ? '🔇 Bot Desconectado de Voz' : '🔇 Bot Disconnected from Voice')
      .setDescription(lang === 'es' 
        ? `El bot se ha desconectado de **${channel?.name || 'canal de voz'}**`
        : `Bot has disconnected from **${channel?.name || 'voice channel'}**`)
      .addFields(
        { name: lang === 'es' ? '👮 Moderador' : '👮 Moderator', value: `${interaction.user}`, inline: true }
      )
      .setColor(0xED4245)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
