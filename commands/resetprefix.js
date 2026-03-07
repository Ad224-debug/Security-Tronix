const { PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: {
    name: 'resetprefix',
    description: 'Resets the prefix to ! (default)',
  },
  async execute(interaction) {
    const getText = (key) => interaction.client.getText(interaction.guild.id, key);
    
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: getText('admin_only'),
        ephemeral: true
      });
    }

    try {
      const configPath = path.join(__dirname, '../config.json');
      let config = { prefixes: {}, languages: {} };
      
      if (fs.existsSync(configPath)) {
        const fileContent = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(fileContent);
      }
      
      if (!config.prefixes) {
        config.prefixes = {};
      }
      
      config.prefixes[interaction.guild.id] = '!';
      
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

      const lang = interaction.client.getLanguage(interaction.guild.id);
      const title = lang === 'es' ? '✅ Prefijo Reseteado' : '✅ Prefix Reset';
      const description = lang === 'es' 
        ? 'El prefijo ha sido reseteado a `!` (por defecto)'
        : 'The prefix has been reset to `!` (default)';
      const exampleLabel = lang === 'es' ? 'Ejemplo' : 'Example';
      const noteLabel = lang === 'es' ? 'Nota' : 'Note';
      const noteText = lang === 'es' 
        ? 'Los comandos slash (/) siempre funcionan independientemente del prefijo'
        : 'Slash commands (/) always work regardless of prefix';

      await interaction.reply({
        embeds: [{
          title: title,
          description: description,
          fields: [
            { name: exampleLabel, value: '!ping, !help' },
            { name: noteLabel, value: noteText },
          ],
          color: 0x57F287,
          timestamp: new Date(),
        }]
      });
    } catch (error) {
      console.error('Error en resetprefix:', error);
      await interaction.reply({
        content: getText('error'),
        ephemeral: true
      });
    }
  },
};
