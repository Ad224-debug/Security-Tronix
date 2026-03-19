const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { createCase } = require('./case.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Comandos de moderación')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    // ban
    .addSubcommand(s => s.setName('ban').setDescription('Banea a un usuario')
      .addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Razón'))
      .addIntegerOption(o => o.setName('days').setDescription('Días de mensajes a borrar (0-7)').setMinValue(0).setMaxValue(7)))
    // kick
    .addSubcommand(s => s.setName('kick').setDescription('Expulsa a un usuario')
      .addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Razón')))
    // softban
    .addSubcommand(s => s.setName('softban').setDescription('Softban (banea y desbanea para borrar mensajes)')
      .addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Razón'))
      .addIntegerOption(o => o.setName('days').setDescription('Días de mensajes a borrar (1-7)').setMinValue(1).setMaxValue(7)))
    // tempban
    .addSubcommand(s => s.setName('tempban').setDescription('Banea temporalmente a un usuario')
      .addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true))
      .addIntegerOption(o => o.setName('days').setDescription('Días de baneo').setMinValue(1).setMaxValue(365).setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Razón'))
      .addIntegerOption(o => o.setName('delete_days').setDescription('Días de mensajes a borrar (0-7)').setMinValue(0).setMaxValue(7)))
    // warn
    .addSubcommand(s => s.setName('warn').setDescription('Advierte a un usuario')
      .addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Razón').setRequired(true)))
    // unwarn
    .addSubcommand(s => s.setName('unwarn').setDescription('Elimina una advertencia')
      .addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true))
      .addIntegerOption(o => o.setName('number').setDescription('Número de advertencia').setMinValue(1).setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Razón').setRequired(true)))
    // timeout
    .addSubcommand(s => s.setName('timeout').setDescription('Aisla a un usuario temporalmente')
      .addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true))
      .addIntegerOption(o => o.setName('duration').setDescription('Duración en minutos (1-10080)').setMinValue(1).setMaxValue(10080).setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Razón')))
    // untimeout
    .addSubcommand(s => s.setName('untimeout').setDescription('Quita el aislamiento de un usuario')
      .addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)))
    // unban
    .addSubcommand(s => s.setName('unban').setDescription('Desbanea a un usuario')
      .addStringOption(o => o.setName('userid').setDescription('ID del usuario').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Razón')))
    // history
    .addSubcommand(s => s.setName('history').setDescription('Ver historial de moderación de un usuario')
      .addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)))
    // case
    .addSubcommand(s => s.setName('case').setDescription('Ver detalles de un caso')
      .addIntegerOption(o => o.setName('id').setDescription('ID del caso').setMinValue(1).setRequired(true)))
    // note
    .addSubcommand(s => s.setName('note').setDescription('Agregar nota privada a un usuario')
      .addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true))
      .addStringOption(o => o.setName('note').setDescription('Nota').setRequired(true)))
    // log
    .addSubcommand(s => s.setName('log').setDescription('Comienza a registrar mensajes de un usuario')
      .addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)))
    // stoplog
    .addSubcommand(s => s.setName('stoplog').setDescription('Detiene el registro y guarda el archivo')
      .addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true))
      .addBooleanOption(o => o.setName('dm').setDescription('¿Enviar por DM al moderador?'))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const L = (es, en) => lang === 'es' ? es : en;

    // ── BAN ──────────────────────────────────────────────────────────────────
    if (sub === 'ban') {
      const usuario = interaction.options.getUser('user');
      const razon = interaction.options.getString('reason') || L('No especificada', 'Not specified');
      const dias = interaction.options.getInteger('days') || 0;
      const miembro = await interaction.guild.members.fetch(usuario.id).catch(() => null);

      if (usuario.id === interaction.user.id) return interaction.reply({ content: L('❌ No puedes banearte a ti mismo.', '❌ You cannot ban yourself.'), ephemeral: true });
      if (usuario.id === interaction.guild.ownerId) return interaction.reply({ content: L('❌ No puedes banear al dueño.', '❌ Cannot ban the owner.'), ephemeral: true });
      if (miembro?.roles.highest.position >= interaction.member.roles.highest.position) return interaction.reply({ content: L('❌ Rol igual o superior.', '❌ Equal or higher role.'), ephemeral: true });
      if (miembro && !miembro.bannable) return interaction.reply({ content: L('❌ No puedo banear a este usuario.', '❌ Cannot ban this user.'), ephemeral: true });

      if (miembro) {
        try { await usuario.send({ embeds: [new EmbedBuilder().setTitle(L('🔨 Has sido baneado', '🔨 You have been banned')).setDescription(L(`Baneado de **${interaction.guild.name}**`, `Banned from **${interaction.guild.name}**`)).addFields({ name: L('Razón','Reason'), value: razon }, { name: L('Moderador','Moderator'), value: interaction.user.tag }).setColor(0xED4245).setTimestamp()] }); } catch {}
      }
      await interaction.guild.members.ban(usuario, { deleteMessageSeconds: dias * 86400, reason: razon });
      const caseId = createCase(interaction.guild.id, 'ban', usuario.id, interaction.user.id, razon);
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle(L('🔨 Usuario Baneado','🔨 User Banned')).setThumbnail(usuario.displayAvatarURL()).addFields({ name: L('Usuario','User'), value: `${usuario} (${usuario.id})`, inline: true }, { name: L('Moderador','Moderator'), value: `${interaction.user}`, inline: true }, { name: L('Razón','Reason'), value: razon }, { name: L('Caso','Case'), value: `#${caseId}`, inline: true }).setColor(0xED4245).setTimestamp()] });
    }

    // ── KICK ─────────────────────────────────────────────────────────────────
    if (sub === 'kick') {
      const usuario = interaction.options.getUser('user');
      const razon = interaction.options.getString('reason') || L('No especificada', 'Not specified');
      const miembro = await interaction.guild.members.fetch(usuario.id).catch(() => null);
      if (!miembro) return interaction.reply({ content: L('❌ Usuario no encontrado.', '❌ User not found.'), ephemeral: true });
      if (usuario.id === interaction.user.id) return interaction.reply({ content: L('❌ No puedes expulsarte.', '❌ Cannot kick yourself.'), ephemeral: true });
      if (usuario.id === interaction.guild.ownerId) return interaction.reply({ content: L('❌ No puedes expulsar al dueño.', '❌ Cannot kick the owner.'), ephemeral: true });
      if (miembro.roles.highest.position >= interaction.member.roles.highest.position) return interaction.reply({ content: L('❌ Rol igual o superior.', '❌ Equal or higher role.'), ephemeral: true });
      if (!miembro.kickable) return interaction.reply({ content: L('❌ No puedo expulsar a este usuario.', '❌ Cannot kick this user.'), ephemeral: true });
      try { await usuario.send({ embeds: [new EmbedBuilder().setTitle(L('👢 Has sido expulsado','👢 You have been kicked')).setDescription(L(`Expulsado de **${interaction.guild.name}**`,`Kicked from **${interaction.guild.name}**`)).addFields({ name: L('Razón','Reason'), value: razon }, { name: L('Moderador','Moderator'), value: interaction.user.tag }).setColor(0xFEE75C).setTimestamp()] }); } catch {}
      await miembro.kick(razon);
      const caseId = createCase(interaction.guild.id, 'kick', usuario.id, interaction.user.id, razon);
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle(L('👢 Usuario Expulsado','👢 User Kicked')).setThumbnail(usuario.displayAvatarURL()).addFields({ name: L('Usuario','User'), value: `${usuario} (${usuario.id})`, inline: true }, { name: L('Moderador','Moderator'), value: `${interaction.user}`, inline: true }, { name: L('Razón','Reason'), value: razon }, { name: L('Caso','Case'), value: `#${caseId}`, inline: true }).setColor(0xFEE75C).setTimestamp()] });
    }

    // ── SOFTBAN ──────────────────────────────────────────────────────────────
    if (sub === 'softban') {
      const usuario = interaction.options.getUser('user');
      const razon = interaction.options.getString('reason') || L('No especificada', 'Not specified');
      const dias = interaction.options.getInteger('days') || 7;
      const miembro = await interaction.guild.members.fetch(usuario.id).catch(() => null);
      if (usuario.id === interaction.user.id) return interaction.reply({ content: '❌', ephemeral: true });
      if (miembro?.roles.highest.position >= interaction.member.roles.highest.position) return interaction.reply({ content: L('❌ Rol igual o superior.', '❌ Equal or higher role.'), ephemeral: true });
      await interaction.deferReply();
      await interaction.guild.members.ban(usuario, { deleteMessageSeconds: dias * 86400, reason: `[SOFTBAN] ${razon}` });
      await interaction.guild.members.unban(usuario, `[SOFTBAN] ${razon}`);
      return interaction.editReply({ embeds: [new EmbedBuilder().setTitle(L('🧹 Softban Aplicado','🧹 Softban Applied')).setThumbnail(usuario.displayAvatarURL()).addFields({ name: L('Usuario','User'), value: `${usuario} (${usuario.id})`, inline: true }, { name: L('Moderador','Moderator'), value: `${interaction.user}`, inline: true }, { name: L('Razón','Reason'), value: razon }, { name: L('Mensajes borrados','Messages deleted'), value: `${dias} días`, inline: true }).setColor(0xFFA500).setTimestamp()] });
    }

    // ── TEMPBAN ──────────────────────────────────────────────────────────────
    if (sub === 'tempban') {
      const usuario = interaction.options.getUser('user');
      const days = interaction.options.getInteger('days');
      const razon = interaction.options.getString('reason') || L('No especificada', 'Not specified');
      const deleteDays = interaction.options.getInteger('delete_days') || 0;
      const miembro = await interaction.guild.members.fetch(usuario.id).catch(() => null);
      if (usuario.id === interaction.user.id || usuario.id === interaction.guild.ownerId) return interaction.reply({ content: '❌', ephemeral: true });
      if (miembro?.roles.highest.position >= interaction.member.roles.highest.position) return interaction.reply({ content: L('❌ Rol igual o superior.', '❌ Equal or higher role.'), ephemeral: true });
      await interaction.deferReply();
      const expiresAt = Date.now() + days * 86400000;
      if (miembro) { try { await usuario.send({ embeds: [new EmbedBuilder().setTitle(L('⏰ Baneado temporalmente','⏰ Temporarily banned')).addFields({ name: L('Razón','Reason'), value: razon }, { name: L('Duración','Duration'), value: `${days} días` }, { name: L('Expira','Expires'), value: `<t:${Math.floor(expiresAt/1000)}:R>` }).setColor(0xFFA500).setTimestamp()] }); } catch {} }
      await interaction.guild.members.ban(usuario, { deleteMessageSeconds: deleteDays * 86400, reason: `[TEMPBAN ${days}d] ${razon}` });
      const caseId = createCase(interaction.guild.id, 'tempban', usuario.id, interaction.user.id, razon, `${days} días`, expiresAt);
      setTimeout(async () => { try { await interaction.guild.members.unban(usuario.id, 'Tempban expirado'); } catch {} }, days * 86400000);
      return interaction.editReply({ embeds: [new EmbedBuilder().setTitle(L('⏰ Baneo Temporal','⏰ Temporary Ban')).setThumbnail(usuario.displayAvatarURL()).addFields({ name: L('Usuario','User'), value: `${usuario} (${usuario.id})`, inline: true }, { name: L('Moderador','Moderator'), value: `${interaction.user}`, inline: true }, { name: L('Duración','Duration'), value: `${days} días`, inline: true }, { name: L('Razón','Reason'), value: razon }, { name: L('Expira','Expires'), value: `<t:${Math.floor(expiresAt/1000)}:F>` }, { name: L('Caso','Case'), value: `#${caseId}`, inline: true }).setColor(0xFFA500).setTimestamp()] });
    }

    // ── WARN ─────────────────────────────────────────────────────────────────
    if (sub === 'warn') {
      const usuario = interaction.options.getUser('user');
      const razon = interaction.options.getString('reason');
      const miembro = await interaction.guild.members.fetch(usuario.id).catch(() => null);
      if (usuario.id === interaction.user.id) return interaction.reply({ content: '❌ No puedes advertirte a ti mismo.', ephemeral: true });
      if (usuario.id === interaction.guild.ownerId) return interaction.reply({ content: '❌ No puedes advertir al dueño.', ephemeral: true });
      if (miembro?.roles.highest.position >= interaction.member.roles.highest.position) return interaction.reply({ content: '❌ Rol igual o superior.', ephemeral: true });
      const warningsPath = path.join(__dirname, '../warnings.json');
      let warnings = fs.existsSync(warningsPath) ? JSON.parse(fs.readFileSync(warningsPath, 'utf8')) : {};
      const key = `${interaction.guild.id}-${usuario.id}`;
      if (!warnings[key]) warnings[key] = [];
      warnings[key].push({ reason: razon, moderator: interaction.user.id, timestamp: Date.now() });
      fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));
      const warnCount = warnings[key].length;
      const caseId = createCase(interaction.guild.id, 'warn', usuario.id, interaction.user.id, razon);
      try { await usuario.send({ embeds: [new EmbedBuilder().setTitle('⚠️ Has recibido una advertencia').setDescription(`En **${interaction.guild.name}**`).addFields({ name: 'Razón', value: razon }, { name: 'Total', value: `${warnCount}` }).setColor(0xFEE75C).setTimestamp()] }); } catch {}
      await interaction.reply({ embeds: [new EmbedBuilder().setTitle('⚠️ Usuario Advertido').setThumbnail(usuario.displayAvatarURL()).addFields({ name: 'Usuario', value: `${usuario} (${usuario.id})`, inline: true }, { name: 'Moderador', value: `${interaction.user}`, inline: true }, { name: 'Razón', value: razon }, { name: 'Total advertencias', value: `${warnCount}`, inline: true }, { name: 'Caso', value: `#${caseId}`, inline: true }).setColor(0xFEE75C).setTimestamp()] });
      const warnConfigPath = path.join(__dirname, '../warn-config.json');
      const warnConfig = fs.existsSync(warnConfigPath) ? JSON.parse(fs.readFileSync(warnConfigPath, 'utf8')) : {};
      const guildConfig = warnConfig[interaction.guild.id] || { autoAction: 'none', autoActionThreshold: 3 };
      if (guildConfig.autoAction !== 'none' && warnCount >= guildConfig.autoActionThreshold && miembro) {
        const autoReason = `Auto: ${warnCount} advertencias`;
        try {
          if (guildConfig.autoAction === 'kick') await miembro.kick(autoReason);
          else if (guildConfig.autoAction === 'ban') await interaction.guild.members.ban(usuario, { reason: autoReason });
          else if (guildConfig.autoAction === 'timeout') await miembro.timeout(3600000, autoReason);
          await interaction.followUp({ content: `⚡ Acción automática: **${guildConfig.autoAction}** por ${warnCount} advertencias.`, ephemeral: true });
        } catch {}
      }
      return;
    }

    // ── UNWARN ───────────────────────────────────────────────────────────────
    if (sub === 'unwarn') {
      const usuario = interaction.options.getUser('user');
      const warnNumber = interaction.options.getInteger('number');
      const razon = interaction.options.getString('reason');
      const warningsPath = path.join(__dirname, '../warnings.json');
      let warnings = fs.existsSync(warningsPath) ? JSON.parse(fs.readFileSync(warningsPath, 'utf8')) : {};
      const key = `${interaction.guild.id}-${usuario.id}`;
      const userWarnings = warnings[key] || [];
      if (userWarnings.length === 0) return interaction.reply({ content: L('❌ Este usuario no tiene advertencias.', '❌ User has no warnings.'), ephemeral: true });
      if (warnNumber > userWarnings.length) return interaction.reply({ content: L(`❌ Solo tiene ${userWarnings.length} advertencia(s).`, `❌ Only has ${userWarnings.length} warning(s).`), ephemeral: true });
      userWarnings.splice(warnNumber - 1, 1);
      warnings[key] = userWarnings;
      fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle(L('✅ Advertencia Eliminada','✅ Warning Removed')).addFields({ name: L('Usuario','User'), value: `${usuario}`, inline: true }, { name: L('Moderador','Moderator'), value: `${interaction.user}`, inline: true }, { name: L('Razón','Reason'), value: razon }, { name: L('Total restantes','Remaining'), value: `${userWarnings.length}`, inline: true }).setColor(0x57F287).setTimestamp()] });
    }

    // ── TIMEOUT ──────────────────────────────────────────────────────────────
    if (sub === 'timeout') {
      const usuario = interaction.options.getUser('user');
      const duration = interaction.options.getInteger('duration');
      const reason = interaction.options.getString('reason') || L('No especificada', 'Not specified');
      const member = await interaction.guild.members.fetch(usuario.id).catch(() => null);
      if (!member) return interaction.reply({ content: '❌ Usuario no encontrado.', ephemeral: true });
      if (usuario.id === interaction.user.id || usuario.id === interaction.guild.ownerId) return interaction.reply({ content: '❌', ephemeral: true });
      if (member.roles.highest.position >= interaction.member.roles.highest.position) return interaction.reply({ content: L('❌ Rol igual o superior.', '❌ Equal or higher role.'), ephemeral: true });
      const expiresAt = Date.now() + duration * 60000;
      try { await usuario.send({ embeds: [new EmbedBuilder().setTitle(L('⏱️ Has sido aislado','⏱️ You have been timed out')).addFields({ name: L('Razón','Reason'), value: reason }, { name: L('Duración','Duration'), value: `${duration} min` }, { name: L('Expira','Expires'), value: `<t:${Math.floor(expiresAt/1000)}:R>` }).setColor(0xFFA500).setTimestamp()] }); } catch {}
      await member.timeout(duration * 60000, reason);
      const caseId = createCase(interaction.guild.id, 'timeout', usuario.id, interaction.user.id, reason, `${duration} min`);
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle(L('⏱️ Usuario Aislado','⏱️ User Timed Out')).setThumbnail(usuario.displayAvatarURL()).addFields({ name: L('Usuario','User'), value: `${usuario} (${usuario.id})`, inline: true }, { name: L('Moderador','Moderator'), value: `${interaction.user}`, inline: true }, { name: L('Duración','Duration'), value: `${duration} min`, inline: true }, { name: L('Expira','Expires'), value: `<t:${Math.floor(expiresAt/1000)}:R>`, inline: true }, { name: L('Razón','Reason'), value: reason }, { name: L('Caso','Case'), value: `#${caseId}`, inline: true }).setColor(0xFFA500).setTimestamp()] });
    }

    // ── UNTIMEOUT ────────────────────────────────────────────────────────────
    if (sub === 'untimeout') {
      const usuario = interaction.options.getUser('user');
      const member = await interaction.guild.members.fetch(usuario.id).catch(() => null);
      if (!member) return interaction.reply({ content: '❌ Usuario no encontrado.', ephemeral: true });
      if (!member.isCommunicationDisabled()) return interaction.reply({ content: L('❌ Este usuario no está aislado.', '❌ User is not timed out.'), ephemeral: true });
      await member.timeout(null);
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle(L('✅ Aislamiento Removido','✅ Timeout Removed')).addFields({ name: L('Usuario','User'), value: usuario.tag, inline: true }, { name: L('Moderador','Moderator'), value: interaction.user.tag, inline: true }).setColor(0x57F287).setTimestamp()] });
    }

    // ── UNBAN ────────────────────────────────────────────────────────────────
    if (sub === 'unban') {
      const userId = interaction.options.getString('userid');
      const reason = interaction.options.getString('reason') || L('No especificada', 'Not specified');
      try {
        await interaction.guild.members.unban(userId, reason);
        return interaction.reply({ embeds: [new EmbedBuilder().setTitle(L('🔓 Usuario Desbaneado','🔓 User Unbanned')).addFields({ name: 'ID', value: userId, inline: true }, { name: L('Razón','Reason'), value: reason }, { name: L('Moderador','Moderator'), value: interaction.user.tag, inline: true }).setColor(0x57F287).setTimestamp()] });
      } catch { return interaction.reply({ content: L('❌ No se pudo desbanear. Verifica el ID.', '❌ Could not unban. Check the ID.'), ephemeral: true }); }
    }

    // ── HISTORY ──────────────────────────────────────────────────────────────
    if (sub === 'history') {
      const usuario = interaction.options.getUser('user');
      const casesPath = path.join(__dirname, '../data/mod-cases.json');
      let cases = fs.existsSync(casesPath) ? JSON.parse(fs.readFileSync(casesPath, 'utf8')) : {};
      const guildCases = (cases[interaction.guild.id] || []).filter(c => c.targetId === usuario.id);
      const typeEmoji = { warn: '⚠️', kick: '👢', ban: '🔨', tempban: '⏰', softban: '🧹', timeout: '⏱️', unban: '🔓', note: '📝' };
      const counts = {};
      for (const c of guildCases) counts[c.type] = (counts[c.type] || 0) + 1;
      const embed = new EmbedBuilder().setTitle('📋 Historial de Moderación').setDescription(`**${usuario.tag}** (${usuario.id})`).setThumbnail(usuario.displayAvatarURL()).setColor(guildCases.length === 0 ? 0x57F287 : 0xED4245).setTimestamp();
      if (guildCases.length === 0) {
        embed.addFields({ name: '✅ Sin historial', value: 'Sin acciones registradas.' });
      } else {
        embed.addFields({ name: `📊 Resumen (${guildCases.length})`, value: Object.entries(counts).map(([t, c]) => `${typeEmoji[t] || '•'} **${t}**: ${c}`).join('\n') });
        const recent = [...guildCases].sort((a, b) => b.timestamp - a.timestamp).slice(0, 8);
        for (const c of recent) {
          const mod = await interaction.client.users.fetch(c.moderatorId).catch(() => null);
          embed.addFields({ name: `${typeEmoji[c.type] || '•'} Caso #${c.id} — ${c.type.toUpperCase()}`, value: `**Razón:** ${c.reason || 'N/A'}\n**Mod:** ${mod?.tag || '?'}\n**Fecha:** <t:${Math.floor(c.timestamp/1000)}:R>${c.duration ? `\n**Duración:** ${c.duration}` : ''}` });
        }
        if (guildCases.length > 8) embed.setFooter({ text: `Mostrando 8 de ${guildCases.length}` });
      }
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ── CASE ─────────────────────────────────────────────────────────────────
    if (sub === 'case') {
      const caseId = interaction.options.getInteger('id');
      const casesPath = path.join(__dirname, '../data/mod-cases.json');
      let cases = fs.existsSync(casesPath) ? JSON.parse(fs.readFileSync(casesPath, 'utf8')) : {};
      const modCase = (cases[interaction.guild.id] || []).find(c => c.id === caseId);
      if (!modCase) return interaction.reply({ content: `❌ Caso #${caseId} no encontrado.`, ephemeral: true });
      const moderator = await interaction.client.users.fetch(modCase.moderatorId).catch(() => null);
      const target = await interaction.client.users.fetch(modCase.targetId).catch(() => null);
      const typeEmoji = { warn: '⚠️', kick: '👢', ban: '🔨', tempban: '⏰', softban: '🧹', timeout: '⏱️', unban: '🔓', note: '📝' };
      const embed = new EmbedBuilder().setTitle(`${typeEmoji[modCase.type] || '•'} Caso #${caseId}`).addFields({ name: 'Tipo', value: modCase.type, inline: true }, { name: 'Usuario', value: target ? `${target.tag} (${target.id})` : modCase.targetId, inline: true }, { name: 'Moderador', value: moderator?.tag || '?', inline: true }, { name: 'Razón', value: modCase.reason || 'N/A' }, { name: 'Fecha', value: `<t:${Math.floor(modCase.timestamp/1000)}:F>`, inline: true }).setColor(0x5865F2).setTimestamp(modCase.timestamp);
      if (modCase.duration) embed.addFields({ name: 'Duración', value: modCase.duration, inline: true });
      if (modCase.expiresAt) embed.addFields({ name: 'Expira', value: `<t:${Math.floor(modCase.expiresAt/1000)}:R>`, inline: true });
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ── NOTE ─────────────────────────────────────────────────────────────────
    if (sub === 'note') {
      const usuario = interaction.options.getUser('user');
      const note = interaction.options.getString('note');
      const caseId = createCase(interaction.guild.id, 'note', usuario.id, interaction.user.id, note);
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle(L('📝 Nota Agregada','📝 Note Added')).setThumbnail(usuario.displayAvatarURL()).addFields({ name: L('Usuario','User'), value: `${usuario} (${usuario.id})`, inline: true }, { name: L('Moderador','Moderator'), value: `${interaction.user}`, inline: true }, { name: L('Nota','Note'), value: note }, { name: L('Caso','Case'), value: `#${caseId}`, inline: true }).setColor(0x5865F2).setFooter({ text: L('El usuario NO será notificado','User will NOT be notified') }).setTimestamp()], ephemeral: true });
    }

    // ── LOG ──────────────────────────────────────────────────────────────────
    if (sub === 'log') {
      const target = interaction.options.getUser('user');
      const key = `${interaction.guild.id}-${target.id}`;
      if (!global.activeLogs) global.activeLogs = new Map();
      if (global.activeLogs.has(key)) return interaction.reply({ content: `⚠️ Ya se está registrando a **${target.tag}**. Usa \`/mod stoplog\` para detenerlo.`, ephemeral: true });
      global.activeLogs.set(key, { messages: [], startedBy: interaction.user.id, startedAt: Date.now(), guildId: interaction.guild.id, userId: target.id, userTag: target.tag });
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle('📋 Log Iniciado').setColor(0x3498DB).addFields({ name: 'Usuario', value: `${target.tag} (${target.id})`, inline: true }, { name: 'Moderador', value: interaction.user.tag, inline: true }, { name: 'Estado', value: '🟢 Registrando...' }).setTimestamp()], ephemeral: true });
    }

    // ── STOPLOG ──────────────────────────────────────────────────────────────
    if (sub === 'stoplog') {
      const target = interaction.options.getUser('user');
      const sendDm = interaction.options.getBoolean('dm') ?? true;
      const key = `${interaction.guild.id}-${target.id}`;
      if (!global.activeLogs || !global.activeLogs.has(key)) return interaction.reply({ content: `❌ No hay log activo para **${target.tag}**.`, ephemeral: true });
      const logData = global.activeLogs.get(key);
      global.activeLogs.delete(key);
      await interaction.deferReply({ ephemeral: true });
      if (logData.messages.length === 0) return interaction.editReply({ content: `⚠️ No se registraron mensajes de **${target.tag}**.` });
      const duration = Math.round((Date.now() - logData.startedAt) / 60000);
      let content = `=== LOG DE MENSAJES ===\nUsuario: ${logData.userTag} (${logData.userId})\nServidor: ${interaction.guild.name}\nDuración: ${duration} min\nTotal: ${logData.messages.length}\n======================\n\n`;
      for (const msg of logData.messages) {
        content += `[${new Date(msg.timestamp).toLocaleString('es-ES')}] #${msg.channel}\n${msg.content}\n${msg.attachments > 0 ? `[${msg.attachments} adjunto(s)]\n` : ''}---\n`;
      }
      const buffer = Buffer.from(content, 'utf-8');
      const attachment = new AttachmentBuilder(buffer, { name: `log_${target.username}_${Date.now()}.txt` });
      await interaction.editReply({ embeds: [new EmbedBuilder().setTitle('📋 Log Finalizado').setColor(0xE74C3C).addFields({ name: 'Usuario', value: target.tag, inline: true }, { name: 'Mensajes', value: `${logData.messages.length}`, inline: true }, { name: 'Duración', value: `${duration} min`, inline: true }).setTimestamp()], files: [attachment] });
      if (sendDm) { try { await interaction.user.send({ content: `📋 Log de **${target.tag}** en **${interaction.guild.name}**`, files: [new AttachmentBuilder(buffer, { name: `log_${target.username}_${Date.now()}.txt` })] }); } catch {} }
      return;
    }
  }
};
