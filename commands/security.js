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
    .addSubcommand(s => s.setName('leakcheck').setDescription('Busca si un username/email aparece en filtraciones de datos')
      .addStringOption(o => o.setName('query').setDescription('Username o email a buscar').setRequired(false))
      .addUserOption(o => o.setName('user').setDescription('Usuario de Discord (usa su username como query)').setRequired(false))),

  async execute(interaction) {
    let sub;
    try {
      sub = interaction.options.getSubcommand();
    } catch (e) {
      console.error('[security] getSubcommand error:', e);
      return interaction.reply({ content: '❌ Error interno.', flags: 64 });
    }

    // Defer inmediato para todos los subcomandos — evita timeout de 3s
    const ephemeralSubs = ['ipinfo', 'usercheck', 'leakcheck'];
    try {
      await interaction.deferReply({ flags: ephemeralSubs.includes(sub) ? 64 : undefined });
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

          // ── AlienVault OTX + ThreatFox (paralelo, sin key) ───────────────
          const { _queryOTX_IP, _queryThreatFox } = require('../security-systems');
          const [otxData, tfData] = await Promise.all([
            _queryOTX_IP(ip),
            _queryThreatFox(ip)
          ]);

          result = { geo, abuseScore, abuseReports, abuseLastReport, hasAbuseKey: !!abuseKey, otxData, tfData };
          cache.set(cacheKey, result, 6 * 60 * 60 * 1000);
        }

        const { geo, abuseScore, abuseReports, abuseLastReport, hasAbuseKey, otxData, tfData } = result;
        const isRisky = geo.proxy || geo.hosting || (abuseScore !== null && abuseScore >= 25) || otxData?.malicious || tfData?.found;
        const color = abuseScore >= 75 || tfData?.found ? 0xED4245 : isRisky ? 0xFFA500 : 0x57F287;
        const riskLabel = abuseScore >= 75 || tfData?.found ? '🔴 ALTO' : isRisky ? '🟡 MEDIO' : '🟢 BAJO';

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

        // AlienVault OTX
        if (otxData) {
          embed.addFields({
            name: `🔭 AlienVault OTX — ${otxData.pulses} pulse(s)`,
            value: otxData.malicious
              ? `⚠️ Encontrado en ${otxData.pulses} campaña(s)\n${otxData.tags.length ? otxData.tags.map(t => `• ${t}`).join('\n') : ''}`
              : '✅ Sin amenazas conocidas',
            inline: false
          });
        }

        // ThreatFox
        if (tfData?.found) {
          embed.addFields({
            name: '🦊 ThreatFox — IoC detectado',
            value: `🦠 **Malware:** ${tfData.malwareFamily}\n🎯 **Tipo:** ${tfData.threatType}\n📊 **Confianza:** ${tfData.confidence}%`,
            inline: false
          });
        } else if (tfData && !tfData.found) {
          embed.addFields({ name: '🦊 ThreatFox', value: '✅ Sin IoCs conocidos', inline: true });
        }

        embed.setFooter({ text: `ip-api.com • AbuseIPDB • OTX • ThreatFox${fromCache ? ' • 📦 Caché' : ''}` }).setTimestamp();
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

          // ── AlienVault OTX + ThreatFox (paralelo, sin key) ───────────────
          const { _queryOTX_Domain, _queryThreatFox } = require('../security-systems');
          const [otxData, tfData] = await Promise.all([
            _queryOTX_Domain(domain),
            _queryThreatFox(domain)
          ]);

          if (otxData?.malicious) {
            threats.push(`🔭 **AlienVault OTX**: ${otxData.pulses} campaña(s) de amenaza${otxData.tags.length ? ` — ${otxData.tags.slice(0,2).join(', ')}` : ''}`);
            isMalicious = true;
          }
          if (tfData?.found) {
            threats.push(`🦊 **ThreatFox**: IoC de ${tfData.malwareFamily} (${tfData.threatType}, confianza ${tfData.confidence}%)`);
            isMalicious = true;
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

        embed.setFooter({ text: `URLhaus • PhishTank • VirusTotal • OTX • ThreatFox${fromCache ? ' • 📦 Caché' : ''}` }).setTimestamp();
        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error('[scanurl]', err);
        return interaction.editReply({ content: '❌ Error al analizar la URL.' });
      }
    }

    // ── USERCHECK ────────────────────────────────────────────────────────────
    if (sub === 'usercheck') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return interaction.editReply({ content: '❌ Solo administradores.' });
      const usuario = await interaction.options.getUser('user').fetch().catch(() => interaction.options.getUser('user'));
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
      const softbans = guildCases.filter(c => c.type === 'softban').length;
      const vcbans = guildCases.filter(c => c.type === 'vcban').length;

      // Risk score
      let riskScore = userWarnings.length * 5 + kicks * 15 + bans * 30 + timeouts * 10 + softbans * 20 + vcbans * 5;
      const accountAgeDays = Math.floor((Date.now() - usuario.createdTimestamp) / 86400000);
      if (accountAgeDays < 3) riskScore += 40;
      else if (accountAgeDays < 7) riskScore += 25;
      else if (accountAgeDays < 30) riskScore += 10;
      if (!usuario.avatar) riskScore += 10;
      if (/free.*nitro|nitro.*free|discord.*gift/i.test(usuario.username)) riskScore += 30;
      if (/admin|moderator|staff|official|support/i.test(usuario.username)) riskScore += 15;

      // Discord flags/badges
      const { UserFlags } = require('discord.js');
      const flags = usuario.flags;
      const badges = [];
      if (flags) {
        if (flags.has(UserFlags.Staff))                 badges.push('👑 Discord Staff');
        if (flags.has(UserFlags.Partner))               badges.push('🤝 Partner');
        if (flags.has(UserFlags.BugHunterLevel1))       badges.push('🐛 Bug Hunter');
        if (flags.has(UserFlags.BugHunterLevel2))       badges.push('🐛 Bug Hunter Gold');
        if (flags.has(UserFlags.ActiveDeveloper))       badges.push('👨‍💻 Active Developer');
        if (flags.has(UserFlags.VerifiedDeveloper))     badges.push('✅ Verified Developer');
        if (flags.has(UserFlags.PremiumEarlySupporter)) badges.push('⭐ Early Supporter');
        if (flags.has(UserFlags.Quarantined))           { badges.push('🚫 Quarantined'); riskScore += 60; }
        if (flags.has(UserFlags.Spammer))               { badges.push('🚨 Marked Spammer'); riskScore += 50; }
      }
      if (usuario.premiumType > 0) badges.push('💎 Nitro');
      if (member?.premiumSince) badges.push('🚀 Server Booster');

      const riskLevel = riskScore >= 60 ? '🔴 ALTO' : riskScore >= 30 ? '🟡 MEDIO' : '🟢 BAJO';
      const color = riskScore >= 60 ? 0xED4245 : riskScore >= 30 ? 0xFFA500 : 0x57F287;
      const isBanned = await interaction.guild.bans.fetch(usuario.id).catch(() => null);

      const embed = new EmbedBuilder()
        .setTitle('🔍 Análisis de Seguridad')
        .setDescription(`**${usuario.tag}** (${usuario.id})`)
        .setThumbnail(usuario.displayAvatarURL({ size: 256 }))
        .setColor(color)
        .addFields(
          { name: '⚠️ Nivel de riesgo', value: `${riskLevel} (${riskScore} pts)`, inline: true },
          { name: '📅 Cuenta creada', value: `<t:${Math.floor(usuario.createdTimestamp / 1000)}:D> (${accountAgeDays}d)`, inline: true },
          { name: '🖼️ Avatar', value: usuario.avatar ? '✅' : '❌ Sin avatar', inline: true },
          { name: '🔨 Baneado aquí', value: isBanned ? '⚠️ Sí' : '✅ No', inline: true },
          { name: '🏠 En servidor', value: member ? '✅ Sí' : '❌ No', inline: true },
          { name: '🤖 Bot', value: usuario.bot ? '✅ Sí' : '❌ No', inline: true },
          { name: '📊 Historial en este servidor', value: `⚠️ Warns: **${userWarnings.length}** | 👢 Kicks: **${kicks}** | 🔨 Bans: **${bans}** | ⏱️ Timeouts: **${timeouts}**${softbans > 0 ? ` | 🔄 Softbans: **${softbans}**` : ''}${vcbans > 0 ? ` | 🔇 VC Bans: **${vcbans}**` : ''}` }
        )
        .setFooter({ text: 'Tronix Security • User Check' })
        .setTimestamp();

      if (badges.length > 0) embed.addFields({ name: '🏅 Badges / Estado', value: badges.join('\n'), inline: false });

      // Últimos 3 casos
      if (guildCases.length > 0) {
        const recent = guildCases.slice(-3).reverse();
        const caseLines = recent.map(c => `**#${c.id}** \`${c.type}\` — ${c.reason || 'Sin razón'} <t:${Math.floor(c.timestamp / 1000)}:R>`).join('\n');
        embed.addFields({ name: `📋 Últimos casos (${guildCases.length} total)`, value: caseLines });
      }

      // Alertas
      const alerts = [];
      if (accountAgeDays < 7) alerts.push('🚨 Cuenta nueva (<7 días)');
      if (!usuario.avatar) alerts.push('⚠️ Sin avatar');
      if (userWarnings.length >= 3) alerts.push(`⚠️ ${userWarnings.length} advertencias`);
      if (bans > 0) alerts.push(`🔨 Baneado ${bans} vez/veces en este servidor`);
      if (/free.*nitro|nitro.*free/i.test(usuario.username)) alerts.push('🚨 Nombre sospechoso (Nitro scam)');
      if (/admin|moderator|staff|official/i.test(usuario.username)) alerts.push('⚠️ Nombre que imita staff');
      if (alerts.length > 0) embed.addFields({ name: '🚨 Alertas', value: alerts.join('\n') });

      return interaction.editReply({ embeds: [embed] });
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

      // LeakCheck usa endpoint público, siempre disponible
      // Solo verificar que haya algo útil si el usuario quiere email con HIBP
      if (!leakcheckKey && !hibpKey && !rapidKey) {
        // No bloqueamos — LeakCheck público siempre funciona
      }

      // ── Llamadas en paralelo ──────────────────────────────────────────────
      const [lcRes, hibpRes, bdRes] = await Promise.allSettled([
        // LeakCheck.io — usa endpoint público (sin key requerida)
        fetch(`https://leakcheck.io/api/public?check=${encodeURIComponent(query)}`, {
          signal: AbortSignal.timeout(8000)
        }).then(async r => ({ ok: r.ok, status: r.status, data: await r.json() })),

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
            }).then(async r => ({ ok: r.ok, status: r.status, data: await r.json() }))
          : Promise.resolve(null)
      ]);

      // ── Procesar resultados ───────────────────────────────────────────────
      const results = { leakcheck: null, hibp: null, breachdir: null };
      const errors = [];

      // LeakCheck (endpoint público, siempre disponible)
      if (lcRes.status === 'fulfilled' && lcRes.value) {
        const { ok, status, data } = lcRes.value;
        if (ok && data?.success) {
          results.leakcheck = {
            found: data.found,
            sources: (data.sources || []).slice(0, 8).map(s => `• ${s.name}${s.date ? ` *(${s.date})*` : ''}`)
          };
        } else if (status === 429) {
          errors.push('LeakCheck (rate limit)');
        } else {
          errors.push(`LeakCheck (error ${status})`);
        }
      } else {
        errors.push('LeakCheck (timeout/error de red)');
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
      } else if (bdRes.status === 'fulfilled' && bdRes.value) {
        const { ok, status, data } = bdRes.value;
        if (ok && data?.success) {
          results.breachdir = {
            found: data.found,
            sources: (data.result || []).slice(0, 6).map(r => `• ${r.sources?.join(', ') || 'Desconocido'}`)
          };
        } else if (status === 403) {
          errors.push('BreachDirectory (no suscrito en RapidAPI)');
        } else if (status === 401) {
          errors.push('BreachDirectory (key inválida)');
        } else if (status === 429) {
          errors.push('BreachDirectory (rate limit)');
        } else {
          errors.push(`BreachDirectory (error ${status})`);
        }
      } else {
        errors.push('BreachDirectory (timeout/error de red)');
      }

      // ── Construir embed ───────────────────────────────────────────────────
      const totalFound = (results.leakcheck?.found || 0) + (results.hibp?.found || 0) + (results.breachdir?.found || 0);
      const anySearched = results.leakcheck !== null || results.hibp !== null || results.breachdir !== null;
      const color  = totalFound > 5 ? 0xED4245 : totalFound > 0 ? 0xFFA500 : 0x57F287;
      const status = totalFound > 5 ? '🔴 ALTO RIESGO' : totalFound > 0 ? '🟡 ENCONTRADO' : anySearched ? '🟢 LIMPIO' : '⚪ SIN DATOS';

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
