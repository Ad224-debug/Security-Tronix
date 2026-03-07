const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: {
    name: 'unmute',
    description: 'Unmutes a user in this channel',
    options: [
      {
        name: 'user',
        description: 'The user you want to unmute',
        type: 6, // USER type
        required: true,
      },
    ],
  },
  async execute(interaction) {
    const getText = (key) => interaction.client.getText(interaction.guild.id, key);

    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: getText('admin_only'),
        ephemeral: true
      });
    }

    const usuario = interaction.options.getUser('user');
    const miembro = interaction.guild.members.cache.get(usuario.id);

    if (!miembro) {
      return await interaction.reply({
        content: '❌ ' + (getText('admin_only').includes('Solo') ? 'No se pudo encontrar ese usuario en el servidor.' : 'Could not find that user on the server.'),
        ephemeral: true
      });
    }

    try {
      await interaction.channel.permissionOverwrites.delete(miembro);

      const mutedRoleId = '1478237207885119672';
      const mutedRole = interaction.guild.roles.cache.get(mutedRoleId);
      
      if (mutedRole && miembro.roles.cache.has(mutedRoleId)) {
        await miembro.roles.remove(mutedRole);
      }

      await interaction.reply({
        embeds: [{
          title: getText('user_unmuted'),
          description: `${usuario} ${getText('user_unmuted_desc')}`,
          fields: [
            { name: getText('moderator'), value: `${interaction.user}` },
          ],
          color: 0x57F287,
          timestamp: new Date(),
        }]
      });
    } catch (error) {
      console.error('Error en desmutear:', error);
      await interaction.reply({
        content: getText('error'),
        ephemeral: true
      });
    }
  },
};
