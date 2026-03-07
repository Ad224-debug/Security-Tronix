const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: {
    name: 'kiss',
    description: 'Give someone a kiss',
    options: [
      {
        name: 'user',
        description: 'User to kiss',
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
          ? '❌ ¡No puedes besarte a ti mismo! Eso sería... interesante pero no... 😅'
          : '❌ You cannot kiss yourself! That would be... interesting but no... 😅';
        return await interaction.reply({
          content: selfMsg,
          ephemeral: true
        });
      }

      const kissGifs = [
        'https://media.tenor.com/cQzRWAWrN6kAAAAC/ichigo-hiro.gif',
        'https://media.tenor.com/WA9iLncZE5MAAAAC/girls-love.gif',
        'https://media.tenor.com/cbIOD1pMlEQAAAAC/mst.gif',
        'https://media.tenor.com/L-NTpww8HTUAAAAC/kiss-anime-anime-kiss.gif',
        'https://media.tenor.com/nRdyrvS3qa4AAAAC/anime-kiss.gif',
      ];

      const randomIndex = Math.floor(Math.random() * kissGifs.length);
      const randomGif = kissGifs[randomIndex];

      const descriptions = {
        es: [
          `😘💕 ¡OMG! **${interaction.user.username}** le dio un beso a **${usuario.username}**! ¡Qué romántico! ✨`,
          `💋💖 ¡Momento épico! **${interaction.user.username}** besó a **${usuario.username}**! ¡El chat está que arde! 🔥`,
          `✨😘 ¡Awww! **${interaction.user.username}** le plantó un beso a **${usuario.username}**! ¡Esto es cine! 🎬`,
          `💕💋 ¡Qué atrevido! **${interaction.user.username}** besó a **${usuario.username}**! ¡Todos están mirando! 👀`,
        ],
        en: [
          `😘💕 OMG! **${interaction.user.username}** kissed **${usuario.username}**! How romantic! ✨`,
          `💋💖 Epic moment! **${interaction.user.username}** kissed **${usuario.username}**! The chat is on fire! 🔥`,
          `✨😘 Awww! **${interaction.user.username}** planted a kiss on **${usuario.username}**! This is cinema! 🎬`,
          `💕💋 How bold! **${interaction.user.username}** kissed **${usuario.username}**! Everyone's watching! 👀`,
        ]
      };

      const description = descriptions[lang][Math.floor(Math.random() * descriptions[lang].length)];

      const embed = new EmbedBuilder()
        .setDescription(description)
        .setImage(randomGif)
        .setColor(0xFF1493)
        .setTimestamp();

      const acceptLabel = lang === 'es' ? '😘 Devolver beso' : '😘 Kiss back';
      const rejectLabel = lang === 'es' ? '❌ Rechazar' : '❌ Reject';

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`kiss_accept_${interaction.user.id}_${usuario.id}_${randomIndex}`)
            .setLabel(acceptLabel)
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`kiss_reject_${interaction.user.id}_${usuario.id}`)
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
               (i.customId.startsWith('kiss_accept_') || i.customId.startsWith('kiss_reject_'));
      };

      const collector = interaction.channel.createMessageComponentCollector({ 
        filter, 
        time: 60000,
        max: 1
      });

      collector.on('collect', async i => {
        try {
          if (i.customId.startsWith('kiss_accept_')) {
            const usedIndex = parseInt(i.customId.split('_')[4]);
            const availableGifs = kissGifs.filter((_, index) => index !== usedIndex);
            const randomKissBack = availableGifs[Math.floor(Math.random() * availableGifs.length)];

            const kissBackDescriptions = {
              es: [
                `💋💕 ¡BESO CORRESPONDIDO! **${usuario.username}** le devolvió el beso a **${interaction.user.username}**! ¡Esto es amor verdadero! 😍`,
                `✨💖 ¡QUÉ ROMÁNTICO! **${usuario.username}** besó de vuelta a **${interaction.user.username}**! ¡El chat explota! 🎆`,
                `😘💕 ¡MOMENTO ÉPICO! **${usuario.username}** devolvió el beso a **${interaction.user.username}** con pasión! ¡CINE PURO! 🎬`,
              ],
              en: [
                `💋💕 KISS RETURNED! **${usuario.username}** kissed **${interaction.user.username}** back! This is true love! 😍`,
                `✨💖 SO ROMANTIC! **${usuario.username}** kissed **${interaction.user.username}** back! The chat explodes! 🎆`,
                `😘💕 EPIC MOMENT! **${usuario.username}** kissed **${interaction.user.username}** back with passion! PURE CINEMA! 🎬`,
              ]
            };

            const kissBackDesc = kissBackDescriptions[lang][Math.floor(Math.random() * kissBackDescriptions[lang].length)];

            const kissBackEmbed = new EmbedBuilder()
              .setDescription(kissBackDesc)
              .setImage(randomKissBack)
              .setColor(0xFF69B4)
              .setTimestamp();

            await i.update({ 
              embeds: [embed, kissBackEmbed], 
              components: [],
              allowedMentions: { users: [] }
            });
          } else if (i.customId.startsWith('kiss_reject_')) {
            const rejectGifs = [
              'https://media.tenor.com/-DlZlNxVMnIAAAAC/hmpf.gif',
              'https://media.tenor.com/vYKBcl-EwKgAAAAC/shiroi-suna-no-aquatope-the-aquatope-on-white-sand.gif',
              'https://media.tenor.com/fMSMIlEjSoMAAAAC/refuse-head-shake.gif',
              'https://media.tenor.com/WJSK7B_oIHsAAAAC/no-anime.gif',
            ];

            const randomReject = rejectGifs[Math.floor(Math.random() * rejectGifs.length)];

            const rejectDescriptions = {
              es: [
                `💔😢 ¡RECHAZADO! **${usuario.username}** esquivó el beso de **${interaction.user.username}**... ¡Eso duele más que un golpe! 😭`,
                `😭💔 ¡Auch! **${usuario.username}** no quiso el beso de **${interaction.user.username}**... ¡Momento incómodo! 😬`,
                `💔 ¡Noooo! **${usuario.username}** rechazó el beso de **${interaction.user.username}**... F por el intento 😢`,
              ],
              en: [
                `💔😢 REJECTED! **${usuario.username}** dodged **${interaction.user.username}**'s kiss... That hurts more than a punch! 😭`,
                `😭💔 Ouch! **${usuario.username}** didn't want **${interaction.user.username}**'s kiss... Awkward moment! 😬`,
                `💔 Noooo! **${usuario.username}** rejected **${interaction.user.username}**'s kiss... F for the attempt 😢`,
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
          console.error('Error en collector de kiss:', error);
        }
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          interaction.editReply({ components: [] }).catch(() => {});
        }
      });
    } catch (error) {
      console.error('Error en comando kiss:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Hubo un error al ejecutar este comando.',
          ephemeral: true
        }).catch(console.error);
      }
    }
  },
};
