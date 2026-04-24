/**
 * server.cjs — Dashboard Express server para Security Tronix
 * Corre integrado con el bot — comparte el mismo proceso y SQLite en Railway
 */

// En Railway las variables ya están en process.env
// Solo cargamos .env.local si existe (para desarrollo local)
try { require('dotenv').config({ path: require('path').join(__dirname, '.env.local') }); } catch {}

// En Railway, node_modules está en la raíz del proyecto, no en DashBoard/
// Agregamos la raíz al path de búsqueda de módulos
const rootPath = require('path').join(__dirname, '..');
if (!module.paths.includes(require('path').join(rootPath, 'node_modules'))) {
  module.paths.push(require('path').join(rootPath, 'node_modules'));
}

const express = require('express');
const session = require('express-session');
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const path = require('path');
const fs = require('fs');

console.log('[dashboard] DISCORD_TOKEN:', process.env.DISCORD_TOKEN ? '✅' : '❌ NO encontrado');
console.log('[dashboard] APPLICATION_ID:', process.env.APPLICATION_ID ? '✅' : '❌ NO encontrado');
console.log('[dashboard] DISCORD_CLIENT_SECRET:', process.env.DISCORD_CLIENT_SECRET ? '✅' : '❌ NO encontrado');
// Debug: mostrar todas las variables que contienen "DISCORD" o "CLIENT"
const relevantVars = Object.keys(process.env).filter(k => k.includes('DISCORD') || k.includes('CLIENT') || k.includes('SECRET'));
console.log('[dashboard] Relevant env vars found:', relevantVars);

const guildConfig = require('../guild-config');

const app = express();
app.use(express.json());

// ── Sesiones ──────────────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'security-tronix-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

// ── Servir el frontend React (build) ─────────────────────────────────────────
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  console.log('[dashboard] Serving static files from dist/');
} else {
  console.warn('[dashboard] No dist/ folder found — run npm run build in dashboard/');
}

// ── Discord OAuth2 ────────────────────────────────────────────────────────────
const DISCORD_CLIENT_ID     = process.env.APPLICATION_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const RAILWAY_DOMAIN        = process.env.RAILWAY_PUBLIC_DOMAIN;
const APP_URL               = process.env.DASHBOARD_URL ||
  (RAILWAY_DOMAIN ? `https://${RAILWAY_DOMAIN}` : 'http://localhost:4000');
const REDIRECT_URI          = `${APP_URL}/auth/callback`;
const DISCORD_API           = 'https://discord.com/api/v10';

console.log('[dashboard] APP_URL:', APP_URL);
console.log('[dashboard] REDIRECT_URI:', REDIRECT_URI);

// GET /auth/login
app.get('/auth/login', (req, res) => {
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'identify guilds',
  });
  res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

// GET /auth/callback
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect('/?error=no_code');
  try {
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
    if (!tokenData.access_token) {
      console.error('[OAuth2] Token error:', tokenData);
      return res.redirect('/?error=token_failed');
    }

    const [userRes, guildsRes] = await Promise.all([
      fetch(`${DISCORD_API}/users/@me`, { headers: { Authorization: `Bearer ${tokenData.access_token}` } }),
      fetch(`${DISCORD_API}/users/@me/guilds`, { headers: { Authorization: `Bearer ${tokenData.access_token}` } }),
    ]);
    const user   = await userRes.json();
    const guilds = await guildsRes.json();

    req.session.user = {
      id: user.id,
      username: user.username,
      discriminator: user.discriminator,
      avatar: user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator || 0) % 5}.png`,
    };

    // Obtener guilds donde está el bot
    let botGuildIds = new Set();
    try {
      const botGuildsRes = await fetch(`${DISCORD_API}/users/@me/guilds`, {
        headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` },
      });
      const botGuilds = await botGuildsRes.json();
      if (Array.isArray(botGuilds)) botGuilds.forEach(g => botGuildIds.add(g.id));
    } catch (e) {
      console.error('[OAuth2] Error fetching bot guilds:', e.message);
    }

    // Solo guilds donde el usuario es admin Y el bot está presente
    req.session.guilds = (Array.isArray(guilds) ? guilds : [])
      .filter(g => {
        try {
          const isAdmin = (BigInt(g.permissions) & BigInt(0x8)) === BigInt(0x8);
          return isAdmin && botGuildIds.has(g.id);
        } catch { return false; }
      })
      .map(g => ({
        id: g.id,
        name: g.name,
        icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
      }));

    console.log(`[OAuth2] ${user.username} logged in — ${req.session.guilds.length} guilds with bot`);
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

// ── Auth middleware ───────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

function canAccessGuild(req, guildId) {
  return req.session.guilds?.some(g => g.id === guildId);
}

// ── API: Me ───────────────────────────────────────────────────────────────────
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: req.session.user, guilds: req.session.guilds });
});

// ── API: Stats ────────────────────────────────────────────────────────────────
app.get('/api/guild/:guildId/stats', requireAuth, async (req, res) => {
  const { guildId } = req.params;
  if (!canAccessGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });
  try {
    const [guildRes, bansRes] = await Promise.all([
      fetch(`${DISCORD_API}/guilds/${guildId}?with_counts=true`, {
        headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` }
      }),
      fetch(`${DISCORD_API}/guilds/${guildId}/bans?limit=1000`, {
        headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` }
      })
    ]);
    const guild = await guildRes.json();
    const bans  = await bansRes.json();

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

    const casesPath = path.join(__dirname, '../data/mod-cases.json');
    let automodToday = 0, recentCases = [];
    if (fs.existsSync(casesPath)) {
      try {
        const cases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
        const guildCases = cases[guildId] || [];
        const todayStart = new Date(); todayStart.setHours(0,0,0,0);
        automodToday = guildCases.filter(c => c.moderatorId === 'automod' && c.timestamp >= todayStart.getTime()).length;
        recentCases = [...guildCases].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10)
          .map(c => ({ id: c.id, type: c.type, user: c.targetId, moderator: c.moderatorId, reason: c.reason || 'N/A', timestamp: c.timestamp }));
      } catch {}
    }

    res.json({
      totalMembers: guild.approximate_member_count || guild.member_count || 0,
      activeBans: Array.isArray(bans) ? bans.length : 0,
      warningsToday,
      automodActionsToday: automodToday,
      guildName: guild.name,
      guildIcon: guild.icon ? `https://cdn.discordapp.com/icons/${guildId}/${guild.icon}.png` : null,
      recentActivity: recentCases,
    });
  } catch (err) {
    console.error('[stats]', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ── API: Logs ─────────────────────────────────────────────────────────────────
app.get('/api/guild/:guildId/logs', requireAuth, (req, res) => {
  const { guildId } = req.params;
  if (!canAccessGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });
  res.json(guildConfig.get(guildId, 'modLogs') || {});
});

app.post('/api/guild/:guildId/logs', requireAuth, (req, res) => {
  const { guildId } = req.params;
  if (!canAccessGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });
  guildConfig.set(guildId, 'modLogs', req.body);
  console.log(`[logs] Saved for guild ${guildId}:`, req.body);
  res.json({ success: true });
});

// ── API: Automod ──────────────────────────────────────────────────────────────
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
  if (fs.existsSync(automodPath)) { try { all = JSON.parse(fs.readFileSync(automodPath, 'utf8')); } catch {} }
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

// ── API: Mod cases ────────────────────────────────────────────────────────────
app.get('/api/guild/:guildId/modcases', requireAuth, (req, res) => {
  const { guildId } = req.params;
  if (!canAccessGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });
  const casesPath = path.join(__dirname, '../data/mod-cases.json');
  let cases = {};
  if (fs.existsSync(casesPath)) { try { cases = JSON.parse(fs.readFileSync(casesPath, 'utf8')); } catch {} }
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

// ── API: Canales ──────────────────────────────────────────────────────────────
app.get('/api/guild/:guildId/channels', requireAuth, async (req, res) => {
  const { guildId } = req.params;
  if (!canAccessGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });
  try {
    const r = await fetch(`${DISCORD_API}/guilds/${guildId}/channels`, {
      headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` },
    });
    const channels = await r.json();
    res.json(
      (Array.isArray(channels) ? channels : [])
        .filter(c => c.type === 0)
        .map(c => ({ id: c.id, name: c.name }))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
  } catch { res.json([]); }
});

// ── API: Roles ────────────────────────────────────────────────────────────────
app.get('/api/guild/:guildId/roles', requireAuth, async (req, res) => {
  const { guildId } = req.params;
  if (!canAccessGuild(req, guildId)) return res.status(403).json({ error: 'Forbidden' });
  try {
    const r = await fetch(`${DISCORD_API}/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` },
    });
    const roles = await r.json();
    res.json((Array.isArray(roles) ? roles : []).map(r => ({ id: r.id, name: r.name, color: r.color })));
  } catch { res.json([]); }
});

// ── Fallback SPA ──────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
    return res.status(404).json({ error: 'Not found' });
  }
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('<h1>Dashboard not built</h1><p>Run: cd dashboard && npm run build</p>');
  }
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || process.env.DASHBOARD_PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Dashboard running at http://localhost:${PORT}`);
});
