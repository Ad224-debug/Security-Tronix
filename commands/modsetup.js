const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('modsetup')
    .setDescription('Configure moderation logging channels')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('kicks')
        .setDescription('Set channel for kick logs')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('Channel for kick logs')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('bans')
        .setDescription('Set channel for ban logs')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('Channel for ban logs')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('warnings')
        .setDescription('Set channel for warning logs')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('Channel for warning logs')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('timeouts')
        .setDescription('Set channel for timeout logs')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('Channel for timeout logs')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('automod')
        .setDescription('Set channel for auto-moderation logs')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('Channel for auto-mod logs')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('all')
        .setDescription('Set one channel for all moderation logs')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('Channel for all logs')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View current moderation log configuration')),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const subcommand = interaction.options.getSubcommand();
    const configPath = path.join(__dirname, '../config.json');
    
    let config = {};
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    if (!config.modLogs) {
      config.modLogs = {};
    }

    if (!config.modLogs[interaction.guild.id]) {
      config.modLogs[interaction.guild.id] = {
        kicks: null,
        bans: null,
        warnings: null,
        timeouts: null,
        automod: null
      };
    }

    const guildLogs = config.modLogs[interaction.guild.id];

    if (subcommand === 'view') {
      const embed = new EmbedBuilder()
        .setTitle(lang === 'es' ? '⚙️ Configuración de Logs de Moderación' : '⚙️ Moderation Logs Configuration')
        .setColor(0x5865F2)
        .addFields(
          { 
            name: lang === 'es' ? '👢 Expulsiones' : '👢 Kicks', 
            value: guildLogs.kicks ? `<#${guildLogs.kicks}>` : (lang === 'es' ? 'No configurado' : 'Not configured'),
            inline: true 
          },
          { 
            name: lang === 'es' ? '🔨 Baneos' : '🔨 Bans', 
            value: guildLogs.bans ? `<#${guildLogs.bans}>` : (lang === 'es' ? 'No configurado' : 'Not configured'),
            inline: true 
          },
          { 
            name: lang === 'es' ? '⚠️ Advertencias' : '⚠️ Warnings', 
            value: guildLogs.warnings ? `<#${guildLogs.warnings}>` : (lang === 'es' ? 'No configurado' : 'Not configured'),
            inline: true 
          },
          { 
            name: lang === 'es' ? '⏱️ Timeouts' : '⏱️ Timeouts', 
            value: guildLogs.timeouts ? `<#${guildLogs.timeouts}>` : (lang === 'es' ? 'No configurado' : 'Not configured'),
            inline: true 
          },
          { 
            name: lang === 'es' ? '🤖 Auto-Moderación' : '🤖 Auto-Moderation', 
            value: guildLogs.automod ? `<#${guildLogs.automod}>` : (lang === 'es' ? 'No configurado' : 'Not configured'),
            inline: true 
          }
        )
        .setFooter({ text: lang === 'es' ? 'Usa /modsetup <tipo> para configurar' : 'Use /modsetup <type> to configure' })
        .setTimestamp();

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const channel = interaction.options.getChannel('channel');

    if (subcommand === 'all') {
      guildLogs.kicks = channel.id;
      guildLogs.bans = channel.id;
      guildLogs.warnings = channel.id;
      guildLogs.timeouts = channel.id;
      guildLogs.automod = channel.id;

      config.modLogs[interaction.guild.id] = guildLogs;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      return await interaction.reply({
        content: lang === 'es' 
          ? `✅ Todos los logs de moderación configurados en: ${channel}`
          : `✅ All moderation logs configured to: ${channel}`,
        ephemeral: true
      });
    }

    guildLogs[subcommand] = channel.id;
    config.modLogs[interaction.guild.id] = guildLogs;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    const typeNames = {
      kicks: lang === 'es' ? 'expulsiones' : 'kicks',
      bans: lang === 'es' ? 'baneos' : 'bans',
      warnings: lang === 'es' ? 'advertencias' : 'warnings',
      timeouts: lang === 'es' ? 'timeouts' : 'timeouts',
      automod: lang === 'es' ? 'auto-moderación' : 'auto-moderation'
    };

    await interaction.reply({
      content: lang === 'es' 
        ? `✅ Canal de logs de ${typeNames[subcommand]} configurado: ${channel}`
        : `✅ ${typeNames[subcommand]} log channel configured: ${channel}`,
      ephemeral: true
    });
  },
};

// Función helper para enviar logs
async function sendModLog(client, guildId, type, embed) {
  const configPath = path.join(__dirname, '../config.json');
  
  if (!fs.existsSync(configPath)) return;
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const channelId = config.modLogs?.[guildId]?.[type];
  
  if (!channelId) return;
  
  try {
    const guild = await client.guilds.fetch(guildId);
    const channel = await guild.channels.fetch(channelId);
    if (channel) {
      await channel.send({ embeds: [embed] });
    }
  } catch (error) {
    console.error(`Error sending ${type} log:`, error);
  }
}

module.exports.sendModLog = sendModLog;
