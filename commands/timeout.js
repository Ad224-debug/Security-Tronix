const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { createCase } = require('./case.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Aisla a un usuario temporalmente')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(opt => opt.setName('user').setDescription('Usuario a aislar').setRequired(true))
    .addIntegerOption(opt => opt.setName('duration').setDescription('Duración en minutos (1-10080)').setMinValue(1).setMaxValue(10080).setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Razón').setRequired(false)),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const usuario = interaction.options.getUser('user');
    const duration = interaction.options.getInteger('duration');
    const reason = interaction.options.getString('reason') || (lang === 'es' ? 'No especificada' : 'Not specified');

    const member = await interaction.guild.members.fetch(usuario.id).catch(() => null);
    if (!member) return interaction.reply({ content: '❌ Usuario no encontrado en el servidor.', ephemeral: true });

    if (usuario.id === interaction.user.id) return interaction.reply({ content: '❌ No puedes aislarte a ti mismo.', ephemeral: true });
    if (usuario.id === interaction.guild.ownerId) return interaction.reply({ content: '❌ No puedes aislar al dueño.', ephemeral: true });
    if (member.roles.highest.position >= interaction.member.roles.highest.position)
      return interaction.reply({ content: '❌ No puedes aislar a alguien con un rol igual o superior al tuyo.', ephemeral: true });

    try {
      // DM antes del timeout
      const expiresAt = Date.now() + duration * 60 * 1000;
      try {
        await usuario.send({ embeds: [
          new EmbedBuilder()
            .setTitle('⏱️ Has sido aislado')
            .setDescription(`Has sido aislado en **${interaction.guild.name}**`)
            .addFields(
              { name: '📝 Razón', value: reason },
              { name: '⏰ Duración', value: `${duration} minuto(s)` },
              { name: '⏳ Expira', value: `<t:${Math.floor(expiresAt / 1000)}:R>` }
            )
            .setColor(0xFFA500).setTimestamp()
        ]});
      } catch { /* DMs cerrados */ }

      await member.timeout(duration * 60 * 1000, reason);

      const caseId = createCase(interaction.guild.id, 'timeout', usuario.id, interaction.user.id, reason, `${duration} min`);

      const embed = new EmbedBuilder()
        .setTitle('⏱️ Usuario Aislado')
        .setThumbnail(usuario.displayAvatarURL())
        .addFields(
          { name: '👤 Usuario', value: `${usuario} (${usuario.id})`, inline: true },
          { name: '👮 Moderador', value: `${interaction.user}`, inline: true },
          { name: '⏰ Duración', value: `${duration} minuto(s)`, inline: true },
          { name: '⏳ Expira', value: `<t:${Math.floor(expiresAt / 1000)}:R>`, inline: true },
          { name: '📝 Razón', value: reason, inline: false },
          { name: '📋 Caso', value: `#${caseId}`, inline: true }
        )
        .setColor(0xFFA500).setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en timeout:', error);
      await interaction.reply({ content: '❌ Error al ejecutar el comando.', ephemeral: true });
    }
  }
};
