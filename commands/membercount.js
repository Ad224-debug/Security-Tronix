const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: 'membercount',
    description: 'Show server member statistics',
  },
  async execute(interaction) {
    try {
      const lang = interaction.client.getLanguage(interaction.guild.id);
      
      const members = await interaction.guild.members.fetch();
      const totalMembers = members.size;
      const humans = members.filter(m => !m.user.bot).size;
      const bots = members.filter(m => m.user.bot).size;
      const online = members.filter(m => m.presence?.status === 'online').size;
      const idle = members.filter(m => m.presence?.status === 'idle').size;
      const dnd = members.filter(m => m.presence?.status === 'dnd').size;
      const offline = totalMembers - online - idle - dnd;

      const title = lang === 'es' ? '📊 Estadísticas de Miembros' : '📊 Member Statistics';
      const totalField = lang === 'es' ? 'Total de Miembros' : 'Total Members';
      const humansField = lang === 'es' ? '👥 Humanos' : '👥 Humans';
      const botsField = lang === 'es' ? '🤖 Bots' : '🤖 Bots';
      const statusField = lang === 'es' ? 'Estados' : 'Status';

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(0x5865F2)
        .setThumbnail(interaction.guild.iconURL())
        .addFields(
          { name: totalField, value: `${totalMembers}`, inline: true },
          { name: humansField, value: `${humans}`, inline: true },
          { name: botsField, value: `${bots}`, inline: true },
          { name: statusField, value: `🟢 ${online} | 🟡 ${idle} | 🔴 ${dnd} | ⚫ ${offline}`, inline: false }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando membercount:', error);
      await interaction.reply({
        content: '❌ Hubo un error al ejecutar este comando.',
        ephemeral: true
      }).catch(console.error);
    }
  },
};
