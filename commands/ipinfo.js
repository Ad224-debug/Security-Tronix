const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ipinfo')
    .setDescription('Obtiene información de una dirección IP (solo admins)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt.setName('ip').setDescription('Dirección IP a consultar').setRequired(true)),

  async execute(interaction) {
    const ip = interaction.options.getString('ip').trim();
    await interaction.deferReply({ ephemeral: true });

    // Validar formato IP básico
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      return interaction.editReply({ content: '❌ Formato de IP inválido. Usa formato: `192.168.1.1`' });
    }

    // Bloquear IPs privadas
    const parts = ip.split('.').map(Number);
    if (parts[0] === 10 || parts[0] === 127 ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168)) {
      return interaction.editReply({ content: '❌ No se pueden consultar IPs privadas o locales.' });
    }

    try {
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,proxy,hosting,query`);
      const data = await res.json();

      if (data.status === 'fail') {
        return interaction.editReply({ content: `❌ No se pudo obtener información: ${data.message}` });
      }

      const flags = {
        proxy: data.proxy ? '⚠️ **Proxy/VPN detectado**' : '✅ No es proxy/VPN',
        hosting: data.hosting ? '🖥️ **IP de hosting/datacenter**' : '🏠 IP residencial/comercial'
      };

      const riskLevel = data.proxy || data.hosting ? '🔴 Alto' : '🟢 Bajo';

      const embed = new EmbedBuilder()
        .setTitle(`🌐 Información de IP: ${ip}`)
        .setColor(data.proxy || data.hosting ? 0xED4245 : 0x57F287)
        .addFields(
          { name: '🌍 País', value: `${data.country} :flag_${data.countryCode?.toLowerCase()}:`, inline: true },
          { name: '🏙️ Ciudad', value: `${data.city}, ${data.regionName}`, inline: true },
          { name: '🕐 Zona horaria', value: data.timezone || 'N/A', inline: true },
          { name: '🏢 ISP', value: data.isp || 'N/A', inline: true },
          { name: '🏗️ Organización', value: data.org || 'N/A', inline: true },
          { name: '📡 AS', value: data.as || 'N/A', inline: true },
          { name: '🔒 Proxy/VPN', value: flags.proxy, inline: true },
          { name: '🖥️ Hosting', value: flags.hosting, inline: true },
          { name: '⚠️ Nivel de riesgo', value: riskLevel, inline: true },
          { name: '📍 Coordenadas', value: `${data.lat}, ${data.lon}`, inline: true }
        )
        .setFooter({ text: 'Datos de ip-api.com • Solo para uso de moderación' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en /ipinfo:', error);
      await interaction.editReply({ content: '❌ Error al consultar la IP. Intenta de nuevo.' });
    }
  }
};
