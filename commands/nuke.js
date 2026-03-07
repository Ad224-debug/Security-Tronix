const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('Clone and delete this channel (clears all messages)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    
    // Solo el owner del servidor puede usar este comando
    if (interaction.user.id !== interaction.guild.ownerId) {
      return await interaction.reply({
        content: lang === 'es' ? '❌ Solo el dueño del servidor puede usar este comando.' : '❌ Only the server owner can use this command.',
        ephemeral: true
      });
    }

    const channel = interaction.channel;

    try {
      await interaction.reply({
        content: lang === 'es' ? '💣 Nukendo canal en 3 segundos...' : '💣 Nuking channel in 3 seconds...',
        ephemeral: true
      });

      // Esperar 3 segundos
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Guardar información del canal
      const position = channel.position;
      const name = channel.name;
      const topic = channel.topic;
      const nsfw = channel.nsfw;
      const rateLimitPerUser = channel.rateLimitPerUser;
      const parent = channel.parent;
      const permissionOverwrites = channel.permissionOverwrites.cache;

      // Clonar el canal
      const newChannel = await channel.clone({
        name: name,
        topic: topic,
        nsfw: nsfw,
        rateLimitPerUser: rateLimitPerUser,
        parent: parent,
        permissionOverwrites: permissionOverwrites,
        position: position,
        reason: `Canal nukeado por ${interaction.user.tag}`
      });

      // Eliminar el canal original
      await channel.delete();

      // Enviar mensaje de confirmación en el nuevo canal
      const embed = new EmbedBuilder()
        .setTitle(lang === 'es' ? '💥 Canal Nukeado' : '💥 Channel Nuked')
        .setDescription(lang === 'es' 
          ? 'Este canal ha sido nukeado. Todos los mensajes anteriores han sido eliminados.'
          : 'This channel has been nuked. All previous messages have been deleted.')
        .addFields(
          { name: lang === 'es' ? '👮 Moderador' : '👮 Moderator', value: `${interaction.user}`, inline: true },
          { name: lang === 'es' ? '🕐 Fecha' : '🕐 Date', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setColor(0xED4245)
        .setImage('https://media.giphy.com/media/HhTXt43pk1I1W/giphy.gif')
        .setTimestamp();

      await newChannel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error en nuke:', error);
      try {
        await interaction.followUp({
          content: lang === 'es' ? '❌ Hubo un error al nukear el canal.' : '❌ There was an error nuking the channel.',
          ephemeral: true
        });
      } catch (e) {
        console.error('No se pudo enviar mensaje de error:', e);
      }
    }
  },
};
