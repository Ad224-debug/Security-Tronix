const { PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: {
    name: 'setlogs',
    description: 'Set the moderation logs channel',
    options: [
      {
        name: 'channel',
        description: 'Channel for moderation logs',
        type: 7, // CHANNEL type
        required: true,
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

      const channel = interaction.options.getChannel('channel');
      const lang = interaction.client.getLanguage(interaction.guild.id);

      // Guardar configuración
      const configPath = path.join(__dirname, '..', 'config.json');
      let config = {};
      
      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }

      if (!config.logChannels) {
        config.logChannels = {};
      }

      config.logChannels[interaction.guild.id] = channel.id;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      const title = lang === 'es' ? '✅ Canal de Logs Configurado' : '✅ Logs Channel Set';
      const description = lang === 'es'
        ? `El canal de logs de moderación ha sido configurado en ${channel}`
        : `Moderation logs channel has been set to ${channel}`;

      await interaction.reply({
        embeds: [{
          title,
          description,
          color: 0x00FF00,
          timestamp: new Date(),
        }],
      });
    } catch (error) {
      console.error('Error en comando setlogs:', error);
      await interaction.reply({
        content: '❌ Hubo un error al ejecutar este comando.',
        ephemeral: true
      }).catch(console.error);
    }
  },
};
