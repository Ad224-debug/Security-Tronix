const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: {
    name: 'slowmode',
    description: 'Sets slowmode for the channel',
    options: [
      {
        name: 'seconds',
        description: 'Seconds between messages (0 to disable)',
        type: 4, // INTEGER type
        required: true,
        min_value: 0,
        max_value: 21600, // 6 hours max
      },
    ],
  },
  async execute(interaction) {
    const getText = (key) => interaction.client.getText(interaction.guild.id, key);

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return await interaction.reply({
        content: getText('no_permission'),
        ephemeral: true
      });
    }

    const seconds = interaction.options.getInteger('seconds');

    try {
      await interaction.channel.setRateLimitPerUser(seconds);

      if (seconds === 0) {
        await interaction.reply({
          embeds: [{
            title: getText('slowmode_disabled'),
            description: getText('slowmode_disabled_desc'),
            color: 0x57F287,
            timestamp: new Date(),
          }]
        });
      } else {
        const description = getText('slowmode_set_desc').replace('{time}', seconds);
        await interaction.reply({
          embeds: [{
            title: getText('slowmode_set'),
            description: description,
            fields: [
              { name: getText('moderator'), value: `${interaction.user}` },
            ],
            color: 0x5865F2,
            timestamp: new Date(),
          }]
        });
      }
    } catch (error) {
      await interaction.reply({
        content: getText('error'),
        ephemeral: true
      });
    }
  },
};
