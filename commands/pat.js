const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: 'pat',
    description: 'Pat someone on the head',
    options: [
      {
        name: 'user',
        description: 'User to pat',
        type: 6, // USER type
        required: true,
      },
    ],
  },
  async execute(interaction) {
    try {
      // Verificar que sea un comando slash
      if (!interaction.isChatInputCommand || !interaction.isChatInputCommand()) {
        return;
      }

      const usuario = interaction.options.getUser('user');
      const lang = interaction.client.getLanguage(interaction.guild.id);

    if (usuario.id === interaction.user.id) {
      const selfMsg = lang === 'es' 
        ? '❌ ¡No puedes acariciarte a ti mismo! Bueno... técnicamente sí, pero sería extraño aquí...'
        : '❌ You cannot pat yourself! Well... technically you can, but it would be weird here...';
      return await interaction.reply({
        content: selfMsg,
        ephemeral: true
      });
    }

    const patGifs = [
      'https://media.tenor.com/rtHwrLRPlAkAAAAC/class-no-daikirai-na-joshi-to-kekkon-suru-koto-ni-natta-i-m-getting-married-to-a-girl-i-hate-in-my-class.gif',
      'https://media.tenor.com/MDc4TSck5PQAAAAC/frieren-anime.gif',
      'https://media.tenor.com/TJfdUVQ-7MgAAAAC/spyxfamily-anya-forger.gif',
      'https://media.tenor.com/OvrmH29V-44AAAAC/pat.gif',
      'https://media.tenor.com/Myi3a3NLehYAAAAC/gato-pato.gif',
    ];

    const randomGif = patGifs[Math.floor(Math.random() * patGifs.length)];

    const descriptions = {
      es: [
        `✨ ¡Awww! **${interaction.user.username}** acarició tiernamente la cabeza de **${usuario.username}**! ¡Qué lindo momento! 🥰`,
        `💕 ¡Pat pat! **${interaction.user.username}** le dio palmaditas adorables a **${usuario.username}**! ¡Tan wholesome! 😊`,
        `🌟 ¡Qué ternura! **${interaction.user.username}** mimó a **${usuario.username}** con cariñosas palmaditas! ¡Aww! 💖`,
        `✨💕 ¡Momento precioso! **${interaction.user.username}** acarició suavemente a **${usuario.username}**! ¡Esto derrite corazones! 🥺`,
      ],
      en: [
        `✨ Awww! **${interaction.user.username}** gently patted **${usuario.username}**'s head! What a sweet moment! 🥰`,
        `💕 Pat pat! **${interaction.user.username}** gave **${usuario.username}** adorable head pats! So wholesome! 😊`,
        `🌟 How cute! **${interaction.user.username}** pampered **${usuario.username}** with loving pats! Aww! 💖`,
        `✨💕 Precious moment! **${interaction.user.username}** softly patted **${usuario.username}**! This melts hearts! 🥺`,
      ]
    };

    const randomDesc = descriptions[lang][Math.floor(Math.random() * descriptions[lang].length)];

    const embed = new EmbedBuilder()
      .setDescription(randomDesc)
      .setImage(randomGif)
      .setColor(0xFFB6C1)
      .setTimestamp();

    await interaction.reply({ 
      embeds: [embed],
      allowedMentions: { users: [] }
    });
    } catch (error) {
      console.error('Error en comando pat:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Hubo un error al ejecutar este comando.',
          ephemeral: true
        }).catch(console.error);
      }
    }
  },
};
