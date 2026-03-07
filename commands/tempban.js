const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { createCase } = require('./case.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tempban')
    .setDescription('Temporarily ban a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to temporarily ban')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('days')
        .setDescription('Number of days to ban')
        .setMinValue(1)
        .setMaxValue(365)
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('delete_days')
        .setDescription('Days of messages to delete (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)),

  async execute(interaction) {
    const getText = (key) => interaction.client.getText(interaction.guild.id, key);
    const lang = interaction.client.getLanguage(interaction.guild.id);
    
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: getText('admin_only'),
        ephemeral: true
      });
    }

    const usuario = interaction.options.getUser('user');
    const days = interaction.options.getInteger('days');
    const razon = interaction.options.getString('reason') || (lang === 'es' ? 'No especificada' : 'Not specified');
    const deleteDays = interaction.options.getInteger('delete_days') || 0;

    const miembro = await interaction.guild.members.fetch(usuario.id).catch(() => null);

    if (usuario.id === interaction.user.id) {
      return await interaction.reply({
        content: lang === 'es' ? '❌ No puedes banearte a ti mismo.' : '❌ You cannot ban yourself.',
        ephemeral: true
      });
    }

    if (usuario.id === interaction.guild.ownerId) {
      return await interaction.reply({
        content: lang === 'es' ? '❌ No puedes banear al dueño del servidor.' : '❌ You cannot ban the server owner.',
        ephemeral: true
      });
    }

    if (miembro && miembro.roles.highest.position >= interaction.member.roles.highest.position) {
      return await interaction.reply({
        content: lang === 'es' ? '❌ No puedes banear a alguien con un rol igual o superior al tuyo.' : '❌ You cannot ban someone with an equal or higher role.',
        ephemeral: true
      });
    }

    try {
      await interaction.deferReply();

      const expiresAt = Date.now() + (days * 24 * 60 * 60 * 1000);

      // Intentar enviar DM
      if (miembro) {
        try {
          const dmEmbed = new EmbedBuilder()
            .setTitle(lang === 'es' ? '⏰ Has sido baneado temporalmente' : '⏰ You have been temporarily banned')
            .setDescription(lang === 'es' 
              ? `Has sido baneado temporalmente de **${interaction.guild.name}**`
              : `You have been temporarily banned from **${interaction.guild.name}**`)
            .addFields(
              { name: lang === 'es' ? '📝 Razón' : '📝 Reason', value: razon },
              { name: lang === 'es' ? '⏰ Duración' : '⏰ Duration', value: `${days} ${lang === 'es' ? 'día(s)' : 'day(s)'}` },
              { name: lang === 'es' ? '⏳ Expira' : '⏳ Expires', value: `<t:${Math.floor(expiresAt / 1000)}:R>` },
              { name: lang === 'es' ? '👮 Moderador' : '👮 Moderator', value: interaction.user.tag }
            )
            .setColor(0xFFA500)
            .setTimestamp();

          await usuario.send({ embeds: [dmEmbed] });
        } catch (error) {
          // Usuario tiene DMs desactivados
        }
      }

      await interaction.guild.members.ban(usuario, {
        deleteMessageSeconds: deleteDays * 24 * 60 * 60,
        reason: `[TEMPBAN ${days}d] ${razon}`,
      });

      // Crear caso de moderación
      const caseId = createCase(
        interaction.guild.id,
        'tempban',
        usuario.id,
        interaction.user.id,
        razon,
        `${days} ${lang === 'es' ? 'día(s)' : 'day(s)'}`,
        expiresAt
      );

      // Programar desbaneo automático
      setTimeout(async () => {
        try {
          await interaction.guild.members.unban(usuario.id, lang === 'es' ? 'Baneo temporal expirado' : 'Temporary ban expired');
          
          // Crear caso de desbaneo automático
          createCase(
            interaction.guild.id,
            'unban',
            usuario.id,
            interaction.client.user.id,
            lang === 'es' ? 'Baneo temporal expirado (automático)' : 'Temporary ban expired (automatic)'
          );
        } catch (error) {
          console.error('Error desbaneando automáticamente:', error);
        }
      }, days * 24 * 60 * 60 * 1000);

      const embed = new EmbedBuilder()
        .setTitle(lang === 'es' ? '⏰ Usuario Baneado Temporalmente' : '⏰ User Temporarily Banned')
        .setDescription(`**${usuario.tag}** ${lang === 'es' ? 'ha sido baneado temporalmente' : 'has been temporarily banned'}`)
        .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: lang === 'es' ? '👤 Usuario' : '👤 User', value: `${usuario} (${usuario.id})`, inline: true },
          { name: lang === 'es' ? '👮 Moderador' : '👮 Moderator', value: `${interaction.user}`, inline: true },
          { name: lang === 'es' ? '⏰ Duración' : '⏰ Duration', value: `${days} ${lang === 'es' ? 'día(s)' : 'day(s)'}`, inline: true },
          { name: lang === 'es' ? '📝 Razón' : '📝 Reason', value: razon, inline: false },
          { name: lang === 'es' ? '⏳ Expira' : '⏳ Expires', value: `<t:${Math.floor(expiresAt / 1000)}:F>`, inline: false },
          { name: lang === 'es' ? '🗑️ Mensajes eliminados' : '🗑️ Messages deleted', value: `${deleteDays} ${lang === 'es' ? 'día(s)' : 'day(s)'}`, inline: true },
          { name: lang === 'es' ? '📋 Caso' : '📋 Case', value: `#${caseId}`, inline: true }
        )
        .setColor(0xFFA500)
        .setFooter({ text: lang === 'es' ? 'Baneo temporal - Se desbaneará automáticamente' : 'Temporary ban - Will unban automatically' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en tempban:', error);
      await interaction.editReply({
        content: getText('error'),
      });
    }
  },
};
