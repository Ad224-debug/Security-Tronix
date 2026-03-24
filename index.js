require('dotenv').config();
const { Client, GatewayIntentBits, Collection, PermissionFlagsBits, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// ─── AUTO DEPLOY DE COMANDOS SLASH ───────────────────────────────────────────
// Se ejecuta una vez al arrancar el bot (Railway, local, etc.)
(async () => {
  try {
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
    const cmds = [];
    for (const file of commandFiles) {
      try {
        const cmd = require(path.join(commandsPath, file));
        if (cmd.data) cmds.push(cmd.data.toJSON ? cmd.data.toJSON() : cmd.data);
      } catch {}
    }
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    await rest.put(Routes.applicationCommands(process.env.APPLICATION_ID), { body: cmds });
    console.log(`✅ Slash commands deployed (${cmds.length} commands)`);
  } catch (err) {
    console.error('❌ Error deploying slash commands:', err.message);
  }
})();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION']
});

// Cache para almacenar mensajes y poder recuperarlos cuando se eliminen
const messageCache = new Map();

client.commands = new Collection();

const guildConfig = require('./guild-config');

// ─── CONFIG CACHE ────────────────────────────────────────────────────────────
// Lee config.json una vez y lo mantiene en memoria. Se invalida cuando se escribe.
let _configCache = null;
let _configMtime = 0;
const CONFIG_PATH = path.join(__dirname, 'config.json');

function getConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const mtime = fs.statSync(CONFIG_PATH).mtimeMs;
      if (!_configCache || mtime !== _configMtime) {
        _configCache = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        _configMtime = mtime;
      }
    }
  } catch { /* usa cache anterior si falla */ }
  return _configCache || {};
}

// Cache de languages.json (no cambia en runtime)
let _langCache = null;
function getLangData() {
  if (!_langCache) {
    const p = path.join(__dirname, 'languages.json');
    _langCache = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {};
  }
  return _langCache;
}

// Cargar configuración de prefijos
function getPrefix(guildId) {
  return guildConfig.get(guildId, 'prefix') || getConfig().prefixes?.[guildId] || '!';
}

// Cargar idioma del servidor
function getLanguage(guildId) {
  return guildConfig.get(guildId, 'language') || getConfig().languages?.[guildId] || 'es';
}

// Obtener texto traducido
function getText(guildId, key) {
  const lang = getLanguage(guildId);
  const languages = getLangData();
  return languages[lang]?.[key] || languages['es']?.[key] || key;
}

// Obtener canal de logs
function getLogChannel(guildId) {
  return getConfig().logChannels?.[guildId] || null;
}

// Obtener canal de logs de mensajes eliminados
function getDeleteLogChannel(guildId) {
  return getConfig().deleteLogChannels?.[guildId] || null;
}

// Obtener canal de notificaciones de boost
function getBoostChannel(guildId) {
  return guildConfig.get(guildId, 'boostChannel') || getConfig().boostChannels?.[guildId] || null;
}

// Verificar permisos personalizados de comando
function hasCommandPermission(guildId, commandName, member) {
  const configPath = path.join(__dirname, 'config.json');
  if (!fs.existsSync(configPath)) return true;
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  // Si no hay permisos configurados para este comando, permitir acceso
  if (!config.commandPermissions?.[guildId]?.[commandName]) return true;
  
  const cmdPerms = config.commandPermissions[guildId][commandName];
  
  // Si no hay usuarios ni roles configurados, permitir acceso
  if (cmdPerms.users.length === 0 && cmdPerms.roles.length === 0) return true;
  
  // Verificar si el usuario está en la lista
  if (cmdPerms.users.includes(member.id)) return true;
  
  // Verificar si el usuario tiene alguno de los roles permitidos
  const hasRole = cmdPerms.roles.some(roleId => member.roles.cache.has(roleId));
  if (hasRole) return true;
  
  // Si es administrador, siempre permitir
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  
  return false;
}

// Enviar log al canal configurado (genérico)
async function sendLog(guild, embed, isDeleteLog = false) {
  let logChannelId;
  if (isDeleteLog) {
    logChannelId = getDeleteLogChannel(guild.id) || getLogChannel(guild.id);
  } else {
    logChannelId = getLogChannel(guild.id);
  }
  if (!logChannelId) return;
  try {
    const logChannel = await guild.channels.fetch(logChannelId);
    if (logChannel) await logChannel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Error enviando log:', error);
  }
}

// Enviar log tipado — enruta al canal correcto según el tipo
// Tipos: kicks, bans, warnings, timeouts, automod, messages, voice, members, server, invites
async function sendTypedLog(guild, type, embed) {
  const modLogs = guildConfig.get(guild.id, 'modLogs') || {};
  // Buscar canal específico para el tipo, luego fallback al canal genérico
  const channelId = modLogs[type] || getLogChannel(guild.id);
  if (!channelId) return;
  try {
    const ch = await guild.channels.fetch(channelId);
    if (ch) await ch.send({ embeds: [embed] });
  } catch (err) {
    console.error(`Error enviando typed log [${type}]:`, err);
  }
}

// Exportar funciones para uso en comandos
client.getLanguage = getLanguage;
client.getText = getText;
client.sendLog = sendLog;
client.sendTypedLog = sendTypedLog;

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  try {
    const command = require(filePath);
    if (!command.data || !command.execute) {
      console.warn(`[WARN] Comando ${file} no tiene data o execute, saltando.`);
      continue;
    }
    client.commands.set(command.data.name, command);
    console.log(`[LOAD] Comando cargado: ${command.data.name} (${file})`);
    
    // Inicializar tracking de mensajes si existe
    if (command.setupMessageTracking) {
      command.setupMessageTracking(client);
    }
  } catch (err) {
    console.error(`[ERROR] Fallo al cargar comando ${file}:`, err.message);
  }
}

const cron = require('node-cron');

client.once('clientReady', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
  setupCronJobs();
});

function setupCronJobs() {
  const cronJobs = {};
  const cronHealth = { lastRun: {}, failures: {} };

  function scheduleSafe(name, pattern, fn) {
    const job = cron.schedule(pattern, async () => {
      try {
        await fn();
        cronHealth.lastRun[name] = Date.now();
        cronHealth.failures[name] = 0;
      } catch (error) {
        cronHealth.failures[name] = (cronHealth.failures[name] || 0) + 1;
        console.error(`Error in cron job [${name}]:`, error);
        if (cronHealth.failures[name] >= 3) {
          console.error(`⚠️ Cron job [${name}] has failed ${cronHealth.failures[name]} times in a row`);
        }
      }
    });
    cronJobs[name] = job;
    return job;
  }

  // Verificar y enviar recordatorios cada 5 minutos — eliminado (sistema de eventos movido)

  // ── Tempban persistente: revisar cada 5 minutos ───────────────────────────
  // Desbanea usuarios cuyo tempban expiró (sobrevive reinicios del bot)
  scheduleSafe('tempbanExpiry', '*/5 * * * *', async () => {
    const casesPath = path.join(__dirname, 'data/mod-cases.json');
    if (!fs.existsSync(casesPath)) return;
    let cases;
    try { cases = JSON.parse(fs.readFileSync(casesPath, 'utf8')); } catch { return; }
    const now = Date.now();
    let changed = false;
    for (const [guildId, guildCases] of Object.entries(cases)) {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) continue;
      for (const c of guildCases) {
        if (c.type === 'tempban' && c.expiresAt && c.expiresAt <= now && !c.unbanned) {
          try {
            await guild.members.unban(c.targetId, 'Tempban expirado');
            c.unbanned = true;
            changed = true;
            console.log(`[tempban] Unbanned ${c.targetId} in ${guild.name} (case #${c.id})`);
            // Log del unban automático
            const embed = new EmbedBuilder()
              .setTitle('⏰ Tempban Expirado — Unban Automático')
              .setColor(0x57F287)
              .addFields(
                { name: '👤 Usuario', value: `<@${c.targetId}> (${c.targetId})`, inline: true },
                { name: '📋 Caso', value: `#${c.id}`, inline: true },
                { name: '📝 Razón original', value: c.reason || 'N/A', inline: false }
              )
              .setTimestamp();
            await sendTypedLog(guild, 'bans', embed);
          } catch (err) {
            // Usuario ya no estaba baneado o no existe — marcar igual para no reintentar
            if (err.code === 10026 || err.code === 10007) { c.unbanned = true; changed = true; }
          }
        }
      }
    }
    if (changed) fs.writeFileSync(casesPath, JSON.stringify(cases, null, 2));
  });

  // Limpieza diaria a las 2 AM
  scheduleSafe('cleanup', '0 2 * * *', async () => {
    console.log('✅ Daily cleanup completed');
  });

  // Backup automático diario a las 3 AM
  scheduleSafe('backup', '0 3 * * *', async () => {
    const BackupSystem = require('./backup-system');
    const backupSystem = new BackupSystem(client);
    
    const result = await backupSystem.createBackup();
    if (result.success) {
      console.log(`✅ Automatic backup created: ${result.backupName}`);
      const cleanup = backupSystem.cleanupOldBackups(30);
      if (cleanup.deleted > 0) {
        console.log(`🗑️ Cleaned up ${cleanup.deleted} old backups`);
      }
    } else {
      console.error('❌ Automatic backup failed:', result.error);
    }
  });

  // Health check cada 15 minutos
  scheduleSafe('healthCheck', '*/15 * * * *', async () => {
    const now = Date.now();
    const staleThreshold = 20 * 60 * 1000; // 20 minutos
    for (const [name, lastRun] of Object.entries(cronHealth.lastRun)) {
      if (now - lastRun > staleThreshold && ['reminders', 'statusUpdate'].includes(name)) {
        console.warn(`⚠️ Cron job [${name}] hasn't run in over 20 minutes (last: ${new Date(lastRun).toISOString()})`);
      }
    }
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
    try {
      Object.values(cronJobs).forEach(job => job.stop());
      console.log('✅ Data saved. Goodbye!');
    } catch (err) {
      console.error('Error during shutdown:', err);
    }
    process.exit(0);
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));

  console.log('✅ Cron jobs configured');
}

// ==================== SISTEMA DE LOGS AUTOMÁTICO ====================
const { EmbedBuilder } = require('discord.js');

// Sistema de Auto-Moderación
const { checkAutomod } = require('./automod-system');

// Sistemas de seguridad adicionales (anti-spam, phishing, alt-detector)
const { runSecurityChecks, runAltCheck } = require('./security-systems');
// Sistema anti-raid
const { checkRaid } = require('./antiraid-system');

// Cachear mensajes para poder recuperarlos cuando se eliminen
client.on('messageCreate', async (message) => {
  if (!message.guild) return;
  if (message.author?.bot) return;
  if (message.type !== 0 && message.type !== 19) return; // Solo mensajes normales y replies

  // Capturar mensajes para logs activos
  if (global.activeLogs) {
    const key = `${message.guild.id}-${message.author.id}`;
    if (global.activeLogs.has(key)) {
      global.activeLogs.get(key).messages.push({
        content: message.content || '[sin texto]',
        channel: message.channel.name,
        timestamp: message.createdTimestamp,
        attachments: message.attachments.size
      });
    }
  }
  
  // Ejecutar auto-moderación
  await checkAutomod(message);

  // Ejecutar sistemas de seguridad adicionales (anti-spam, phishing)
  await runSecurityChecks(message, sendLog);

  // Guardar información del mensaje en cache
  messageCache.set(message.id, {
    content: message.content,
    author: {
      id: message.author.id,
      tag: message.author.tag,
      avatar: message.author.displayAvatarURL()
    },
    channel: {
      id: message.channel.id,
      name: message.channel.name
    },
    attachments: message.attachments.map(att => ({
      name: att.name,
      url: att.url,
      proxyURL: att.proxyURL,
      size: att.size,
      contentType: att.contentType
    })),
    embeds: message.embeds.length,
    stickers: message.stickers.map(s => s.name),
    createdTimestamp: message.createdTimestamp,
    guildId: message.guild.id
  });
  
  // Limpiar cache después de 24 horas para no consumir mucha memoria
  setTimeout(() => {
    messageCache.delete(message.id);
  }, 24 * 60 * 60 * 1000);
});

// Log: Mensajes eliminados (MEJORADO)
client.on('messageDelete', async (message) => {
  try {
    if (!message.guild) return;
    
    // Intentar obtener del cache si el mensaje no está completo
    let cachedData = null;
    
    if (messageCache.has(message.id)) {
      cachedData = messageCache.get(message.id);
    }
    
    // Si es un bot, ignorar (opcional, puedes quitarlo si quieres logs de bots también)
    if (message.author?.bot || cachedData?.author?.bot) return;
    
    const embed = new EmbedBuilder()
      .setTitle('🗑️ Mensaje Eliminado')
      .setColor(0xFF0000)
      .setTimestamp();

    // Información del autor
    let authorTag = 'Usuario Desconocido';
    let authorId = null;
    let authorAvatar = null;

    if (message.author) {
      authorTag = message.author.tag;
      authorId = message.author.id;
      authorAvatar = message.author.displayAvatarURL();
    } else if (cachedData?.author) {
      authorTag = cachedData.author.tag;
      authorId = cachedData.author.id;
      authorAvatar = cachedData.author.avatar;
    }

    if (authorAvatar) {
      embed.setAuthor({
        name: authorTag,
        iconURL: authorAvatar
      });
    } else {
      embed.setAuthor({ name: authorTag });
    }

    if (authorId) {
      embed.addFields({ name: '👤 Autor', value: `<@${authorId}>`, inline: true });
    }

    // Canal donde se eliminó
    embed.addFields({ name: '📍 Canal', value: `<#${message.channel.id}>`, inline: true });

    // Hora de creación del mensaje
    const createdAt = message.createdTimestamp || cachedData?.createdTimestamp;
    if (createdAt) {
      embed.addFields({ name: '🕐 Enviado', value: `<t:${Math.floor(createdAt / 1000)}:R>`, inline: true });
    }

    // Contenido del mensaje
    const content = message.content || cachedData?.content;
    if (content && content.length > 0) {
      const truncatedContent = content.length > 1024 ? content.substring(0, 1021) + '...' : content;
      embed.addFields({ name: '💬 Contenido', value: truncatedContent, inline: false });
    }

    // Archivos adjuntos (imágenes, GIFs, videos, etc.)
    let attachments = message.attachments;
    if ((!attachments || attachments.size === 0) && cachedData?.attachments) {
      attachments = new Map(cachedData.attachments.map(att => [att.name, att]));
    }

    if (attachments && attachments.size > 0) {
      const attachmentList = Array.from(attachments.values()).map((att, index) => {
        const size = att.size ? `(${(att.size / 1024).toFixed(2)} KB)` : '';
        return `${index + 1}. [${att.name}](${att.url}) ${size}`;
      }).join('\n');
      
      embed.addFields({ name: '📎 Archivos Adjuntos', value: attachmentList, inline: false });
      
      // Si es una imagen o GIF, mostrarla en el embed
      const firstAttachment = Array.from(attachments.values())[0];
      if (firstAttachment && firstAttachment.contentType?.startsWith('image/')) {
        embed.setImage(firstAttachment.proxyURL || firstAttachment.url);
      }
    }

    // Stickers
    let stickers = message.stickers;
    if ((!stickers || stickers.size === 0) && cachedData?.stickers) {
      stickers = new Map(cachedData.stickers.map((name, index) => [index, { name }]));
    }

    if (stickers && stickers.size > 0) {
      const stickerList = Array.from(stickers.values()).map(s => s.name || s).join(', ');
      embed.addFields({ name: '🎨 Stickers', value: stickerList, inline: false });
    }

    // Embeds en el mensaje
    const embedCount = message.embeds?.length || cachedData?.embeds || 0;
    if (embedCount > 0) {
      embed.addFields({ name: '📋 Embeds', value: `${embedCount} embed(s)`, inline: true });
    }

    // ID del mensaje
    embed.setFooter({ text: `ID del mensaje: ${message.id}` });

    await sendTypedLog(message.guild, 'messages', embed); // messages log channel
    
    // Limpiar del cache
    messageCache.delete(message.id);
  } catch (error) {
    console.error('Error en log de mensaje eliminado:', error);
  }
});

// Log: Mensajes editados
client.on('messageUpdate', async (oldMessage, newMessage) => {
  if (newMessage.author?.bot) return;
  if (!newMessage.guild) return;
  if (oldMessage.content === newMessage.content) return;

  const embed = new EmbedBuilder()
    .setTitle('✏️ Mensaje Editado')
    .setColor(0xFFA500)
    .addFields(
      { name: 'Autor', value: `${newMessage.author.tag}`, inline: true },
      { name: 'Canal', value: `${newMessage.channel}`, inline: true },
      { name: 'Antes', value: oldMessage.content || '*Sin contenido*', inline: false },
      { name: 'Después', value: newMessage.content || '*Sin contenido*', inline: false },
      { name: 'Link', value: `[Ir al mensaje](${newMessage.url})`, inline: false }
    )
    .setTimestamp();

  await sendTypedLog(newMessage.guild, 'messages', embed);
});

// ==================== ANÁLISIS DE REPUTACIÓN AL UNIRSE ====================
async function analyzeAndSendReputation(member) {
  const configPath = path.join(__dirname, 'config.json');
  if (!fs.existsSync(configPath)) return;
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  const channelId = config.joinCheckChannels?.[member.guild.id] || config.logChannels?.[member.guild.id];
  if (!channelId) return;

  const channel = await member.guild.channels.fetch(channelId).catch(() => null);
  if (!channel) return;

  // Fetch completo del usuario para obtener flags, banner, bio, etc.
  const user = await member.user.fetch().catch(() => member.user);

  const accountAgeDays = Math.floor((Date.now() - user.createdTimestamp) / 86400000);
  const accountAgeYears = Math.floor(accountAgeDays / 365);
  const ageStr = accountAgeYears > 0
    ? `${accountAgeYears} año(s), ${accountAgeDays % 365} día(s)`
    : `${accountAgeDays} día(s)`;

  // ── Señales de confianza (suman puntos positivos) ──────────────────────────
  // Empezamos en 0 y sumamos confianza, luego restamos riesgo
  let trustScore = 0;
  const trustSignals = [];
  const riskSignals = [];

  // Edad de la cuenta
  if (accountAgeDays >= 365 * 3) { trustScore += 30; trustSignals.push('📅 Cuenta con más de 3 años'); }
  else if (accountAgeDays >= 365) { trustScore += 20; trustSignals.push('📅 Cuenta con más de 1 año'); }
  else if (accountAgeDays >= 180) { trustScore += 10; trustSignals.push('📅 Cuenta con más de 6 meses'); }
  else if (accountAgeDays >= 30)  { trustScore += 5; }
  else if (accountAgeDays < 3)    { trustScore -= 40; riskSignals.push('🚨 Cuenta muy nueva (<3 días)'); }
  else if (accountAgeDays < 7)    { trustScore -= 25; riskSignals.push('⚠️ Cuenta nueva (<7 días)'); }
  else if (accountAgeDays < 30)   { trustScore -= 10; riskSignals.push('⚠️ Cuenta reciente (<30 días)'); }

  // Avatar
  if (user.avatar) { trustScore += 10; trustSignals.push('🖼️ Tiene avatar personalizado'); }
  else { trustScore -= 10; riskSignals.push('⚠️ Sin avatar (cuenta por defecto)'); }

  // Banner de perfil
  if (user.banner) { trustScore += 10; trustSignals.push('🎨 Tiene banner de perfil'); }

  // Bio / About Me (solo disponible con fetch completo)
  if (user.bio) { trustScore += 5; trustSignals.push('📝 Tiene bio en el perfil'); }

  // Nitro (premiumType: 0=none, 1=Nitro Classic, 2=Nitro, 3=Nitro Basic)
  if (user.premiumType && user.premiumType > 0) {
    trustScore += 20;
    const nitroTypes = { 1: 'Nitro Classic', 2: 'Nitro', 3: 'Nitro Basic' };
    trustSignals.push(`💎 Tiene Discord ${nitroTypes[user.premiumType] || 'Nitro'}`);
  }

  // Flags de la cuenta (UserFlags de Discord)
  const { UserFlags } = require('discord.js');
  const flags = user.flags;
  if (flags) {
    if (flags.has(UserFlags.Staff))                    { trustScore += 50; trustSignals.push('👑 Discord Staff'); }
    if (flags.has(UserFlags.Partner))                  { trustScore += 40; trustSignals.push('🤝 Discord Partner'); }
    if (flags.has(UserFlags.BugHunterLevel1))          { trustScore += 15; trustSignals.push('🐛 Bug Hunter'); }
    if (flags.has(UserFlags.BugHunterLevel2))          { trustScore += 25; trustSignals.push('🐛 Bug Hunter Gold'); }
    if (flags.has(UserFlags.ActiveDeveloper))          { trustScore += 20; trustSignals.push('👨‍💻 Active Developer'); }
    if (flags.has(UserFlags.VerifiedDeveloper))        { trustScore += 30; trustSignals.push('✅ Verified Bot Developer'); }
    if (flags.has(UserFlags.PremiumEarlySupporter))    { trustScore += 15; trustSignals.push('🌟 Early Nitro Supporter'); }
    if (flags.has(UserFlags.HypeSquadOnlineHouse1))    { trustScore += 5;  trustSignals.push('🏠 HypeSquad Bravery'); }
    if (flags.has(UserFlags.HypeSquadOnlineHouse2))    { trustScore += 5;  trustSignals.push('🏠 HypeSquad Brilliance'); }
    if (flags.has(UserFlags.HypeSquadOnlineHouse3))    { trustScore += 5;  trustSignals.push('🏠 HypeSquad Balance'); }
    if (flags.has(UserFlags.Quarantined))              { trustScore -= 60; riskSignals.push('🚫 Cuenta en cuarentena por Discord'); }
    if (flags.has(UserFlags.Spammer))                  { trustScore -= 50; riskSignals.push('🚨 Marcado como spammer por Discord'); }
  }

  // Nombre sospechoso
  if (/free.*nitro|nitro.*free|discord.*gift/i.test(user.username)) {
    trustScore -= 35; riskSignals.push('🚨 Nombre sospechoso (Nitro/Gift scam)');
  }
  if (/admin|moderator|staff|official|support/i.test(user.username)) {
    trustScore -= 20; riskSignals.push('⚠️ Nombre que imita staff/soporte');
  }

  // Clamp entre -100 y 100, luego convertir a 0-100 para mostrar
  trustScore = Math.max(-100, Math.min(100, trustScore));
  const displayScore = Math.round((trustScore + 100) / 2); // 0-100

  // Nivel de confianza
  let trustLevel, color;
  if (displayScore >= 70)      { trustLevel = '🟢 ALTA';  color = 0x57F287; }
  else if (displayScore >= 40) { trustLevel = '🟡 MEDIA'; color = 0xFFA500; }
  else                         { trustLevel = '🔴 BAJA';  color = 0xED4245; }

  const joinType = member.pending ? '📋 Aprobó formulario de acceso' : '📥 Se unió al servidor';

  const embed = new EmbedBuilder()
    .setTitle(`🔍 Análisis de Confianza — ${joinType}`)
    .setColor(color)
    .setThumbnail(user.displayAvatarURL())
    .addFields(
      { name: '👤 Usuario', value: `${user} (${user.tag})`, inline: true },
      { name: '🆔 ID', value: user.id, inline: true },
      { name: '🏅 Confianza', value: `${trustLevel} (${displayScore}/100)`, inline: true },
      { name: '📅 Cuenta creada', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: true },
      { name: '⏳ Antigüedad', value: ageStr, inline: true },
      { name: '💎 Nitro', value: user.premiumType > 0 ? '✅ Sí' : '❌ No', inline: true }
    )
    .setFooter({ text: 'Tronix Security • Account Trust Analysis' })
    .setTimestamp();

  if (trustSignals.length > 0) {
    embed.addFields({ name: '✅ Señales positivas', value: trustSignals.join('\n') });
  }
  if (riskSignals.length > 0) {
    embed.addFields({ name: '🚩 Señales de riesgo', value: riskSignals.join('\n') });
  }
  if (trustSignals.length === 0 && riskSignals.length === 0) {
    embed.addFields({ name: '📊 Sin señales destacadas', value: 'Cuenta sin badges ni alertas detectadas.' });
  }

  await channel.send({ embeds: [embed] });
}

// Log: Miembro se une + Sistema de protección de bots
client.on('guildMemberAdd', async (member) => {
  // Sistema de protección de bots
  if (member.user.bot) {
    const configPath = path.join(__dirname, 'config.json');
    
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const botPerms = config.botPermissions?.[member.guild.id];
      
      // Si el sistema está habilitado
      if (botPerms && botPerms.enabled) {
        // Obtener el audit log para ver quién agregó el bot
        try {
          const fetchedLogs = await member.guild.fetchAuditLogs({
            limit: 1,
            type: 28 // MEMBER_ADD
          });
          
          const auditEntry = fetchedLogs.entries.first();
          
          if (auditEntry && auditEntry.target.id === member.user.id) {
            const executor = auditEntry.executor;
            
            // Verificar si el usuario tiene permiso
            const hasPermission = botPerms.allowedUsers.includes(executor.id);
            
            if (!hasPermission) {
              // Kickear el bot
              await member.kick('Bot agregado sin autorización');
              
              const lang = getLanguage(member.guild.id);
              
              // Notificar al usuario que intentó agregar el bot
              try {
                await executor.send(lang === 'es'
                  ? `❌ No tienes permiso para agregar bots al servidor **${member.guild.name}**. El bot **${member.user.tag}** fue expulsado automáticamente.\n\nContacta al dueño del servidor si necesitas agregar un bot.`
                  : `❌ You don't have permission to add bots to **${member.guild.name}**. The bot **${member.user.tag}** was automatically kicked.\n\nContact the server owner if you need to add a bot.`
                );
              } catch (error) {
                // Usuario tiene DMs desactivados
              }
              
              // Log del bot expulsado
              const kickEmbed = new EmbedBuilder()
                .setTitle('🤖 Bot Expulsado (Sin Autorización)')
                .setColor(0xFF0000)
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                  { name: '🤖 Bot', value: `${member.user.tag}`, inline: true },
                  { name: '👤 Agregado por', value: `${executor.tag}`, inline: true },
                  { name: '❌ Razón', value: lang === 'es' ? 'Usuario sin permiso para agregar bots' : 'User without permission to add bots', inline: false }
                )
                .setTimestamp();
              
              await sendLog(member.guild, kickEmbed);
              return; // No continuar con el log normal
            } else {
              // Usuario tiene permiso, log especial
              const botAddEmbed = new EmbedBuilder()
                .setTitle('🤖 Bot Agregado (Autorizado)')
                .setColor(0x00FF00)
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                  { name: '🤖 Bot', value: `${member.user.tag}`, inline: true },
                  { name: '👤 Agregado por', value: `${executor.tag}`, inline: true },
                  { name: '✅ Estado', value: lang === 'es' ? 'Autorizado' : 'Authorized', inline: true }
                )
                .setTimestamp();
              
              await sendLog(member.guild, botAddEmbed);
              return; // No continuar con el log normal
            }
          }
        } catch (error) {
          console.error('Error checking bot permissions:', error);
        }
      }
    }
  }
  
  // Log normal de miembro nuevo (solo para usuarios humanos)
  const embed = new EmbedBuilder()
    .setTitle('📥 Miembro Nuevo')
    .setColor(0x00FF00)
    .setThumbnail(member.user.displayAvatarURL())
    .addFields(
      { name: 'Usuario', value: `${member.user.tag}`, inline: true },
      { name: 'ID', value: member.user.id, inline: true },
      { name: 'Cuenta Creada', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: false },
      { name: 'Miembros Totales', value: `${member.guild.memberCount}`, inline: true }
    )
    .setTimestamp();

  await sendTypedLog(member.guild, 'members', embed);

  // Análisis de reputación: solo si NO tiene formulario pendiente
  // (si tiene pending:true, se analizará cuando apruebe el formulario en guildMemberUpdate)
  if (!member.pending) {
    await analyzeAndSendReputation(member).catch(err => console.error('[joincheck]', err));
    await checkRaid(member, sendLog).catch(err => console.error('[antiraid]', err));
    await runAltCheck(member, sendLog).catch(err => console.error('[altcheck]', err));
  }

  // ── Role Restore: restaurar roles si el usuario vuelve a entrar ──────────
  try {
    const stored = guildConfig.get(member.guild.id, 'roleRestore') || {};
    if (stored[member.id]) {
      const { roles: savedRoles } = stored[member.id];
      const validRoles = savedRoles.filter(id => member.guild.roles.cache.has(id));
      if (validRoles.length > 0) {
        await member.roles.set(validRoles, 'Role Restore: usuario volvió al servidor');
        const logEmbed = new EmbedBuilder()
          .setTitle('🔄 Roles Restaurados')
          .setColor(0x5865F2)
          .setThumbnail(member.user.displayAvatarURL())
          .addFields(
            { name: '👤 Usuario', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
            { name: '🎭 Roles restaurados', value: `${validRoles.length}`, inline: true }
          )
          .setFooter({ text: 'Role Restore automático' })
          .setTimestamp();
        await sendTypedLog(member.guild, 'members', logEmbed);
      }
      // Limpiar después de restaurar
      delete stored[member.id];
      guildConfig.set(member.guild.id, 'roleRestore', stored);
    }
  } catch (err) {
    console.error('[roleRestore] Error restoring roles on rejoin:', err);
  }

  // ── Verificación de entrada ───────────────────────────────────────────────
  try {
    const { getConfig: getVerifyConfig, sendVerificationToMember } = require('./verification-system');
    const verifyCfg = getVerifyConfig(member.guild.id);
    if (verifyCfg?.enabled && !member.user.bot) {
      await sendVerificationToMember(member, verifyCfg);
    }
  } catch (err) {
    console.error('[verify] Error sending verification:', err);
  }
});

// Log: Miembro se va + guardar roles para Role Restore
client.on('guildMemberRemove', async (member) => {
  const embed = new EmbedBuilder()
    .setTitle('📤 Miembro Salió')
    .setColor(0xFF0000)
    .setThumbnail(member.user.displayAvatarURL())
    .addFields(
      { name: 'Usuario', value: `${member.user.tag}`, inline: true },
      { name: 'ID', value: member.user.id, inline: true },
      { name: 'Se Unió', value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Desconocido', inline: false },
      { name: 'Miembros Totales', value: `${member.guild.memberCount}`, inline: true }
    )
    .setTimestamp();

  await sendTypedLog(member.guild, 'members', embed);

  // ── Role Restore: guardar roles al salir ──────────────────────────────────
  try {
    const roleIds = member.roles.cache
      .filter(r => r.id !== member.guild.id) // excluir @everyone
      .map(r => r.id);

    if (roleIds.length > 0) {
      const stored = guildConfig.get(member.guild.id, 'roleRestore') || {};
      stored[member.id] = { roles: roleIds, leftAt: Date.now(), tag: member.user.tag };
      guildConfig.set(member.guild.id, 'roleRestore', stored);
    }
  } catch (err) {
    console.error('[roleRestore] Error saving roles on leave:', err);
  }
});

// Log: Usuario baneado
client.on('guildBanAdd', async (ban) => {
  const embed = new EmbedBuilder()
    .setTitle('🔨 Usuario Baneado')
    .setColor(0x8B0000)
    .setThumbnail(ban.user.displayAvatarURL())
    .addFields(
      { name: 'Usuario', value: `${ban.user.tag}`, inline: true },
      { name: 'ID', value: ban.user.id, inline: true },
      { name: 'Razón', value: ban.reason || 'No especificada', inline: false }
    )
    .setTimestamp();

  await sendTypedLog(ban.guild, 'bans', embed);
});

// Log: Usuario desbaneado
client.on('guildBanRemove', async (ban) => {
  const embed = new EmbedBuilder()
    .setTitle('🔓 Usuario Desbaneado')
    .setColor(0x00FF00)
    .setThumbnail(ban.user.displayAvatarURL())
    .addFields(
      { name: 'Usuario', value: `${ban.user.tag}`, inline: true },
      { name: 'ID', value: ban.user.id, inline: true }
    )
    .setTimestamp();

  await sendTypedLog(ban.guild, 'bans', embed);
});

// Log: Rol asignado/removido
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  // Membership Screening: usuario aprobó el formulario (pending: true → false)
  if (oldMember.pending === true && newMember.pending === false) {
    await analyzeAndSendReputation(newMember).catch(err => console.error('[joincheck screening]', err));
    await runAltCheck(newMember, sendLog).catch(err => console.error('[altcheck screening]', err));
  }

  const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
  const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

  if (addedRoles.size > 0) {
    const embed = new EmbedBuilder()
      .setTitle('➕ Rol Asignado')
      .setColor(0x00FF00)
      .addFields(
        { name: 'Usuario', value: `${newMember.user.tag}`, inline: true },
        { name: 'Rol', value: addedRoles.map(r => r.name).join(', '), inline: true }
      )
      .setTimestamp();

    await sendTypedLog(newMember.guild, 'members', embed);
  }

  if (removedRoles.size > 0) {
    const embed = new EmbedBuilder()
      .setTitle('➖ Rol Removido')
      .setColor(0xFF0000)
      .addFields(
        { name: 'Usuario', value: `${newMember.user.tag}`, inline: true },
        { name: 'Rol', value: removedRoles.map(r => r.name).join(', '), inline: true }
      )
      .setTimestamp();

    await sendTypedLog(newMember.guild, 'members', embed);
  }

  // Log: Cambio de apodo
  if (oldMember.nickname !== newMember.nickname) {
    const embed = new EmbedBuilder()
      .setTitle('✏️ Apodo Cambiado')
      .setColor(0x3498DB)
      .addFields(
        { name: 'Usuario', value: `${newMember.user.tag}`, inline: true },
        { name: 'Antes', value: oldMember.nickname || 'Sin apodo', inline: true },
        { name: 'Después', value: newMember.nickname || 'Sin apodo', inline: true }
      )
      .setTimestamp();

    await sendTypedLog(newMember.guild, 'members', embed);
  }

  // Log: Timeout aplicado/removido
  const oldTimeout = oldMember.communicationDisabledUntilTimestamp;
  const newTimeout = newMember.communicationDisabledUntilTimestamp;
  if (!oldTimeout && newTimeout && newTimeout > Date.now()) {
    // Buscar en audit log quién aplicó el timeout y la razón
    let moderator = null, reason = 'No especificada';
    try {
      const auditLogs = await newMember.guild.fetchAuditLogs({ limit: 1, type: 24 }); // MEMBER_UPDATE
      const entry = auditLogs.entries.first();
      if (entry && entry.target.id === newMember.id && Date.now() - entry.createdTimestamp < 5000) {
        moderator = entry.executor;
        reason = entry.reason || 'No especificada';
      }
    } catch { /* skip */ }
    const embed = new EmbedBuilder()
      .setTitle('⏱️ Timeout Aplicado')
      .setColor(0xFFA500)
      .setThumbnail(newMember.user.displayAvatarURL())
      .addFields(
        { name: '👤 Usuario', value: `${newMember.user.tag} (<@${newMember.id}>)`, inline: true },
        { name: '🆔 ID', value: newMember.id, inline: true },
        { name: '⏰ Expira', value: `<t:${Math.floor(newTimeout / 1000)}:R>`, inline: true },
        { name: '🛡️ Moderador', value: moderator ? `${moderator.tag} (<@${moderator.id}>)` : 'Desconocido', inline: true },
        { name: '📝 Razón', value: reason, inline: true }
      )
      .setTimestamp();
    await sendTypedLog(newMember.guild, 'timeouts', embed);
  } else if (oldTimeout && (!newTimeout || newTimeout <= Date.now())) {
    let moderator = null;
    try {
      const auditLogs = await newMember.guild.fetchAuditLogs({ limit: 1, type: 24 });
      const entry = auditLogs.entries.first();
      if (entry && entry.target.id === newMember.id && Date.now() - entry.createdTimestamp < 5000) {
        moderator = entry.executor;
      }
    } catch { /* skip */ }
    const embed = new EmbedBuilder()
      .setTitle('✅ Timeout Removido')
      .setColor(0x57F287)
      .setThumbnail(newMember.user.displayAvatarURL())
      .addFields(
        { name: '👤 Usuario', value: `${newMember.user.tag} (<@${newMember.id}>)`, inline: true },
        { name: '🆔 ID', value: newMember.id, inline: true },
        { name: '🛡️ Moderador', value: moderator ? `${moderator.tag} (<@${moderator.id}>)` : 'Desconocido', inline: true }
      )
      .setTimestamp();
    await sendTypedLog(newMember.guild, 'timeouts', embed);
  }

  // Sistema de notificaciones de boost
  const boostChannelId = getBoostChannel(newMember.guild.id);
  if (boostChannelId) {
    const oldBoostStatus = oldMember.premiumSince;
    const newBoostStatus = newMember.premiumSince;

    // Usuario empezó a boostear (primer boost)
    if (!oldBoostStatus && newBoostStatus) {
      try {
        const boostChannel = await newMember.guild.channels.fetch(boostChannelId);
        if (boostChannel) {
          const boostCount = newMember.guild.premiumSubscriptionCount || 0;
          const embed = new EmbedBuilder()
            .setTitle(getText(newMember.guild.id, 'boost_thanks'))
            .setDescription(`${newMember} ${getText(newMember.guild.id, 'boost_thanks_desc')}`)
            .setColor(0xFF73FA)
            .setThumbnail(newMember.user.displayAvatarURL())
            .addFields({ name: getText(newMember.guild.id, 'boost_count'), value: `${boostCount} boost${boostCount !== 1 ? 's' : ''}`, inline: true })
            .setTimestamp();
          await boostChannel.send({ content: `${newMember}`, embeds: [embed] });
        }
      } catch (error) {
        console.error('Error sending boost notification:', error);
      }
    }

    // Usuario dejó de boostear
    if (oldBoostStatus && !newBoostStatus) {
      try {
        const boostChannel = await newMember.guild.channels.fetch(boostChannelId);
        if (boostChannel) {
          const boostCount = newMember.guild.premiumSubscriptionCount || 0;
          const embed = new EmbedBuilder()
            .setTitle(getText(newMember.guild.id, 'boost_removed'))
            .setDescription(`${newMember} ${getText(newMember.guild.id, 'boost_removed_desc')}`)
            .setColor(0x808080)
            .setThumbnail(newMember.user.displayAvatarURL())
            .addFields({ name: getText(newMember.guild.id, 'boost_removed_count'), value: `${boostCount} boost${boostCount !== 1 ? 's' : ''}`, inline: true })
            .setTimestamp();
          await boostChannel.send({ embeds: [embed] });
        }
      } catch (error) {
        console.error('Error sending boost removal notification:', error);
      }
    }
  }
});

// Detectar boosts via mensajes del sistema (captura 1er y 2do boost)
client.on('messageCreate', async (message) => {
  // Tipo 8 = USER_PREMIUM_GUILD_SUBSCRIPTION (boost)
  if (!message.guild || message.type !== 8) return;

  const boostChannelId = getBoostChannel(message.guild.id);
  if (!boostChannelId) return;

  try {
    const boostChannel = await message.guild.channels.fetch(boostChannelId);
    if (!boostChannel) return;

    // Refetch guild para tener el conteo actualizado
    const guild = await message.guild.fetch();
    const boostCount = guild.premiumSubscriptionCount || 0;
    const member = message.member || await message.guild.members.fetch(message.author.id).catch(() => null);

    const embed = new EmbedBuilder()
      .setTitle(getText(message.guild.id, 'boost_thanks'))
      .setDescription(`${message.author} ${getText(message.guild.id, 'boost_thanks_desc')}`)
      .setColor(0xFF73FA)
      .setThumbnail(message.author.displayAvatarURL())
      .addFields({ name: getText(message.guild.id, 'boost_count'), value: `${boostCount} boost${boostCount !== 1 ? 's' : ''}`, inline: true })
      .setTimestamp();

    await boostChannel.send({ content: `${message.author}`, embeds: [embed] });
  } catch (error) {
    console.error('Error sending boost notification (system message):', error);
  }
});

// Log: Canal creado
client.on('channelCreate', async (channel) => {
  if (!channel.guild) return;

  const embed = new EmbedBuilder()
    .setTitle('📝 Canal Creado')
    .setColor(0x00FF00)
    .addFields(
      { name: 'Canal', value: `${channel}`, inline: true },
      { name: 'Tipo', value: channel.type.toString(), inline: true },
      { name: 'ID', value: channel.id, inline: true }
    )
    .setTimestamp();

  await sendTypedLog(channel.guild, 'server', embed);
});

// Log: Canal eliminado
client.on('channelDelete', async (channel) => {
  if (!channel.guild) return;

  const embed = new EmbedBuilder()
    .setTitle('🗑️ Canal Eliminado')
    .setColor(0xFF0000)
    .addFields(
      { name: 'Canal', value: channel.name, inline: true },
      { name: 'Tipo', value: channel.type.toString(), inline: true },
      { name: 'ID', value: channel.id, inline: true }
    )
    .setTimestamp();

  await sendTypedLog(channel.guild, 'server', embed);
});

// Log: Rol creado
client.on('roleCreate', async (role) => {
  const embed = new EmbedBuilder()
    .setTitle('🎭 Rol Creado')
    .setColor(0x00FF00)
    .addFields(
      { name: 'Rol', value: role.name, inline: true },
      { name: 'Color', value: role.hexColor, inline: true },
      { name: 'ID', value: role.id, inline: true }
    )
    .setTimestamp();

  await sendTypedLog(role.guild, 'server', embed);
});

// Log: Rol eliminado
client.on('roleDelete', async (role) => {
  const embed = new EmbedBuilder()
    .setTitle('🗑️ Rol Eliminado')
    .setColor(0xFF0000)
    .addFields(
      { name: 'Rol', value: role.name, inline: true },
      { name: 'Color', value: role.hexColor, inline: true },
      { name: 'ID', value: role.id, inline: true }
    )
    .setTimestamp();

  await sendTypedLog(role.guild, 'server', embed);
});

// Log: Canal actualizado (nombre, topic, permisos)
client.on('channelUpdate', async (oldChannel, newChannel) => {
  if (!newChannel.guild) return;
  const changes = [];
  if (oldChannel.name !== newChannel.name) changes.push({ name: '📝 Nombre', value: `\`${oldChannel.name}\` → \`${newChannel.name}\``, inline: false });
  if (oldChannel.topic !== newChannel.topic) changes.push({ name: '📋 Topic', value: `${oldChannel.topic || '*vacío*'} → ${newChannel.topic || '*vacío*'}`, inline: false });
  if (oldChannel.rateLimitPerUser !== newChannel.rateLimitPerUser) changes.push({ name: '🐌 Slowmode', value: `${oldChannel.rateLimitPerUser}s → ${newChannel.rateLimitPerUser}s`, inline: true });
  if (oldChannel.nsfw !== newChannel.nsfw) changes.push({ name: '🔞 NSFW', value: `${oldChannel.nsfw} → ${newChannel.nsfw}`, inline: true });
  if (changes.length === 0) return;
  const embed = new EmbedBuilder()
    .setTitle('⚙️ Canal Actualizado')
    .setColor(0xFFA500)
    .addFields({ name: '📍 Canal', value: `${newChannel}`, inline: true }, { name: '🆔 ID', value: newChannel.id, inline: true }, ...changes)
    .setTimestamp();
  await sendTypedLog(newChannel.guild, 'server', embed);
});

// Log: Rol actualizado (nombre, color, permisos)
client.on('roleUpdate', async (oldRole, newRole) => {
  const changes = [];
  if (oldRole.name !== newRole.name) changes.push({ name: '📝 Nombre', value: `\`${oldRole.name}\` → \`${newRole.name}\``, inline: false });
  if (oldRole.hexColor !== newRole.hexColor) changes.push({ name: '🎨 Color', value: `${oldRole.hexColor} → ${newRole.hexColor}`, inline: true });
  if (oldRole.hoist !== newRole.hoist) changes.push({ name: '📌 Mostrar separado', value: `${oldRole.hoist} → ${newRole.hoist}`, inline: true });
  if (oldRole.mentionable !== newRole.mentionable) changes.push({ name: '🔔 Mencionable', value: `${oldRole.mentionable} → ${newRole.mentionable}`, inline: true });
  // Detectar cambios de permisos
  const addedPerms = newRole.permissions.toArray().filter(p => !oldRole.permissions.has(p));
  const removedPerms = oldRole.permissions.toArray().filter(p => !newRole.permissions.has(p));
  if (addedPerms.length > 0) changes.push({ name: '✅ Permisos añadidos', value: addedPerms.join(', ').substring(0, 1024), inline: false });
  if (removedPerms.length > 0) changes.push({ name: '❌ Permisos removidos', value: removedPerms.join(', ').substring(0, 1024), inline: false });
  if (changes.length === 0) return;
  const embed = new EmbedBuilder()
    .setTitle('⚙️ Rol Actualizado')
    .setColor(newRole.color || 0xFFA500)
    .addFields({ name: '🎭 Rol', value: `${newRole}`, inline: true }, { name: '🆔 ID', value: newRole.id, inline: true }, ...changes)
    .setTimestamp();
  await sendTypedLog(newRole.guild, 'server', embed);
});

// Log: Servidor actualizado (nombre, icono, nivel de verificación)
client.on('guildUpdate', async (oldGuild, newGuild) => {
  const changes = [];
  if (oldGuild.name !== newGuild.name) changes.push({ name: '📝 Nombre', value: `\`${oldGuild.name}\` → \`${newGuild.name}\``, inline: false });
  if (oldGuild.verificationLevel !== newGuild.verificationLevel) changes.push({ name: '🔒 Verificación', value: `${oldGuild.verificationLevel} → ${newGuild.verificationLevel}`, inline: true });
  if (oldGuild.explicitContentFilter !== newGuild.explicitContentFilter) changes.push({ name: '🔞 Filtro contenido', value: `${oldGuild.explicitContentFilter} → ${newGuild.explicitContentFilter}`, inline: true });
  if (oldGuild.icon !== newGuild.icon) changes.push({ name: '🖼️ Icono', value: 'Cambiado', inline: true });
  if (oldGuild.banner !== newGuild.banner) changes.push({ name: '🎨 Banner', value: 'Cambiado', inline: true });
  if (changes.length === 0) return;
  const embed = new EmbedBuilder()
    .setTitle('🏠 Servidor Actualizado')
    .setColor(0x5865F2)
    .addFields(...changes)
    .setTimestamp();
  await sendTypedLog(newGuild, 'server', embed);
});

// Log: Emoji creado/eliminado
client.on('emojiCreate', async (emoji) => {
  const embed = new EmbedBuilder()
    .setTitle('😀 Emoji Creado')
    .setColor(0x57F287)
    .setThumbnail(emoji.url)
    .addFields({ name: 'Nombre', value: emoji.name, inline: true }, { name: 'ID', value: emoji.id, inline: true }, { name: 'Animado', value: emoji.animated ? '✅' : '❌', inline: true })
    .setTimestamp();
  await sendTypedLog(emoji.guild, 'server', embed);
});

client.on('emojiDelete', async (emoji) => {
  const embed = new EmbedBuilder()
    .setTitle('😀 Emoji Eliminado')
    .setColor(0xED4245)
    .addFields({ name: 'Nombre', value: emoji.name, inline: true }, { name: 'ID', value: emoji.id, inline: true })
    .setTimestamp();
  await sendTypedLog(emoji.guild, 'server', embed);
});

// Log: Sticker creado/eliminado
client.on('stickerCreate', async (sticker) => {
  const embed = new EmbedBuilder()
    .setTitle('🎨 Sticker Creado')
    .setColor(0x57F287)
    .addFields({ name: 'Nombre', value: sticker.name, inline: true }, { name: 'ID', value: sticker.id, inline: true })
    .setTimestamp();
  await sendTypedLog(sticker.guild, 'server', embed);
});

client.on('stickerDelete', async (sticker) => {
  const embed = new EmbedBuilder()
    .setTitle('🎨 Sticker Eliminado')
    .setColor(0xED4245)
    .addFields({ name: 'Nombre', value: sticker.name, inline: true }, { name: 'ID', value: sticker.id, inline: true })
    .setTimestamp();
  await sendTypedLog(sticker.guild, 'server', embed);
});

// Log: Invitaciones creadas/eliminadas
client.on('inviteCreate', async (invite) => {
  const embed = new EmbedBuilder()
    .setTitle('🔗 Invitación Creada')
    .setColor(0x57F287)
    .addFields(
      { name: '👤 Creada por', value: invite.inviter ? `${invite.inviter.tag} (<@${invite.inviter.id}>)` : 'Desconocido', inline: true },
      { name: '📍 Canal', value: `<#${invite.channel.id}>`, inline: true },
      { name: '🔑 Código', value: invite.code, inline: true },
      { name: '⏰ Expira', value: invite.expiresAt ? `<t:${Math.floor(invite.expiresAt.getTime() / 1000)}:R>` : 'Nunca', inline: true },
      { name: '🔢 Usos máx.', value: invite.maxUses ? `${invite.maxUses}` : 'Ilimitado', inline: true }
    )
    .setTimestamp();
  await sendTypedLog(invite.guild, 'invites', embed);
});

client.on('inviteDelete', async (invite) => {
  const embed = new EmbedBuilder()
    .setTitle('🔗 Invitación Eliminada')
    .setColor(0xED4245)
    .addFields(
      { name: '🔑 Código', value: invite.code, inline: true },
      { name: '📍 Canal', value: `<#${invite.channel.id}>`, inline: true }
    )
    .setTimestamp();
  await sendTypedLog(invite.guild, 'invites', embed);
});

// Log: Eliminación masiva de mensajes (purge)
client.on('messageDeleteBulk', async (messages) => {
  const first = messages.first();
  if (!first?.guild) return;
  const embed = new EmbedBuilder()
    .setTitle('🗑️ Mensajes Eliminados en Masa')
    .setColor(0xFF0000)
    .addFields(
      { name: '📍 Canal', value: `<#${first.channel.id}>`, inline: true },
      { name: '🔢 Cantidad', value: `${messages.size} mensajes`, inline: true }
    )
    .setTimestamp();
  await sendTypedLog(first.guild, 'messages', embed);
});

// Log: Reacciones añadidas/removidas
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  if (!reaction.message.guild) return;
  // Fetch parcial si es necesario
  if (reaction.partial) { try { await reaction.fetch(); } catch { return; } }
  const embed = new EmbedBuilder()
    .setTitle('👍 Reacción Añadida')
    .setColor(0x57F287)
    .addFields(
      { name: '👤 Usuario', value: `${user.tag} (<@${user.id}>)`, inline: true },
      { name: '😀 Emoji', value: reaction.emoji.toString(), inline: true },
      { name: '📍 Canal', value: `<#${reaction.message.channel.id}>`, inline: true },
      { name: '🔗 Mensaje', value: `[Ver mensaje](${reaction.message.url})`, inline: true }
    )
    .setTimestamp();
  await sendTypedLog(reaction.message.guild, 'messages', embed);
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;
  if (!reaction.message.guild) return;
  if (reaction.partial) { try { await reaction.fetch(); } catch { return; } }
  const embed = new EmbedBuilder()
    .setTitle('👎 Reacción Removida')
    .setColor(0xFFA500)
    .addFields(
      { name: '👤 Usuario', value: `${user.tag} (<@${user.id}>)`, inline: true },
      { name: '😀 Emoji', value: reaction.emoji.toString(), inline: true },
      { name: '📍 Canal', value: `<#${reaction.message.channel.id}>`, inline: true },
      { name: '🔗 Mensaje', value: `[Ver mensaje](${reaction.message.url})`, inline: true }
    )
    .setTimestamp();
  await sendTypedLog(reaction.message.guild, 'messages', embed);
});

// Log: Hilos (threads) creados/eliminados/archivados
client.on('threadCreate', async (thread) => {
  const embed = new EmbedBuilder()
    .setTitle('🧵 Hilo Creado')
    .setColor(0x57F287)
    .addFields(
      { name: '📝 Nombre', value: thread.name, inline: true },
      { name: '📍 Canal padre', value: `<#${thread.parentId}>`, inline: true },
      { name: '🆔 ID', value: thread.id, inline: true }
    )
    .setTimestamp();
  await sendTypedLog(thread.guild, 'server', embed);
});

client.on('threadDelete', async (thread) => {
  const embed = new EmbedBuilder()
    .setTitle('🧵 Hilo Eliminado')
    .setColor(0xED4245)
    .addFields(
      { name: '📝 Nombre', value: thread.name, inline: true },
      { name: '📍 Canal padre', value: `<#${thread.parentId}>`, inline: true },
      { name: '🆔 ID', value: thread.id, inline: true }
    )
    .setTimestamp();
  await sendTypedLog(thread.guild, 'server', embed);
});

client.on('threadUpdate', async (oldThread, newThread) => {
  if (!oldThread.archived && newThread.archived) {
    const embed = new EmbedBuilder()
      .setTitle('🧵 Hilo Archivado')
      .setColor(0x808080)
      .addFields(
        { name: '📝 Nombre', value: newThread.name, inline: true },
        { name: '📍 Canal padre', value: `<#${newThread.parentId}>`, inline: true }
      )
      .setTimestamp();
    await sendTypedLog(newThread.guild, 'server', embed);
  }
});

// Log: Voz — join, leave, move
client.on('voiceStateUpdate', async (oldState, newState) => {
  // VC ban check (ya existente, se mantiene)
  if (!oldState.channel && newState.channel) {
    const vcBansPath = require('path').join(__dirname, 'data/voice-bans.json');
    if (require('fs').existsSync(vcBansPath)) {
      const vcBans = JSON.parse(require('fs').readFileSync(vcBansPath, 'utf8'));
      const key = `${newState.guild.id}-${newState.channel.id}`;
      if (vcBans[key] && vcBans[key].includes(newState.member.id)) {
        try {
          await newState.disconnect('Banned from this voice channel');
          const lang = getLanguage(newState.guild.id);
          try {
            await newState.member.send(lang === 'es'
              ? `❌ Estás baneado del canal de voz **${newState.channel.name}** en **${newState.guild.name}**`
              : `❌ You are banned from voice channel **${newState.channel.name}** in **${newState.guild.name}**`
            );
          } catch {}
        } catch (error) {
          console.error('Error disconnecting banned user from voice:', error);
        }
        return;
      }
    }
  }

  // Voice logging
  const member = newState.member || oldState.member;
  if (!member || member.user.bot) return;

  let embed = null;

  if (!oldState.channel && newState.channel) {
    // Joined
    embed = new EmbedBuilder()
      .setTitle('🔊 Entró a Voz')
      .setColor(0x57F287)
      .addFields(
        { name: '👤 Usuario', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
        { name: '📍 Canal', value: `${newState.channel.name}`, inline: true }
      )
      .setTimestamp();
  } else if (oldState.channel && !newState.channel) {
    // Left
    embed = new EmbedBuilder()
      .setTitle('🔇 Salió de Voz')
      .setColor(0xED4245)
      .addFields(
        { name: '👤 Usuario', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
        { name: '📍 Canal', value: `${oldState.channel.name}`, inline: true }
      )
      .setTimestamp();
  } else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
    // Moved
    embed = new EmbedBuilder()
      .setTitle('🔀 Movido en Voz')
      .setColor(0xFFA500)
      .addFields(
        { name: '👤 Usuario', value: `${member.user.tag} (<@${member.id}>)`, inline: true },
        { name: '📤 Desde', value: oldState.channel.name, inline: true },
        { name: '📥 Hacia', value: newState.channel.name, inline: true }
      )
      .setTimestamp();
  }

  if (embed) await sendTypedLog(newState.guild || oldState.guild, 'voice', embed);
});

// Log: Webhooks creados/eliminados
client.on('webhookUpdate', async (channel) => {
  if (!channel.guild) return;
  try {
    const webhooks = await channel.fetchWebhooks();
    // Usar audit log para saber si fue create o delete y quién lo hizo
    const logs = await channel.guild.fetchAuditLogs({ limit: 1, type: 50 }).catch(() => null); // WEBHOOK_CREATE
    const logsD = await channel.guild.fetchAuditLogs({ limit: 1, type: 52 }).catch(() => null); // WEBHOOK_DELETE
    const entryC = logs?.entries.first();
    const entryD = logsD?.entries.first();
    // Determinar cuál es más reciente
    const isCreate = entryC && (!entryD || entryC.createdTimestamp > entryD.createdTimestamp);
    const entry = isCreate ? entryC : entryD;
    const embed = new EmbedBuilder()
      .setTitle(isCreate ? '🔌 Webhook Creado' : '🔌 Webhook Eliminado')
      .setColor(isCreate ? 0x57F287 : 0xED4245)
      .addFields(
        { name: '📍 Canal', value: `<#${channel.id}>`, inline: true },
        { name: '👤 Por', value: entry?.executor ? `${entry.executor.tag} (<@${entry.executor.id}>)` : 'Desconocido', inline: true },
        { name: '🔌 Nombre', value: entry?.target?.name || 'Desconocido', inline: true }
      )
      .setTimestamp();
    await sendTypedLog(channel.guild, 'webhooks', embed);
  } catch { /* skip */ }
});

// Log: Mensajes fijados/desfijados
client.on('channelPinsUpdate', async (channel, time) => {
  if (!channel.guild) return;
  try {
    const logs = await channel.guild.fetchAuditLogs({ limit: 1, type: 74 }).catch(() => null); // MESSAGE_PIN
    const entry = logs?.entries.first();
    const embed = new EmbedBuilder()
      .setTitle('📌 Mensaje Fijado/Desfijado')
      .setColor(0xFEE75C)
      .addFields(
        { name: '📍 Canal', value: `<#${channel.id}>`, inline: true },
        { name: '👤 Por', value: entry?.executor ? `${entry.executor.tag} (<@${entry.executor.id}>)` : 'Desconocido', inline: true }
      )
      .setTimestamp();
    await sendTypedLog(channel.guild, 'pins', embed);
  } catch { /* skip */ }
});

// ==================== FIN SISTEMA DE LOGS ====================

// Log: Uso de comandos slash — se registra DESPUÉS de ejecutar exitosamente
// (el log se hace dentro del handler principal de interactionCreate)

// Manejar comandos slash
client.on('interactionCreate', async (interaction) => {
  // Manejar botones de reportes
  if (interaction.isButton() && interaction.customId?.startsWith('report_action_')) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return await interaction.reply({ content: '❌ No tienes permisos para gestionar reportes.', flags: 64 });
      }

      const parts = interaction.customId.split('_');
      // format: report_action_<reportId>_<action>  (reportId may contain underscores via timestamp)
      const action = parts[parts.length - 1];
      const reportId = parts.slice(2, -1).join('_');
      const userId = reportId.split('-')[1];
      const lang = getLanguage(interaction.guild.id);
      const L = (es, en) => lang === 'es' ? es : en;

      if (action === 'dismiss') {
        const embed = EmbedBuilder.from(interaction.message.embeds[0])
          .setColor(0x808080)
          .setFooter({ text: `Report ID: ${reportId} • ${L('Descartado por', 'Dismissed by')} ${interaction.user.tag}` });
        await interaction.message.edit({ embeds: [embed], components: [] });
        return await interaction.reply({ content: L('✅ Reporte descartado.', '✅ Report dismissed.'), flags: 64 });
      }

      const member = await interaction.guild.members.fetch(userId).catch(() => null);
      if (!member) {
        return await interaction.reply({ content: L('❌ No se encontró al usuario reportado.', '❌ Reported user not found.'), flags: 64 });
      }

      if (action === 'warn') {
        const warningsPath = path.join(__dirname, 'warnings.json');
        const warnings = fs.existsSync(warningsPath) ? JSON.parse(fs.readFileSync(warningsPath, 'utf8')) : {};
        const key = `${interaction.guild.id}-${userId}`;
        if (!warnings[key]) warnings[key] = [];
        warnings[key].push({ reason: L('Reportado por un usuario', 'Reported by a user'), moderator: interaction.user.id, timestamp: Date.now() });
        fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));
      } else if (action === 'timeout') {
        await member.timeout(60 * 60 * 1000, L('Reportado por un usuario', 'Reported by a user'));
      } else if (action === 'kick') {
        await member.kick(L('Reportado por un usuario', 'Reported by a user'));
      } else if (action === 'ban') {
        await interaction.guild.members.ban(userId, { reason: L('Reportado por un usuario', 'Reported by a user') });
      }

      const actionLabels = { warn: '⚠️ Warn', timeout: '⏱️ Timeout (1h)', kick: '👢 Kick', ban: '🔨 Ban' };
      const embed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor(0x57F287)
        .setFooter({ text: `Report ID: ${reportId} • ${L('Acción', 'Action')}: ${actionLabels[action]} por ${interaction.user.tag}` });
      await interaction.message.edit({ embeds: [embed], components: [] });
      await interaction.reply({ content: L(`✅ Acción **${actionLabels[action]}** aplicada.`, `✅ Action **${actionLabels[action]}** applied.`), flags: 64 });
    } catch (error) {
      console.error('Error en report button:', error);
      await interaction.reply({ content: '❌ Error al procesar la acción.', flags: 64 });
    }
    return;
  }

  // Manejar botones y modals de verificación
  if ((interaction.isButton() || interaction.isModalSubmit()) && interaction.customId?.startsWith('verify_')) {
    try {
      const { handleVerifyInteraction } = require('./verification-system');
      await handleVerifyInteraction(interaction, client);
    } catch (e) {
      console.error('Error en verify interaction:', e);
    }
    return;
  }

  // Manejar botones y modals de automod
  if ((interaction.isButton() || interaction.isModalSubmit()) && interaction.customId?.startsWith('am_')) {
    try {
      const automodCmd = client.commands.get('automod');
      if (automodCmd?.handleInteraction) await automodCmd.handleInteraction(interaction);
    } catch (e) {
      console.error('Error en automod interaction:', e);
    }
    return;
  }

  // Manejar botones y modals de logs
  if ((interaction.isButton() || interaction.isModalSubmit()) && interaction.customId?.startsWith('logs_')) {
    try {
      const logsCmd = client.commands.get('logs');
      if (logsCmd?.handleInteraction) await logsCmd.handleInteraction(interaction);
    } catch (e) {
      console.error('Error en logs interaction:', e);
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.warn(`[CMD] Comando no encontrado: ${interaction.commandName}`);
    return;
  }

  console.log(`[CMD] Ejecutando /${interaction.commandName} por ${interaction.user.tag} en ${interaction.guild.name}`);

  // Verificar permisos personalizados del comando
  if (!hasCommandPermission(interaction.guild.id, interaction.commandName, interaction.member)) {
    console.warn(`[CMD] Permiso denegado para ${interaction.commandName} a ${interaction.user.tag}`);
    return await interaction.reply({
      content: getText(interaction.guild.id, 'cmd_perm_denied'),
      flags: 64
    });
  }

  try {
    await command.execute(interaction);
    // Log del comando — solo si se ejecutó sin error
    try {
      const sub = interaction.options.getSubcommand(false);
      const subGroup = interaction.options.getSubcommandGroup(false);
      const fullCmd = ['/' + interaction.commandName, subGroup, sub].filter(Boolean).join(' ');
      const cmdEmbed = new EmbedBuilder()
        .setTitle('⌨️ Comando Usado')
        .setColor(0x5865F2)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          { name: '👤 Usuario', value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
          { name: '⌨️ Comando', value: `\`${fullCmd}\``, inline: true },
          { name: '📍 Canal', value: `<#${interaction.channel.id}>`, inline: true }
        )
        .setFooter({ text: `ID: ${interaction.user.id}` })
        .setTimestamp();
      await sendTypedLog(interaction.guild, 'commands', cmdEmbed);
    } catch { /* no bloquear si falla el log */ }
  } catch (error) {
    console.error(`[CMD ERROR] /${interaction.commandName}:`, error);
    const errorMessage = {
      content: '❌ Hubo un error al ejecutar este comando.',
      flags: 64
    };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Manejar comandos con prefijo
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const prefix = getPrefix(message.guild.id);
  
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);

  if (!command) return;

  try {
    // Crear un objeto similar a interaction para compatibilidad
    const fakeInteraction = {
      user: message.author,
      member: message.member,
      guild: message.guild,
      channel: message.channel,
      memberPermissions: message.member.permissions,
      client: client,
      isChatInputCommand: () => false,
      options: {
        getUser: (name) => message.mentions.users.first(),
        getString: (name) => args[0],
        getInteger: (name) => parseInt(args[0]),
        getRole: (name) => message.mentions.roles.first(),
      },
      reply: async (options) => {
        if (typeof options === 'string') {
          return await message.reply(options);
        }
        return await message.reply(options);
      },
      deferReply: async () => {
        return await message.channel.sendTyping();
      },
      editReply: async (options) => {
        return await message.reply(options);
      },
    };

    await command.execute(fakeInteraction);
  } catch (error) {
    console.error(error);
    try {
      await message.reply('❌ Hubo un error al ejecutar este comando.');
    } catch (replyError) {
      console.error('No se pudo enviar mensaje de error:', replyError);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
