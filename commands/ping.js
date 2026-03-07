const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Muestra la latencia del bot / Shows bot latency'),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    
    const sent = await interaction.reply({ 
      content: lang === 'es' ? '🏓 Calculando latencia...' : '🏓 Calculating latency...', 
      fetchReply: true 
    });

    const wsLatency = interaction.client.ws.ping;
    const apiLatency = sent.createdTimestamp - interaction.createdTimestamp;

    // Determinar calidad de conexión
    let quality, color, emoji;
    if (wsLatency < 100) {
      quality = lang === 'es' ? 'Excelente' : 'Excellent';
      color = 0x57F287;
      emoji = '🟢';
    } else if (wsLatency < 200) {
      quality = lang === 'es' ? 'Buena' : 'Good';
      color = 0xFEE75C;
      emoji = '🟡';
    } else if (wsLatency < 400) {
      quality = lang === 'es' ? 'Regular' : 'Fair';
      color = 0xFFA500;
      emoji = '🟠';
    } else {
      quality = lang === 'es' ? 'Mala' : 'Poor';
      color = 0xED4245;
      emoji = '🔴';
    }

    const embed = new EmbedBuilder()
      .setTitle(lang === 'es' ? '🏓 Pong!' : '🏓 Pong!')
      .setColor(color)
      .addFields(
        { 
          name: lang === 'es' ? '📡 Latencia WebSocket' : '📡 WebSocket Latency', 
          value: `\`${wsLatency}ms\``, 
          inline: true 
        },
        { 
          name: lang === 'es' ? '⚡ Latencia API' : '⚡ API Latency', 
          value: `\`${apiLatency}ms\``, 
          inline: true 
        },
        { 
          name: lang === 'es' ? '📊 Calidad' : '📊 Quality', 
          value: `${emoji} ${quality}`, 
          inline: true 
        }
      )
      .setFooter({ text: lang === 'es' ? 'Latencia medida en milisegundos' : 'Latency measured in milliseconds' })
      .setTimestamp();

    await interaction.editReply({ content: null, embeds: [embed] });
  },
};
