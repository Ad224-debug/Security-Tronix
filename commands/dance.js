const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: 'dance',
    description: 'Dance with someone',
    options: [
      {
        name: 'user',
        description: 'User to dance with',
        type: 6, // USER type
        required: false,
      },
    ],
  },
  async execute(interaction) {
    try {
      const usuario = interaction.options.getUser('user');
      const lang = interaction.client.getLanguage(interaction.guild.id);

      const danceGifs = [
        'https://media.tenor.com/g3T6Du7fTnoAAAAC/dance-moves.gif',
        'https://media.tenor.com/cfLmJVoxuw0AAAAC/dog-dance.gif',
        'https://media.tenor.com/y8XLIk_9IWUAAAAC/black-kid-blue-shirt-dancing.gif',
        'https://images-ext-1.discordapp.net/external/0-08CZVvdbaY7gQqqJpQYLk0QxFDBMU7QheuNxpGyMw/https/media.tenor.com/XOBIokmyuTMAAAAC/dance.gif',
      ];

      const randomGif = danceGifs[Math.floor(Math.random() * danceGifs.length)];

      let descriptions;
      if (usuario) {
        descriptions = {
          es: [
            `💃🕺 ¡A bailar! **${interaction.user.username}** está bailando con **${usuario.username}**! ¡Qué ritmo! 🎵`,
            `🎶✨ ¡Fiesta! **${interaction.user.username}** y **${usuario.username}** están bailando juntos! ¡Esto es épico! 💃`,
            `🕺💫 ¡Baile grupal! **${interaction.user.username}** invitó a **${usuario.username}** a bailar! ¡Qué movimientos! 🎉`,
            `💃🎵 ¡Momento musical! **${interaction.user.username}** está bailando con **${usuario.username}**! ¡La pista es suya! ✨`,
          ],
          en: [
            `💃🕺 Let's dance! **${interaction.user.username}** is dancing with **${usuario.username}**! What rhythm! 🎵`,
            `🎶✨ Party time! **${interaction.user.username}** and **${usuario.username}** are dancing together! This is epic! 💃`,
            `🕺💫 Group dance! **${interaction.user.username}** invited **${usuario.username}** to dance! What moves! 🎉`,
            `💃🎵 Musical moment! **${interaction.user.username}** is dancing with **${usuario.username}**! The floor is theirs! ✨`,
          ]
        };
      } else {
        descriptions = {
          es: [
            `💃✨ ¡Solo dance! **${interaction.user.username}** está bailando como si nadie estuviera mirando! 🎵`,
            `🕺🎶 ¡Qué ritmo! **${interaction.user.username}** se lanzó a la pista de baile! ¡Puro estilo! 💫`,
            `💃🔥 ¡Momento épico! **${interaction.user.username}** está bailando con todo! ¡La pista arde! 🎉`,
            `🕺✨ ¡Baile libre! **${interaction.user.username}** está mostrando sus mejores pasos! 💃`,
          ],
          en: [
            `💃✨ Solo dance! **${interaction.user.username}** is dancing like nobody's watching! 🎵`,
            `🕺🎶 What rhythm! **${interaction.user.username}** hit the dance floor! Pure style! 💫`,
            `💃🔥 Epic moment! **${interaction.user.username}** is dancing with everything! The floor is on fire! 🎉`,
            `🕺✨ Free dance! **${interaction.user.username}** is showing their best moves! 💃`,
          ]
        };
      }

      const description = descriptions[lang][Math.floor(Math.random() * descriptions[lang].length)];

      const embed = new EmbedBuilder()
        .setDescription(description)
        .setImage(randomGif)
        .setColor(0x9370DB)
        .setTimestamp();

      await interaction.reply({ 
        embeds: [embed],
        allowedMentions: { users: [] }
      });
    } catch (error) {
      console.error('Error en comando dance:', error);
      await interaction.reply({
        content: '❌ Hubo un error al ejecutar este comando.',
        ephemeral: true
      }).catch(console.error);
    }
  },
};
