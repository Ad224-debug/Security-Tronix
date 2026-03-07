const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const os = require('os');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Show bot information and statistics'),
    
  async execute(interaction) {
    try {
      const lang = interaction.client.getLanguage(interaction.guild.id);
      
      const uptime = process.uptime();
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor(uptime / 3600) % 24;
      const minutes = Math.floor(uptime / 60) % 60;
      const seconds = Math.floor(uptime % 60);
      
      const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
      const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
      const totalMemory = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
      const totalServers = interaction.client.guilds.cache.size;
      const totalUsers = interaction.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
      const totalChannels = interaction.client.channels.cache.size;
      const totalCommands = interaction.client.commands.size;
      const ping = interaction.client.ws.ping;
      const cpuUsage = process.cpuUsage();
      const cpuPercent = ((cpuUsage.user + cpuUsage.system) / 1000000).toFixed(2);

      const title = lang === 'es' ? '🤖 Información del Bot' : '🤖 Bot Information';
      const uptimeField = lang === 'es' ? '⏰ Tiempo Activo' : '⏰ Uptime';
      const memoryField = lang === 'es' ? '💾 Memoria' : '💾 Memory';
      const serversField = lang === 'es' ? '🌐 Servidores' : '🌐 Servers';
      const usersField = lang === 'es' ? '👥 Usuarios' : '👥 Users';
      const channelsField = lang === 'es' ? '📝 Canales' : '📝 Channels';
      const commandsField = lang === 'es' ? '⚡ Comandos' : '⚡ Commands';
      const pingField = lang === 'es' ? '📡 Latencia' : '📡 Latency';
      const versionField = lang === 'es' ? '📦 Versión' : '📦 Version';
      const platformField = lang === 'es' ? '💻 Plataforma' : '💻 Platform';

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(0x5865F2)
        .setThumbnail(interaction.client.user.displayAvatarURL())
        .setDescription(lang === 'es' 
          ? `Bot de moderación profesional con ${totalCommands} comandos disponibles`
          : `Professional moderation bot with ${totalCommands} available commands`)
        .addFields(
          { name: uptimeField, value: `\`${uptimeString}\``, inline: true },
          { name: pingField, value: `\`${ping}ms\``, inline: true },
          { name: versionField, value: '`v2.0.0`', inline: true },
          { name: serversField, value: `\`${totalServers}\``, inline: true },
          { name: usersField, value: `\`${totalUsers.toLocaleString()}\``, inline: true },
          { name: channelsField, value: `\`${totalChannels}\``, inline: true },
          { name: memoryField, value: `\`${memoryUsage}MB / ${totalMemory}MB\``, inline: true },
          { name: commandsField, value: `\`${totalCommands}\``, inline: true },
          { name: platformField, value: `\`${os.platform()} ${os.arch()}\``, inline: true }
        )
        .setFooter({ text: `Node.js ${process.version} • Discord.js v14` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando botinfo:', error);
      await interaction.reply({
        content: '❌ Hubo un error al ejecutar este comando.',
        ephemeral: true
      }).catch(console.error);
    }
  },
};
