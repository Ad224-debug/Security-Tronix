const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: 'roleinfo',
    description: 'Show information about a role',
    options: [
      {
        name: 'role',
        description: 'Role to get information about',
        type: 8, // ROLE type
        required: true,
      },
    ],
  },
  async execute(interaction) {
    try {
      const role = interaction.options.getRole('role');
      const lang = interaction.client.getLanguage(interaction.guild.id);

      const members = interaction.guild.members.cache.filter(m => m.roles.cache.has(role.id)).size;
      const createdAt = Math.floor(role.createdTimestamp / 1000);
      const permissions = role.permissions.toArray().join(', ') || 'None';

      const title = lang === 'es' ? '🎭 Información del Rol' : '🎭 Role Information';
      const nameField = lang === 'es' ? 'Nombre' : 'Name';
      const idField = lang === 'es' ? 'ID' : 'ID';
      const colorField = lang === 'es' ? 'Color' : 'Color';
      const membersField = lang === 'es' ? 'Miembros' : 'Members';
      const createdField = lang === 'es' ? 'Creado' : 'Created';
      const positionField = lang === 'es' ? 'Posición' : 'Position';
      const mentionableField = lang === 'es' ? 'Mencionable' : 'Mentionable';
      const hoistedField = lang === 'es' ? 'Separado' : 'Hoisted';
      const permissionsField = lang === 'es' ? 'Permisos' : 'Permissions';

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(role.color || 0x5865F2)
        .addFields(
          { name: nameField, value: role.name, inline: true },
          { name: idField, value: role.id, inline: true },
          { name: colorField, value: role.hexColor, inline: true },
          { name: membersField, value: `${members}`, inline: true },
          { name: positionField, value: `${role.position}`, inline: true },
          { name: createdField, value: `<t:${createdAt}:R>`, inline: true },
          { name: mentionableField, value: role.mentionable ? '✅' : '❌', inline: true },
          { name: hoistedField, value: role.hoist ? '✅' : '❌', inline: true },
          { name: permissionsField, value: permissions.length > 1024 ? 'Demasiados para mostrar' : permissions, inline: false }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando roleinfo:', error);
      await interaction.reply({
        content: '❌ Hubo un error al ejecutar este comando.',
        ephemeral: true
      }).catch(console.error);
    }
  },
};
