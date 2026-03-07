const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: 'cry',
    description: 'Show that you are crying',
  },
  async execute(interaction) {
    try {
      const lang = interaction.client.getLanguage(interaction.guild.id);

      const cryGifs = [
        'https://media.giphy.com/media/ROF8OQvDmxytW/giphy.gif',
        'https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif',
        'https://media.giphy.com/media/L95W4wv8nnb9K/giphy.gif',
        'https://media.giphy.com/media/OPU6wzx8JrHna/giphy.gif',
        'https://media.giphy.com/media/ISOckXUybVfQ4/giphy.gif',
      ];

      const randomGif = cryGifs[Math.floor(Math.random() * cryGifs.length)];

      const descriptions = {
        es: [
          `😢💔 ¡Aww! **${interaction.user.username}** está llorando... ¡Alguien dele un abrazo! 🥺`,
          `😭 ¡Noooo! **${interaction.user.username}** está triste... ¡Momento emotivo! 💔`,
          `🥺💧 **${interaction.user.username}** está llorando... ¡Necesita apoyo! 😢`,
          `😢✨ **${interaction.user.username}** derramó algunas lágrimas... ¡Todo estará bien! 💕`,
        ],
        en: [
          `😢💔 Aww! **${interaction.user.username}** is crying... Someone give them a hug! 🥺`,
          `😭 Noooo! **${interaction.user.username}** is sad... Emotional moment! 💔`,
          `🥺💧 **${interaction.user.username}** is crying... They need support! 😢`,
          `😢✨ **${interaction.user.username}** shed some tears... Everything will be okay! 💕`,
        ]
      };

      const description = descriptions[lang][Math.floor(Math.random() * descriptions[lang].length)];

      const embed = new EmbedBuilder()
        .setDescription(description)
        .setImage(randomGif)
        .setColor(0x4682B4)
        .setTimestamp();

      await interaction.reply({ 
        embeds: [embed],
        allowedMentions: { users: [] }
      });
    } catch (error) {
      console.error('Error en comando cry:', error);
      await interaction.reply({
        content: '❌ Hubo un error al ejecutar este comando.',
        ephemeral: true
      }).catch(console.error);
    }
  },
};
