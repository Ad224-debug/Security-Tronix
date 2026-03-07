const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: {
    name: 'lock',
    description: 'Locks the channel (only moderators can write)',
  },
  async execute(interaction) {
    const getText = (key) => interaction.client.getText(interaction.guild.id, key);

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return await interaction.reply({
        content: getText('no_permission'),
        ephemeral: true
      });
    }

    try {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: false,
      });

      await interaction.reply({
        embeds: [{
          title: getText('lock_channel'),
          description: getText('lock_channel_desc'),
          fields: [
            { name: getText('moderator'), value: `${interaction.user}` },
          ],
          color: 0xED4245,
          timestamp: new Date(),
        }]
      });
    } catch (error) {
      await interaction.reply({
        content: getText('error'),
        ephemeral: true
      });
    }
  },
};
