const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('Envía una sugerencia al servidor / Send a suggestion to the server')
    .addStringOption(option =>
      option.setName('suggestion')
        .setDescription('Tu sugerencia / Your suggestion')
        .setRequired(true)
        .setMaxLength(1000)),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const suggestion = interaction.options.getString('suggestion');

    // Cargar configuración
    const configPath = path.join(__dirname, '../config.json');
    let config = {};
    
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    const suggestionChannelId = config.suggestionChannels?.[interaction.guild.id];

    if (!suggestionChannelId) {
      return await interaction.reply({
        content: lang === 'es'
          ? '❌ El sistema de sugerencias no está configurado. Un administrador debe usar `/suggestion setup` primero.'
          : '❌ The suggestion system is not configured. An administrator must use `/suggestion setup` first.',
        ephemeral: true
      });
    }

    try {
      const suggestionChannel = await interaction.guild.channels.fetch(suggestionChannelId);

      if (!suggestionChannel) {
        return await interaction.reply({
          content: lang === 'es'
            ? '❌ El canal de sugerencias no existe. Contacta a un administrador.'
            : '❌ The suggestion channel does not exist. Contact an administrator.',
          ephemeral: true
        });
      }

      // Crear ID único para la sugerencia
      const suggestionsPath = path.join(__dirname, '../data/suggestions.json');
      let suggestions = {};
      
      if (fs.existsSync(suggestionsPath)) {
        suggestions = JSON.parse(fs.readFileSync(suggestionsPath, 'utf8'));
      }

      if (!suggestions[interaction.guild.id]) {
        suggestions[interaction.guild.id] = [];
      }

      const suggestionId = suggestions[interaction.guild.id].length + 1;

      // Crear embed de sugerencia
      const embed = new EmbedBuilder()
        .setTitle(lang === 'es' ? `💡 Sugerencia #${suggestionId}` : `💡 Suggestion #${suggestionId}`)
        .setDescription(suggestion)
        .setColor(0x5865F2)
        .addFields(
          { name: lang === 'es' ? '👤 Autor' : '👤 Author', value: `${interaction.user}`, inline: true },
          { name: lang === 'es' ? '📅 Fecha' : '📅 Date', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
          { name: lang === 'es' ? '📊 Estado' : '📊 Status', value: lang === 'es' ? '⏳ Pendiente' : '⏳ Pending', inline: true }
        )
        .setFooter({ text: `ID: ${suggestionId}` })
        .setTimestamp();

      // Enviar sugerencia al canal
      const message = await suggestionChannel.send({ embeds: [embed] });

      // Agregar reacciones para votar
      await message.react('✅');
      await message.react('❌');

      // Guardar sugerencia
      suggestions[interaction.guild.id].push({
        id: suggestionId,
        userId: interaction.user.id,
        username: interaction.user.tag,
        suggestion: suggestion,
        messageId: message.id,
        channelId: suggestionChannel.id,
        status: 'pending',
        timestamp: Date.now(),
        votes: { yes: 0, no: 0 }
      });

      fs.writeFileSync(suggestionsPath, JSON.stringify(suggestions, null, 2));

      // Confirmar al usuario
      await interaction.reply({
        embeds: [{
          title: lang === 'es' ? '✅ Sugerencia Enviada' : '✅ Suggestion Sent',
          description: lang === 'es'
            ? `Tu sugerencia #${suggestionId} ha sido enviada a ${suggestionChannel}. ¡Gracias por tu aporte!`
            : `Your suggestion #${suggestionId} has been sent to ${suggestionChannel}. Thank you for your contribution!`,
          color: 0x57F287,
          timestamp: new Date()
        }],
        ephemeral: true
      });

    } catch (error) {
      console.error('Error sending suggestion:', error);
      await interaction.reply({
        content: lang === 'es'
          ? '❌ Hubo un error al enviar tu sugerencia. Inténtalo de nuevo.'
          : '❌ There was an error sending your suggestion. Please try again.',
        ephemeral: true
      });
    }
  },
};
