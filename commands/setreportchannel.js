const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setreportchannel')
    .setDescription('Set the channel for user reports')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel for reports')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const channel = interaction.options.getChannel('channel');
    const configPath = path.join(__dirname, '../config.json');
    
    let config = {};
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    if (!config.reportChannels) {
      config.reportChannels = {};
    }

    config.reportChannels[interaction.guild.id] = channel.id;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    await interaction.reply({
      content: lang === 'es' 
        ? `✅ Canal de reportes configurado: ${channel}`
        : `✅ Report channel configured: ${channel}`,
      ephemeral: true
    });
  }
};
