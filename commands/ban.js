const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bans a user from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to ban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('days')
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
    const razon = interaction.options.getString('reason') || (lang === 'es' ? 'No especificada' : 'Not specified');
    const dias = interaction.options.getInteger('days') || 0;

    // Fetch member si está en el servidor
    const miembro = await interaction.guild.members.fetch(usuario.id).catch(() => null);

    // Validaciones de seguridad
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

    if (miembro) {
      if (miembro.roles.highest.position >= interaction.member.roles.highest.position) {
        return await interaction.reply({
          content: lang === 'es' ? '❌ No puedes banear a alguien con un rol igual o superior al tuyo.' : '❌ You cannot ban someone with an equal or higher role.',
          ephemeral: true
        });
      }

      if (!miembro.bannable) {
        return await interaction.reply({
          content: lang === 'es' ? '❌ No puedo banear a este usuario. Verifica que mi rol esté por encima del suyo.' : '❌ I cannot ban this user. Check that my role is above theirs.',
          ephemeral: true
        });
      }
    }

    try {
      // Intentar enviar DM antes de banear
      if (miembro) {
        try {
          const dmEmbed = new EmbedBuilder()
            .setTitle(lang === 'es' ? '🔨 Has sido baneado' : '🔨 You have been banned')
            .setDescription(lang === 'es' 
              ? `Has sido baneado de **${interaction.guild.name}**`
              : `You have been banned from **${interaction.guild.name}**`)
            .addFields(
              { name: lang === 'es' ? '📝 Razón' : '📝 Reason', value: razon },
              { name: lang === 'es' ? '👮 Moderador' : '👮 Moderator', value: interaction.user.tag }
            )
            .setColor(0xED4245)
            .setTimestamp();

          await usuario.send({ embeds: [dmEmbed] });
        } catch (error) {
          // Usuario tiene DMs desactivados
        }
      }

      await interaction.guild.members.ban(usuario, {
        deleteMessageSeconds: dias * 24 * 60 * 60,
        reason: razon,
      });

      const embed = new EmbedBuilder()
        .setTitle(lang === 'es' ? '🔨 Usuario Baneado' : '🔨 User Banned')
        .setDescription(`**${usuario.tag}** ${lang === 'es' ? 'ha sido baneado del servidor' : 'has been banned from the server'}`)
        .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: lang === 'es' ? '👤 Usuario' : '👤 User', value: `${usuario} (${usuario.id})`, inline: true },
          { name: lang === 'es' ? '👮 Moderador' : '👮 Moderator', value: `${interaction.user}`, inline: true },
          { name: lang === 'es' ? '📝 Razón' : '📝 Reason', value: razon, inline: false },
          { name: lang === 'es' ? '🗑️ Mensajes eliminados' : '🗑️ Messages deleted', value: `${dias} ${lang === 'es' ? 'día(s)' : 'day(s)'}`, inline: true }
        )
        .setColor(0xED4245)
        .setFooter({ text: lang === 'es' ? 'Baneo permanente' : 'Permanent ban' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en ban:', error);
      await interaction.reply({
        content: getText('error'),
        ephemeral: true
      });
    }
  },
};
