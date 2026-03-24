const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Gestiona roles de usuarios / Manages user roles')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Acción a realizar / Action to perform')
        .setRequired(true)
        .addChoices(
          { name: 'Agregar rol / Add role', value: 'add' },
          { name: 'Remover rol / Remove role', value: 'remove' }
        ))
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Usuario a modificar / User to modify')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Rol a agregar o remover / Role to add or remove')
        .setRequired(true)),
  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const L = (es, en) => lang === 'es' ? es : en;

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({ content: L('❌ No tienes permiso para gestionar roles.', '❌ You do not have permission to manage roles.'), flags: 64 });
    }

    const accion = interaction.options.getString('action');
    const usuario = interaction.options.getUser('user');
    const rol = interaction.options.getRole('role');

    let miembro;
    try {
      miembro = await interaction.guild.members.fetch(usuario.id);
    } catch {
      return interaction.reply({ content: L('❌ No se pudo encontrar al usuario.', '❌ Could not find the user.'), flags: 64 });
    }

    const botMember = await interaction.guild.members.fetch(interaction.client.user.id);
    if (botMember.roles.highest.position <= rol.position) {
      return interaction.reply({ content: L('❌ El bot no puede gestionar ese rol (jerarquía).', '❌ Bot cannot manage that role (hierarchy).'), flags: 64 });
    }
    if (interaction.member.roles.highest.position <= rol.position && interaction.member.id !== interaction.guild.ownerId) {
      return interaction.reply({ content: L('❌ No puedes gestionar un rol igual o superior al tuyo.', '❌ You cannot manage a role equal or higher than yours.'), flags: 64 });
    }
    if (miembro.id === interaction.guild.ownerId && interaction.member.id !== interaction.guild.ownerId) {
      return interaction.reply({ content: L('❌ No puedes modificar los roles del dueño del servidor.', '❌ You cannot modify the server owner\'s roles.'), flags: 64 });
    }
    if (miembro.roles.highest.position >= interaction.member.roles.highest.position && interaction.member.id !== interaction.guild.ownerId) {
      return interaction.reply({ content: L('❌ No puedes modificar a alguien con igual o mayor jerarquía.', '❌ You cannot modify someone with equal or higher hierarchy.'), flags: 64 });
    }

    try {
      if (accion === 'add') {
        if (miembro.roles.cache.has(rol.id)) {
          return interaction.reply({ content: L(`⚠️ ${usuario} ya tiene el rol ${rol}.`, `⚠️ ${usuario} already has the role ${rol}.`), flags: 64 });
        }
        await miembro.roles.add(rol);
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setTitle(L('✅ Rol Asignado', '✅ Role Assigned'))
            .setDescription(L(`Se le dio el rol ${rol} a ${usuario}`, `Gave role ${rol} to ${usuario}`))
            .addFields(
              { name: L('Moderador', 'Moderator'), value: `${interaction.user}`, inline: true },
              { name: L('Posición del rol', 'Role position'), value: `${rol.position}`, inline: true }
            )
            .setColor(0x57F287)
            .setTimestamp()
          ]
        });
      } else {
        if (!miembro.roles.cache.has(rol.id)) {
          return interaction.reply({ content: L(`⚠️ ${usuario} no tiene el rol ${rol}.`, `⚠️ ${usuario} doesn't have the role ${rol}.`), flags: 64 });
        }
        await miembro.roles.remove(rol);
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setTitle(L('✅ Rol Removido', '✅ Role Removed'))
            .setDescription(L(`Se removió el rol ${rol} de ${usuario}`, `Removed role ${rol} from ${usuario}`))
            .addFields({ name: L('Moderador', 'Moderator'), value: `${interaction.user}`, inline: true })
            .setColor(0xED4245)
            .setTimestamp()
          ]
        });
      }
    } catch (error) {
      console.error('Error en comando role:', error);
      return interaction.reply({ content: L('❌ Ocurrió un error al modificar el rol.', '❌ An error occurred while modifying the role.'), flags: 64 });
    }
  },
};
