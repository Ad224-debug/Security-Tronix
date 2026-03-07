const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warns a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to warn')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the warning')
        .setRequired(true)),
  async execute(interaction) {
    const getText = (key) => interaction.client.getText(interaction.guild.id, key);

    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: getText('admin_only'),
        ephemeral: true
      });
    }

    const usuario = interaction.options.getUser('user');
    const razon = interaction.options.getString('reason');

    // Cargar configuración de warnings
    const warnConfigPath = path.join(__dirname, '../warn-config.json');
    let warnConfig = {};
    
    if (fs.existsSync(warnConfigPath)) {
      warnConfig = JSON.parse(fs.readFileSync(warnConfigPath, 'utf8'));
    }

    const guildConfig = warnConfig[interaction.guild.id] || {
      dmNotifications: true,
      autoAction: 'none',
      autoActionThreshold: 3,
    };

    // Cargar o crear archivo de advertencias
    const warningsPath = path.join(__dirname, '../warnings.json');
    let warnings = {};
    
    if (fs.existsSync(warningsPath)) {
      warnings = JSON.parse(fs.readFileSync(warningsPath, 'utf8'));
    }

    const key = `${interaction.guild.id}-${usuario.id}`;
    if (!warnings[key]) {
      warnings[key] = [];
    }

    warnings[key].push({
      reason: razon,
      moderator: interaction.user.id,
      timestamp: Date.now(),
    });

    fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2), 'utf8');

    const warnCount = warnings[key].length;

    await interaction.reply({
      embeds: [{
        title: getText('warn_user'),
        description: `${usuario} ${getText('warn_user_desc')}`,
        fields: [
          { name: getText('afk_reason'), value: razon },
          { name: getText('moderator'), value: `${interaction.user}` },
          { name: getText('total_warnings'), value: `${warnCount}` },
        ],
        color: 0xFEE75C,
        timestamp: new Date(),
      }]
    });

    // Enviar DM al usuario si está habilitado
    if (guildConfig.dmNotifications) {
      try {
        const lang = interaction.client.getLanguage(interaction.guild.id);
        const dmTitle = lang === 'es' ? '⚠️ Has recibido una advertencia' : '⚠️ You received a warning';
        const dmDesc = lang === 'es' 
          ? `Has recibido una advertencia en **${interaction.guild.name}**`
          : `You received a warning in **${interaction.guild.name}**`;

        await usuario.send({
          embeds: [{
            title: dmTitle,
            description: dmDesc,
            fields: [
              { name: getText('afk_reason'), value: razon },
              { name: getText('total_warnings'), value: `${warnCount}` },
            ],
            color: 0xFEE75C,
            timestamp: new Date(),
          }]
        });
      } catch (error) {
        // Usuario tiene DMs desactivados
      }
    }

    // Acción automática si se alcanza el umbral
    if (guildConfig.autoAction !== 'none' && warnCount >= guildConfig.autoActionThreshold) {
      const miembro = interaction.guild.members.cache.get(usuario.id);
      
      if (miembro) {
        try {
          const lang = interaction.client.getLanguage(interaction.guild.id);
          const autoReason = lang === 'es' 
            ? `Acción automática: ${warnCount} advertencias`
            : `Auto action: ${warnCount} warnings`;

          if (guildConfig.autoAction === 'kick') {
            await miembro.kick(autoReason);
            await interaction.followUp({
              content: `⚡ ${usuario} ${lang === 'es' ? 'fue expulsado automáticamente por alcanzar' : 'was automatically kicked for reaching'} ${warnCount} ${getText('warnings').toLowerCase()}.`,
              ephemeral: true
            });
          } else if (guildConfig.autoAction === 'ban') {
            await interaction.guild.members.ban(usuario, { reason: autoReason });
            await interaction.followUp({
              content: `⚡ ${usuario} ${lang === 'es' ? 'fue baneado automáticamente por alcanzar' : 'was automatically banned for reaching'} ${warnCount} ${getText('warnings').toLowerCase()}.`,
              ephemeral: true
            });
          } else if (guildConfig.autoAction === 'mute') {
            const mutedRoleId = '1478237207885119672';
            const mutedRole = interaction.guild.roles.cache.get(mutedRoleId);
            
            if (mutedRole) {
              await miembro.roles.add(mutedRole);
              await interaction.followUp({
                content: `⚡ ${usuario} ${lang === 'es' ? 'fue muteado automáticamente por alcanzar' : 'was automatically muted for reaching'} ${warnCount} ${getText('warnings').toLowerCase()}.`,
                ephemeral: true
              });
            }
          }
        } catch (error) {
          console.error('Error en acción automática:', error);
        }
      }
    }
  },
};
