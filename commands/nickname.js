const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: 'nickname',
    description: 'Change a user\'s nickname',
    options: [
      {
        name: 'user',
        description: 'User to change nickname',
        type: 6, // USER type
        required: true,
      },
      {
        name: 'nickname',
        description: 'New nickname (leave empty to reset)',
        type: 3, // STRING type
        required: false,
      },
    ],
  },
  async execute(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageNicknames)) {
        const lang = interaction.client.getLanguage(interaction.guild.id);
        const msg = lang === 'es' 
          ? '❌ No tienes permisos para gestionar apodos.'
          : '❌ You don\'t have permission to manage nicknames.';
        return await interaction.reply({
          content: msg,
          ephemeral: true
        });
      }

      const usuario = interaction.options.getUser('user');
      const member = await interaction.guild.members.fetch(usuario.id);
      const nickname = interaction.options.getString('nickname');
      const lang = interaction.client.getLanguage(interaction.guild.id);

      if (member.roles.highest.position >= interaction.member.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
        const msg = lang === 'es'
          ? '❌ No puedes cambiar el apodo de alguien con un rol igual o superior al tuyo.'
          : '❌ You cannot change the nickname of someone with an equal or higher role.';
        return await interaction.reply({
          content: msg,
          ephemeral: true
        });
      }

      const oldNickname = member.nickname || usuario.username;
      await member.setNickname(nickname);

      const title = lang === 'es' ? '✏️ Apodo Cambiado' : '✏️ Nickname Changed';
      const userField = lang === 'es' ? 'Usuario' : 'User';
      const oldField = lang === 'es' ? 'Apodo Anterior' : 'Old Nickname';
      const newField = lang === 'es' ? 'Nuevo Apodo' : 'New Nickname';
      const moderatorField = lang === 'es' ? 'Moderador' : 'Moderator';
      const resetText = lang === 'es' ? 'Restablecido' : 'Reset';

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(0x3498DB)
        .addFields(
          { name: userField, value: `${usuario.tag}`, inline: true },
          { name: oldField, value: oldNickname, inline: true },
          { name: newField, value: nickname || resetText, inline: true },
          { name: moderatorField, value: `${interaction.user.tag}`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando nickname:', error);
      await interaction.reply({
        content: '❌ Hubo un error al ejecutar este comando.',
        ephemeral: true
      }).catch(console.error);
    }
  },
};
