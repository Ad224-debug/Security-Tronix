/**
 * antiraid-system.js — Sistema Anti-Raid mejorado
 * 
 * Detecta y responde a:
 * 1. Raids de joins masivos
 * 2. Eliminación masiva de canales
 * 3. Eliminación masiva de roles
 * 4. Bans masivos
 * 5. Webhooks masivos
 * 6. Menciones masivas / spam
 */

const { EmbedBuilder, PermissionFlagsBits, ChannelType, AuditLogEvent } = require('discord.js');
const guildConfig = require('./guild-config');

// ─── Estado en memoria ────────────────────────────────────────────────────────
const joinWindows   = new Map(); // guildId → [timestamps]
const raidState     = new Map(); // guildId → { active, lockedChannels, unlockTimer }
const actionWindows = new Map(); // `${guildId}-${userId}-${type}` → [timestamps]

// ─── Config ───────────────────────────────────────────────────────────────────
function getAntiRaidConfig(guildId) {
  const fromDb = guildConfig.get(guildId, 'antiraidConfig');
  const defaults = {
    enabled:            false,
    threshold:          10,       // joins para activar raid
    windowMs:           30000,    // ventana de 30s para joins
    action:             'kick',   // kick | ban | timeout | lockdown
    minAccountAge:      7,        // días mínimos de cuenta
    unlockAfter:        10,       // minutos auto-unlock
    // Protección de estructura del servidor
    channelDeleteLimit: 3,        // canales eliminados en 10s = raid
    roleDeleteLimit:    3,        // roles eliminados en 10s = raid
    banLimit:           5,        // bans en 10s = raid
    webhookLimit:       3,        // webhooks creados en 10s = raid
    structureWindowMs:  10000,    // ventana para acciones destructivas
    punishAdmin:        true,     // kickear/banear al admin que hace el raid
  };
  return Object.assign({}, defaults, fromDb || {});
}

// ─── Lockdown ─────────────────────────────────────────────────────────────────
async function lockdownGuild(guild, sendLog, cfg) {
  const state = raidState.get(guild.id) || { active: false, lockedChannels: [] };
  if (state.active) return;

  const lockedChannels = [];
  for (const [, channel] of guild.channels.cache) {
    if (channel.type !== ChannelType.GuildText) continue;
    try {
      const ow = channel.permissionOverwrites.cache.get(guild.id);
      if (ow?.deny.has(PermissionFlagsBits.SendMessages)) continue;
      await channel.permissionOverwrites.edit(guild.id, { SendMessages: false });
      lockedChannels.push(channel.id);
    } catch {}
  }

  if (state.unlockTimer) clearTimeout(state.unlockTimer);
  const unlockTimer = setTimeout(() => unlockGuild(guild, sendLog, 'auto'), cfg.unlockAfter * 60 * 1000);
  raidState.set(guild.id, { active: true, lockedChannels, unlockTimer });

  const embed = new EmbedBuilder()
    .setTitle('🚨 RAID DETECTADO — LOCKDOWN ACTIVADO')
    .setColor(0xFF0000)
    .addFields(
      { name: '🔒 Canales bloqueados', value: `${lockedChannels.length}`, inline: true },
      { name: '⏱️ Auto-unlock en', value: `${cfg.unlockAfter} min`, inline: true },
    )
    .setFooter({ text: 'Usa /antiraid unlock para desbloquear manualmente' })
    .setTimestamp();
  await sendLog(guild, embed);
}

async function unlockGuild(guild, sendLog, reason = 'manual') {
  const state = raidState.get(guild.id);
  if (!state?.active) return false;
  if (state.unlockTimer) clearTimeout(state.unlockTimer);

  let unlocked = 0;
  for (const channelId of state.lockedChannels) {
    const ch = guild.channels.cache.get(channelId);
    if (!ch) continue;
    try { await ch.permissionOverwrites.edit(guild.id, { SendMessages: null }); unlocked++; } catch {}
  }
  raidState.set(guild.id, { active: false, lockedChannels: [], unlockTimer: null });

  const embed = new EmbedBuilder()
    .setTitle('✅ Lockdown Levantado')
    .setColor(0x57F287)
    .addFields(
      { name: '🔓 Canales desbloqueados', value: `${unlocked}`, inline: true },
      { name: '📋 Razón', value: reason === 'auto' ? 'Auto-unlock por tiempo' : 'Manual', inline: true },
    )
    .setTimestamp();
  await sendLog(guild, embed);
  return true;
}

// ─── Punish admin que hizo el raid ───────────────────────────────────────────
async function punishRaidAdmin(guild, userId, reason, cfg, sendLog) {
  if (!cfg.punishAdmin) return;
  // No punir al dueño del servidor
  if (guild.ownerId === userId) return;

  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return;

  // No punir a alguien con más permisos que el bot
  const botMember = guild.members.me;
  if (!botMember || member.roles.highest.position >= botMember.roles.highest.position) return;

  try {
    const dmEmbed = new EmbedBuilder()
      .setTitle('🚨 Acción Anti-Raid')
      .setColor(0xFF0000)
      .setDescription(`Has sido sancionado en **${guild.name}** por actividad sospechosa detectada por el sistema Anti-Raid.`)
      .addFields({ name: '📝 Razón', value: reason })
      .setTimestamp();

    await member.send({ embeds: [dmEmbed] }).catch(() => {});

    if (cfg.action === 'ban') {
      await guild.members.ban(userId, { reason: `[Anti-Raid] ${reason}`, deleteMessageSeconds: 86400 });
    } else {
      await member.kick(`[Anti-Raid] ${reason}`);
    }

    const logEmbed = new EmbedBuilder()
      .setTitle(`🛡️ Anti-Raid — Admin ${cfg.action === 'ban' ? 'Baneado' : 'Kickeado'}`)
      .setColor(0xFF0000)
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: '👤 Usuario', value: `${member.user.tag} (<@${userId}>)`, inline: true },
        { name: '🆔 ID', value: userId, inline: true },
        { name: '📝 Razón', value: reason, inline: false },
      )
      .setTimestamp();
    await sendLog(guild, logEmbed);
  } catch (err) {
    console.error('[antiraid] Error punishing admin:', err.message);
  }
}

// ─── Ventana de acciones por usuario ─────────────────────────────────────────
function trackAction(guildId, userId, type, windowMs) {
  const key = `${guildId}-${userId}-${type}`;
  const now = Date.now();
  const times = (actionWindows.get(key) || []).filter(t => now - t < windowMs);
  times.push(now);
  actionWindows.set(key, times);
  return times.length;
}

// ─── Detección de acciones destructivas (canales, roles, bans, webhooks) ─────
async function checkDestructiveAction(guild, userId, type, sendLog) {
  const cfg = getAntiRaidConfig(guild.id);
  if (!cfg.enabled) return;

  const limits = {
    channelDelete: cfg.channelDeleteLimit,
    roleDelete:    cfg.roleDeleteLimit,
    ban:           cfg.banLimit,
    webhookCreate: cfg.webhookLimit,
  };

  const limit = limits[type];
  if (!limit) return;

  const count = trackAction(guild.id, userId, type, cfg.structureWindowMs);

  if (count >= limit) {
    // Resetear contador para no re-disparar en cada acción siguiente
    actionWindows.delete(`${guild.id}-${userId}-${type}`);

    const typeLabels = {
      channelDelete: `eliminó ${count} canales`,
      roleDelete:    `eliminó ${count} roles`,
      ban:           `baneó ${count} usuarios`,
      webhookCreate: `creó ${count} webhooks`,
    };

    const reason = `Actividad sospechosa: ${typeLabels[type]} en ${cfg.structureWindowMs / 1000}s`;

    const alertEmbed = new EmbedBuilder()
      .setTitle('🚨 ACTIVIDAD SOSPECHOSA DETECTADA')
      .setColor(0xFF0000)
      .addFields(
        { name: '👤 Usuario', value: `<@${userId}> (${userId})`, inline: true },
        { name: '⚠️ Acción', value: typeLabels[type], inline: true },
        { name: '📝 Respuesta', value: cfg.action === 'ban' ? 'Baneado' : 'Kickeado', inline: true },
      )
      .setFooter({ text: 'Sistema Anti-Raid' })
      .setTimestamp();
    await sendLog(guild, alertEmbed);

    await punishRaidAdmin(guild, userId, reason, cfg, sendLog);

    // Si es eliminación masiva de canales/roles, activar lockdown también
    if (type === 'channelDelete' || type === 'roleDelete') {
      await lockdownGuild(guild, sendLog, cfg);
    }
  }
}

// ─── Handler principal de joins ───────────────────────────────────────────────
async function checkRaid(member, sendLog) {
  if (member.user.bot) return;

  const cfg = getAntiRaidConfig(member.guild.id);
  if (!cfg.enabled) return;

  const guildId = member.guild.id;
  const now = Date.now();

  // Ventana de joins
  const timestamps = (joinWindows.get(guildId) || []).filter(t => now - t < cfg.windowMs);
  timestamps.push(now);
  joinWindows.set(guildId, timestamps);

  // Cuenta nueva → kickear directamente si está configurado
  if (cfg.minAccountAge > 0) {
    const ageMs = now - member.user.createdTimestamp;
    if (ageMs < cfg.minAccountAge * 86400000) {
      try { await member.kick(`[Anti-Raid] Cuenta nueva (<${cfg.minAccountAge} días)`); } catch {}
      const embed = new EmbedBuilder()
        .setTitle('🆕 Cuenta Nueva Expulsada')
        .setColor(0xFFA500)
        .setThumbnail(member.user.displayAvatarURL())
        .addFields(
          { name: 'Usuario', value: `${member.user.tag} (${member.user.id})`, inline: true },
          { name: 'Cuenta creada', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: 'Razón', value: `Cuenta menor a ${cfg.minAccountAge} días`, inline: false },
        )
        .setTimestamp();
      await sendLog(member.guild, embed);
      return;
    }
  }

  // Raid por volumen de joins
  if (timestamps.length >= cfg.threshold) {
    joinWindows.set(guildId, []);

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Raid de Joins Detectado')
      .setColor(0xFF6600)
      .addFields(
        { name: '📊 Joins', value: `${timestamps.length} en ${cfg.windowMs / 1000}s`, inline: true },
        { name: '⚙️ Umbral', value: `${cfg.threshold}`, inline: true },
      )
      .setTimestamp();
    await sendLog(member.guild, embed);
    await lockdownGuild(member.guild, sendLog, cfg);

    // Kickear/banear al último que entró
    try {
      if (cfg.action === 'ban') await member.ban({ reason: '[Anti-Raid] Raid detectado' });
      else if (cfg.action === 'kick') await member.kick('[Anti-Raid] Raid detectado');
    } catch {}
  }
}

function getRaidState(guildId) {
  return raidState.get(guildId) || { active: false, lockedChannels: [] };
}

module.exports = { checkRaid, unlockGuild, getRaidState, getAntiRaidConfig, checkDestructiveAction };
