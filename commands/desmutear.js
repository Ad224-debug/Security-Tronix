const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute a user in this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('user').setDescription('User to unmute').setRequired(true)),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const L = (es, en) => lang === 'es' ? es : en;
    const usuario = interaction.options.getUser('user');

    const miembro = await interaction.guild.members.fetch(usuario.id).catch(() => null);
    if (!miembro) {
      return interaction.reply({ content: L('❌ No se encontró ese usuario.', '❌ User not found.'), ephemeral: true });
    }

    try {
      // Remover overwrite de canal
      await interaction.channel.permissionOverwrites.delete(miembro).catch(() => {});

      // Remover rol "Muted" si existe
      const mutedRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === 'muted');
      if (mutedRole && miembro.roles.cache.has(mutedRole.id)) {
        await miembro.roles.remove(mutedRole).catch(() => {});
      }

      await interaction.reply({
        embeds: [{
          title: L('🔊 Usuario Desmuteado', '🔊 User Unmuted'),
          description: L(`${usuario} puede volver a escribir en este canal.`, `${usuario} can write in this channel again.`),
          fields: [
            { name: L('Moderador', 'Moderator'), value: `${interaction.user}`, inline: true },
          ],
          color: 0x57F287,
          timestamp: new Date(),
        }],
      });
    } catch (error) {
      console.error('Error en unmute:', error);
      await interaction.reply({ content: '❌ Error al desmutear al usuario.', ephemeral: true });
    }
  },
};
