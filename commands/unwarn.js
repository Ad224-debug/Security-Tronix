const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription('Removes a warning from a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to remove warning from')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('warning_number')
        .setDescription('Warning number to remove (use /warnings to see list)')
        .setMinValue(1)
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for removing the warning')
        .setRequired(true)),

  async execute(interaction) {
    const getText = (key) => interaction.client.getText(interaction.guild.id, key);

    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: getText('admin_only'),
        ephemeral: true
      });
    }

    const usuario = interaction.options.getUser('user');
    const warnNumber = interaction.options.getInteger('warning_number');
    const razon = interaction.options.getString('reason');

    const warningsPath = path.join(__dirname, '../warnings.json');
    let warnings = {};
    
    if (fs.existsSync(warningsPath)) {
      warnings = JSON.parse(fs.readFileSync(warningsPath, 'utf8'));
    }

    const key = `${interaction.guild.id}-${usuario.id}`;
    const userWarnings = warnings[key] || [];

    if (userWarnings.length === 0) {
      return await interaction.reply({
        content: getText('no_warnings'),
        ephemeral: true
      });
    }

    if (warnNumber > userWarnings.length) {
      const lang = interaction.client.getLanguage(interaction.guild.id);
      const errorMsg = lang === 'es'
        ? `❌ Este usuario solo tiene ${userWarnings.length} advertencia(s).`
        : `❌ This user only has ${userWarnings.length} warning(s).`;
      return await interaction.reply({
        content: errorMsg,
        ephemeral: true
      });
    }

    const removedWarn = userWarnings[warnNumber - 1];
    userWarnings.splice(warnNumber - 1, 1);
    warnings[key] = userWarnings;

    fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2), 'utf8');

    await interaction.reply({
      embeds: [{
        title: getText('unwarn_title'),
        description: `${getText('unwarn_desc')} ${usuario}`,
        fields: [
          { name: getText('warn_removed'), value: `#${warnNumber}` },
          { name: getText('warn_removed_reason'), value: removedWarn.reason },
          { name: getText('removal_reason'), value: razon },
          { name: getText('moderator'), value: `${interaction.user}` },
          { name: getText('total_warnings'), value: `${userWarnings.length}` },
        ],
        color: 0x57F287,
        timestamp: new Date(),
      }]
    });
  },
};
