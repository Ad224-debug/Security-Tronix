const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setbotavatar')
    .setDescription('Cambia el avatar del bot en este servidor (Owner only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addAttachmentOption(option =>
      option.setName('image')
        .setDescription('Nueva imagen para el avatar del bot en este servidor')
        .setRequired(true)),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);

    if (interaction.user.id !== interaction.guild.ownerId) {
      return interaction.reply({
        content: lang === 'es'
          ? '❌ Solo el dueño del servidor puede usar este comando.'
          : '❌ Only the server owner can use this command.',
        ephemeral: true
      });
    }

    const attachment = interaction.options.getAttachment('image');

    if (!attachment.contentType?.startsWith('image/')) {
      return interaction.reply({
        content: lang === 'es'
          ? '❌ El archivo debe ser una imagen (PNG, JPG, GIF, etc.)'
          : '❌ The file must be an image (PNG, JPG, GIF, etc.)',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      // Cambia el avatar solo en este servidor usando guild avatar
      await interaction.guild.members.me.edit({ avatar: attachment.url });

      const embed = new EmbedBuilder()
        .setTitle('✅ Avatar del Bot Actualizado')
        .setDescription(lang === 'es'
          ? 'El avatar del bot fue cambiado solo en este servidor.'
          : 'The bot avatar was changed only in this server.')
        .setColor(0x57F287)
        .setThumbnail(interaction.guild.members.me.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: lang === 'es' ? '👤 Cambiado por' : '👤 Changed by', value: `${interaction.user}`, inline: true }
        )
        .setFooter({ text: lang === 'es' ? 'Solo afecta a este servidor' : 'Only affects this server' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error changing bot guild avatar:', error);

      // Guild avatars requieren Nitro en el bot — informar claramente
      const isNitroError = error.code === 50035 || error.message?.includes('avatar');
      await interaction.editReply({
        content: lang === 'es'
          ? `❌ No se pudo cambiar el avatar: \`${isNitroError ? 'El bot necesita Nitro para tener avatares por servidor.' : error.message}\``
          : `❌ Could not change avatar: \`${isNitroError ? 'Bot needs Nitro to have per-server avatars.' : error.message}\``
      });
    }
  },
};
