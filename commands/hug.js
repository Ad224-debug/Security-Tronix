const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: {
    name: 'hug',
    description: 'Give someone a hug',
    options: [
      {
        name: 'user',
        description: 'User to hug',
        type: 6, // USER type
        required: true,
      },
    ],
  },
  async execute(interaction) {
    try {
      const usuario = interaction.options.getUser('user');
      const lang = interaction.client.getLanguage(interaction.guild.id);

      if (usuario.id === interaction.user.id) {
        const selfMsg = lang === 'es' 
          ? '❌ ¡No puedes abrazarte a ti mismo! Aunque todos necesitamos amor propio... 💕'
          : '❌ You cannot hug yourself! Although we all need self-love... 💕';
        return await interaction.reply({
          content: selfMsg,
          ephemeral: true
        });
      }

      const hugGifs = [
        'https://media.tenor.com/SYsRdiK-T7gAAAAC/hug-anime.gif',
        'https://media.tenor.com/tbzuQSodu58AAAAC/oshi-no-ko-onk.gif',
        'https://media.tenor.com/7oCaSR-q1kkAAAAC/alice-vt.gif',
        'https://media.tenor.com/J7eGDvGeP9IAAAAC/enage-kiss-anime-hug.gif',
        'https://media.tenor.com/P-8xYwXoGX0AAAAC/anime-hug-hugs.gif',
      ];

      const randomGif = hugGifs[Math.floor(Math.random() * hugGifs.length)];

      const descriptions = {
        es: [
          `🤗💕 ¡Awww! **${interaction.user.username}** envolvió a **${usuario.username}** en un cálido abrazo! ¡Qué tierno! ✨`,
          `💖 ¡Abrazo grupal! **${interaction.user.username}** le dio un super abrazo a **${usuario.username}**! ¡Momento wholesome! 🥰`,
          `✨🤗 ¡Qué lindo! **${interaction.user.username}** abrazó fuertemente a **${usuario.username}**! ¡Esto es puro amor! 💕`,
          `🫂💖 ¡Momento emotivo! **${interaction.user.username}** le dio un abrazo reconfortante a **${usuario.username}**! 🌟`,
        ],
        en: [
          `🤗💕 Awww! **${interaction.user.username}** wrapped **${usuario.username}** in a warm hug! So sweet! ✨`,
          `💖 Group hug! **${interaction.user.username}** gave **${usuario.username}** a super hug! Wholesome moment! 🥰`,
          `✨🤗 How cute! **${interaction.user.username}** hugged **${usuario.username}** tightly! This is pure love! 💕`,
          `🫂💖 Emotional moment! **${interaction.user.username}** gave **${usuario.username}** a comforting hug! 🌟`,
        ]
      };

      const description = descriptions[lang][Math.floor(Math.random() * descriptions[lang].length)];

      const embed = new EmbedBuilder()
        .setDescription(description)
        .setImage(randomGif)
        .setColor(0xFF69B4)
        .setTimestamp();

      const acceptLabel = lang === 'es' ? '🤗 Devolver abrazo' : '🤗 Hug back';
      const rejectLabel = lang === 'es' ? '❌ Rechazar' : '❌ Reject';

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`hug_accept_${interaction.user.id}_${usuario.id}`)
            .setLabel(acceptLabel)
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`hug_reject_${interaction.user.id}_${usuario.id}`)
            .setLabel(rejectLabel)
            .setStyle(ButtonStyle.Danger)
        );

      await interaction.reply({ 
        embeds: [embed],
        components: [row],
        allowedMentions: { users: [] }
      });

      const filter = i => {
        return i.user.id === usuario.id && 
               (i.customId.startsWith('hug_accept_') || i.customId.startsWith('hug_reject_'));
      };

      const collector = interaction.channel.createMessageComponentCollector({ 
        filter, 
        time: 60000,
        max: 1
      });

      collector.on('collect', async i => {
        try {
          if (i.customId.startsWith('hug_accept_')) {
            const hugBackGifs = [
              'https://media.tenor.com/V8f3qPS23LgAAAAC/ao-sorakado-summer-pockets.gif',
              'https://media.tenor.com/d0AdL1hRqcIAAAAC/high-school-dxd-rias.gif',
              'https://media.tenor.com/4KCRNlvol8AAAAAC/hug-i-m-sorry.gif',
              'https://media.tenor.com/VrYw1wiHs3EAAAAC/kanna-kamui-kanna.gif',
            ];

            const randomHugBack = hugBackGifs[Math.floor(Math.random() * hugBackGifs.length)];

            const hugBackDescriptions = {
              es: [
                `💕✨ ¡DOBLE ABRAZO! **${usuario.username}** le devolvió el abrazo a **${interaction.user.username}** con todo el cariño! ¡Esto es hermoso! 🥰`,
                `🫂💖 ¡Qué emoción! **${usuario.username}** abrazó de vuelta a **${interaction.user.username}**! ¡Amor correspondido! 💕`,
                `✨🤗 ¡Momento mágico! **${usuario.username}** devolvió el abrazo a **${interaction.user.username}** con el doble de fuerza! 🌟`,
              ],
              en: [
                `💕✨ DOUBLE HUG! **${usuario.username}** hugged **${interaction.user.username}** back with all the love! This is beautiful! 🥰`,
                `🫂💖 So emotional! **${usuario.username}** hugged **${interaction.user.username}** back! Love returned! 💕`,
                `✨🤗 Magical moment! **${usuario.username}** hugged **${interaction.user.username}** back twice as hard! 🌟`,
              ]
            };

            const hugBackDesc = hugBackDescriptions[lang][Math.floor(Math.random() * hugBackDescriptions[lang].length)];

            const hugBackEmbed = new EmbedBuilder()
              .setDescription(hugBackDesc)
              .setImage(randomHugBack)
              .setColor(0xFF1493)
              .setTimestamp();

            await i.update({ 
              embeds: [embed, hugBackEmbed], 
              components: [],
              allowedMentions: { users: [] }
            });
          } else if (i.customId.startsWith('hug_reject_')) {
            const rejectGifs = [
              'https://media.tenor.com/-DlZlNxVMnIAAAAC/hmpf.gif',
              'https://media.tenor.com/vYKBcl-EwKgAAAAC/shiroi-suna-no-aquatope-the-aquatope-on-white-sand.gif',
              'https://media.tenor.com/fMSMIlEjSoMAAAAC/refuse-head-shake.gif',
              'https://media.tenor.com/WJSK7B_oIHsAAAAC/no-anime.gif',
            ];

            const randomReject = rejectGifs[Math.floor(Math.random() * rejectGifs.length)];

            const rejectDescriptions = {
              es: [
                `💔 ¡Auch! **${usuario.username}** rechazó el abrazo de **${interaction.user.username}**... ¡Qué frío! 😢`,
                `😢 ¡Noooo! **${usuario.username}** no quiso el abrazo de **${interaction.user.username}**... ¡Momento triste! 💔`,
                `💔😭 ¡Corazón roto! **${usuario.username}** le dijo que no al abrazo de **${interaction.user.username}**... F en el chat`,
              ],
              en: [
                `💔 Ouch! **${usuario.username}** rejected **${interaction.user.username}**'s hug... So cold! 😢`,
                `😢 Noooo! **${usuario.username}** didn't want **${interaction.user.username}**'s hug... Sad moment! 💔`,
                `💔😭 Heartbroken! **${usuario.username}** said no to **${interaction.user.username}**'s hug... F in the chat`,
              ]
            };

            const rejectDesc = rejectDescriptions[lang][Math.floor(Math.random() * rejectDescriptions[lang].length)];

            const rejectEmbed = new EmbedBuilder()
              .setDescription(rejectDesc)
              .setImage(randomReject)
              .setColor(0x808080)
              .setTimestamp();

            await i.update({ 
              embeds: [embed, rejectEmbed], 
              components: [],
              allowedMentions: { users: [] }
            });
          }
        } catch (error) {
          console.error('Error en collector de hug:', error);
        }
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          interaction.editReply({ components: [] }).catch(() => {});
        }
      });
    } catch (error) {
      console.error('Error en comando hug:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Hubo un error al ejecutar este comando.',
          ephemeral: true
        }).catch(console.error);
      }
    }
  },
};
