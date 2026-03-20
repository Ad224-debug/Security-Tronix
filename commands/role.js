const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Manages user roles')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Action to perform')
        .setRequired(true)
        .addChoices(
          { name: 'Add role', value: 'add' },
          { name: 'Remove role', value: 'remove' }
        ))
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to modify roles')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Role to add or remove')
        .setRequired(true)),
  async execute(interaction) {
    const getText = (key) => interaction.client.getText(interaction.guild.id, key);
    
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return await interaction.reply({
        content: getText('no_permission'),
        ephemeral: true
      });
    }

    const accion = interaction.options.getString('action');
    const usuario = interaction.options.getUser('user');
    const rol = interaction.options.getRole('role');
    
    let miembro;
    try {
      miembro = await interaction.guild.members.fetch(usuario.id);
    } catch (error) {
      return await interaction.reply({
        content: getText('error'),
        ephemeral: true
      });
    }

    const botMember = await interaction.guild.members.fetch(interaction.client.user.id);
    if (botMember.roles.highest.position <= rol.position) {
      return await interaction.reply({
        content: getText('error'),
        ephemeral: true
      });
    }

    if (interaction.member.roles.highest.position <= rol.position) {
      return await interaction.reply({
        content: getText('error'),
        ephemeral: true
      });
    }

    if (miembro.id === interaction.guild.ownerId && interaction.member.id !== interaction.guild.ownerId) {
      return await interaction.reply({
        content: getText('error'),
        ephemeral: true
      });
    }

    if (miembro.roles.highest.position >= interaction.member.roles.highest.position && interaction.member.id !== interaction.guild.ownerId) {
      return await interaction.reply({
        content: getText('error'),
        ephemeral: true
      });
    }

    try {
      if (accion === 'add') {
        if (miembro.roles.cache.has(rol.id)) {
          return await interaction.reply({
            content: `⚠️ ${usuario} already has the role ${rol}.`,
            ephemeral: true
          });
        }
        
        await miembro.roles.add(rol);
        await interaction.reply({
          embeds: [new EmbedBuilder()
            .setTitle(getText('role_assigned'))
            .setDescription(`Gave role ${rol} to ${usuario}`)
            .addFields(
              { name: getText('moderator'), value: `${interaction.user}`, inline: true },
              { name: 'Role position', value: `${rol.position}`, inline: true }
            )
            .setColor(0x57F287)
            .setTimestamp()
          ]
        });
      } else {
        if (!miembro.roles.cache.has(rol.id)) {
          return await interaction.reply({
            content: `⚠️ ${usuario} doesn't have the role ${rol}.`,
            ephemeral: true
          });
        }
        
        await miembro.roles.remove(rol);
        await interaction.reply({
          embeds: [new EmbedBuilder()
            .setTitle(getText('role_removed'))
            .setDescription(`Removed role ${rol} from ${usuario}`)
            .addFields({ name: getText('moderator'), value: `${interaction.user}`, inline: true })
            .setColor(0xED4245)
            .setTimestamp()
          ]
        });
      }
    } catch (error) {
      console.error('Error en comando role:', error);
      await interaction.reply({
        content: getText('error'),
        ephemeral: true
      });
    }
  },
};
