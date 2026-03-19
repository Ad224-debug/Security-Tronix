const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('Ver historial completo de moderación de un usuario')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(opt => opt.setName('user').setDescription('Usuario a consultar').setRequired(true)),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const usuario = interaction.options.getUser('user');

    // Cargar casos de moderación
    const casesPath = path.join(__dirname, '../data/mod-cases.json');
    let cases = {};
    if (fs.existsSync(casesPath)) cases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
    const guildCases = (cases[interaction.guild.id] || []).filter(c => c.targetId === usuario.id);

    // Cargar warnings
    const warningsPath = path.join(__dirname, '../warnings.json');
    let warnings = {};
    if (fs.existsSync(warningsPath)) warnings = JSON.parse(fs.readFileSync(warningsPath, 'utf8'));
    const userWarnings = warnings[`${interaction.guild.id}-${usuario.id}`] || [];

    const typeEmoji = { warn: '⚠️', kick: '👢', ban: '🔨', tempban: '⏰', softban: '🧹', timeout: '⏱️', unban: '🔓', note: '📝' };

    // Contar por tipo
    const counts = {};
    for (const c of guildCases) counts[c.type] = (counts[c.type] || 0) + 1;

    const embed = new EmbedBuilder()
      .setTitle(`📋 Historial de Moderación`)
      .setDescription(`**${usuario.tag}** (${usuario.id})`)
      .setThumbnail(usuario.displayAvatarURL())
      .setColor(guildCases.length === 0 ? 0x57F287 : 0xED4245)
      .setTimestamp();

    // Resumen
    if (guildCases.length === 0) {
      embed.addFields({ name: '✅ Sin historial', value: 'Este usuario no tiene acciones de moderación registradas.' });
    } else {
      const summary = Object.entries(counts).map(([type, count]) => `${typeEmoji[type] || '•'} **${type}**: ${count}`).join('\n');
      embed.addFields({ name: `📊 Resumen (${guildCases.length} acciones)`, value: summary, inline: false });

      // Últimas 8 acciones
      const recent = [...guildCases].sort((a, b) => b.timestamp - a.timestamp).slice(0, 8);
      for (const c of recent) {
        const mod = await interaction.client.users.fetch(c.moderatorId).catch(() => null);
        embed.addFields({
          name: `${typeEmoji[c.type] || '•'} Caso #${c.id} — ${c.type.toUpperCase()}`,
          value: `**Razón:** ${c.reason || 'N/A'}\n**Mod:** ${mod?.tag || 'Desconocido'}\n**Fecha:** <t:${Math.floor(c.timestamp / 1000)}:R>${c.duration ? `\n**Duración:** ${c.duration}` : ''}`,
          inline: false
        });
      }

      if (guildCases.length > 8) {
        embed.setFooter({ text: `Mostrando 8 de ${guildCases.length} acciones` });
      }
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
