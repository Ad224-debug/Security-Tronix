const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: {
    name: 'mute',
    description: 'Mutes a user in this channel',
    options: [
      {
        name: 'user',
        description: 'The user you want to mute',
        type: 6, // USER type
        required: true,
      },
      {
        name: 'reason',
        description: 'Reason for the mute',
        type: 3, // STRING type
        required: false,
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
    const razon = interaction.options.getString('reason') || (getText('afk_reason') === '📝 Razón' ? 'No especificada' : 'Not specified');

    if (!miembro) {
      return await interaction.reply({
        content: '❌ ' + (getText('admin_only').includes('Solo') ? 'No se pudo encontrar ese usuario en el servidor.' : 'Could not find that user on the server.'),
        ephemeral: true
      });
    }

    try {
      await interaction.channel.permissionOverwrites.create(miembro, {
        SendMessages: false,
      });

      const mutedRoleId = '1478237207885119672';
      const mutedRole = interaction.guild.roles.cache.get(mutedRoleId);
      
      if (mutedRole) {
        await miembro.roles.add(mutedRole);
      }

      await interaction.reply({
        embeds: [{
          title: getText('user_muted'),
          description: `${usuario} ${getText('user_muted_desc')}`,
          fields: [
            { name: getText('afk_reason'), value: razon },
            { name: getText('moderator'), value: `${interaction.user}` },
          ],
          color: 0xED4245,
          timestamp: new Date(),
        }]
      });
    } catch (error) {
      console.error('Error en mutear:', error);
      await interaction.reply({
        content: getText('error'),
        ephemeral: true
      });
    }
  },
};
