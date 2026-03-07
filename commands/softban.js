const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('softban')
    .setDescription('Softban a user (ban and immediately unban to delete messages)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to softban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the softban')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('days')
        .setDescription('Days of messages to delete (1-7)')
        .setMinValue(1)
        .setMaxValue(7)
        .setRequired(false)),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: lang === 'es' ? '❌ Solo administradores pueden usar este comando.' : '❌ Only administrators can use this command.',
        ephemeral: true
      });
    }

    const usuario = interaction.options.getUser('user');
    const razon = interaction.options.getString('reason') || (lang === 'es' ? 'No especificada' : 'Not specified');
    const dias = interaction.options.getInteger('days') || 7;

    const miembro = await interaction.guild.members.fetch(usuario.id).catch(() => null);

    if (usuario.id === interaction.user.id) {
      return await interaction.reply({
        content: lang === 'es' ? '❌ No puedes hacer softban a ti mismo.' : '❌ You cannot softban yourself.',
        ephemeral: true
      });
    }

    if (usuario.id === interaction.guild.ownerId) {
      return await interaction.reply({
        content: lang === 'es' ? '❌ No puedes hacer softban al dueño del servidor.' : '❌ You cannot softban the server owner.',
        ephemeral: true
      });
    }

    if (miembro) {
      if (miembro.roles.highest.position >= interaction.member.roles.highest.position) {
        return await interaction.reply({
          content: lang === 'es' ? '❌ No puedes hacer softban a alguien con un rol igual o superior al tuyo.' : '❌ You cannot softban someone with an equal or higher role.',
          ephemeral: true
        });
      }

      if (!miembro.bannable) {
        return await interaction.reply({
          content: lang === 'es' ? '❌ No puedo hacer softban a este usuario.' : '❌ I cannot softban this user.',
          ephemeral: true
        });
      }
    }

    try {
      await interaction.deferReply();

      // Ban
      await interaction.guild.members.ban(usuario, {
        deleteMessageSeconds: dias * 24 * 60 * 60,
        reason: `[SOFTBAN] ${razon}`,
      });

      // Unban inmediatamente
      await interaction.guild.members.unban(usuario, `[SOFTBAN] ${razon}`);

      const embed = new EmbedBuilder()
        .setTitle(lang === 'es' ? '🧹 Softban Aplicado' : '🧹 Softban Applied')
        .setDescription(`**${usuario.tag}** ${lang === 'es' ? 'ha recibido un softban (mensajes eliminados, usuario no baneado)' : 'has been softbanned (messages deleted, user not banned)'}`)
        .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: lang === 'es' ? '👤 Usuario' : '👤 User', value: `${usuario} (${usuario.id})`, inline: true },
          { name: lang === 'es' ? '👮 Moderador' : '👮 Moderator', value: `${interaction.user}`, inline: true },
          { name: lang === 'es' ? '📝 Razón' : '📝 Reason', value: razon, inline: false },
          { name: lang === 'es' ? '🗑️ Mensajes eliminados' : '🗑️ Messages deleted', value: `${dias} ${lang === 'es' ? 'día(s)' : 'day(s)'}`, inline: true }
        )
        .setColor(0xFFA500)
        .setFooter({ text: lang === 'es' ? 'El usuario puede volver a unirse' : 'User can rejoin' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en softban:', error);
      await interaction.editReply({
        content: lang === 'es' ? '❌ Hubo un error al ejecutar el softban.' : '❌ There was an error executing the softban.',
      });
    }
  },
};
