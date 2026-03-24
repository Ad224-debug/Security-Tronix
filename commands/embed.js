const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Create a custom embed message')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(o => o.setName('title').setDescription('Embed title').setRequired(true))
    .addStringOption(o => o.setName('description').setDescription('Embed description').setRequired(true))
    .addStringOption(o => o.setName('color').setDescription('Hex color (e.g. #FF0000)'))
    .addStringOption(o => o.setName('image').setDescription('Image URL'))
    .addStringOption(o => o.setName('thumbnail').setDescription('Thumbnail URL'))
    .addStringOption(o => o.setName('footer').setDescription('Footer text')),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const L = (es, en) => lang === 'es' ? es : en;
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const colorHex = interaction.options.getString('color');
    const image = interaction.options.getString('image');
    const thumbnail = interaction.options.getString('thumbnail');
    const footer = interaction.options.getString('footer');

    let color = 0x5865F2;
    if (colorHex) {
      const hex = colorHex.replace('#', '');
      if (/^[0-9A-F]{6}$/i.test(hex)) color = parseInt(hex, 16);
    }

    const embed = new EmbedBuilder().setTitle(title).setDescription(description).setColor(color).setTimestamp();
    if (image) embed.setImage(image);
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (footer) embed.setFooter({ text: footer });

    await interaction.channel.send({ embeds: [embed] });
    await interaction.reply({ content: L('✅ Embed creado.', '✅ Embed created.'), flags: 64 });
  },
};
