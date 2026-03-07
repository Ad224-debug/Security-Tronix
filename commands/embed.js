const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: 'embed',
    description: 'Create a custom embed message',
    options: [
      {
        name: 'title',
        description: 'Embed title',
        type: 3, // STRING type
        required: true,
      },
      {
        name: 'description',
        description: 'Embed description',
        type: 3, // STRING type
        required: true,
      },
      {
        name: 'color',
        description: 'Embed color in hex (e.g., #FF0000 for red)',
        type: 3, // STRING type
        required: false,
      },
      {
        name: 'image',
        description: 'Image URL',
        type: 3, // STRING type
        required: false,
      },
      {
        name: 'thumbnail',
        description: 'Thumbnail URL',
        type: 3, // STRING type
        required: false,
      },
      {
        name: 'footer',
        description: 'Footer text',
        type: 3, // STRING type
        required: false,
      },
    ],
  },
  async execute(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        const lang = interaction.client.getLanguage(interaction.guild.id);
        const msg = lang === 'es' 
          ? '❌ No tienes permisos para gestionar mensajes.'
          : '❌ You don\'t have permission to manage messages.';
        return await interaction.reply({
          content: msg,
          ephemeral: true
        });
      }

      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description');
      const colorHex = interaction.options.getString('color');
      const image = interaction.options.getString('image');
      const thumbnail = interaction.options.getString('thumbnail');
      const footer = interaction.options.getString('footer');

      let color = 0x5865F2; // Discord blurple default
      if (colorHex) {
        const hex = colorHex.replace('#', '');
        if (/^[0-9A-F]{6}$/i.test(hex)) {
          color = parseInt(hex, 16);
        }
      }

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp();

      if (image) embed.setImage(image);
      if (thumbnail) embed.setThumbnail(thumbnail);
      if (footer) embed.setFooter({ text: footer });

      await interaction.channel.send({ embeds: [embed] });

      const lang = interaction.client.getLanguage(interaction.guild.id);
      const msg = lang === 'es' 
        ? '✅ Embed creado exitosamente.'
        : '✅ Embed created successfully.';
      
      await interaction.reply({
        content: msg,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error en comando embed:', error);
      await interaction.reply({
        content: '❌ Hubo un error al ejecutar este comando.',
        ephemeral: true
      }).catch(console.error);
    }
  },
};
