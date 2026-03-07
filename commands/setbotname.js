const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setbotname')
    .setDescription('Cambia el nombre del bot (Owner only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Nuevo nombre para el bot')
        .setRequired(true)
        .setMinLength(2)
        .setMaxLength(32)),

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

    const newName = interaction.options.getString('name');
    const oldName = interaction.client.user.username;

    await interaction.deferReply({ ephemeral: true });

    try {
      // Cambiar el nombre del bot
      await interaction.client.user.setUsername(newName);

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Nombre del Bot Actualizado')
        .setDescription(lang === 'es'
          ? `El nombre del bot ha sido cambiado exitosamente.`
          : `The bot's name has been changed successfully.`)
        .setColor(0x57F287)
        .addFields(
          { name: lang === 'es' ? '📝 Nombre anterior' : '📝 Previous name', value: oldName, inline: true },
          { name: lang === 'es' ? '✨ Nombre nuevo' : '✨ New name', value: newName, inline: true },
          { name: lang === 'es' ? '👤 Cambiado por' : '👤 Changed by', value: interaction.user.tag, inline: false }
        )
        .setFooter({ 
          text: lang === 'es' 
            ? '⚠️ Solo puedes cambiar el nombre 2 veces por hora' 
            : '⚠️ You can only change the name 2 times per hour' 
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Error changing bot name:', error);

      let errorMessage = error.message;
      
      // Mensajes de error específicos
      if (error.code === 50035) {
        errorMessage = lang === 'es'
          ? 'El nombre debe tener entre 2 y 32 caracteres.'
          : 'The name must be between 2 and 32 characters.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = lang === 'es'
          ? 'Has alcanzado el límite de cambios de nombre. Solo puedes cambiar el nombre 2 veces por hora.'
          : 'You have reached the name change limit. You can only change the name 2 times per hour.';
      }

      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Error al Cambiar Nombre')
        .setDescription(lang === 'es'
          ? `No se pudo cambiar el nombre del bot:\n\`\`\`${errorMessage}\`\`\``
          : `Could not change the bot's name:\n\`\`\`${errorMessage}\`\`\``)
        .setColor(0xED4245)
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};
