const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set slowmode for the channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption(o => o.setName('seconds').setDescription('Seconds between messages (0 to disable)').setRequired(true).setMinValue(0).setMaxValue(21600)),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const L = (es, en) => lang === 'es' ? es : en;
    const seconds = interaction.options.getInteger('seconds');

    try {
      await interaction.channel.setRateLimitPerUser(seconds);

      const msg = seconds === 0
        ? L('✅ Slowmode desactivado.', '✅ Slowmode disabled.')
        : L(`✅ Slowmode configurado a **${seconds}s**.`, `✅ Slowmode set to **${seconds}s**.`);

      await interaction.reply({ content: msg });
    } catch (error) {
      await interaction.reply({ content: '❌ Error al configurar slowmode.', flags: 64 });
    }
  },
};
