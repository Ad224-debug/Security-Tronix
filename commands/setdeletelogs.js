const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: {
    name: 'setdeletelogs',
    description: 'Configure the channel for deleted messages logs',
    options: [
      {
        name: 'action',
        description: 'Action to perform',
        type: 3, // STRING type
        required: true,
        choices: [
          { name: 'Set Channel', value: 'set' },
          { name: 'View Current', value: 'view' },
          { name: 'Disable', value: 'disable' }
        ]
      },
      {
        name: 'channel',
        description: 'Channel for deleted messages logs (required for set)',
        type: 7, // CHANNEL type
        required: false,
      },
    ],
  },
  async execute(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        const lang = interaction.client.getLanguage(interaction.guild.id);
        const msg = lang === 'es' 
          ? '❌ Solo administradores pueden usar este comando.'
          : '❌ Only administrators can use this command.';
        return await interaction.reply({
          content: msg,
          ephemeral: true
        });
      }

      const action = interaction.options.getString('action');
      const channel = interaction.options.getChannel('channel');
      const lang = interaction.client.getLanguage(interaction.guild.id);

      const configPath = path.join(__dirname, '..', 'config.json');
      let config = {};
      
      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }

      if (!config.deleteLogChannels) {
        config.deleteLogChannels = {};
      }

      // Acción: Ver canal actual
      if (action === 'view') {
        const currentChannelId = config.deleteLogChannels[interaction.guild.id];
        
        if (!currentChannelId) {
          const msg = lang === 'es'
            ? '❌ No hay un canal de logs de mensajes eliminados configurado.\nUsa `/setdeletelogs action:Set Channel` para configurar uno.'
            : '❌ No deleted messages logs channel is configured.\nUse `/setdeletelogs action:Set Channel` to set one.';
          return await interaction.reply({
            content: msg,
            ephemeral: true
          });
        }

        const title = lang === 'es' ? '📋 Canal de Logs Actual' : '📋 Current Logs Channel';
        const description = lang === 'es'
          ? `Los mensajes eliminados se están registrando en <#${currentChannelId}>`
          : `Deleted messages are being logged in <#${currentChannelId}>`;

        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(description)
          .setColor(0x5865F2)
          .setTimestamp();

        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Acción: Desactivar logs
      if (action === 'disable') {
        if (!config.deleteLogChannels[interaction.guild.id]) {
          const msg = lang === 'es'
            ? '❌ No hay un canal de logs configurado para desactivar.'
            : '❌ There is no logs channel configured to disable.';
          return await interaction.reply({
            content: msg,
            ephemeral: true
          });
        }

        delete config.deleteLogChannels[interaction.guild.id];
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        const title = lang === 'es' ? '🔴 Logs Desactivados' : '🔴 Logs Disabled';
        const description = lang === 'es'
          ? 'Los logs de mensajes eliminados han sido desactivados.'
          : 'Deleted messages logs have been disabled.';

        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(description)
          .setColor(0xFF0000)
          .setTimestamp();

        return await interaction.reply({ embeds: [embed] });
      }

      // Acción: Configurar canal
      if (action === 'set') {
        if (!channel) {
          const msg = lang === 'es'
            ? '❌ Debes especificar un canal para configurar los logs.'
            : '❌ You must specify a channel to set up logs.';
          return await interaction.reply({
            content: msg,
            ephemeral: true
          });
        }

        const oldChannelId = config.deleteLogChannels[interaction.guild.id];
        config.deleteLogChannels[interaction.guild.id] = channel.id;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        const title = lang === 'es' ? '✅ Canal de Logs Configurado' : '✅ Logs Channel Set';
        let description;
        
        if (oldChannelId) {
          description = lang === 'es'
            ? `El canal de logs ha sido cambiado de <#${oldChannelId}> a ${channel}\n\n**Se registrará:**\n• 💬 Texto del mensaje\n• 🖼️ Imágenes y GIFs\n• 📎 Archivos adjuntos\n• 🎨 Stickers\n• 📋 Embeds\n• 🕐 Hora de envío\n• 👤 Autor del mensaje`
            : `Logs channel has been changed from <#${oldChannelId}> to ${channel}\n\n**Will be logged:**\n• 💬 Message text\n• 🖼️ Images and GIFs\n• 📎 Attachments\n• 🎨 Stickers\n• 📋 Embeds\n• 🕐 Send time\n• 👤 Message author`;
        } else {
          description = lang === 'es'
            ? `Los mensajes eliminados se registrarán en ${channel}\n\n**Se registrará:**\n• 💬 Texto del mensaje\n• 🖼️ Imágenes y GIFs\n• 📎 Archivos adjuntos\n• 🎨 Stickers\n• 📋 Embeds\n• 🕐 Hora de envío\n• 👤 Autor del mensaje`
            : `Deleted messages will be logged in ${channel}\n\n**Will be logged:**\n• 💬 Message text\n• 🖼️ Images and GIFs\n• 📎 Attachments\n• 🎨 Stickers\n• 📋 Embeds\n• 🕐 Send time\n• 👤 Message author`;
        }

        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(description)
          .setColor(0x00FF00)
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error en comando setdeletelogs:', error);
      await interaction.reply({
        content: '❌ Hubo un error al ejecutar este comando.',
        ephemeral: true
      }).catch(console.error);
    }
  },
};
