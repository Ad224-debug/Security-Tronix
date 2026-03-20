const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setbotavatar')
    .setDescription('Cambia el avatar del bot (Owner only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addAttachmentOption(option =>
      option.setName('image')
        .setDescription('Nueva imagen para el avatar del bot')
        .setRequired(true)),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);

    // Solo el owner puede usar este comando
    if (interaction.user.id !== interaction.guild.ownerId) {
      return await interaction.reply({
        content: lang === 'es' 
          ? '❌ Solo el dueño del servidor puede usar este comando.'
          : '❌ Only the server owner can use this command.',
        ephemeral: true
      });
    }

    const attachment = interaction.options.getAttachment('image');

    // Verificar que sea una imagen
    if (!attachment.contentType || !attachment.contentType.startsWith('image/')) {
      return await interaction.reply({
        content: lang === 'es'
          ? '❌ El archivo debe ser una imagen (PNG, JPG, GIF, etc.)'
          : '❌ The file must be an image (PNG, JPG, GIF, etc.)',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      // Cambiar el avatar del bot
      await interaction.client.user.setAvatar(attachment.url);

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Avatar del Bot Actualizado')
        .setDescription(lang === 'es'
          ? `El avatar del bot ha sido cambiado exitosamente.`
          : `The bot's avatar has been changed successfully.`)
        .setColor(0x57F287)
        .setThumbnail(interaction.client.user.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: lang === 'es' ? '👤 Cambiado por' : '👤 Changed by', value: interaction.user.tag, inline: true }
        )
        .setFooter({ 
          text: lang === 'es' 
            ? '⚠️ Solo puedes cambiar el avatar 2 veces por hora' 
            : '⚠️ You can only change the avatar 2 times per hour' 
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Error changing bot avatar:', error);

      let errorMessage = error.message;
      
      // Mensajes de error específicos
      if (error.message.includes('rate limit')) {
        errorMessage = lang === 'es'
          ? 'Has alcanzado el límite de cambios de avatar. Solo puedes cambiar el avatar 2 veces por hora.'
          : 'You have reached the avatar change limit. You can only change the avatar 2 times per hour.';
      } else if (error.code === 50035) {
        errorMessage = lang === 'es'
          ? 'La imagen no es válida o es demasiado grande. Usa una imagen de menos de 8MB.'
          : 'The image is invalid or too large. Use an image under 8MB.';
      }

      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Error al Cambiar Avatar')
        .setDescription(lang === 'es'
          ? `No se pudo cambiar el avatar del bot:\n\`\`\`${errorMessage}\`\`\``
          : `Could not change the bot's avatar:\n\`\`\`${errorMessage}\`\`\``)
        .setColor(0xED4245)
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};
