const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: {
    name: 'slap',
    description: 'Slap someone',
    options: [
      {
        name: 'user',
        description: 'User to slap',
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
          ? '❌ ¡No puedes abofetearte a ti mismo! Eso sería raro...'
          : '❌ You cannot slap yourself! That would be weird...';
        return await interaction.reply({
          content: selfMsg,
          ephemeral: true
        });
      }

      const slapGifs = [
        'https://media.tenor.com/eU5H6GbVjrcAAAAC/slap-jjk.gif',
        'https://media.tenor.com/Ws6Dm1ZW_vMAAAAC/girl-slap.gif',
        'https://media.tenor.com/nVvUhW4FBxcAAAAC/slap.gif',
        'https://media.tenor.com/Sv8LQZAoQmgAAAAC/chainsaw-man-csm.gif',
        'https://media.tenor.com/E3OW-MYYum0AAAAC/no-angry.gif',
      ];

      const randomIndex = Math.floor(Math.random() * slapGifs.length);
      const randomGif = slapGifs[randomIndex];

      const descriptions = {
        es: [
          `💥 ¡PAM! **${interaction.user.username}** le dio tremenda cachetada a **${usuario.username}**! ¡Eso debió doler! 😤`,
          `👋💢 ¡ZAAAS! **${interaction.user.username}** abofeteó a **${usuario.username}**! ¡Qué salvaje! 😱`,
          `✋💥 ¡PLAF! **${interaction.user.username}** le plantó una cachetada épica a **${usuario.username}**! 🔥`,
          `💢 ¡SMACK! **${interaction.user.username}** no se aguantó y le dio un sopapo a **${usuario.username}**! 😤`,
        ],
        en: [
          `💥 SMACK! **${interaction.user.username}** slapped **${usuario.username}** hard! That must've hurt! 😤`,
          `👋💢 WHACK! **${interaction.user.username}** slapped **${usuario.username}**! How savage! 😱`,
          `✋💥 SLAP! **${interaction.user.username}** gave **${usuario.username}** an epic slap! 🔥`,
          `💢 SMACK! **${interaction.user.username}** couldn't hold back and slapped **${usuario.username}**! 😤`,
        ]
      };

      const randomDesc = descriptions[lang][Math.floor(Math.random() * descriptions[lang].length)];

      const embed = new EmbedBuilder()
        .setDescription(randomDesc)
        .setImage(randomGif)
        .setColor(0xFF4500)
        .setTimestamp();

      const revengeLabel = lang === 'es' ? '😤 Devolver cachetada' : '😤 Slap back';

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`slap_revenge_${interaction.user.id}_${usuario.id}_${randomIndex}`)
            .setLabel(revengeLabel)
            .setStyle(ButtonStyle.Danger)
        );

      await interaction.reply({ 
        embeds: [embed],
        components: [row],
        allowedMentions: { users: [] }
      });

      const filter = i => {
        return i.user.id === usuario.id && i.customId.startsWith('slap_revenge_');
      };

      const collector = interaction.channel.createMessageComponentCollector({ 
        filter, 
        time: 60000,
        max: 1
      });

      collector.on('collect', async i => {
        try {
          if (i.customId.startsWith('slap_revenge_')) {
            const usedIndex = parseInt(i.customId.split('_')[4]);
            const availableGifs = slapGifs.filter((_, index) => index !== usedIndex);
            const randomSlapBack = availableGifs[Math.floor(Math.random() * availableGifs.length)];

            const revengeDescriptions = {
              es: [
                `💥💢 ¡CONTRAATAQUE! **${usuario.username}** le devolvió la cachetada a **${interaction.user.username}** con el doble de fuerza! ¡VENGANZA! 😈`,
                `👊💥 ¡OJO POR OJO! **${usuario.username}** no se quedó callado y le plantó tremenda cachetada de vuelta a **${interaction.user.username}**! 🔥`,
                `💢✋ ¡REVANCHA! **${usuario.username}** contraatacó y le dio un sopapo épico a **${interaction.user.username}**! ¡Nadie se mete con él/ella! 😤`,
              ],
              en: [
                `💥💢 COUNTERATTACK! **${usuario.username}** slapped **${interaction.user.username}** back twice as hard! REVENGE! 😈`,
                `👊💥 EYE FOR AN EYE! **${usuario.username}** didn't stay quiet and slapped **${interaction.user.username}** right back! 🔥`,
                `💢✋ PAYBACK! **${usuario.username}** counterattacked with an epic slap to **${interaction.user.username}**! Nobody messes with them! 😤`,
              ]
            };

            const randomRevengeDesc = revengeDescriptions[lang][Math.floor(Math.random() * revengeDescriptions[lang].length)];

            const slapBackEmbed = new EmbedBuilder()
              .setDescription(randomRevengeDesc)
              .setImage(randomSlapBack)
              .setColor(0xDC143C)
              .setTimestamp();

            await i.update({ 
              embeds: [embed, slapBackEmbed], 
              components: [],
              allowedMentions: { users: [] }
            });
          }
        } catch (error) {
          console.error('Error en collector de slap:', error);
        }
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          interaction.editReply({ components: [] }).catch(() => {});
        }
      });
    } catch (error) {
      console.error('Error en comando slap:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Hubo un error al ejecutar este comando.',
          ephemeral: true
        }).catch(console.error);
      }
    }
  },
};
