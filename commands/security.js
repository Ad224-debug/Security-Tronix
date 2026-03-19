const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

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
    .addSubcommand(s => s.setName('roblox').setDescription('Información de una cuenta de Roblox')
      .addStringOption(o => o.setName('username').setDescription('Nombre de usuario de Roblox').setRequired(true))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // ── IPINFO ───────────────────────────────────────────────────────────────
    if (sub === 'ipinfo') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply({ content: '❌ Solo administradores.', ephemeral: true });
      const ip = interaction.options.getString('ip').trim();
      await interaction.deferReply({ ephemeral: true });
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipRegex.test(ip)) return interaction.editReply({ content: '❌ Formato de IP inválido.' });
      const parts = ip.split('.').map(Number);
      if (parts[0] === 10 || parts[0] === 127 || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168)) return interaction.editReply({ content: '❌ No se pueden consultar IPs privadas.' });
      try {
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,timezone,isp,org,as,proxy,hosting,query`);
        const data = await res.json();
        if (data.status === 'fail') return interaction.editReply({ content: `❌ ${data.message}` });
        const riskLevel = data.proxy || data.hosting ? '🔴 Alto' : '🟢 Bajo';
        return interaction.editReply({ embeds: [new EmbedBuilder().setTitle(`🌐 IP: ${ip}`).setColor(data.proxy || data.hosting ? 0xED4245 : 0x57F287).addFields({ name: '🌍 País', value: `${data.country}`, inline: true }, { name: '🏙️ Ciudad', value: `${data.city}, ${data.regionName}`, inline: true }, { name: '🕐 Zona horaria', value: data.timezone || 'N/A', inline: true }, { name: '🏢 ISP', value: data.isp || 'N/A', inline: true }, { name: '🔒 Proxy/VPN', value: data.proxy ? '⚠️ Detectado' : '✅ No', inline: true }, { name: '🖥️ Hosting', value: data.hosting ? '⚠️ Sí' : '✅ No', inline: true }, { name: '⚠️ Riesgo', value: riskLevel, inline: true }).setFooter({ text: 'ip-api.com' }).setTimestamp()] });
      } catch { return interaction.editReply({ content: '❌ Error al consultar la IP.' }); }
    }

    // ── SCANURL ──────────────────────────────────────────────────────────────
    if (sub === 'scanurl') {
      let url = interaction.options.getString('url').trim();
      await interaction.deferReply();
      if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
      let domain;
      try { domain = new URL(url).hostname; } catch { return interaction.editReply({ content: '❌ URL inválida.' }); }
      try {
        const checks = await Promise.allSettled([
          fetch('https://urlhaus-api.abuse.ch/v1/url/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `url=${encodeURIComponent(url)}` }).then(r => r.json())
        ]);
        const threats = [];
        let isMalicious = false;
        const urlhausResult = checks[0].status === 'fulfilled' ? checks[0].value : null;
        if (urlhausResult?.url_status === 'online') { threats.push('🦠 **URLhaus**: URL de malware activa'); isMalicious = true; }
        const suspiciousPatterns = [
          { pattern: /discord\.gift|discordnitro|free-nitro/i, label: '⚠️ Posible scam de Discord Nitro' },
          { pattern: /bit\.ly|tinyurl|t\.co/i, label: '⚠️ URL acortada' },
          { pattern: /\.tk$|\.ml$|\.ga$|\.cf$/i, label: '⚠️ Dominio de alto riesgo' },
          { pattern: /login.*steam|steam.*login/i, label: '⚠️ Posible phishing de Steam' },
          { pattern: /free.*robux|robux.*free/i, label: '⚠️ Posible scam de Roblox' }
        ];
        for (const { pattern, label } of suspiciousPatterns) { if (pattern.test(url)) threats.push(label); }
        const color = isMalicious ? 0xED4245 : threats.length > 0 ? 0xFFA500 : 0x57F287;
        const status = isMalicious ? '🔴 MALICIOSA' : threats.length > 0 ? '🟡 SOSPECHOSA' : '🟢 LIMPIA';
        const embed = new EmbedBuilder().setTitle('🔍 Análisis de URL').setColor(color).addFields({ name: '🌐 URL', value: `\`${url.slice(0, 200)}\`` }, { name: '🏷️ Dominio', value: domain, inline: true }, { name: '📊 Estado', value: status, inline: true });
        if (threats.length > 0) embed.addFields({ name: '⚠️ Amenazas', value: threats.join('\n') });
        else embed.addFields({ name: '✅ Sin amenazas', value: 'No se encontraron amenazas conocidas.' });
        embed.setFooter({ text: 'URLhaus • Análisis heurístico' }).setTimestamp();
        return interaction.editReply({ embeds: [embed] });
      } catch { return interaction.editReply({ content: '❌ Error al analizar la URL.' }); }
    }

    // ── USERCHECK ────────────────────────────────────────────────────────────
    if (sub === 'usercheck') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply({ content: '❌ Solo administradores.', ephemeral: true });
      const usuario = interaction.options.getUser('user');
      await interaction.deferReply({ ephemeral: true });
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
      await interaction.deferReply();
      try {
        const searchRes = await fetch('https://users.roblox.com/v1/usernames/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usernames: [username], excludeBannedUsers: false }) });
        const searchData = await searchRes.json();
        if (!searchData.data || searchData.data.length === 0) return interaction.editReply({ content: `❌ No se encontró **${username}** en Roblox.` });
        const userId = searchData.data[0].id;
        const displayName = searchData.data[0].displayName;
        const [userRes, friendsRes, followersRes, followingRes, badgesRes] = await Promise.all([
          fetch(`https://users.roblox.com/v1/users/${userId}`),
          fetch(`https://friends.roblox.com/v1/users/${userId}/friends/count`),
          fetch(`https://friends.roblox.com/v1/users/${userId}/followers/count`),
          fetch(`https://friends.roblox.com/v1/users/${userId}/followings/count`),
          fetch(`https://badges.roblox.com/v1/users/${userId}/badges?limit=10&sortOrder=Desc`)
        ]);
        const [userData, friendsData, followersData, followingData, badgesData] = await Promise.all([userRes.json(), friendsRes.json(), followersRes.json(), followingRes.json(), badgesRes.json()]);
        const avatarRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`);
        const avatarData = await avatarRes.json();
        const avatarUrl = avatarData.data?.[0]?.imageUrl || null;
        const createdAt = new Date(userData.created);
        const days = Math.floor((Date.now() - createdAt.getTime()) / 86400000);
        const years = Math.floor(days / 365);
        const ageStr = years > 0 ? `${years} año(s) y ${days % 365} día(s)` : `${days} día(s)`;
        const badgeList = badgesData.data?.slice(0, 5).map(b => b.name).join('\n') || 'Ninguno';
        const embed = new EmbedBuilder().setTitle(`${userData.isBanned ? '🚫 ' : ''}${displayName} (@${userData.name})`).setURL(`https://www.roblox.com/users/${userId}/profile`).setColor(userData.isBanned ? 0xFF0000 : 0x00B2FF).setDescription(userData.description?.slice(0, 300) || '*Sin descripción*').addFields(
          { name: '🆔 ID', value: `${userId}`, inline: true },
          { name: '📅 Creado', value: `<t:${Math.floor(createdAt.getTime()/1000)}:D>`, inline: true },
          { name: '⏳ Antigüedad', value: ageStr, inline: true },
          { name: '👥 Amigos', value: `${friendsData.count ?? 'N/A'}`, inline: true },
          { name: '👁️ Seguidores', value: `${followersData.count ?? 'N/A'}`, inline: true },
          { name: '➡️ Siguiendo', value: `${followingData.count ?? 'N/A'}`, inline: true },
          { name: '🏅 Últimos badges', value: badgeList }
        ).setTimestamp();
        if (avatarUrl) embed.setThumbnail(avatarUrl);
        if (userData.isBanned) embed.addFields({ name: '⚠️ Estado', value: 'Cuenta **baneada**' });
        return interaction.editReply({ embeds: [embed] });
      } catch { return interaction.editReply({ content: '❌ Error al obtener datos de Roblox.' }); }
    }
  }
};
