const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggestion')
    .setDescription('Gestionar sistema de sugerencias / Manage suggestion system')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('setup')
        .setDescription('Configurar canal de sugerencias / Configure suggestion channel')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('Canal para sugerencias / Channel for suggestions')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('approve')
        .setDescription('Aprobar sugerencia / Approve suggestion')
        .addIntegerOption(option =>
          option.setName('id')
            .setDescription('ID de la sugerencia / Suggestion ID')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Razón de aprobación / Approval reason')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('deny')
        .setDescription('Rechazar sugerencia / Deny suggestion')
        .addIntegerOption(option =>
          option.setName('id')
            .setDescription('ID de la sugerencia / Suggestion ID')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Razón de rechazo / Denial reason')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Listar sugerencias pendientes / List pending suggestions'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('Ver detalles de una sugerencia / View suggestion details')
        .addIntegerOption(option =>
          option.setName('id')
            .setDescription('ID de la sugerencia / Suggestion ID')
            .setRequired(true))),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const subcommand = interaction.options.getSubcommand();

    const configPath = path.join(__dirname, '../config.json');
    const suggestionsPath = path.join(__dirname, '../data/suggestions.json');

    let config = {};
    let suggestions = {};

    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    if (fs.existsSync(suggestionsPath)) {
      suggestions = JSON.parse(fs.readFileSync(suggestionsPath, 'utf8'));
    }

    switch (subcommand) {
      case 'setup':
        const channel = interaction.options.getChannel('channel');

        if (!config.suggestionChannels) {
          config.suggestionChannels = {};
        }

        config.suggestionChannels[interaction.guild.id] = channel.id;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

        await interaction.reply({
          embeds: [{
            title: lang === 'es' ? '✅ Sistema de Sugerencias Configurado' : '✅ Suggestion System Configured',
            description: lang === 'es'
              ? `El canal de sugerencias ha sido configurado en ${channel}.\n\nLos usuarios pueden usar \`/suggest\` para enviar sugerencias.`
              : `The suggestion channel has been configured to ${channel}.\n\nUsers can use \`/suggest\` to send suggestions.`,
            color: 0x57F287,
            timestamp: new Date()
          }],
          ephemeral: true
        });
        break;

      case 'approve':
      case 'deny':
        const id = interaction.options.getInteger('id');
        const reason = interaction.options.getString('reason') || (lang === 'es' ? 'Sin razón especificada' : 'No reason specified');

        if (!suggestions[interaction.guild.id]) {
          return await interaction.reply({
            content: lang === 'es' ? '❌ No hay sugerencias en este servidor.' : '❌ There are no suggestions in this server.',
            ephemeral: true
          });
        }

        const suggestionIndex = suggestions[interaction.guild.id].findIndex(s => s.id === id);

        if (suggestionIndex === -1) {
          return await interaction.reply({
            content: lang === 'es' ? `❌ No se encontró la sugerencia #${id}.` : `❌ Suggestion #${id} not found.`,
            ephemeral: true
          });
        }

        const suggestionData = suggestions[interaction.guild.id][suggestionIndex];

        if (suggestionData.status !== 'pending') {
          return await interaction.reply({
            content: lang === 'es'
              ? `❌ Esta sugerencia ya fue ${suggestionData.status === 'approved' ? 'aprobada' : 'rechazada'}.`
              : `❌ This suggestion was already ${suggestionData.status === 'approved' ? 'approved' : 'denied'}.`,
            ephemeral: true
          });
        }

        try {
          const channel = await interaction.guild.channels.fetch(suggestionData.channelId);
          const message = await channel.messages.fetch(suggestionData.messageId);

          const isApproved = subcommand === 'approve';
          suggestionData.status = isApproved ? 'approved' : 'denied';
          suggestionData.reviewedBy = interaction.user.id;
          suggestionData.reviewReason = reason;
          suggestionData.reviewedAt = Date.now();

          // Actualizar embed
          const embed = EmbedBuilder.from(message.embeds[0])
            .setColor(isApproved ? 0x57F287 : 0xED4245)
            .spliceFields(2, 1, {
              name: lang === 'es' ? '📊 Estado' : '📊 Status',
              value: isApproved
                ? (lang === 'es' ? '✅ Aprobada' : '✅ Approved')
                : (lang === 'es' ? '❌ Rechazada' : '❌ Denied'),
              inline: true
            })
            .addFields(
              { name: lang === 'es' ? '👮 Revisado por' : '👮 Reviewed by', value: `${interaction.user}`, inline: true },
              { name: lang === 'es' ? '📝 Razón' : '📝 Reason', value: reason, inline: false }
            );

          await message.edit({ embeds: [embed] });

          // Notificar al autor
          try {
            const author = await interaction.client.users.fetch(suggestionData.userId);
            await author.send({
              embeds: [{
                title: isApproved
                  ? (lang === 'es' ? '✅ Tu Sugerencia fue Aprobada' : '✅ Your Suggestion was Approved')
                  : (lang === 'es' ? '❌ Tu Sugerencia fue Rechazada' : '❌ Your Suggestion was Denied'),
                description: lang === 'es'
                  ? `Tu sugerencia #${id} en **${interaction.guild.name}** ha sido ${isApproved ? 'aprobada' : 'rechazada'}.\n\n**Razón:** ${reason}`
                  : `Your suggestion #${id} in **${interaction.guild.name}** has been ${isApproved ? 'approved' : 'denied'}.\n\n**Reason:** ${reason}`,
                color: isApproved ? 0x57F287 : 0xED4245,
                timestamp: new Date()
              }]
            });
          } catch (error) {
            // Usuario tiene DMs desactivados
          }

          // Guardar cambios
          suggestions[interaction.guild.id][suggestionIndex] = suggestionData;
          fs.writeFileSync(suggestionsPath, JSON.stringify(suggestions, null, 2));

          await interaction.reply({
            embeds: [{
              title: isApproved
                ? (lang === 'es' ? '✅ Sugerencia Aprobada' : '✅ Suggestion Approved')
                : (lang === 'es' ? '❌ Sugerencia Rechazada' : '❌ Suggestion Denied'),
              description: lang === 'es'
                ? `La sugerencia #${id} ha sido ${isApproved ? 'aprobada' : 'rechazada'}. El autor ha sido notificado.`
                : `Suggestion #${id} has been ${isApproved ? 'approved' : 'denied'}. The author has been notified.`,
              color: isApproved ? 0x57F287 : 0xED4245,
              timestamp: new Date()
            }],
            ephemeral: true
          });

        } catch (error) {
          console.error('Error updating suggestion:', error);
          await interaction.reply({
            content: lang === 'es'
              ? '❌ Hubo un error al actualizar la sugerencia.'
              : '❌ There was an error updating the suggestion.',
            ephemeral: true
          });
        }
        break;

      case 'list':
        if (!suggestions[interaction.guild.id] || suggestions[interaction.guild.id].length === 0) {
          return await interaction.reply({
            content: lang === 'es' ? '📭 No hay sugerencias en este servidor.' : '📭 There are no suggestions in this server.',
            ephemeral: true
          });
        }

        const pending = suggestions[interaction.guild.id].filter(s => s.status === 'pending');

        if (pending.length === 0) {
          return await interaction.reply({
            content: lang === 'es' ? '📭 No hay sugerencias pendientes.' : '📭 There are no pending suggestions.',
            ephemeral: true
          });
        }

        const listEmbed = new EmbedBuilder()
          .setTitle(lang === 'es' ? '📋 Sugerencias Pendientes' : '📋 Pending Suggestions')
          .setDescription(pending.map(s => 
            `**#${s.id}** - <@${s.userId}> - <t:${Math.floor(s.timestamp / 1000)}:R>\n${s.suggestion.substring(0, 100)}${s.suggestion.length > 100 ? '...' : ''}`
          ).join('\n\n'))
          .setColor(0x5865F2)
          .setFooter({ text: lang === 'es' ? `Total: ${pending.length} sugerencias` : `Total: ${pending.length} suggestions` })
          .setTimestamp();

        await interaction.reply({ embeds: [listEmbed], ephemeral: true });
        break;

      case 'view':
        const viewId = interaction.options.getInteger('id');

        if (!suggestions[interaction.guild.id]) {
          return await interaction.reply({
            content: lang === 'es' ? '❌ No hay sugerencias en este servidor.' : '❌ There are no suggestions in this server.',
            ephemeral: true
          });
        }

        const viewSuggestion = suggestions[interaction.guild.id].find(s => s.id === viewId);

        if (!viewSuggestion) {
          return await interaction.reply({
            content: lang === 'es' ? `❌ No se encontró la sugerencia #${viewId}.` : `❌ Suggestion #${viewId} not found.`,
            ephemeral: true
          });
        }

        const statusEmoji = {
          pending: '⏳',
          approved: '✅',
          denied: '❌'
        };

        const statusText = {
          pending: lang === 'es' ? 'Pendiente' : 'Pending',
          approved: lang === 'es' ? 'Aprobada' : 'Approved',
          denied: lang === 'es' ? 'Rechazada' : 'Denied'
        };

        const viewEmbed = new EmbedBuilder()
          .setTitle(lang === 'es' ? `💡 Sugerencia #${viewId}` : `💡 Suggestion #${viewId}`)
          .setDescription(viewSuggestion.suggestion)
          .setColor(viewSuggestion.status === 'approved' ? 0x57F287 : viewSuggestion.status === 'denied' ? 0xED4245 : 0x5865F2)
          .addFields(
            { name: lang === 'es' ? '👤 Autor' : '👤 Author', value: `<@${viewSuggestion.userId}>`, inline: true },
            { name: lang === 'es' ? '📅 Fecha' : '📅 Date', value: `<t:${Math.floor(viewSuggestion.timestamp / 1000)}:R>`, inline: true },
            { name: lang === 'es' ? '📊 Estado' : '📊 Status', value: `${statusEmoji[viewSuggestion.status]} ${statusText[viewSuggestion.status]}`, inline: true }
          );

        if (viewSuggestion.reviewedBy) {
          viewEmbed.addFields(
            { name: lang === 'es' ? '👮 Revisado por' : '👮 Reviewed by', value: `<@${viewSuggestion.reviewedBy}>`, inline: true },
            { name: lang === 'es' ? '📝 Razón' : '📝 Reason', value: viewSuggestion.reviewReason, inline: false }
          );
        }

        viewEmbed.setTimestamp();

        await interaction.reply({ embeds: [viewEmbed], ephemeral: true });
        break;
    }
  },
};
