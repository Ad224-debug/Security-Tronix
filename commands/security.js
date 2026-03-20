const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const cache = require('../cache');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('security')
    .setDescription('Comandos de seguridad')
    .addSubcommand(s => s.setName('ipinfo').setDescription('Información de una dirección IP')
      .addStringOption(o => o.setName('ip').setDescription('Dirección IP').setRequired(true)))
    .addSubcommand(s => s.setName('scanurl').setDescription('Analiza si una URL es maliciosa')
      .addStringOption(o => o.setName('url').setDescription('URL a analizar').setRequired(true)))
    .addSubcommand(s => s.setName('usercheck').setDescription('Análisis de seguridad de un usuario')
      .addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)))
    .addSubcommand(s => s.setName('roblox').setDescription('Información completa de una cuenta de Roblox')
      .addStringOption(o => o.setName('username').setDescription('Nombre de usuario de Roblox').setRequired(true)))
    .addSubcommand(s => s.setName('roblox_avatar').setDescription('Muestra el avatar/foto de una cuenta de Roblox')
      .addStringOption(o => o.setName('username').setDescription('Nombre de usuario de Roblox').setRequired(true))
      .addStringOption(o => o.setName('tipo').setDescription('Tipo de imagen').addChoices({ name: 'Headshot (cara)', value: 'headshot' }, { name: 'Busto', value: 'bust' }, { name: 'Cuerpo completo', value: 'full' })))
    .addSubcommand(s => s.setName('leakcheck').setDescription('Busca si un username/email aparece en filtraciones de datos')
      .addStringOption(o => o.setName('query').setDescription('Username o email a buscar').setRequired(false))
      .addUserOption(o => o.setName('user').setDescription('Usuario de Discord (usa su username como query)').setRequired(false))),

  async execute(interaction) {
    let sub;
    try {
      sub = interaction.options.getSubcommand();
    } catch (e) {
      console.error('[security] getSubcommand error:', e);
      return interaction.reply({ content: '❌ Error interno.', ephemeral: true });
    }

    // Defer inmediato para todos los subcomandos — evita timeout de 3s
    const ephemeralSubs = ['ipinfo', 'usercheck', 'leakcheck'];
    try {
      await interaction.deferReply({ ephemeral: ephemeralSubs.includes(sub) });
    } catch (e) {
      console.error('[security] deferReply error:', e);
      return;
    }

    // ── IPINFO ───────────────────────────────────────────────────────────────
    if (sub === 'ipinfo') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return interaction.editReply({ content: '❌ Solo administradores.' });
      const ip = interaction.options.getString('ip').trim();
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(ip)) return interaction.editReply({ content: '❌ Formato de IP inválido.' });
      const parts = ip.split('.').map(Number);
      if (parts[0] === 10 || parts[0] === 127 || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168))
        return interaction.editReply({ content: '❌ No se pueden consultar IPs privadas.' });
      try {
        const cacheKey = `ip:${ip}`;
        let result = cache.get(cacheKey);
        const fromCache = !!result;

        if (!result) {
          const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,timezone,isp,org,as,proxy,hosting,query`);
          const geo = await geoRes.json();
          if (geo.status === 'fail') return interaction.editReply({ content: `❌ ${geo.message}` });

          let abuseScore = null, abuseReports = null, abuseLastReport = null;
          const abuseKey = process.env.ABUSEIPDB_KEY;
          if (abuseKey) {
            try {
              const abuseRes = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}&maxAgeInDays=90`, {
                headers: { Key: abuseKey, Accept: 'application/json' }
              });
              const abuseData = await abuseRes.json();
              if (abuseData.data) {
                abuseScore = abuseData.data.abuseConfidenceScore;
                abuseReports = abuseData.data.totalReports;
                abuseLastReport = abuseData.data.lastReportedAt;
              }
            } catch { /* skip */ }
          }
          result = { geo, abuseScore, abuseReports, abuseLastReport, hasAbuseKey: !!abuseKey };
          cache.set(cacheKey, result, 6 * 60 * 60 * 1000);
        }

        const { geo, abuseScore, abuseReports, abuseLastReport, hasAbuseKey } = result;
        const isRisky = geo.proxy || geo.hosting || (abuseScore !== null && abuseScore >= 25);
        const color = abuseScore >= 75 ? 0xED4245 : isRisky ? 0xFFA500 : 0x57F287;
        const riskLabel = abuseScore >= 75 ? '🔴 ALTO' : isRisky ? '🟡 MEDIO' : '🟢 BAJO';

        const embed = new EmbedBuilder()
          .setTitle(`🌐 IP: ${ip}`)
          .setColor(color)
          .addFields(
            { name: '🌍 País', value: `${geo.country} (${geo.countryCode})`, inline: true },
            { name: '🏙️ Ciudad', value: `${geo.city}, ${geo.regionName}`, inline: true },
            { name: '🕐 Zona horaria', value: geo.timezone || 'N/A', inline: true },
            { name: '🏢 ISP', value: geo.isp || 'N/A', inline: true },
            { name: '🔒 Proxy/VPN', value: geo.proxy ? '⚠️ Detectado' : '✅ No', inline: true },
            { name: '🖥️ Hosting/DC', value: geo.hosting ? '⚠️ Sí' : '✅ No', inline: true },
            { name: '⚠️ Riesgo general', value: riskLabel, inline: true }
          );

        if (abuseScore !== null) {
          embed.addFields(
            { name: '🛡️ AbuseIPDB Score', value: `**${abuseScore}%** de abuso`, inline: true },
            { name: '📋 Reportes (90d)', value: `${abuseReports}`, inline: true },
            { name: '🕒 Último reporte', value: abuseLastReport ? `<t:${Math.floor(new Date(abuseLastReport).getTime() / 1000)}:R>` : 'Nunca', inline: true }
          );
        } else if (!hasAbuseKey) {
          embed.addFields({ name: '🛡️ AbuseIPDB', value: '⚠️ Sin API key (`ABUSEIPDB_KEY`)', inline: false });
        }

        embed.setFooter({ text: `ip-api.com • AbuseIPDB${fromCache ? ' • 📦 Caché' : ''}` }).setTimestamp();
        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error('[ipinfo]', err);
        return interaction.editReply({ content: '❌ Error al consultar la IP.' });
      }
    }

    // ── SCANURL ──────────────────────────────────────────────────────────────
    if (sub === 'scanurl') {
      let url = interaction.options.getString('url').trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
      let domain;
      try { domain = new URL(url).hostname; } catch { return interaction.editReply({ content: '❌ URL inválida.' }); }
      try {
        const cacheKey = `url:${url}`;
        let cached = cache.get(cacheKey);
        const fromCache = !!cached;

        let threats = [], isMalicious = false, vtStats = null, phishDetected = false;

        if (cached) {
          ({ threats, isMalicious, vtStats, phishDetected } = cached);
        } else {
          const vtKey = process.env.VIRUSTOTAL_KEY;

          // ── URLhaus ──────────────────────────────────────────────────────
          const urlhausRes = await fetch('https://urlhaus-api.abuse.ch/v1/url/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `url=${encodeURIComponent(url)}`
          }).then(r => r.json()).catch(() => null);
          if (urlhausRes?.url_status === 'online') {
            threats.push('🦠 **URLhaus**: URL de malware activa');
            isMalicious = true;
          }

          // ── PhishTank (sin key, gratis) ───────────────────────────────────
          try {
            const ptRes = await fetch('https://checkurl.phishtank.com/checkurl/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'phishtank/TronixSecurity' },
              body: `url=${encodeURIComponent(Buffer.from(url).toString('base64'))}&format=json&app_key=`
            });
            const ptData = await ptRes.json();
            if (ptData.results?.in_database && ptData.results?.valid) {
              threats.push('🎣 **PhishTank**: URL de phishing confirmada');
              isMalicious = true;
              phishDetected = true;
            }
          } catch { /* skip */ }

          // ── VirusTotal ───────────────────────────────────────────────────
          if (vtKey) {
            try {
              const vtSubmit = await fetch('https://www.virustotal.com/api/v3/urls', {
                method: 'POST',
                headers: { 'x-apikey': vtKey, 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `url=${encodeURIComponent(url)}`
              });
              const vtSubmitData = await vtSubmit.json();
              const analysisId = vtSubmitData.data?.id;
              if (analysisId) {
                await new Promise(r => setTimeout(r, 3000));
                const vtResult = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
                  headers: { 'x-apikey': vtKey }
                });
                const vtData = await vtResult.json();
                const stats = vtData.data?.attributes?.stats;
                if (stats) {
                  vtStats = stats;
                  if (stats.malicious > 0) { threats.push(`🔴 **VirusTotal**: ${stats.malicious} motor(es) detectaron malware`); isMalicious = true; }
                  else if (stats.suspicious > 0) { threats.push(`🟡 **VirusTotal**: ${stats.suspicious} motor(es) sospechoso`); }
                }
              }
            } catch { /* skip */ }
          }

          // ── Heurísticas ──────────────────────────────────────────────────
          const patterns = [
            { pattern: /discord\.gift|discordnitro|free-nitro/i, label: '⚠️ Posible scam de Discord Nitro' },
            { pattern: /bit\.ly|tinyurl|t\.co/i, label: '⚠️ URL acortada' },
            { pattern: /\.tk$|\.ml$|\.ga$|\.cf$/i, label: '⚠️ Dominio de alto riesgo' },
            { pattern: /login.*steam|steam.*login/i, label: '⚠️ Posible phishing de Steam' },
            { pattern: /free.*robux|robux.*free/i, label: '⚠️ Posible scam de Roblox' }
          ];
          for (const { pattern, label } of patterns) { if (pattern.test(url)) threats.push(label); }

          // Cachear 24h si limpia, 1h si maliciosa (para re-verificar pronto)
          cache.set(cacheKey, { threats, isMalicious, vtStats, phishDetected }, isMalicious ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000);
        }

        const color = isMalicious ? 0xED4245 : threats.length > 0 ? 0xFFA500 : 0x57F287;
        const status = isMalicious ? '🔴 MALICIOSA' : threats.length > 0 ? '🟡 SOSPECHOSA' : '🟢 LIMPIA';

        const embed = new EmbedBuilder()
          .setTitle('🔍 Análisis de URL')
          .setColor(color)
          .addFields(
            { name: '🌐 URL', value: `\`${url.slice(0, 200)}\`` },
            { name: '🏷️ Dominio', value: domain, inline: true },
            { name: '📊 Estado', value: status, inline: true }
          );

        if (vtStats) {
          embed.addFields({ name: '🧬 VirusTotal', value: `🔴 Malicioso: **${vtStats.malicious}** | 🟡 Sospechoso: **${vtStats.suspicious}** | ✅ Limpio: **${vtStats.harmless}** | ⬜ Sin datos: **${vtStats.undetected}**` });
        } else if (!process.env.VIRUSTOTAL_KEY) {
          embed.addFields({ name: '🧬 VirusTotal', value: '⚠️ Sin API key (`VIRUSTOTAL_KEY`)' });
        }

        if (threats.length > 0) embed.addFields({ name: '⚠️ Amenazas detectadas', value: threats.join('\n') });
        else embed.addFields({ name: '✅ Sin amenazas', value: 'No se encontraron amenazas conocidas.' });

        embed.setFooter({ text: `URLhaus • PhishTank • VirusTotal${fromCache ? ' • 📦 Caché' : ''}` }).setTimestamp();
        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error('[scanurl]', err);
        return interaction.editReply({ content: '❌ Error al analizar la URL.' });
      }
    }

    // ── USERCHECK ────────────────────────────────────────────────────────────
    if (sub === 'usercheck') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return interaction.editReply({ content: '❌ Solo administradores.' });
      const usuario = interaction.options.getUser('user');
      const member = await interaction.guild.members.fetch(usuario.id).catch(() => null);
      const casesPath = path.join(__dirname, '../data/mod-cases.json');
      const warningsPath = path.join(__dirname, '../warnings.json');
      let cases = fs.existsSync(casesPath) ? JSON.parse(fs.readFileSync(casesPath, 'utf8')) : {};
      let warnings = fs.existsSync(warningsPath) ? JSON.parse(fs.readFileSync(warningsPath, 'utf8')) : {};
      const guildCases = (cases[interaction.guild.id] || []).filter(c => c.targetId === usuario.id);
      const userWarnings = warnings[`${interaction.guild.id}-${usuario.id}`] || [];
      const bans = guildCases.filter(c => c.type === 'ban' || c.type === 'tempban').length;
      const kicks = guildCases.filter(c => c.type === 'kick').length;
      const timeouts = guildCases.filter(c => c.type === 'timeout').length;
      let riskScore = userWarnings.length * 5 + kicks * 15 + bans * 30 + timeouts * 10;
      const accountAgeDays = Math.floor((Date.now() - usuario.createdTimestamp) / 86400000);
      if (accountAgeDays < 7) riskScore += 25; else if (accountAgeDays < 30) riskScore += 10;
      if (!usuario.avatar) riskScore += 10;
      if (/free.*nitro|nitro.*free|discord.*gift/i.test(usuario.username)) riskScore += 30;
      const riskLevel = riskScore >= 60 ? '🔴 ALTO' : riskScore >= 30 ? '🟡 MEDIO' : '🟢 BAJO';
      const color = riskScore >= 60 ? 0xED4245 : riskScore >= 30 ? 0xFFA500 : 0x57F287;
      const isBanned = await interaction.guild.bans.fetch(usuario.id).catch(() => null);
      const embed = new EmbedBuilder().setTitle('🔍 Análisis de Seguridad').setDescription(`**${usuario.tag}** (${usuario.id})`).setThumbnail(usuario.displayAvatarURL()).setColor(color).addFields(
        { name: '⚠️ Nivel de riesgo', value: `${riskLevel} (${riskScore} pts)`, inline: true },
        { name: '📅 Cuenta', value: `${accountAgeDays} días`, inline: true },
        { name: '🖼️ Avatar', value: usuario.avatar ? '✅' : '❌ Sin avatar', inline: true },
        { name: '🔨 Baneado', value: isBanned ? '⚠️ Sí' : '✅ No', inline: true },
        { name: '📊 Historial', value: `⚠️ Warns: **${userWarnings.length}** | 👢 Kicks: **${kicks}** | 🔨 Bans: **${bans}** | ⏱️ Timeouts: **${timeouts}**` }
      ).setFooter({ text: 'Tronix Security' }).setTimestamp();
      const alerts = [];
      if (accountAgeDays < 7) alerts.push('🚨 Cuenta nueva (<7 días)');
      if (!usuario.avatar) alerts.push('⚠️ Sin avatar');
      if (userWarnings.length >= 3) alerts.push(`⚠️ ${userWarnings.length} advertencias`);
      if (bans > 0) alerts.push(`🔨 Baneado ${bans} vez/veces`);
      if (/free.*nitro|nitro.*free/i.test(usuario.username)) alerts.push('🚨 Nombre sospechoso');
      if (alerts.length > 0) embed.addFields({ name: '🚨 Alertas', value: alerts.join('\n') });
      return interaction.editReply({ embeds: [embed] });
    }

    // ── ROBLOX ───────────────────────────────────────────────────────────────
    if (sub === 'roblox') {
      const username = interaction.options.getString('username');
      try {
        // 1. Resolve username → userId
        const searchRes = await fetch('https://users.roblox.com/v1/usernames/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usernames: [username], excludeBannedUsers: false })
        });
        const searchData = await searchRes.json();
        if (!searchData.data || searchData.data.length === 0)
          return interaction.editReply({ content: `❌ No se encontró **${username}** en Roblox.` });

        const userId = searchData.data[0].id;

        // 2. Fetch all data in parallel
        const [
          userRes, friendsRes, followersRes, followingRes,
          badgesRes, groupsRes, gamesRes, premiumRes, avatarRes
        ] = await Promise.all([
          fetch(`https://users.roblox.com/v1/users/${userId}`),
          fetch(`https://friends.roblox.com/v1/users/${userId}/friends/count`),
          fetch(`https://friends.roblox.com/v1/users/${userId}/followers/count`),
          fetch(`https://friends.roblox.com/v1/users/${userId}/followings/count`),
          fetch(`https://badges.roblox.com/v1/users/${userId}/badges?limit=6&sortOrder=Desc`),
          fetch(`https://groups.roblox.com/v1/users/${userId}/groups/roles`),
          fetch(`https://games.roblox.com/v2/users/${userId}/games?limit=10&sortOrder=Desc`),
          fetch(`https://premiumfeatures.roblox.com/v1/users/${userId}/validate-membership`),
          fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`)
        ]);

        const [
          userData, friendsData, followersData, followingData,
          badgesData, groupsData, gamesData, premiumData, avatarData
        ] = await Promise.all([
          userRes.json(), friendsRes.json(), followersRes.json(), followingRes.json(),
          badgesRes.json(), groupsRes.json(), gamesRes.json(),
          premiumRes.json().catch(() => null),
          avatarRes.json()
        ]);

        // Premium: API returns true/false directly or { isPremium: bool }
        let isPremium = false;
        try {
          if (typeof premiumData === 'boolean') isPremium = premiumData;
          else if (premiumData?.isPremium) isPremium = true;
          else isPremium = premiumRes.status === 200;
        } catch { isPremium = false; }

        // 3. Presence (online status) via POST
        let presenceStatus = 'Desconocido';
        try {
          const presenceRes = await fetch('https://presence.roblox.com/v1/presence/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userIds: [userId] })
          });
          const presenceData = await presenceRes.json();
          const p = presenceData.userPresences?.[0];
          if (p) {
            const types = { 0: '⚫ Offline', 1: '🟢 Online (Web)', 2: '🎮 En juego', 3: '🔧 En Roblox Studio' };
            presenceStatus = types[p.userPresenceType] || '⚫ Offline';
            if (p.lastLocation && p.userPresenceType === 2) presenceStatus += `\n└ *${p.lastLocation}*`;
          }
        } catch { /* presence API may require auth, silently skip */ }

        // 4. Process data
        const avatarUrl = avatarData.data?.[0]?.imageUrl || null;
        const createdAt = new Date(userData.created);
        const totalDays = Math.floor((Date.now() - createdAt.getTime()) / 86400000);
        const years = Math.floor(totalDays / 365);
        const remDays = totalDays % 365;
        const ageStr = years > 0 ? `${years} año(s), ${remDays} día(s)` : `${totalDays} día(s)`;

        const badgeList = badgesData.data?.slice(0, 5).map(b => `• ${b.name}`).join('\n') || '• Ninguno';
        const totalBadges = badgesData.data?.length ?? 0;

        const groupList = groupsData.data?.slice(0, 4).map(g => `• ${g.group.name} *(${g.role.name})*`).join('\n') || '• Ninguno';
        const totalGroups = groupsData.data?.length ?? 0;

        const gameList = gamesData.data?.slice(0, 4).map(g => `• [${g.name}](https://www.roblox.com/games/${g.rootPlace?.id})`).join('\n') || '• Ninguno';
        const totalGames = gamesData.data?.length ?? 0;

        // 5. Build embed
        const isBanned = userData.isBanned;
        const displayName = userData.displayName;
        const embed = new EmbedBuilder()
          .setTitle(`${isBanned ? '🚫 ' : ''}${displayName} (@${userData.name})`)
          .setURL(`https://www.roblox.com/users/${userId}/profile`)
          .setColor(isBanned ? 0xFF0000 : isPremium ? 0xF5A623 : 0x00B2FF)
          .setDescription(userData.description?.slice(0, 350) || '*Sin descripción*')
          .addFields(
            { name: '🆔 ID', value: `${userId}`, inline: true },
            { name: '💎 Premium', value: isPremium ? '✅ Sí' : '❌ No', inline: true },
            { name: '🚦 Estado', value: presenceStatus, inline: true },
            { name: '📅 Creado', value: `<t:${Math.floor(createdAt.getTime() / 1000)}:D>`, inline: true },
            { name: '⏳ Antigüedad', value: ageStr, inline: true },
            { name: '🔒 Cuenta', value: isBanned ? '🚫 Baneada' : '✅ Activa', inline: true },
            { name: '👥 Amigos', value: `${friendsData.count ?? 'N/A'}`, inline: true },
            { name: '👁️ Seguidores', value: `${followersData.count ?? 'N/A'}`, inline: true },
            { name: '➡️ Siguiendo', value: `${followingData.count ?? 'N/A'}`, inline: true },
            { name: `🏅 Últimos badges (${totalBadges} total)`, value: badgeList },
            { name: `👾 Grupos (${totalGroups} total)`, value: groupList, inline: true },
            { name: `🎮 Juegos creados (${totalGames})`, value: gameList, inline: true }
          )
          .setFooter({ text: 'Roblox • Tronix Security', iconURL: 'https://images.rbxcdn.com/e1c2b9a5c5e5e5e5e5e5e5e5e5e5e5e5.png' })
          .setTimestamp();

        if (avatarUrl) embed.setThumbnail(avatarUrl);

        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error('[roblox]', err);
        return interaction.editReply({ content: '❌ Error al obtener datos de Roblox.' });
      }
    }

    // ── ROBLOX AVATAR ────────────────────────────────────────────────────────
    if (sub === 'roblox_avatar') {
      const username = interaction.options.getString('username');
      const tipo = interaction.options.getString('tipo') || 'full';
      try {
        // Resolve username → userId
        const searchRes = await fetch('https://users.roblox.com/v1/usernames/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usernames: [username], excludeBannedUsers: false })
        });
        const searchData = await searchRes.json();
        if (!searchData.data || searchData.data.length === 0)
          return interaction.editReply({ content: `❌ No se encontró **${username}** en Roblox.` });

        const userId = searchData.data[0].id;
        const displayName = searchData.data[0].displayName;

        // Choose endpoint and size based on tipo
        const endpoints = {
          headshot: `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=720x720&format=Png&isCircular=false`,
          bust:     `https://thumbnails.roblox.com/v1/users/avatar-bust?userIds=${userId}&size=420x420&format=Png&isCircular=false`,
          full:     `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=720x720&format=Png&isCircular=false`
        };
        const tipoLabels = { headshot: '🎭 Headshot', bust: '👤 Busto', full: '🧍 Cuerpo completo' };

        const thumbRes = await fetch(endpoints[tipo]);
        const thumbData = await thumbRes.json();
        const imageUrl = thumbData.data?.[0]?.imageUrl;

        if (!imageUrl) return interaction.editReply({ content: '❌ No se pudo obtener el avatar.' });

        const embed = new EmbedBuilder()
          .setTitle(`${tipoLabels[tipo]} — ${displayName} (@${username})`)
          .setURL(`https://www.roblox.com/users/${userId}/profile`)
          .setColor(0x00B2FF)
          .setImage(imageUrl)
          .setFooter({ text: `ID: ${userId} • Roblox` })
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error('[roblox_avatar]', err);
        return interaction.editReply({ content: '❌ Error al obtener el avatar de Roblox.' });
      }
    }

    // ── LEAKCHECK ────────────────────────────────────────────────────────────
    if (sub === 'leakcheck') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator))
        return interaction.editReply({ content: '❌ Solo administradores.' });

      const rawQuery = interaction.options.getString('query');
      const targetUser = interaction.options.getUser('user');

      if (!rawQuery && !targetUser)
        return interaction.editReply({ content: '❌ Debes proporcionar un `query` o un `user`.' });

      const query = rawQuery ? rawQuery.trim() : targetUser.username;
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query);
      const queryType = isEmail ? 'email' : 'username';

      const leakcheckKey = process.env.LEAKCHECK_KEY;
      const hibpKey      = process.env.HIBP_KEY;
      const rapidKey     = process.env.RAPIDAPI_KEY;

      // ── Llamadas en paralelo ──────────────────────────────────────────────
      const [lcRes, hibpRes, bdRes] = await Promise.allSettled([
        // LeakCheck.io
        leakcheckKey
          ? fetch(`https://leakcheck.io/api/v2/query/${encodeURIComponent(query)}`, {
              headers: { 'X-API-Key': leakcheckKey },
              signal: AbortSignal.timeout(8000)
            }).then(r => r.json())
          : Promise.resolve(null),

        // Have I Been Pwned (solo email)
        isEmail && hibpKey
          ? fetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(query)}?truncateResponse=false`, {
              headers: { 'hibp-api-key': hibpKey, 'User-Agent': 'TronixSecurity' },
              signal: AbortSignal.timeout(8000)
            }).then(async r => ({ status: r.status, data: r.status === 200 ? await r.json() : [] }))
          : Promise.resolve(null),

        // BreachDirectory
        rapidKey
          ? fetch(`https://breachdirectory.p.rapidapi.com/?func=auto&term=${encodeURIComponent(query)}`, {
              headers: { 'X-RapidAPI-Key': rapidKey, 'X-RapidAPI-Host': 'breachdirectory.p.rapidapi.com' },
              signal: AbortSignal.timeout(8000)
            }).then(r => r.json())
          : Promise.resolve(null)
      ]);

      // ── Procesar resultados ───────────────────────────────────────────────
      const results = { leakcheck: null, hibp: null, breachdir: null };
      const errors = [];

      // LeakCheck
      if (!leakcheckKey) {
        errors.push('LeakCheck (sin key)');
      } else if (lcRes.status === 'fulfilled' && lcRes.value?.success) {
        results.leakcheck = {
          found: lcRes.value.found,
          sources: (lcRes.value.sources || []).slice(0, 8).map(s => `• ${s.name}${s.date ? ` *(${s.date})*` : ''}`)
        };
      } else {
        errors.push('LeakCheck (error)');
      }

      // HIBP
      if (!isEmail) {
        // no-op, se muestra nota abajo
      } else if (!hibpKey) {
        errors.push('HIBP (sin key)');
      } else if (hibpRes.status === 'fulfilled' && hibpRes.value) {
        const { status: httpStatus, data } = hibpRes.value;
        if (httpStatus === 200) {
          results.hibp = {
            found: data.length,
            breaches: data.slice(0, 6).map(b => `• **${b.Name}** *(${b.BreachDate})* — ${b.DataClasses.slice(0, 3).join(', ')}`)
          };
        } else {
          results.hibp = { found: 0, breaches: [] };
        }
      } else {
        errors.push('HIBP (error)');
      }

      // BreachDirectory
      if (!rapidKey) {
        errors.push('BreachDirectory (sin key)');
      } else if (bdRes.status === 'fulfilled' && bdRes.value?.success) {
        results.breachdir = {
          found: bdRes.value.found,
          sources: (bdRes.value.result || []).slice(0, 6).map(r => `• ${r.sources?.join(', ') || 'Desconocido'}`)
        };
      } else {
        errors.push('BreachDirectory (error)');
      }

      // ── Construir embed ───────────────────────────────────────────────────
      const totalFound = (results.leakcheck?.found || 0) + (results.hibp?.found || 0) + (results.breachdir?.found || 0);
      const color  = totalFound > 5 ? 0xED4245 : totalFound > 0 ? 0xFFA500 : 0x57F287;
      const status = totalFound > 5 ? '🔴 ALTO RIESGO' : totalFound > 0 ? '🟡 ENCONTRADO' : '🟢 LIMPIO';

      const embed = new EmbedBuilder()
        .setTitle('🔍 Búsqueda en Filtraciones de Datos')
        .setColor(color)
        .addFields(
          { name: '🔎 Búsqueda', value: `\`${query}\` *(${queryType})*${targetUser ? `\n👤 ${targetUser}` : ''}`, inline: true },
          { name: '📊 Estado',   value: status,        inline: true },
          { name: '📋 Total',    value: `${totalFound}`, inline: true }
        );

      if (results.leakcheck) {
        embed.addFields(results.leakcheck.found > 0
          ? { name: `🔓 LeakCheck.io — ${results.leakcheck.found} filtración(es)`, value: results.leakcheck.sources.join('\n') || 'Sin detalles' }
          : { name: '✅ LeakCheck.io', value: 'No encontrado', inline: true });
      }

      if (results.hibp) {
        embed.addFields(results.hibp.found > 0
          ? { name: `🔓 Have I Been Pwned — ${results.hibp.found} filtración(es)`, value: results.hibp.breaches.join('\n') || 'Sin detalles' }
          : { name: '✅ Have I Been Pwned', value: 'No encontrado', inline: true });
      } else if (!isEmail) {
        embed.addFields({ name: 'ℹ️ Have I Been Pwned', value: 'Solo busca por email', inline: true });
      }

      if (results.breachdir) {
        embed.addFields(results.breachdir.found > 0
          ? { name: `🔓 BreachDirectory — ${results.breachdir.found} resultado(s)`, value: results.breachdir.sources.join('\n') || 'Sin detalles' }
          : { name: '✅ BreachDirectory', value: 'No encontrado', inline: true });
      }

      if (errors.length > 0)
        embed.addFields({ name: '⚠️ APIs no disponibles', value: errors.map(e => `• ${e}`).join('\n') });

      embed
        .setFooter({ text: 'LeakCheck.io • HaveIBeenPwned • BreachDirectory — Solo admins' })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }
  }
};
