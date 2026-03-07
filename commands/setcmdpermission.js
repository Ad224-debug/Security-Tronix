const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setcmdpermission')
    .setDescription('Configure who can use specific commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('command')
        .setDescription('Command name (without /)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Action to perform')
        .setRequired(true)
        .addChoices(
          { name: 'Add User', value: 'add_user' },
          { name: 'Add Role', value: 'add_role' },
          { name: 'Remove User', value: 'remove_user' },
          { name: 'Remove Role', value: 'remove_role' },
          { name: 'Clear All', value: 'clear' },
          { name: 'View Permissions', value: 'view' }
        ))
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to add/remove')
        .setRequired(false))
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Role to add/remove')
        .setRequired(false)),

  async execute(interaction) {
    const getText = (key) => interaction.client.getText(interaction.guild.id, key);
    const commandName = interaction.options.getString('command').toLowerCase();
    const action = interaction.options.getString('action');
    const user = interaction.options.getUser('user');
    const role = interaction.options.getRole('role');

    const configPath = path.join(__dirname, '../config.json');
    let config = {};
    
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    if (!config.commandPermissions) {
      config.commandPermissions = {};
    }

    if (!config.commandPermissions[interaction.guild.id]) {
      config.commandPermissions[interaction.guild.id] = {};
    }

    if (!config.commandPermissions[interaction.guild.id][commandName]) {
      config.commandPermissions[interaction.guild.id][commandName] = {
        users: [],
        roles: []
      };
    }

    const cmdPerms = config.commandPermissions[interaction.guild.id][commandName];

    switch (action) {
      case 'add_user':
        if (!user) {
          return await interaction.reply({
            content: getText('cmd_perm_user_required'),
            ephemeral: true
          });
        }
        if (!cmdPerms.users.includes(user.id)) {
          cmdPerms.users.push(user.id);
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
          await interaction.reply({
            content: getText('cmd_perm_user_added').replace('{user}', user.tag).replace('{command}', commandName),
            ephemeral: true
          });
        } else {
          await interaction.reply({
            content: getText('cmd_perm_already_has'),
            ephemeral: true
          });
        }
        break;

      case 'add_role':
        if (!role) {
          return await interaction.reply({
            content: getText('cmd_perm_role_required'),
            ephemeral: true
          });
        }
        if (!cmdPerms.roles.includes(role.id)) {
          cmdPerms.roles.push(role.id);
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
          await interaction.reply({
            content: getText('cmd_perm_role_added').replace('{role}', role.name).replace('{command}', commandName),
            ephemeral: true
          });
        } else {
          await interaction.reply({
            content: getText('cmd_perm_already_has'),
            ephemeral: true
          });
        }
        break;

      case 'remove_user':
        if (!user) {
          return await interaction.reply({
            content: getText('cmd_perm_user_required'),
            ephemeral: true
          });
        }
        const userIndex = cmdPerms.users.indexOf(user.id);
        if (userIndex > -1) {
          cmdPerms.users.splice(userIndex, 1);
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
          await interaction.reply({
            content: getText('cmd_perm_user_removed').replace('{user}', user.tag).replace('{command}', commandName),
            ephemeral: true
          });
        } else {
          await interaction.reply({
            content: getText('cmd_perm_not_found'),
            ephemeral: true
          });
        }
        break;

      case 'remove_role':
        if (!role) {
          return await interaction.reply({
            content: getText('cmd_perm_role_required'),
            ephemeral: true
          });
        }
        const roleIndex = cmdPerms.roles.indexOf(role.id);
        if (roleIndex > -1) {
          cmdPerms.roles.splice(roleIndex, 1);
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
          await interaction.reply({
            content: getText('cmd_perm_role_removed').replace('{role}', role.name).replace('{command}', commandName),
            ephemeral: true
          });
        } else {
          await interaction.reply({
            content: getText('cmd_perm_not_found'),
            ephemeral: true
          });
        }
        break;

      case 'clear':
        config.commandPermissions[interaction.guild.id][commandName] = {
          users: [],
          roles: []
        };
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        await interaction.reply({
          content: getText('cmd_perm_cleared').replace('{command}', commandName),
          ephemeral: true
        });
        break;

      case 'view':
        const users = cmdPerms.users.length > 0 
          ? cmdPerms.users.map(id => `<@${id}>`).join(', ')
          : getText('cmd_perm_none');
        const roles = cmdPerms.roles.length > 0
          ? cmdPerms.roles.map(id => `<@&${id}>`).join(', ')
          : getText('cmd_perm_none');

        await interaction.reply({
          embeds: [{
            title: getText('cmd_perm_view_title').replace('{command}', commandName),
            fields: [
              { name: getText('cmd_perm_users'), value: users, inline: false },
              { name: getText('cmd_perm_roles'), value: roles, inline: false }
            ],
            color: 0x5865F2,
            timestamp: new Date()
          }],
          ephemeral: true
        });
        break;
    }
  }
};
