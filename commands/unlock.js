const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: {
    name: 'unlock',
    description: 'Unlocks the channel (everyone can write)',
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
        SendMessages: null,
      });

      await interaction.reply({
        embeds: [{
          title: getText('unlock_channel'),
          description: getText('unlock_channel_desc'),
          fields: [
            { name: getText('moderator'), value: `${interaction.user}` },
          ],
          color: 0x57F287,
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
