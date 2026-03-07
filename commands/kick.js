const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kicks a user from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to kick')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the kick')
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

    // Fetch member para asegurar que tenemos la info completa
    const miembro = await interaction.guild.members.fetch(usuario.id).catch(() => null);

    if (!miembro) {
      return await interaction.reply({
        content: lang === 'es' ? '❌ No se pudo encontrar ese usuario en el servidor.' : '❌ Could not find that user on the server.',
        ephemeral: true
      });
    }

    // Validaciones de seguridad
    if (miembro.id === interaction.user.id) {
      return await interaction.reply({
        content: lang === 'es' ? '❌ No puedes expulsarte a ti mismo.' : '❌ You cannot kick yourself.',
        ephemeral: true
      });
    }

    if (miembro.id === interaction.guild.ownerId) {
      return await interaction.reply({
        content: lang === 'es' ? '❌ No puedes expulsar al dueño del servidor.' : '❌ You cannot kick the server owner.',
        ephemeral: true
      });
    }

    if (miembro.roles.highest.position >= interaction.member.roles.highest.position) {
      return await interaction.reply({
        content: lang === 'es' ? '❌ No puedes expulsar a alguien con un rol igual o superior al tuyo.' : '❌ You cannot kick someone with an equal or higher role.',
        ephemeral: true
      });
    }

    if (!miembro.kickable) {
      return await interaction.reply({
        content: lang === 'es' ? '❌ No puedo expulsar a este usuario. Verifica que mi rol esté por encima del suyo.' : '❌ I cannot kick this user. Check that my role is above theirs.',
        ephemeral: true
      });
    }

    try {
      // Intentar enviar DM antes de expulsar
      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle(lang === 'es' ? '👢 Has sido expulsado' : '👢 You have been kicked')
          .setDescription(lang === 'es' 
            ? `Has sido expulsado de **${interaction.guild.name}**`
            : `You have been kicked from **${interaction.guild.name}**`)
          .addFields(
            { name: lang === 'es' ? '📝 Razón' : '📝 Reason', value: razon },
            { name: lang === 'es' ? '👮 Moderador' : '👮 Moderator', value: interaction.user.tag }
          )
          .setColor(0xFEE75C)
          .setTimestamp();

        await usuario.send({ embeds: [dmEmbed] });
      } catch (error) {
        // Usuario tiene DMs desactivados
      }

      await miembro.kick(razon);

      const embed = new EmbedBuilder()
        .setTitle(lang === 'es' ? '👢 Usuario Expulsado' : '👢 User Kicked')
        .setDescription(`**${usuario.tag}** ${lang === 'es' ? 'ha sido expulsado del servidor' : 'has been kicked from the server'}`)
        .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: lang === 'es' ? '👤 Usuario' : '👤 User', value: `${usuario} (${usuario.id})`, inline: true },
          { name: lang === 'es' ? '👮 Moderador' : '👮 Moderator', value: `${interaction.user}`, inline: true },
          { name: lang === 'es' ? '📝 Razón' : '📝 Reason', value: razon, inline: false }
        )
        .setColor(0xFEE75C)
        .setFooter({ text: lang === 'es' ? 'Acción de moderación' : 'Moderation action' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en kick:', error);
      await interaction.reply({
        content: getText('error'),
        ephemeral: true
      });
    }
  },
};
