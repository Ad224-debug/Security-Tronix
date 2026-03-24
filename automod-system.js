const fs = require('fs');
const path = require('path');
const { handleRB3Strike } = require('./rb3-system');

// Cache de config de automod por guild (se invalida por mtime)
const _automodCache = new Map(); // guildId → { config, mtime }
const AUTOMOD_PATH = path.join(__dirname, 'data/automod.json');

// Lista de palabras/términos NSFW
const nsfwKeywords = [
  'porno', 'porn', 'xxx', 'sexo', 'sex', 'desnudo', 'nude', 'nudes',
  'pene', 'vagina', 'tetas', 'culo', 'coño', 'verga', 'pija', 'concha',
  'dick', 'pussy', 'cock', 'boobs', 'ass', 'fuck', 'shit',
  'onlyfans', 'pornhub', 'xvideos', 'xnxx', 'redtube',
  'pack', 'nopor', 'cp', 'gore'
];

function containsNSFW(text) {
  const lowerText = text.toLowerCase();
  return nsfwKeywords.some(keyword => lowerText.includes(keyword));
}

function getAutomodConfig(guildId) {
  try {
    if (!fs.existsSync(AUTOMOD_PATH)) return null;
    const mtime = fs.statSync(AUTOMOD_PATH).mtimeMs;
    const cached = _automodCache.get(guildId);
    if (!cached || cached.mtime !== mtime) {
      const all = JSON.parse(fs.readFileSync(AUTOMOD_PATH, 'utf8'));
      // Actualizar cache para todos los guilds del archivo
      for (const [id, cfg] of Object.entries(all)) {
        _automodCache.set(id, { config: cfg, mtime });
      }
      return all[guildId] || null;
    }
    return cached.config;
  } catch { return null; }
}

async function checkAutomod(message) {
  if (!message.guild || message.author.bot) return;
  
  // Ignorar administradores
  if (message.member?.permissions.has('Administrator')) return;

  const config = getAutomodConfig(message.guild.id);
  if (!config) return;

  let violations = [];
  let isNSFW = false;

  // 0. NSFW DETECTION (PRIORITY) - Siempre activo por defecto
  const nsfwEnabled = config.nsfw?.enabled !== false; // Por defecto true
  if (nsfwEnabled && containsNSFW(message.content)) {
    violations.push('nsfw');
    isNSFW = true;
  }

  // 1. SPAM DETECTION — manejado por security-systems.js (ventana deslizante + duplicados)
  // No duplicar lógica aquí

  // 2. MASS MENTIONS
  if (config.mentions?.enabled) {
    const mentionCount = message.mentions.users.size + message.mentions.roles.size;
    if (mentionCount > config.mentions.maxMentions) {
      violations.push('mass_mentions');
    }
  }

  // 3. LINK FILTER
  if (config.links?.enabled) {
    const linkRegex = /(https?:\/\/[^\s]+)/gi;
    if (linkRegex.test(message.content)) {
      violations.push('links');
    }
  }

  // 4. INVITE FILTER
  if (config.invites?.enabled) {
    const inviteRegex = /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[a-zA-Z0-9]+/gi;
    if (inviteRegex.test(message.content)) {
      violations.push('invites');
    }
  }

  // 5. EXCESSIVE CAPS
  if (config.caps?.enabled) {
    const text = message.content.replace(/[^a-zA-Z]/g, '');
    if (text.length >= 10) {
      const capsCount = (text.match(/[A-Z]/g) || []).length;
      const capsPercentage = (capsCount / text.length) * 100;
      
      if (capsPercentage > config.caps.percentage) {
        violations.push('caps');
      }
    }
  }

  // TOMAR ACCIÓN SI HAY VIOLACIONES
  if (violations.length > 0) {
    try {
      await message.delete();
      
      const lang = message.client.getLanguage ? message.client.getLanguage(message.guild.id) : (message.guild.preferredLocale?.startsWith('es') ? 'es' : 'en');
      
      const violationMessages = {
        nsfw: lang === 'es' ? '🔞 contenido NSFW/inapropiado' : '🔞 NSFW/inappropriate content',
        spam: lang === 'es' ? 'spam de mensajes' : 'message spam',
        mass_mentions: lang === 'es' ? 'menciones masivas' : 'mass mentions',
        links: lang === 'es' ? 'enlaces no permitidos' : 'unauthorized links',
        invites: lang === 'es' ? 'invitaciones de Discord' : 'Discord invites',
        caps: lang === 'es' ? 'mayúsculas excesivas' : 'excessive caps'
      };

      const violationText = violations.map(v => violationMessages[v]).join(', ');
      
      const warning = await message.channel.send({
        content: lang === 'es'
          ? `⚠️ ${message.author}, tu mensaje fue eliminado por: **${violationText}**`
          : `⚠️ ${message.author}, your message was deleted for: **${violationText}**`
      });

      // Auto-eliminar el mensaje de advertencia después de 5 segundos
      setTimeout(() => warning.delete().catch(() => {}), 5000);

      // APLICAR RB3 SI ES NSFW O MÚLTIPLES VIOLACIONES
      if (isNSFW || violations.length >= 2) {
        const rb3Result = await handleRB3Strike(
          message.guild,
          message.author.id,
          `Auto-mod: ${violationText}`,
          message.client
        );

        if (rb3Result) {
          const actionMessages = {
            warn: lang === 'es' ? 'Advertencia' : 'Warning',
            timeout_1h: lang === 'es' ? 'Timeout 1h' : 'Timeout 1h',
            timeout_6h: lang === 'es' ? 'Timeout 6h' : 'Timeout 6h',
            timeout_12h: lang === 'es' ? 'Timeout 12h' : 'Timeout 12h',
            timeout_24h: lang === 'es' ? 'Timeout 24h' : 'Timeout 24h',
            timeout_3d: lang === 'es' ? 'Timeout 3d' : 'Timeout 3d',
            timeout_7d: lang === 'es' ? 'Timeout 7d' : 'Timeout 7d',
            kick: lang === 'es' ? 'Expulsado' : 'Kicked',
            tempban_7d: lang === 'es' ? 'Tempban 7d' : 'Tempban 7d',
            tempban_30d: lang === 'es' ? 'Tempban 30d' : 'Tempban 30d',
            ban: lang === 'es' ? 'Baneado' : 'Banned'
          };

          const rb3Warning = await message.channel.send({
            content: lang === 'es'
              ? `🚨 **RB3 Activado** - ${message.author.tag} ha recibido strike ${rb3Result.strikeCount}/3. Acción: **${actionMessages[rb3Result.action]}**`
              : `🚨 **RB3 Activated** - ${message.author.tag} received strike ${rb3Result.strikeCount}/3. Action: **${actionMessages[rb3Result.action]}**`
          });

          setTimeout(() => rb3Warning.delete().catch(() => {}), 10000);
        }
      }

      // Log en el canal de logs si existe
      const configPath = path.join(__dirname, 'config.json');
      if (fs.existsSync(configPath)) {
        let serverConfig;
        try { serverConfig = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch { serverConfig = {}; }
        const logChannelId = serverConfig.logChannels?.[message.guild.id];
        
        if (logChannelId) {
          const logChannel = await message.guild.channels.fetch(logChannelId).catch(() => null);
          if (logChannel) {
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder()
              .setTitle(lang === 'es' ? '🤖 Auto-Moderación' : '🤖 Auto-Moderation')
              .setColor(0xFEE75C)
              .addFields(
                { name: lang === 'es' ? 'Usuario' : 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
                { name: lang === 'es' ? 'Canal' : 'Channel', value: `${message.channel}`, inline: true },
                { name: lang === 'es' ? 'Violación' : 'Violation', value: violationText, inline: false },
                { name: lang === 'es' ? 'Mensaje' : 'Message', value: message.content.substring(0, 1000) || '*Sin contenido*', inline: false }
              )
              .setTimestamp();

            await logChannel.send({ embeds: [embed] });
          }
        }
      }
    } catch (error) {
      console.error('Error en auto-moderación:', error);
    }
  }
}

module.exports = { checkAutomod };
