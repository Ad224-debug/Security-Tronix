const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botpermission')
    .setDescription('Manage who can add bots to the server (Owner only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Give permission to add bots')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User to give permission')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove permission to add bots')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User to remove permission')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List users who can add bots'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('enable')
        .setDescription('Enable bot protection system')
        .addBooleanOption(option =>
          option.setName('enabled')
            .setDescription('Enable or disable protection')
            .setRequired(true))),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const subcommand = interaction.options.getSubcommand();

    // Solo el owner puede usar este comando
    if (interaction.user.id !== interaction.guild.ownerId) {
      return await interaction.reply({
        content: lang === 'es' 
          ? '❌ Solo el dueño del servidor puede usar este comando.'
          : '❌ Only the server owner can use this command.',
        ephemeral: true
      });
    }

    const configPath = path.join(__dirname, '../config.json');
    let config = {};
    
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    if (!config.botPermissions) {
      config.botPermissions = {};
    }

    if (!config.botPermissions[interaction.guild.id]) {
      config.botPermissions[interaction.guild.id] = {
        enabled: true,
        allowedUsers: [interaction.guild.ownerId] // Owner siempre tiene permiso
      };
    }

    const guildConfig = config.botPermissions[interaction.guild.id];

    switch (subcommand) {
      case 'add':
        const userToAdd = interaction.options.getUser('user');
        
        if (guildConfig.allowedUsers.includes(userToAdd.id)) {
          return await interaction.reply({
            content: lang === 'es'
              ? `❌ ${userToAdd} ya tiene permiso para agregar bots.`
              : `❌ ${userToAdd} already has permission to add bots.`,
            ephemeral: true
          });
        }

        guildConfig.allowedUsers.push(userToAdd.id);
        config.botPermissions[interaction.guild.id] = guildConfig;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        const addEmbed = new EmbedBuilder()
          .setTitle(lang === 'es' ? '✅ Permiso de Bots Otorgado' : '✅ Bot Permission Granted')
          .setDescription(lang === 'es'
            ? `${userToAdd} ahora puede agregar bots al servidor`
            : `${userToAdd} can now add bots to the server`)
          .addFields(
            { name: lang === 'es' ? '👤 Usuario' : '👤 User', value: `${userToAdd.tag}`, inline: true },
            { name: lang === 'es' ? '👑 Otorgado por' : '👑 Granted by', value: `${interaction.user.tag}`, inline: true }
          )
          .setColor(0x57F287)
          .setTimestamp();

        await interaction.reply({ embeds: [addEmbed] });
        break;

      case 'remove':
        const userToRemove = interaction.options.getUser('user');

        if (userToRemove.id === interaction.guild.ownerId) {
          return await interaction.reply({
            content: lang === 'es'
              ? '❌ No puedes remover el permiso del dueño del servidor.'
              : '❌ You cannot remove permission from the server owner.',
            ephemeral: true
          });
        }

        const index = guildConfig.allowedUsers.indexOf(userToRemove.id);
        if (index === -1) {
          return await interaction.reply({
            content: lang === 'es'
              ? `❌ ${userToRemove} no tiene permiso para agregar bots.`
              : `❌ ${userToRemove} doesn't have permission to add bots.`,
            ephemeral: true
          });
        }

        guildConfig.allowedUsers.splice(index, 1);
        config.botPermissions[interaction.guild.id] = guildConfig;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        const removeEmbed = new EmbedBuilder()
          .setTitle(lang === 'es' ? '🚫 Permiso de Bots Removido' : '🚫 Bot Permission Removed')
          .setDescription(lang === 'es'
            ? `${userToRemove} ya no puede agregar bots al servidor`
            : `${userToRemove} can no longer add bots to the server`)
          .addFields(
            { name: lang === 'es' ? '👤 Usuario' : '👤 User', value: `${userToRemove.tag}`, inline: true },
            { name: lang === 'es' ? '👑 Removido por' : '👑 Removed by', value: `${interaction.user.tag}`, inline: true }
          )
          .setColor(0xED4245)
          .setTimestamp();

        await interaction.reply({ embeds: [removeEmbed] });
        break;

      case 'list':
        const allowedUsers = [];
        
        for (const userId of guildConfig.allowedUsers) {
          try {
            const user = await interaction.client.users.fetch(userId);
            const isOwner = userId === interaction.guild.ownerId;
            allowedUsers.push(`${user.tag} ${isOwner ? '👑' : ''}`);
          } catch (error) {
            allowedUsers.push(`Usuario Desconocido (${userId})`);
          }
        }

        const listEmbed = new EmbedBuilder()
          .setTitle(lang === 'es' ? '🤖 Usuarios con Permiso de Bots' : '🤖 Users with Bot Permission')
          .setDescription(lang === 'es'
            ? `**Sistema:** ${guildConfig.enabled ? '✅ Activado' : '❌ Desactivado'}\n\n**Usuarios autorizados:**\n${allowedUsers.join('\n')}`
            : `**System:** ${guildConfig.enabled ? '✅ Enabled' : '❌ Disabled'}\n\n**Authorized users:**\n${allowedUsers.join('\n')}`)
          .setColor(0x5865F2)
          .setFooter({ text: lang === 'es' ? '👑 = Dueño del servidor' : '👑 = Server owner' })
          .setTimestamp();

        await interaction.reply({ embeds: [listEmbed], ephemeral: true });
        break;

      case 'enable':
        const enabled = interaction.options.getBoolean('enabled');
        guildConfig.enabled = enabled;
        config.botPermissions[interaction.guild.id] = guildConfig;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        await interaction.reply({
          content: lang === 'es'
            ? `✅ Sistema de protección de bots ${enabled ? 'activado' : 'desactivado'}`
            : `✅ Bot protection system ${enabled ? 'enabled' : 'disabled'}`,
          ephemeral: true
        });
        break;
    }
  },
};
