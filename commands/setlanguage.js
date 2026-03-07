const { PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: {
    name: 'setlanguage',
    description: 'Configura el idioma del bot en el servidor',
    options: [
      {
        name: 'idioma',
        description: 'Idioma a configurar',
        type: 3, // STRING type
        required: true,
        choices: [
          { name: 'Español', value: 'es' },
          { name: 'English', value: 'en' },
        ],
      },
    ],
  },
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: '❌ Solo administradores pueden cambiar el idioma.',
        ephemeral: true
      });
    }

    const idioma = interaction.options.getString('idioma');
    
    try {
      const configPath = path.join(__dirname, '../config.json');
      let config = { prefixes: {}, languages: {} };
      
      if (fs.existsSync(configPath)) {
        const fileContent = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(fileContent);
      }
      
      if (!config.languages) {
        config.languages = {};
      }
      
      config.languages[interaction.guild.id] = idioma;
      
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

      const langName = idioma === 'es' ? 'Español 🇪🇸' : 'English 🇺🇸';
      const description = idioma === 'es' 
        ? 'El idioma del servidor ha sido cambiado a Español'
        : 'Server language has been changed to English';

      await interaction.reply({
        embeds: [{
          title: '✅ ' + (idioma === 'es' ? 'Idioma Configurado' : 'Language Configured'),
          description: description,
          fields: [
            { name: idioma === 'es' ? 'Idioma' : 'Language', value: langName },
          ],
          color: 0x57F287,
          timestamp: new Date(),
        }]
      });
    } catch (error) {
      console.error('Error en setlanguage:', error);
      await interaction.reply({
        content: '❌ Error al guardar el idioma.',
        ephemeral: true
      });
    }
  },
};
