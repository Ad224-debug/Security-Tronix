/**
 * security-systems.js
 * Integra: Anti-Spam mejorado, Alt-Detector, FishFish Phishing Scanner,
 *          AlienVault OTX, ThreatFox
 */

const { EmbedBuilder } = require('discord.js');
const https = require('https');

// ─────────────────────────────────────────────────────────────────────────────
// 1. ANTI-SPAM — Ventana deslizante por usuario/guild
// ─────────────────────────────────────────────────────────────────────────────

// Map: `guildId-userId` → [timestamps]
const spamWindows = new Map();
// Map: `guildId-userId` → { count, firstSeen } para mensajes duplicados
const duplicateTracker = new Map();

const SPAM_WINDOW_MS = 5000;   // ventana de 5 segundos
const SPAM_MAX_MSGS  = 5;      // máx mensajes en la ventana
const DUPE_MAX       = 3;      // máx veces el mismo texto en 10s
const DUPE_WINDOW_MS = 10000;

// Limpieza periódica para evitar memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of spamWindows) {
    const fresh = timestamps.filter(t => now - t < SPAM_WINDOW_MS * 2);
    if (fresh.length === 0) spamWindows.delete(key);
    else spamWindows.set(key, fresh);
  }
  for (const [key, data] of duplicateTracker) {
    if (now - data.firstSeen > DUPE_WINDOW_MS * 2) duplicateTracker.delete(key);
  }
}, 30000);

/**
 * Detecta spam por velocidad y mensajes duplicados.
 * Retorna { isSpam: bool, reason: string }
 */
function checkSpam(message) {
  const key = `${message.guild.id}-${message.author.id}`;
  const now = Date.now();

  // — Velocidad —
  const timestamps = (spamWindows.get(key) || []).filter(t => now - t < SPAM_WINDOW_MS);
  timestamps.push(now);
  spamWindows.set(key, timestamps);

  if (timestamps.length > SPAM_MAX_MSGS) {
    return { isSpam: true, reason: 'spam_speed' };
  }

  // — Duplicados —
  if (message.content && message.content.length > 5) {
    const dupeKey = `${key}-${message.content.trim().toLowerCase().substring(0, 50)}`;
    const dupe = duplicateTracker.get(dupeKey) || { count: 0, firstSeen: now };
    if (now - dupe.firstSeen > DUPE_WINDOW_MS) {
      dupe.count = 1; dupe.firstSeen = now;
    } else {
      dupe.count++;
    }
    duplicateTracker.set(dupeKey, dupe);
    if (dupe.count >= DUPE_MAX) {
      return { isSpam: true, reason: 'spam_duplicate' };
    }
  }

  return { isSpam: false };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. FISHFISH PHISHING SCANNER
// ─────────────────────────────────────────────────────────────────────────────

// Cache local de dominios maliciosos (se refresca cada 30 min)
let phishingDomains = new Set();
let lastFetch = 0;
const PHISHING_CACHE_TTL = 30 * 60 * 1000; // 30 minutos

function fetchPhishingList() {
  return new Promise((resolve) => {
    const req = https.get('https://api.fishfish.gg/v1/domains?type=phishing', {
      headers: { 'User-Agent': 'VexorBot/1.0' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          // La API devuelve un array de strings (dominios)
          if (Array.isArray(json)) {
            phishingDomains = new Set(json.map(d => d.toLowerCase()));
            lastFetch = Date.now();
            console.log(`[FishFish] Loaded ${phishingDomains.size} phishing domains`);
          }
        } catch (e) {
          console.error('[FishFish] Parse error:', e.message);
        }
        resolve();
      });
    });
    req.on('error', (e) => {
      console.error('[FishFish] Fetch error:', e.message);
      resolve();
    });
    req.setTimeout(10000, () => { req.destroy(); resolve(); });
  });
}

async function ensurePhishingList() {
  if (Date.now() - lastFetch > PHISHING_CACHE_TTL) {
    await fetchPhishingList();
  }
}

const URL_REGEX = /https?:\/\/([a-zA-Z0-9.-]+)/gi;

/**
 * Extrae dominios de un texto y los comprueba contra FishFish.
 * Retorna el primer dominio malicioso encontrado, o null.
 */
async function checkPhishing(text) {
  await ensurePhishingList();
  if (phishingDomains.size === 0) return null;

  const matches = [...text.matchAll(URL_REGEX)];
  for (const match of matches) {
    const domain = match[1].toLowerCase().replace(/^www\./, '');
    if (phishingDomains.has(domain)) return domain;
    // Comprobar dominio raíz (ej: sub.evil.com → evil.com)
    const parts = domain.split('.');
    if (parts.length > 2) {
      const root = parts.slice(-2).join('.');
      if (phishingDomains.has(root)) return root;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ALT DETECTOR — en guildMemberAdd
// ─────────────────────────────────────────────────────────────────────────────

let altDetector = null;
try {
  const AltDetectorModule = require('discord-alt-detector');
  // Handle both default export and named export patterns
  const AltDetector = AltDetectorModule?.default || AltDetectorModule;
  if (typeof AltDetector === 'function') {
    altDetector = new AltDetector();
  } else {
    console.warn('[AltDetector] Unexpected module format, alt detection disabled');
  }
} catch (e) {
  console.warn('[AltDetector] Package not available, alt detection disabled:', e.message);
}

/**
 * Analiza si un miembro es probablemente un alt.
 * Retorna { isAlt: bool, probability: number, reasons: string[] }
 */
async function checkAlt(member) {
  if (!altDetector) return { isAlt: false, probability: 0, reasons: [] };

  try {
    const result = await altDetector.detect(member.user);
    // discord-alt-detector devuelve { probability, reasons }
    const probability = result.probability ?? 0;
    return {
      isAlt: probability >= 70,
      probability,
      reasons: result.reasons || []
    };
  } catch (e) {
    console.error('[AltDetector] Error:', e.message);
    return { isAlt: false, probability: 0, reasons: [] };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ALIENVAULT OTX — enriquecimiento de IPs y dominios (sin key, gratis)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Consulta AlienVault OTX para una IP.
 * Retorna { pulses, malicious, tags } o null si falla.
 */
async function queryOTX_IP(ip) {
  try {
    const res = await fetch(`https://otx.alienvault.com/api/v1/indicators/IPv4/${ip}/general`, {
      headers: { 'User-Agent': 'TronixSecurity/1.0' },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      pulses: data.pulse_info?.count ?? 0,
      malicious: (data.pulse_info?.count ?? 0) > 0,
      tags: (data.pulse_info?.pulses ?? []).slice(0, 3).map(p => p.name)
    };
  } catch { return null; }
}

/**
 * Consulta AlienVault OTX para un dominio/URL.
 * Retorna { pulses, malicious, tags } o null si falla.
 */
async function queryOTX_Domain(domain) {
  try {
    const res = await fetch(`https://otx.alienvault.com/api/v1/indicators/domain/${domain}/general`, {
      headers: { 'User-Agent': 'TronixSecurity/1.0' },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      pulses: data.pulse_info?.count ?? 0,
      malicious: (data.pulse_info?.count ?? 0) > 0,
      tags: (data.pulse_info?.pulses ?? []).slice(0, 3).map(p => p.name)
    };
  } catch { return null; }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. THREATFOX — IoCs de malware para dominios/URLs (sin key, gratis)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Consulta ThreatFox para un dominio o IP.
 * Retorna { found, malwareFamily, threatType, confidence } o null si falla.
 */
async function queryThreatFox(query) {
  try {
    const res = await fetch('https://threatfox-api.abuse.ch/api/v1/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'TronixSecurity/1.0' },
      body: JSON.stringify({ query: 'search_ioc', search_term: query }),
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.query_status !== 'ok' || !data.data?.length) return { found: false };
    const ioc = data.data[0];
    return {
      found: true,
      malwareFamily: ioc.malware_printable || ioc.malware || 'Desconocido',
      threatType: ioc.threat_type_desc || ioc.threat_type || 'Desconocido',
      confidence: ioc.confidence_level ?? 0
    };
  } catch { return null; }
}

module.exports._queryOTX_IP     = queryOTX_IP;
module.exports._queryOTX_Domain = queryOTX_Domain;
module.exports._queryThreatFox  = queryThreatFox;

// ─────────────────────────────────────────────────────────────────────────────
// 6. HANDLER PRINCIPAL — se llama desde index.js en messageCreate
// ─────────────────────────────────────────────────────────────────────────────

async function runSecurityChecks(message, sendLogFn) {
  if (!message.guild || message.author.bot) return;
  if (message.member?.permissions.has('Administrator')) return;

  const lang = message.client.getLanguage(message.guild.id);
  const L = (es, en) => lang === 'es' ? es : en;

  // — Anti-Spam —
  const spamResult = checkSpam(message);
  if (spamResult.isSpam) {
    await message.delete().catch(() => {});

    const reasons = {
      spam_speed:     L('🚫 Spam (demasiados mensajes rápidos)', '🚫 Spam (too many messages quickly)'),
      spam_duplicate: L('🚫 Spam (mensajes duplicados)', '🚫 Spam (duplicate messages)'),
    };
    const warn = await message.channel.send({
      content: L(
        `⚠️ ${message.author}, por favor no hagas spam.`,
        `⚠️ ${message.author}, please don't spam.`
      )
    }).catch(() => null);
    if (warn) setTimeout(() => warn.delete().catch(() => {}), 5000);

    // Log
    const embed = new EmbedBuilder()
      .setTitle(L('🚫 Anti-Spam', '🚫 Anti-Spam'))
      .setColor(0xFFA500)
      .addFields(
        { name: L('Usuario', 'User'), value: `${message.author.tag} (${message.author.id})`, inline: true },
        { name: L('Canal', 'Channel'), value: `${message.channel}`, inline: true },
        { name: L('Razón', 'Reason'), value: reasons[spamResult.reason], inline: false }
      )
      .setTimestamp();
    await sendLogFn(message.guild, embed);
    return; // No seguir chequeando si ya es spam
  }

  // — Phishing (FishFish + OTX + ThreatFox) —
  if (message.content && URL_REGEX.test(message.content)) {
    URL_REGEX.lastIndex = 0;

    const domainMatches = [...message.content.matchAll(URL_REGEX)].map(m => m[1].toLowerCase().replace(/^www\./, ''));
    const domainsToCheck = [...new Set(domainMatches)].slice(0, 3);

    const [fishfishDomain, ...rest] = await Promise.all([
      checkPhishing(message.content),
      ...domainsToCheck.flatMap(d => [queryOTX_Domain(d), queryThreatFox(d)])
    ]);

    const otxHit = domainsToCheck.findIndex((_, i) => rest[i * 2]?.malicious);
    const tfHit  = domainsToCheck.findIndex((_, i) => rest[i * 2 + 1]?.found);

    const detectedDomain = fishfishDomain
      || (otxHit >= 0 ? domainsToCheck[otxHit] : null)
      || (tfHit  >= 0 ? domainsToCheck[tfHit]  : null);

    if (detectedDomain) {
      await message.delete().catch(() => {});

      const sources = [
        fishfishDomain ? 'FishFish' : null,
        otxHit >= 0    ? `OTX (${rest[otxHit * 2].pulses} pulses)` : null,
        tfHit  >= 0    ? `ThreatFox (${rest[tfHit * 2 + 1].malwareFamily})` : null
      ].filter(Boolean).join(', ');

      const warn = await message.channel.send({
        content: L(
          `🎣 ${message.author}, tu mensaje contenía un enlace malicioso y fue eliminado.`,
          `🎣 ${message.author}, your message contained a malicious link and was removed.`
        )
      }).catch(() => null);
      if (warn) setTimeout(() => warn.delete().catch(() => {}), 8000);

      await message.author.send(
        L(
          `⚠️ Tu mensaje en **${message.guild.name}** fue eliminado porque contenía el dominio malicioso: \`${detectedDomain}\`\n\nDetectado por: ${sources}`,
          `⚠️ Your message in **${message.guild.name}** was removed because it contained the malicious domain: \`${detectedDomain}\`\n\nDetected by: ${sources}`
        )
      ).catch(() => {});

      const embed = new EmbedBuilder()
        .setTitle(L('🎣 Enlace Malicioso Detectado', '🎣 Malicious Link Detected'))
        .setColor(0xFF0000)
        .addFields(
          { name: L('Usuario', 'User'),    value: `${message.author.tag} (${message.author.id})`, inline: true },
          { name: L('Canal', 'Channel'),   value: `${message.channel}`, inline: true },
          { name: L('Dominio', 'Domain'),  value: `\`${detectedDomain}\``, inline: false },
          { name: L('Fuentes', 'Sources'), value: sources, inline: false },
          { name: L('Mensaje', 'Message'), value: message.content.substring(0, 500), inline: false }
        )
        .setFooter({ text: 'FishFish • AlienVault OTX • ThreatFox' })
        .setTimestamp();
      await sendLogFn(message.guild, embed);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. HANDLER DE ALT — se llama desde index.js en guildMemberAdd
// ─────────────────────────────────────────────────────────────────────────────

async function runAltCheck(member, sendLogFn) {
  if (member.user.bot) return;

  const result = await checkAlt(member);
  if (!result.isAlt) return;

  const lang = member.client.getLanguage(member.guild.id);
  const L = (es, en) => lang === 'es' ? es : en;

  const embed = new EmbedBuilder()
    .setTitle(L('🔍 Posible Alt Detectado', '🔍 Possible Alt Detected'))
    .setColor(0xFFA500)
    .setThumbnail(member.user.displayAvatarURL())
    .addFields(
      { name: L('Usuario', 'User'), value: `${member.user.tag} (${member.user.id})`, inline: true },
      { name: L('Probabilidad', 'Probability'), value: `${result.probability}%`, inline: true },
      { name: L('Cuenta creada', 'Account created'), value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
      { name: L('Señales', 'Signals'), value: result.reasons.join('\n') || L('Sin detalles', 'No details'), inline: false }
    )
    .setFooter({ text: 'discord-alt-detector' })
    .setTimestamp();

  await sendLogFn(member.guild, embed);
}

// Precarga la lista de phishing al iniciar
fetchPhishingList().catch(() => {});

module.exports = { runSecurityChecks, runAltCheck };
