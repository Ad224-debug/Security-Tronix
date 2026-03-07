const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('User ID to unban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for unbanning')
        .setRequired(false)),

  async execute(interaction) {
    try {
      const getText = (key) => interaction.client.getText(interaction.guild.id, key);
      
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return await interaction.reply({
          content: getText('admin_only'),
          ephemeral: true
        });
      }

      const userId = interaction.options.getString('userid');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const lang = interaction.client.getLanguage(interaction.guild.id);

      await interaction.guild.members.unban(userId, reason);

      const title = lang === 'es' ? '🔓 Usuario Desbaneado' : '🔓 User Unbanned';
      const userField = lang === 'es' ? 'ID de Usuario' : 'User ID';
      const reasonField = lang === 'es' ? 'Razón' : 'Reason';
      const moderatorField = lang === 'es' ? 'Moderador' : 'Moderator';

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(0x00FF00)
        .addFields(
          { name: userField, value: userId, inline: true },
          { name: reasonField, value: reason, inline: false },
          { name: moderatorField, value: `${interaction.user.tag}`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando unban:', error);
      const lang = interaction.client.getLanguage(interaction.guild.id);
      const msg = lang === 'es'
        ? '❌ No se pudo desbanear al usuario. Verifica que el ID sea correcto y que el usuario esté baneado.'
        : '❌ Could not unban user. Check that the ID is correct and the user is banned.';
      await interaction.reply({
        content: msg,
        ephemeral: true
      }).catch(console.error);
    }
  },
};
