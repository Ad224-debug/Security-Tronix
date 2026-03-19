const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('usercheck')
    .setDescription('Análisis de seguridad completo de un usuario')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(opt => opt.setName('user').setDescription('Usuario a analizar').setRequired(true)),

  async execute(interaction) {
    const usuario = interaction.options.getUser('user');
    await interaction.deferReply({ ephemeral: true });

    const member = await interaction.guild.members.fetch(usuario.id).catch(() => null);

    // Cargar historial
    const casesPath = path.join(__dirname, '../data/mod-cases.json');
    const warningsPath = path.join(__dirname, '../warnings.json');
    let cases = fs.existsSync(casesPath) ? JSON.parse(fs.readFileSync(casesPath, 'utf8')) : {};
    let warnings = fs.existsSync(warningsPath) ? JSON.parse(fs.readFileSync(warningsPath, 'utf8')) : {};

    const guildCases = (cases[interaction.guild.id] || []).filter(c => c.targetId === usuario.id);
    const userWarnings = warnings[`${interaction.guild.id}-${usuario.id}`] || [];
    const bans = guildCases.filter(c => c.type === 'ban' || c.type === 'tempban').length;
    const kicks = guildCases.filter(c => c.type === 'kick').length;
    const timeouts = guildCases.filter(c => c.type === 'timeout').length;

    // Calcular score de riesgo
    let riskScore = 0;
    riskScore += userWarnings.length * 5;
    riskScore += kicks * 15;
    riskScore += bans * 30;
    riskScore += timeouts * 10;

    // Cuenta nueva (menos de 7 días)
    const accountAge = Date.now() - usuario.createdTimestamp;
    const accountAgeDays = Math.floor(accountAge / (1000 * 60 * 60 * 24));
    if (accountAgeDays < 7) riskScore += 25;
    else if (accountAgeDays < 30) riskScore += 10;

    // Sin avatar
    if (!usuario.avatar) riskScore += 10;

    // Nombre sospechoso
    if (/free.*nitro|nitro.*free|discord.*gift/i.test(usuario.username)) riskScore += 30;

    const riskLevel = riskScore >= 60 ? '🔴 ALTO' : riskScore >= 30 ? '🟡 MEDIO' : '🟢 BAJO';
    const color = riskScore >= 60 ? 0xED4245 : riskScore >= 30 ? 0xFFA500 : 0x57F287;

    // Info de cuenta
    const joinedAt = member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'No está en el servidor';
    const createdAt = `<t:${Math.floor(usuario.createdTimestamp / 1000)}:R>`;
    const isBanned = await interaction.guild.bans.fetch(usuario.id).catch(() => null);

    const embed = new EmbedBuilder()
      .setTitle(`🔍 Análisis de Seguridad`)
      .setDescription(`**${usuario.tag}** (${usuario.id})`)
      .setThumbnail(usuario.displayAvatarURL())
      .setColor(color)
      .addFields(
        { name: '⚠️ Nivel de riesgo', value: `${riskLevel} (${riskScore} pts)`, inline: true },
        { name: '📅 Cuenta creada', value: `${createdAt} (${accountAgeDays} días)`, inline: true },
        { name: '📥 Se unió', value: joinedAt, inline: true },
        { name: '🖼️ Avatar', value: usuario.avatar ? '✅ Tiene avatar' : '❌ Sin avatar (sospechoso)', inline: true },
        { name: '🤖 Es bot', value: usuario.bot ? '⚠️ Sí' : '✅ No', inline: true },
        { name: '🔨 Baneado actualmente', value: isBanned ? '⚠️ Sí' : '✅ No', inline: true },
        { name: '📊 Historial en este servidor', value: [
          `⚠️ Advertencias: **${userWarnings.length}**`,
          `👢 Kicks: **${kicks}**`,
          `🔨 Bans: **${bans}**`,
          `⏱️ Timeouts: **${timeouts}**`,
          `📋 Total acciones: **${guildCases.length}**`
        ].join('\n'), inline: false }
      )
      .setFooter({ text: `Análisis generado por Tronix Security` })
      .setTimestamp();

    // Alertas
    const alerts = [];
    if (accountAgeDays < 7) alerts.push('🚨 Cuenta creada hace menos de 7 días');
    if (!usuario.avatar) alerts.push('⚠️ Sin avatar de perfil');
    if (userWarnings.length >= 3) alerts.push(`⚠️ ${userWarnings.length} advertencias acumuladas`);
    if (bans > 0) alerts.push(`🔨 Ha sido baneado ${bans} vez/veces`);
    if (/free.*nitro|nitro.*free/i.test(usuario.username)) alerts.push('🚨 Nombre de usuario sospechoso (posible scammer)');

    if (alerts.length > 0) {
      embed.addFields({ name: '🚨 Alertas', value: alerts.join('\n'), inline: false });
    }

    await interaction.editReply({ embeds: [embed] });
  }
};
