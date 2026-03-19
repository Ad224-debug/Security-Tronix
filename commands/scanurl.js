const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('scanurl')
    .setDescription('Analiza si una URL es maliciosa o phishing')
    .addStringOption(opt =>
      opt.setName('url').setDescription('URL a analizar').setRequired(true)),

  async execute(interaction) {
    let url = interaction.options.getString('url').trim();
    await interaction.deferReply();

    // Asegurar que tenga protocolo para el análisis
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    let domain;
    try {
      domain = new URL(url).hostname;
    } catch {
      return interaction.editReply({ content: '❌ URL inválida.' });
    }

    try {
      // Google Safe Browsing (sin key, usando endpoint público de verificación básica)
      // Usamos múltiples fuentes públicas
      const checks = await Promise.allSettled([
        // PhishTank API (pública)
        fetch('https://checkurl.phishtank.com/checkurl/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'phishtank/TronixSecurity' },
          body: `url=${encodeURIComponent(url)}&format=json`
        }).then(r => r.json()),

        // URLhaus (abuse.ch) - base de datos de malware
        fetch('https://urlhaus-api.abuse.ch/v1/url/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `url=${encodeURIComponent(url)}`
        }).then(r => r.json())
      ]);

      let phishResult = null;
      let urlhausResult = null;

      if (checks[0].status === 'fulfilled') phishResult = checks[0].value;
      if (checks[1].status === 'fulfilled') urlhausResult = checks[1].value;

      // Analizar resultados
      const threats = [];
      let isMalicious = false;

      // PhishTank
      if (phishResult?.results?.in_database && phishResult?.results?.valid) {
        threats.push('🎣 **PhishTank**: Phishing confirmado');
        isMalicious = true;
      }

      // URLhaus
      if (urlhausResult?.query_status === 'is_host' || urlhausResult?.url_status === 'online') {
        threats.push('🦠 **URLhaus**: URL de malware activa');
        isMalicious = true;
      }

      // Heurísticas básicas
      const suspiciousPatterns = [
        { pattern: /discord\.gift|discordnitro|free-nitro/i, label: '⚠️ Posible scam de Discord Nitro' },
        { pattern: /paypal.*secure|secure.*paypal/i, label: '⚠️ Posible phishing de PayPal' },
        { pattern: /bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly/i, label: '⚠️ URL acortada (no verificable directamente)' },
        { pattern: /\.ru$|\.cn$|\.tk$|\.ml$|\.ga$|\.cf$/i, label: '⚠️ Dominio de alto riesgo' },
        { pattern: /login.*steam|steam.*login/i, label: '⚠️ Posible phishing de Steam' },
        { pattern: /free.*robux|robux.*free/i, label: '⚠️ Posible scam de Roblox' }
      ];

      for (const { pattern, label } of suspiciousPatterns) {
        if (pattern.test(url)) threats.push(label);
      }

      const color = isMalicious ? 0xED4245 : threats.length > 0 ? 0xFFA500 : 0x57F287;
      const status = isMalicious ? '🔴 MALICIOSA' : threats.length > 0 ? '🟡 SOSPECHOSA' : '🟢 LIMPIA';

      const embed = new EmbedBuilder()
        .setTitle(`🔍 Análisis de URL`)
        .setColor(color)
        .addFields(
          { name: '🌐 URL', value: `\`${url.slice(0, 200)}\``, inline: false },
          { name: '🏷️ Dominio', value: domain, inline: true },
          { name: '📊 Estado', value: status, inline: true }
        )
        .setTimestamp();

      if (threats.length > 0) {
        embed.addFields({ name: '⚠️ Amenazas detectadas', value: threats.join('\n'), inline: false });
      } else {
        embed.addFields({ name: '✅ Sin amenazas conocidas', value: 'No se encontraron amenazas en las bases de datos consultadas.', inline: false });
      }

      embed.addFields({ name: '📡 Fuentes consultadas', value: 'PhishTank • URLhaus (abuse.ch) • Análisis heurístico', inline: false });
      embed.setFooter({ text: 'Este análisis no garantiza seguridad absoluta. Usa con criterio.' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en /scanurl:', error);
      await interaction.editReply({ content: '❌ Error al analizar la URL.' });
    }
  }
};
