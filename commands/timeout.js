const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a user temporarily')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to timeout')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('duration')
        .setDescription('Duration in minutes (1-10080)')
        .setMinValue(1)
        .setMaxValue(10080)
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for timeout')
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

      const usuario = interaction.options.getUser('user');
      const member = await interaction.guild.members.fetch(usuario.id);
      const duration = interaction.options.getInteger('duration');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const lang = interaction.client.getLanguage(interaction.guild.id);

      if (duration < 1 || duration > 10080) {
        const msg = lang === 'es'
          ? '❌ La duración debe estar entre 1 y 10080 minutos (7 días).'
          : '❌ Duration must be between 1 and 10080 minutes (7 days).';
        return await interaction.reply({
          content: msg,
          ephemeral: true
        });
      }

      if (member.id === interaction.user.id) {
        const msg = lang === 'es'
          ? '❌ No puedes aislarte a ti mismo.'
          : '❌ You cannot timeout yourself.';
        return await interaction.reply({
          content: msg,
          ephemeral: true
        });
      }

      if (member.roles.highest.position >= interaction.member.roles.highest.position) {
        const msg = lang === 'es'
          ? '❌ No puedes aislar a alguien con un rol igual o superior al tuyo.'
          : '❌ You cannot timeout someone with an equal or higher role.';
        return await interaction.reply({
          content: msg,
          ephemeral: true
        });
      }

      await member.timeout(duration * 60 * 1000, reason);

      const title = lang === 'es' ? '⏱️ Usuario Aislado' : '⏱️ User Timed Out';
      const userField = lang === 'es' ? 'Usuario' : 'User';
      const durationField = lang === 'es' ? 'Duración' : 'Duration';
      const reasonField = lang === 'es' ? 'Razón' : 'Reason';
      const moderatorField = lang === 'es' ? 'Moderador' : 'Moderator';
      const durationText = lang === 'es' ? `${duration} minutos` : `${duration} minutes`;

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(0xFFA500)
        .addFields(
          { name: userField, value: `${usuario.tag}`, inline: true },
          { name: durationField, value: durationText, inline: true },
          { name: reasonField, value: reason, inline: false },
          { name: moderatorField, value: `${interaction.user.tag}`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando timeout:', error);
      await interaction.reply({
        content: '❌ Hubo un error al ejecutar este comando.',
        ephemeral: true
      }).catch(console.error);
    }
  },
};
