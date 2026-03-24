const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Show warnings for a user')
    .addUserOption(o => o.setName('user').setDescription('User to check').setRequired(false)),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const L = (es, en) => lang === 'es' ? es : en;
    const usuario = interaction.options.getUser('user') || interaction.user;

    // Users can only check their own warnings; mods can check anyone
    if (usuario.id !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({ content: L('❌ Solo puedes ver tus propias advertencias.', '❌ You can only view your own warnings.'), flags: 64 });
    }

    const warningsPath = path.join(__dirname, '../warnings.json');
    const warnings = fs.existsSync(warningsPath) ? JSON.parse(fs.readFileSync(warningsPath, 'utf8')) : {};
    const userWarnings = warnings[`${interaction.guild.id}-${usuario.id}`] || [];

    if (userWarnings.length === 0) {
      return interaction.reply({ content: L(`✅ ${usuario.username} no tiene advertencias.`, `✅ ${usuario.username} has no warnings.`) });
    }

    const embed = new EmbedBuilder()
      .setTitle(L(`⚠️ Advertencias — ${usuario.username}`, `⚠️ Warnings — ${usuario.username}`))
      .setThumbnail(usuario.displayAvatarURL())
      .setColor(0xFEE75C)
      .setDescription(L(`Total: **${userWarnings.length}**`, `Total: **${userWarnings.length}**`))
      .setTimestamp();

    userWarnings.slice(-10).forEach((warn, i) => {
      embed.addFields({
        name: `#${i + 1}`,
        value: `**${L('Razón', 'Reason')}:** ${warn.reason}\n**${L('Moderador', 'Moderator')}:** <@${warn.moderator}>\n**${L('Fecha', 'Date')}:** <t:${Math.floor(warn.timestamp / 1000)}:R>`,
      });
    });

    await interaction.reply({ embeds: [embed] });
  },
};
