const { PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: {
    name: 'warnsetup',
    description: 'Configure warning system settings',
    options: [
      {
        name: 'dm_notifications',
        description: 'Send DM to users when warned?',
        type: 5, // BOOLEAN type
        required: true,
      },
      {
        name: 'auto_action',
        description: 'Auto action after X warnings',
        type: 3, // STRING type
        required: false,
        choices: [
          { name: 'None', value: 'none' },
          { name: 'Kick', value: 'kick' },
          { name: 'Ban', value: 'ban' },
          { name: 'Mute', value: 'mute' },
        ],
      },
      {
        name: 'auto_action_threshold',
        description: 'Number of warnings before auto action',
        type: 4, // INTEGER type
        required: false,
        min_value: 1,
        max_value: 20,
      },
    ],
  },
  async execute(interaction) {
    const getText = (key) => interaction.client.getText(interaction.guild.id, key);

    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: getText('admin_only'),
        ephemeral: true
      });
    }

    const dmNotifications = interaction.options.getBoolean('dm_notifications');
    const autoAction = interaction.options.getString('auto_action') || 'none';
    const threshold = interaction.options.getInteger('auto_action_threshold') || 3;

    // Cargar o crear configuración
    const configPath = path.join(__dirname, '../warn-config.json');
    let config = {};
    
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    config[interaction.guild.id] = {
      dmNotifications: dmNotifications,
      autoAction: autoAction,
      autoActionThreshold: threshold,
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

    const lang = interaction.client.getLanguage(interaction.guild.id);
    
    const dmStatus = dmNotifications 
      ? (lang === 'es' ? '✅ Activado' : '✅ Enabled')
      : (lang === 'es' ? '❌ Desactivado' : '❌ Disabled');
    
    const autoActionText = autoAction === 'none' 
      ? (lang === 'es' ? 'Ninguna' : 'None')
      : autoAction.charAt(0).toUpperCase() + autoAction.slice(1);

    await interaction.reply({
      embeds: [{
        title: getText('warn_setup_title'),
        description: getText('warn_setup_desc'),
        fields: [
          { 
            name: lang === 'es' ? '📧 Notificaciones DM' : '📧 DM Notifications', 
            value: dmStatus, 
            inline: true 
          },
          { 
            name: lang === 'es' ? '⚡ Acción Automática' : '⚡ Auto Action', 
            value: autoActionText, 
            inline: true 
          },
          { 
            name: lang === 'es' ? '🔢 Umbral' : '🔢 Threshold', 
            value: `${threshold} ${getText('warnings').toLowerCase()}`, 
            inline: true 
          },
        ],
        color: 0x5865F2,
        timestamp: new Date(),
      }]
    });
  },
};
