const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: 'announce',
    description: 'Sends an announcement to a channel',
    options: [
      {
        name: 'channel',
        description: 'Channel to send the announcement',
        type: 7, // CHANNEL type
        required: true,
      },
      {
        name: 'title',
        description: 'Announcement title',
        type: 3, // STRING type
        required: true,
      },
      {
        name: 'message',
        description: 'Announcement message',
        type: 3, // STRING type
        required: true,
      },
      {
        name: 'color',
        description: 'Embed color (hex code)',
        type: 3, // STRING type
        required: false,
      },
      {
        name: 'mention',
        description: 'Mention everyone?',
        type: 5, // BOOLEAN type
        required: false,
      },
    ],
  },
  async execute(interaction) {
    const getText = (key) => interaction.client.getText(interaction.guild.id, key);

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return await interaction.reply({
        content: getText('no_permission'),
        ephemeral: true
      });
    }

    const channel = interaction.options.getChannel('channel');
    const title = interaction.options.getString('title');
    const message = interaction.options.getString('message');
    const colorHex = interaction.options.getString('color') || '5865F2';
    const mention = interaction.options.getBoolean('mention') || false;

    let color;
    try {
      color = parseInt(colorHex.replace('#', ''), 16);
    } catch {
      color = 0x5865F2;
    }

    const embed = new EmbedBuilder()
      .setTitle(`${getText('announce_title')} ${title}`)
      .setDescription(message)
      .setColor(color)
      .setFooter({ text: `${getText('moderator')}: ${interaction.user.username}` })
      .setTimestamp();

    try {
      await channel.send({
        content: mention ? '@everyone' : null,
        embeds: [embed]
      });

      await interaction.reply({
        embeds: [{
          title: getText('announce_sent'),
          description: getText('announce_sent_desc'),
          fields: [
            { name: 'Canal', value: `${channel}` },
          ],
          color: 0x57F287,
        }],
        ephemeral: true
      });
    } catch (error) {
      await interaction.reply({
        content: getText('error'),
        ephemeral: true
      });
    }
  },
};
