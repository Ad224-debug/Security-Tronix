/**
 * server.js — Express backend para el dashboard de Security Tronix
 * Maneja: Discord OAuth2, sesiones, API REST para configuración del bot
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
require('dotenv').config({ path: require('path').join(__dirname, '.env.local') });

const express = require('express');
const session = require('express-session');
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const path = require('path');
const fs = require('fs');

// Verificar que el token está cargado
console.log('[config] DISCORD_TOKEN:', process.env.DISCORD_TOKEN ? '✅ cargado' : '❌ NO encontrado');
console.log('[config] APPLICATION_ID:', process.env.APPLICATION_ID ? '✅ cargado' : '❌ NO encontrado');
console.log('[config] DISCORD_CLIENT_SECRET:', process.env.DISCORD_CLIENT_SECRET ? '✅ cargado' : '❌ NO encontrado');

// Importar guild-config del bot (acceso directo a SQLite)
const guildConfig = require('../guild-config');

const app = express();
app.use(express.json());

// ── Sesiones ──────────────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'security-tronix-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 días
}));

// ── Servir el frontend React (build) ─────────────────────────────────────────
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// ── Discord OAuth2 ────────────────────────────────────────────────────────────
const DISCORD_CLIENT_ID     = process.env.APPLICATION_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const APP_URL               = process.env.DASHBOARD_URL || 'http://localhost:4000';
const REDIRECT_URI          = `${APP_URL}/auth/callback`;

const DISCORD_API = 'https://discord.com/api/v10';

// GET /auth/login — redirige a Discord OAuth2
app.get('/auth/login', (req, res) => {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'identify guilds',
  });
  res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

// GET /auth/callback — Discord redirige acá con el code
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect('/?error=no_code');

  try {
    // Intercambiar code por access_token
    const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return res.redirect('/?error=token_failed');

    // Obtener info del usuario
    const userRes = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const user = await userRes.json();

    // Obtener servidores del usuario
    const guildsRes = await fetch(`${DISCORD_API}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const guilds = await guildsRes.json();

    // Guardar en sesión
    req.session.user = {
      id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      avatar: user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || 0) % 5}.png`,
      accessToken: tokenData.access_token,
    };

    // Obtener los servidores donde está el bot
    let botGuildIds = new Set();
    try {
      const botGuildsRes = await fetch(`${DISCORD_API}/users/@me/guilds`, {
        headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` },
      });
      const botGuilds = await botGuildsRes.json();
      if (Array.isArray(botGuilds)) {
        botGuilds.forEach(g => botGuildIds.add(g.id));
      }
    } catch (e) {
      console.error('[OAuth2] Error fetching bot guilds:', e.message);
    }

    // Filtrar: usuario es admin (bit 0x8) Y el bot está en ese servidor
    req.session.guilds = guilds
      .filter(g => {
        const isAdmin = (BigInt(g.permissions) & BigInt(0x8)) === BigInt(0x8);
        const botPresent = botGuildIds.has(g.id);
        return isAdmin && botPresent;
      })
      .map(g => ({
        id: g.id,
        name: g.name,
        icon: g.icon
          ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`
          : null,
      }));

    res.redirect('/select-server');
  } catch (err) {
    console.error('[OAuth2] Error:', err);
    res.redirect('/?error=oauth_failed');
  }
});

// GET /auth/logout
app.get('/auth/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// ── Middleware de autenticación ───────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

// ── API: Usuario actual ───────────────────────────────────────────────────────
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: req.session.user, guilds: req.session.guilds });
});

// ── API: Stats reales del servidor ────────────────────────────────────────────
app.get('/api/guild/:guildId/stats', requireAuth, async (req, res) => {
  const { guildId } = req.params;
  if (!canAccessGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });

  try {
    // Obtener info del guild via Bot token
    const [guildRes, bansRes] = await Promise.all([
      fetch(`${DISCORD_API}/guilds/${guildId}?with_counts=true`, {
        headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` }
      }),
      fetch(`${DISCORD_API}/guilds/${guildId}/bans?limit=1000`, {
        headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` }
      })
    ]);

    const guild = await guildRes.json();
    const bans = await bansRes.json();
    console.log('[stats] guild:', guild?.name, '| bans:', Array.isArray(bans) ? bans.length : bans?.message);

    // Contar warnings de hoy desde warnings.json
    const warningsPath = path.join(__dirname, '../warnings.json');
    let warningsToday = 0;
    if (fs.existsSync(warningsPath)) {
      try {
        const warnings = JSON.parse(fs.readFileSync(warningsPath, 'utf8'));
        const todayStart = new Date(); todayStart.setHours(0,0,0,0);
        for (const [key, list] of Object.entries(warnings)) {
          if (key.startsWith(guildId)) {
            warningsToday += list.filter(w => w.timestamp >= todayStart.getTime()).length;
          }
        }
      } catch {}
    }

    // Contar acciones de automod de hoy desde mod-cases.json
    const casesPath = path.join(__dirname, '../data/mod-cases.json');
    let automodToday = 0;
    let recentCases = [];
    if (fs.existsSync(casesPath)) {
      try {
        const cases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
        const guildCases = cases[guildId] || [];
        const todayStart = new Date(); todayStart.setHours(0,0,0,0);
        automodToday = guildCases.filter(c =>
          c.moderatorId === 'automod' && c.timestamp >= todayStart.getTime()
        ).length;
        recentCases = [...guildCases]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 10)
          .map(c => ({
            id: c.id,
            type: c.type,
            user: c.targetId,
            moderator: c.moderatorId,
            reason: c.reason || 'N/A',
            timestamp: c.timestamp,
          }));
      } catch {}
    }

    res.json({
      totalMembers: guild.approximate_member_count || guild.member_count || 0,
      activeBans: Array.isArray(bans) ? bans.length : 0,
      warningsToday,
      automodActionsToday: automodToday,
      guildName: guild.name,
      guildIcon: guild.icon
        ? `https://cdn.discordapp.com/icons/${guildId}/${guild.icon}.png`
        : null,
      recentActivity: recentCases,
    });
  } catch (err) {
    console.error('[stats]', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ── API: Configuración de logs ────────────────────────────────────────────────
app.get('/api/guild/:guildId/logs', requireAuth, (req, res) => {
  const { guildId } = req.params;
  if (!canAccessGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });
  const logs = guildConfig.get(guildId, 'modLogs') || {};
  res.json(logs);
});

app.post('/api/guild/:guildId/logs', requireAuth, (req, res) => {
  const { guildId } = req.params;
  if (!canAccessGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });
  guildConfig.set(guildId, 'modLogs', req.body);
  res.json({ success: true });
});

// ── API: Configuración de automod ─────────────────────────────────────────────
app.get('/api/guild/:guildId/automod', requireAuth, (req, res) => {
  const { guildId } = req.params;
  if (!canAccessGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });
  const automodPath = path.join(__dirname, '../data/automod.json');
  let config = {};
  if (fs.existsSync(automodPath)) {
    try { config = JSON.parse(fs.readFileSync(automodPath, 'utf8'))[guildId] || {}; } catch {}
  }
  res.json(config);
});

app.post('/api/guild/:guildId/automod', requireAuth, (req, res) => {
  const { guildId } = req.params;
  if (!canAccessGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });
  const automodPath = path.join(__dirname, '../data/automod.json');
  let all = {};
  if (fs.existsSync(automodPath)) {
    try { all = JSON.parse(fs.readFileSync(automodPath, 'utf8')); } catch {}
  }
  all[guildId] = req.body;
  fs.writeFileSync(automodPath, JSON.stringify(all, null, 2));
  res.json({ success: true });
});

// ── API: Anti-Raid ────────────────────────────────────────────────────────────
app.get('/api/guild/:guildId/antiraid', requireAuth, (req, res) => {
  const { guildId } = req.params;
  if (!canAccessGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });
  res.json(guildConfig.get(guildId, 'antiraidConfig') || {});
});

app.post('/api/guild/:guildId/antiraid', requireAuth, (req, res) => {
  const { guildId } = req.params;
  if (!canAccessGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });
  guildConfig.set(guildId, 'antiraidConfig', req.body);
  res.json({ success: true });
});

// ── API: Verificación ─────────────────────────────────────────────────────────
app.get('/api/guild/:guildId/verification', requireAuth, (req, res) => {
  const { guildId } = req.params;
  if (!canAccessGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });
  res.json(guildConfig.get(guildId, 'verifyConfig') || {});
});

app.post('/api/guild/:guildId/verification', requireAuth, (req, res) => {
  const { guildId } = req.params;
  if (!canAccessGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });
  guildConfig.set(guildId, 'verifyConfig', req.body);
  res.json({ success: true });
});

// ── API: Moderación ───────────────────────────────────────────────────────────
app.get('/api/guild/:guildId/modcases', requireAuth, (req, res) => {
  const { guildId } = req.params;
  if (!canAccessGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });
  const casesPath = path.join(__dirname, '../data/mod-cases.json');
  let cases = {};
  if (fs.existsSync(casesPath)) {
    try { cases = JSON.parse(fs.readFileSync(casesPath, 'utf8')); } catch {}
  }
  res.json(cases[guildId] || []);
});

app.get('/api/guild/:guildId/modconfig', requireAuth, (req, res) => {
  const { guildId } = req.params;
  if (!canAccessGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });
  res.json({
    warnSetup: guildConfig.get(guildId, 'warnSetup') || {},
    jailConfig: guildConfig.get(guildId, 'jailConfig') || {},
    modRole: guildConfig.get(guildId, 'modRole') || null,
  });
});

app.post('/api/guild/:guildId/modconfig', requireAuth, (req, res) => {
  const { guildId } = req.params;
  if (!canAccessGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });
  const { warnSetup, jailConfig, modRole } = req.body;
  if (warnSetup) guildConfig.set(guildId, 'warnSetup', warnSetup);
  if (jailConfig) guildConfig.set(guildId, 'jailConfig', jailConfig);
  if (modRole !== undefined) guildConfig.set(guildId, 'modRole', modRole);
  res.json({ success: true });
});

// ── API: Seguridad ────────────────────────────────────────────────────────────
app.get('/api/guild/:guildId/security', requireAuth, (req, res) => {
  const { guildId } = req.params;
  if (!canAccessGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });
  res.json(guildConfig.get(guildId, 'securityConfig') || {});
});

app.post('/api/guild/:guildId/security', requireAuth, (req, res) => {
  const { guildId } = req.params;
  if (!canAccessGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });
  guildConfig.set(guildId, 'securityConfig', req.body);
  res.json({ success: true });
});

// ── API: Canales del servidor (para los selectores) ───────────────────────────
app.get('/api/guild/:guildId/channels', requireAuth, async (req, res) => {
  const { guildId } = req.params;
  if (!canAccessGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });
  try {
    const r = await fetch(`${DISCORD_API}/guilds/${guildId}/channels`, {
      headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` },
    });
    const channels = await r.json();
    const textChannels = channels
      .filter(c => c.type === 0)
      .map(c => ({ id: c.id, name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    res.json(textChannels);
  } catch {
    res.json([]);
  }
});

// ── API: Roles del servidor ───────────────────────────────────────────────────
app.get('/api/guild/:guildId/roles', requireAuth, async (req, res) => {
  const { guildId } = req.params;
  if (!canAccessGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });
  try {
    const r = await fetch(`${DISCORD_API}/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` },
    });
    const roles = await r.json();
    res.json(roles.map(r => ({ id: r.id, name: r.name, color: r.color })));
  } catch {
    res.json([]);
  }
});

// ── Helper: verificar que el usuario tiene acceso al guild ────────────────────
function canAccessGuild(req, guildId) {
  return req.session.guilds?.some(g => g.id === guildId);
}

// ── Fallback: servir React para rutas del frontend ────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/auth')) return res.status(404).json({ error: 'Not found' });
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('Dashboard not built yet. Run: npm run build');
  }
});

const PORT = process.env.DASHBOARD_PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Dashboard server running at http://localhost:${PORT}`);
});
