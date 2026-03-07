const { PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: {
    name: 'setprefix',
    description: 'Changes the server command prefix',
    options: [
      {
        name: 'prefix',
        description: 'New prefix (!, ?, etc.)',
        type: 3, // STRING type
        required: true,
        max_length: 3,
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

    const nuevoPrefijo = interaction.options.getString('prefix');
    
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
      
      config.prefixes[interaction.guild.id] = nuevoPrefijo;
      
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

      const lang = interaction.client.getLanguage(interaction.guild.id);
      const title = lang === 'es' ? '✅ Prefijo Actualizado' : '✅ Prefix Updated';
      const description = lang === 'es' 
        ? `El nuevo prefijo es: \`${nuevoPrefijo}\``
        : `The new prefix is: \`${nuevoPrefijo}\``;
      const exampleLabel = lang === 'es' ? 'Ejemplo' : 'Example';
      const noteLabel = lang === 'es' ? 'Nota' : 'Note';
      const noteText = lang === 'es' 
        ? 'Los comandos slash (/) siempre funcionan'
        : 'Slash commands (/) always work';

      await interaction.reply({
        embeds: [{
          title: title,
          description: description,
          fields: [
            { name: exampleLabel, value: `${nuevoPrefijo}ping` },
            { name: noteLabel, value: noteText },
          ],
          color: 0x57F287,
          timestamp: new Date(),
        }]
      });
    } catch (error) {
      console.error('Error en setprefix:', error);
      await interaction.reply({
        content: getText('error'),
        ephemeral: true
      });
    }
  },
};
