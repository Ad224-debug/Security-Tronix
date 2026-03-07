const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rb3setup')
    .setDescription('Configure RB3 (Rule Break 3) automatic punishment system')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('enable')
        .setDescription('Enable RB3 system')
        .addBooleanOption(option =>
          option.setName('enabled')
            .setDescription('Enable or disable RB3')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('strike1')
        .setDescription('Configure action for 1st strike')
        .addStringOption(option =>
          option.setName('action')
            .setDescription('Action to take')
            .setRequired(true)
            .addChoices(
              { name: 'Warning', value: 'warn' },
              { name: 'Timeout 1h', value: 'timeout_1h' },
              { name: 'Timeout 6h', value: 'timeout_6h' },
              { name: 'Timeout 12h', value: 'timeout_12h' },
              { name: 'Timeout 24h', value: 'timeout_24h' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('strike2')
        .setDescription('Configure action for 2nd strike')
        .addStringOption(option =>
          option.setName('action')
            .setDescription('Action to take')
            .setRequired(true)
            .addChoices(
              { name: 'Timeout 6h', value: 'timeout_6h' },
              { name: 'Timeout 12h', value: 'timeout_12h' },
              { name: 'Timeout 24h', value: 'timeout_24h' },
              { name: 'Timeout 3d', value: 'timeout_3d' },
              { name: 'Kick', value: 'kick' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('strike3')
        .setDescription('Configure action for 3rd strike')
        .addStringOption(option =>
          option.setName('action')
            .setDescription('Action to take')
            .setRequired(true)
            .addChoices(
              { name: 'Timeout 3d', value: 'timeout_3d' },
              { name: 'Timeout 7d', value: 'timeout_7d' },
              { name: 'Kick', value: 'kick' },
              { name: 'Tempban 7d', value: 'tempban_7d' },
              { name: 'Tempban 30d', value: 'tempban_30d' },
              { name: 'Ban', value: 'ban' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('reset_time')
        .setDescription('Set time before strikes reset')
        .addIntegerOption(option =>
          option.setName('days')
            .setDescription('Days before strikes reset (0 = never)')
            .setMinValue(0)
            .setMaxValue(365)
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View current RB3 configuration')),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const subcommand = interaction.options.getSubcommand();
    const rb3Path = path.join(__dirname, '../data/rb3-config.json');
    
    let rb3Config = {};
    if (fs.existsSync(rb3Path)) {
      rb3Config = JSON.parse(fs.readFileSync(rb3Path, 'utf8'));
    }

    if (!rb3Config[interaction.guild.id]) {
      rb3Config[interaction.guild.id] = {
        enabled: false,
        strike1: 'warn',
        strike2: 'timeout_12h',
        strike3: 'tempban_7d',
        resetDays: 30
      };
    }

    const guildRB3 = rb3Config[interaction.guild.id];

    if (subcommand === 'view') {
      const actionNames = {
        warn: lang === 'es' ? '⚠️ Advertencia' : '⚠️ Warning',
        timeout_1h: lang === 'es' ? '⏱️ Timeout 1 hora' : '⏱️ Timeout 1 hour',
        timeout_6h: lang === 'es' ? '⏱️ Timeout 6 horas' : '⏱️ Timeout 6 hours',
        timeout_12h: lang === 'es' ? '⏱️ Timeout 12 horas' : '⏱️ Timeout 12 hours',
        timeout_24h: lang === 'es' ? '⏱️ Timeout 24 horas' : '⏱️ Timeout 24 hours',
        timeout_3d: lang === 'es' ? '⏱️ Timeout 3 días' : '⏱️ Timeout 3 days',
        timeout_7d: lang === 'es' ? '⏱️ Timeout 7 días' : '⏱️ Timeout 7 days',
        kick: lang === 'es' ? '👢 Expulsión' : '👢 Kick',
        tempban_7d: lang === 'es' ? '⏰ Baneo temporal 7 días' : '⏰ Tempban 7 days',
        tempban_30d: lang === 'es' ? '⏰ Baneo temporal 30 días' : '⏰ Tempban 30 days',
        ban: lang === 'es' ? '🔨 Baneo permanente' : '🔨 Permanent ban'
      };

      const embed = new EmbedBuilder()
        .setTitle(lang === 'es' ? '⚙️ Configuración RB3 (Rule Break 3)' : '⚙️ RB3 (Rule Break 3) Configuration')
        .setDescription(lang === 'es' 
          ? `Sistema de castigos automáticos por acumulación de infracciones.\n\n**Estado:** ${guildRB3.enabled ? '✅ Activado' : '❌ Desactivado'}`
          : `Automatic punishment system for accumulated violations.\n\n**Status:** ${guildRB3.enabled ? '✅ Enabled' : '❌ Disabled'}`)
        .setColor(guildRB3.enabled ? 0x57F287 : 0xED4245)
        .addFields(
          { 
            name: lang === 'es' ? '1️⃣ Primer Strike' : '1️⃣ First Strike', 
            value: actionNames[guildRB3.strike1],
            inline: true 
          },
          { 
            name: lang === 'es' ? '2️⃣ Segundo Strike' : '2️⃣ Second Strike', 
            value: actionNames[guildRB3.strike2],
            inline: true 
          },
          { 
            name: lang === 'es' ? '3️⃣ Tercer Strike' : '3️⃣ Third Strike', 
            value: actionNames[guildRB3.strike3],
            inline: true 
          },
          {
            name: lang === 'es' ? '🔄 Reinicio de Strikes' : '🔄 Strike Reset',
            value: guildRB3.resetDays === 0 
              ? (lang === 'es' ? 'Nunca' : 'Never')
              : `${guildRB3.resetDays} ${lang === 'es' ? 'días' : 'days'}`,
            inline: false
          }
        )
        .setFooter({ text: lang === 'es' ? 'Los strikes se acumulan por automod y advertencias' : 'Strikes accumulate from automod and warnings' })
        .setTimestamp();

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subcommand === 'enable') {
      guildRB3.enabled = interaction.options.getBoolean('enabled');
    } else if (subcommand === 'strike1') {
      guildRB3.strike1 = interaction.options.getString('action');
    } else if (subcommand === 'strike2') {
      guildRB3.strike2 = interaction.options.getString('action');
    } else if (subcommand === 'strike3') {
      guildRB3.strike3 = interaction.options.getString('action');
    } else if (subcommand === 'reset_time') {
      guildRB3.resetDays = interaction.options.getInteger('days');
    }

    rb3Config[interaction.guild.id] = guildRB3;

    // Crear directorio si no existe
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(rb3Path, JSON.stringify(rb3Config, null, 2));

    await interaction.reply({
      content: lang === 'es' 
        ? `✅ Configuración RB3 actualizada`
        : `✅ RB3 configuration updated`,
      ephemeral: true
    });
  },
};
