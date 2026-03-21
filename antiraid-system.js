/**
 * antiraid-system.js
 * Detección y respuesta automática a raids de Discord.
 * 
 * Flujo:
 *  1. checkRaid(member, sendLog) — llamado en guildMemberAdd
 *  2. Si se detecta raid → lockdown de canales + alerta + auto-unlock tras X min
 *  3. /config antiraid para configurar por servidor
 */

const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// Estado en memoria
// ─────────────────────────────────────────────────────────────────────────────

// Map: guildId → [timestamps de joins recientes]
const joinWindows = new Map();

// Map: guildId → { active: bool, lockedChannels: [channelId], unlockTimer }
const raidState = new Map();

// ─────────────────────────────────────────────────────────────────────────────
// Config helpers
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG_PATH = path.join(__dirname, 'config.json');

function getConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); } catch { return {}; }
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

/**
 * Devuelve la config antiraid para un guild con defaults.
 */
function getAntiRaidConfig(guildId) {
  const config = getConfig();
  const defaults = {
    enabled:       false,
    threshold:     10,       // joins para activar
    windowMs:      30000,    // ventana de 30 segundos
    action:        'lockdown', // lockdown | kick | timeout
    minAccountAge: 7,        // días mínimos de antigüedad de cuenta
    unlockAfter:   10,       // minutos hasta auto-unlock
    logChannelId:  null,
  };
  return Object.assign({}, defaults, config.antiRaid?.[guildId] || {});
}

// ─────────────────────────────────────────────────────────────────────────────
// Lockdown / Unlock
// ─────────────────────────────────────────────────────────────────────────────

async function lockdownGuild(guild, sendLog, cfg) {
  const state = raidState.get(guild.id) || { active: false, lockedChannels: [] };
  if (state.active) return; // ya en lockdown

  const lockedChannels = [];

  for (const [, channel] of guild.channels.cache) {
    if (channel.type !== ChannelType.GuildText) continue;
    try {
      const everyoneOverwrite = channel.permissionOverwrites.cache.get(guild.id);
      // Solo bloquear si @everyone no tenía ya SendMessages=false
      if (everyoneOverwrite?.deny.has(PermissionFlagsBits.SendMessages)) continue;

      await channel.permissionOverwrites.edit(guild.id, {
        SendMessages: false,
      });
      lockedChannels.push(channel.id);
    } catch { /* sin permisos en ese canal */ }
  }

  // Cancelar timer anterior si existe
  if (state.unlockTimer) clearTimeout(state.unlockTimer);

  const unlockTimer = setTimeout(async () => {
    await unlockGuild(guild, sendLog, 'auto');
  }, cfg.unlockAfter * 60 * 1000);

  raidState.set(guild.id, { active: true, lockedChannels, unlockTimer });

  const embed = new EmbedBuilder()
    .setTitle('🚨 RAID DETECTADO — LOCKDOWN ACTIVADO')
    .setColor(0xFF0000)
    .addFields(
      { name: '🔒 Canales bloqueados', value: `${lockedChannels.length}`, inline: true },
      { name: '⏱️ Auto-unlock en', value: `${cfg.unlockAfter} minutos`, inline: true },
      { name: '⚙️ Acción', value: cfg.action, inline: true },
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
    const channel = guild.channels.cache.get(channelId);
    if (!channel) continue;
    try {
      await channel.permissionOverwrites.edit(guild.id, {
        SendMessages: null, // restaurar a heredado
      });
      unlocked++;
    } catch { /* sin permisos */ }
  }

  raidState.set(guild.id, { active: false, lockedChannels: [], unlockTimer: null });

  const embed = new EmbedBuilder()
    .setTitle('✅ Lockdown Levantado')
    .setColor(0x57F287)
    .addFields(
      { name: '🔓 Canales desbloqueados', value: `${unlocked}`, inline: true },
      { name: '📋 Razón', value: reason === 'auto' ? 'Auto-unlock por tiempo' : 'Desbloqueado manualmente', inline: true },
    )
    .setTimestamp();

  await sendLog(guild, embed);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Acciones sobre el miembro que activó el raid
// ─────────────────────────────────────────────────────────────────────────────

async function applyRaidAction(member, cfg) {
  try {
    if (cfg.action === 'kick') {
      await member.kick('Anti-Raid: raid detectado');
    } else if (cfg.action === 'timeout') {
      await member.timeout(10 * 60 * 1000, 'Anti-Raid: raid detectado'); // 10 min
    }
    // 'lockdown' no hace nada al miembro individual
  } catch { /* sin permisos */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// Verificación de edad de cuenta
// ─────────────────────────────────────────────────────────────────────────────

function isNewAccount(user, minDays) {
  const ageMs = Date.now() - user.createdTimestamp;
  return ageMs < minDays * 24 * 60 * 60 * 1000;
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLER PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

async function checkRaid(member, sendLog) {
  if (member.user.bot) return;

  const cfg = getAntiRaidConfig(member.guild.id);
  if (!cfg.enabled) return;

  const guildId = member.guild.id;
  const now = Date.now();

  // Actualizar ventana de joins
  const timestamps = (joinWindows.get(guildId) || []).filter(t => now - t < cfg.windowMs);
  timestamps.push(now);
  joinWindows.set(guildId, timestamps);

  // Acción sobre cuenta nueva independientemente del raid
  if (cfg.minAccountAge > 0 && isNewAccount(member.user, cfg.minAccountAge)) {
    if (cfg.action === 'kick') {
      await applyRaidAction(member, cfg);
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
    }
  }

  // Detección de raid por volumen de joins
  if (timestamps.length >= cfg.threshold) {
    // Limpiar ventana para no re-disparar en cada join siguiente
    joinWindows.set(guildId, []);

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Raid Detectado')
      .setColor(0xFF6600)
      .addFields(
        { name: '📊 Joins detectados', value: `${timestamps.length} en ${cfg.windowMs / 1000}s`, inline: true },
        { name: '⚙️ Umbral', value: `${cfg.threshold}`, inline: true },
      )
      .setTimestamp();
    await sendLog(member.guild, embed);

    await lockdownGuild(member.guild, sendLog, cfg);
    await applyRaidAction(member, cfg);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Estado público (para /antiraid status)
// ─────────────────────────────────────────────────────────────────────────────

function getRaidState(guildId) {
  return raidState.get(guildId) || { active: false, lockedChannels: [] };
}

module.exports = { checkRaid, unlockGuild, getRaidState, getAntiRaidConfig };
