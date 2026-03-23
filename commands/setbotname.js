const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setbotname')
    .setDescription('Cambia el apodo del bot en este servidor (Owner only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Nuevo apodo para el bot (vacío para resetear)')
        .setRequired(false)
        .setMinLength(1)
        .setMaxLength(32)),

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

    const newNick = interaction.options.getString('name') ?? null;
    const oldNick = interaction.guild.members.me.nickname ?? interaction.client.user.username;

    await interaction.deferReply({ ephemeral: true });

    try {
      // Cambia solo el nickname en este servidor, no el nombre global del bot
      await interaction.guild.members.me.setNickname(newNick);

      const embed = new EmbedBuilder()
        .setTitle('✅ Apodo del Bot Actualizado')
        .setColor(0x57F287)
        .addFields(
          { name: lang === 'es' ? '📝 Anterior' : '📝 Previous', value: oldNick, inline: true },
          { name: lang === 'es' ? '✨ Nuevo' : '✨ New', value: newNick ?? interaction.client.user.username, inline: true },
          { name: lang === 'es' ? '👤 Cambiado por' : '👤 Changed by', value: `${interaction.user}`, inline: false }
        )
        .setFooter({ text: lang === 'es' ? 'Solo afecta a este servidor' : 'Only affects this server' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error changing bot nickname:', error);
      await interaction.editReply({
        content: lang === 'es'
          ? `❌ No se pudo cambiar el apodo: \`${error.message}\``
          : `❌ Could not change nickname: \`${error.message}\``
      });
    }
  },
};
