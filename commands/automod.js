const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Configure auto-moderation settings')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('spam')
        .setDescription('Configure spam detection')
        .addBooleanOption(option =>
          option.setName('enabled')
            .setDescription('Enable spam detection')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('messages')
            .setDescription('Max messages in timeframe (default: 5)')
            .setMinValue(2)
            .setMaxValue(20)
            .setRequired(false))
        .addIntegerOption(option =>
          option.setName('seconds')
            .setDescription('Timeframe in seconds (default: 5)')
            .setMinValue(1)
            .setMaxValue(60)
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('mentions')
        .setDescription('Configure mass mention detection')
        .addBooleanOption(option =>
          option.setName('enabled')
            .setDescription('Enable mass mention detection')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('max_mentions')
            .setDescription('Max mentions per message (default: 5)')
            .setMinValue(1)
            .setMaxValue(50)
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('links')
        .setDescription('Configure link filtering')
        .addBooleanOption(option =>
          option.setName('enabled')
            .setDescription('Enable link filtering')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('invites')
        .setDescription('Configure Discord invite filtering')
        .addBooleanOption(option =>
          option.setName('enabled')
            .setDescription('Enable invite filtering')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('caps')
        .setDescription('Configure excessive caps detection')
        .addBooleanOption(option =>
          option.setName('enabled')
            .setDescription('Enable caps detection')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('percentage')
            .setDescription('Max percentage of caps (default: 70)')
            .setMinValue(10)
            .setMaxValue(100)
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('nsfw')
        .setDescription('Configure NSFW content detection')
        .addBooleanOption(option =>
          option.setName('enabled')
            .setDescription('Enable NSFW detection (always recommended)')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View current auto-mod settings')),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const subcommand = interaction.options.getSubcommand();
    const automodPath = path.join(__dirname, '../data/automod.json');
    
    let automod = {};
    if (fs.existsSync(automodPath)) {
      automod = JSON.parse(fs.readFileSync(automodPath, 'utf8'));
    }

    if (!automod[interaction.guild.id]) {
      automod[interaction.guild.id] = {
        spam: { enabled: false, messages: 5, seconds: 5 },
        mentions: { enabled: false, maxMentions: 5 },
        links: { enabled: false },
        invites: { enabled: false },
        caps: { enabled: false, percentage: 70 },
        nsfw: { enabled: true } // Activado por defecto
      };
    }

    const guildAutomod = automod[interaction.guild.id];

    if (subcommand === 'view') {
      const embed = new EmbedBuilder()
        .setTitle(lang === 'es' ? '⚙️ Configuración de Auto-Moderación' : '⚙️ Auto-Moderation Settings')
        .setColor(0x5865F2)
        .addFields(
          { 
            name: lang === 'es' ? '📨 Anti-Spam' : '📨 Anti-Spam', 
            value: `${guildAutomod.spam.enabled ? '✅' : '❌'} ${guildAutomod.spam.enabled ? `(${guildAutomod.spam.messages} ${lang === 'es' ? 'mensajes' : 'messages'} / ${guildAutomod.spam.seconds}s)` : ''}`,
            inline: true 
          },
          { 
            name: lang === 'es' ? '👥 Menciones Masivas' : '👥 Mass Mentions', 
            value: `${guildAutomod.mentions.enabled ? '✅' : '❌'} ${guildAutomod.mentions.enabled ? `(max ${guildAutomod.mentions.maxMentions})` : ''}`,
            inline: true 
          },
          { 
            name: lang === 'es' ? '🔗 Filtro de Links' : '🔗 Link Filter', 
            value: guildAutomod.links.enabled ? '✅' : '❌',
            inline: true 
          },
          { 
            name: lang === 'es' ? '📧 Filtro de Invitaciones' : '📧 Invite Filter', 
            value: guildAutomod.invites.enabled ? '✅' : '❌',
            inline: true 
          },
          { 
            name: lang === 'es' ? '🔠 Mayúsculas Excesivas' : '🔠 Excessive Caps', 
            value: `${guildAutomod.caps.enabled ? '✅' : '❌'} ${guildAutomod.caps.enabled ? `(max ${guildAutomod.caps.percentage}%)` : ''}`,
            inline: true 
          },
          { 
            name: lang === 'es' ? '🔞 Filtro NSFW' : '🔞 NSFW Filter', 
            value: guildAutomod.nsfw?.enabled ? '✅' : '❌',
            inline: true 
          }
        )
        .setTimestamp();

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const enabled = interaction.options.getBoolean('enabled');

    switch (subcommand) {
      case 'spam':
        guildAutomod.spam.enabled = enabled;
        if (enabled) {
          guildAutomod.spam.messages = interaction.options.getInteger('messages') || 5;
          guildAutomod.spam.seconds = interaction.options.getInteger('seconds') || 5;
        }
        break;

      case 'mentions':
        guildAutomod.mentions.enabled = enabled;
        if (enabled) {
          guildAutomod.mentions.maxMentions = interaction.options.getInteger('max_mentions') || 5;
        }
        break;

      case 'links':
        guildAutomod.links.enabled = enabled;
        break;

      case 'invites':
        guildAutomod.invites.enabled = enabled;
        break;

      case 'caps':
        guildAutomod.caps.enabled = enabled;
        if (enabled) {
          guildAutomod.caps.percentage = interaction.options.getInteger('percentage') || 70;
        }
        break;

      case 'nsfw':
        if (!guildAutomod.nsfw) guildAutomod.nsfw = {};
        guildAutomod.nsfw.enabled = enabled;
        break;
    }

    automod[interaction.guild.id] = guildAutomod;

    // Crear directorio si no existe
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(automodPath, JSON.stringify(automod, null, 2));

    await interaction.reply({
      content: lang === 'es' 
        ? `✅ Configuración de auto-moderación actualizada: **${subcommand}** ${enabled ? 'activado' : 'desactivado'}`
        : `✅ Auto-moderation setting updated: **${subcommand}** ${enabled ? 'enabled' : 'disabled'}`,
      ephemeral: true
    });
  },
};
