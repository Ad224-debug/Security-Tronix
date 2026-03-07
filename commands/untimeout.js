const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Remove timeout from a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to remove timeout')
        .setRequired(true)),

  async execute(interaction) {
    try {
      const getText = (key) => interaction.client.getText(interaction.guild.id, key);
      
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return await interaction.reply({
          content: getText('admin_only'),
          ephemeral: true
        });
      }

      const usuario = interaction.options.getUser('user');
      const member = await interaction.guild.members.fetch(usuario.id);
      const lang = interaction.client.getLanguage(interaction.guild.id);

      if (!member.isCommunicationDisabled()) {
        const msg = lang === 'es'
          ? '❌ Este usuario no está aislado.'
          : '❌ This user is not timed out.';
        return await interaction.reply({
          content: msg,
          ephemeral: true
        });
      }

      await member.timeout(null);

      const title = lang === 'es' ? '✅ Aislamiento Removido' : '✅ Timeout Removed';
      const userField = lang === 'es' ? 'Usuario' : 'User';
      const moderatorField = lang === 'es' ? 'Moderador' : 'Moderator';

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(0x00FF00)
        .addFields(
          { name: userField, value: `${usuario.tag}`, inline: true },
          { name: moderatorField, value: `${interaction.user.tag}`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando untimeout:', error);
      await interaction.reply({
        content: '❌ Hubo un error al ejecutar este comando.',
        ephemeral: true
      }).catch(console.error);
    }
  },
};
