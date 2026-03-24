const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const guildConfig = require('../guild-config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggestion')
    .setDescription('Gestionar sistema de sugerencias / Manage suggestion system')
    .addSubcommand(subcommand =>
      subcommand
        .setName('submit')
        .setDescription('Enviar una sugerencia / Submit a suggestion')
        .addStringOption(option =>
          option.setName('suggestion')
            .setDescription('Tu sugerencia / Your suggestion')
            .setRequired(true)
            .setMaxLength(1000)))
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

    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }

    // Helper: load suggestions from SQLite (primary) or file (fallback/migration)
    function loadSuggestions() {
      const fromDb = guildConfig.get(interaction.guild.id, 'suggestions');
      if (fromDb) return fromDb;
      // fallback: file
      if (fs.existsSync(suggestionsPath)) {
        const all = JSON.parse(fs.readFileSync(suggestionsPath, 'utf8'));
        return all[interaction.guild.id] || [];
      }
      return [];
    }

    // Helper: save suggestions to SQLite (and keep file in sync)
    function saveSuggestions(list) {
      guildConfig.set(interaction.guild.id, 'suggestions', list);
      // also write to file for backup
      let all = {};
      if (fs.existsSync(suggestionsPath)) {
        try { all = JSON.parse(fs.readFileSync(suggestionsPath, 'utf8')); } catch {}
      }
      all[interaction.guild.id] = list;
      const dataDir = path.join(__dirname, '../data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(suggestionsPath, JSON.stringify(all, null, 2));
    }

    // Admin-only subcommands
    const adminSubs = ['setup', 'approve', 'deny', 'list', 'view'];
    if (adminSubs.includes(subcommand) && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: lang === 'es' ? '❌ Solo administradores pueden usar este subcomando.' : '❌ Only administrators can use this subcommand.',
        flags: 64
      });
    }

    switch (subcommand) {
      case 'submit': {
        const suggestionText = interaction.options.getString('suggestion');
        // Read from SQLite first, fallback to config.json
        const suggestionChannelId = guildConfig.get(interaction.guild.id, 'suggestionChannel') || config.suggestionChannels?.[interaction.guild.id];

        if (!suggestionChannelId) {
          return await interaction.reply({
            content: lang === 'es'
              ? '❌ No se ha configurado un canal de sugerencias. Un administrador debe usar `/suggestion setup` primero.'
              : '❌ No suggestion channel has been configured. An administrator must use `/suggestion setup` first.',
            flags: 64
          });
        }

        const suggestionChannel = await interaction.guild.channels.fetch(suggestionChannelId).catch(() => null);
        if (!suggestionChannel) {
          return await interaction.reply({
            content: lang === 'es' ? '❌ El canal de sugerencias no existe.' : '❌ The suggestion channel does not exist.',
            flags: 64
          });
        }

        const guildSuggestions = loadSuggestions();
        const newId = (guildSuggestions.length || 0) + 1;

        const submitEmbed = new EmbedBuilder()
          .setTitle(lang === 'es' ? `💡 Sugerencia #${newId}` : `💡 Suggestion #${newId}`)
          .setDescription(suggestionText)
          .setColor(0x5865F2)
          .addFields(
            { name: lang === 'es' ? '👤 Autor' : '👤 Author', value: `${interaction.user}`, inline: true },
            { name: lang === 'es' ? '📅 Fecha' : '📅 Date', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
            { name: lang === 'es' ? '📊 Estado' : '📊 Status', value: '⏳ Pendiente', inline: true }
          )
          .setTimestamp();

        const msg = await suggestionChannel.send({ embeds: [submitEmbed] });
        await msg.react('✅').catch(() => {});
        await msg.react('❌').catch(() => {});

        guildSuggestions.push({
          id: newId,
          suggestion: suggestionText,
          userId: interaction.user.id,
          channelId: suggestionChannelId,
          messageId: msg.id,
          status: 'pending',
          timestamp: Date.now()
        });

        saveSuggestions(guildSuggestions);

        return await interaction.reply({
          content: lang === 'es' ? `✅ Tu sugerencia #${newId} ha sido enviada.` : `✅ Your suggestion #${newId} has been submitted.`,
          flags: 64
        });
      }

      case 'setup':
        const channel = interaction.options.getChannel('channel');

        if (!config.suggestionChannels) {
          config.suggestionChannels = {};
        }

        config.suggestionChannels[interaction.guild.id] = channel.id;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        guildConfig.set(interaction.guild.id, 'suggestionChannel', channel.id);

        await interaction.reply({
          embeds: [{
            title: lang === 'es' ? '✅ Sistema de Sugerencias Configurado' : '✅ Suggestion System Configured',
            description: lang === 'es'
              ? `El canal de sugerencias ha sido configurado en ${channel}.\n\nLos usuarios pueden usar \`/suggest\` para enviar sugerencias.`
              : `The suggestion channel has been configured to ${channel}.\n\nUsers can use \`/suggest\` to send suggestions.`,
            color: 0x57F287,
            timestamp: new Date()
          }],
          flags: 64
        });
        break;

      case 'approve':
      case 'deny':
        const id = interaction.options.getInteger('id');
        const reason = interaction.options.getString('reason') || (lang === 'es' ? 'Sin razón especificada' : 'No reason specified');

        const guildSuggestionsAD = loadSuggestions();

        if (!guildSuggestionsAD || guildSuggestionsAD.length === 0) {
          return await interaction.reply({
            content: lang === 'es' ? '❌ No hay sugerencias en este servidor.' : '❌ There are no suggestions in this server.',
            flags: 64
          });
        }

        const suggestionIndex = guildSuggestionsAD.findIndex(s => s.id === id);

        if (suggestionIndex === -1) {
          return await interaction.reply({
            content: lang === 'es' ? `❌ No se encontró la sugerencia #${id}.` : `❌ Suggestion #${id} not found.`,
            flags: 64
          });
        }

        const suggestionData = guildSuggestionsAD[suggestionIndex];

        if (suggestionData.status !== 'pending') {
          return await interaction.reply({
            content: lang === 'es'
              ? `❌ Esta sugerencia ya fue ${suggestionData.status === 'approved' ? 'aprobada' : 'rechazada'}.`
              : `❌ This suggestion was already ${suggestionData.status === 'approved' ? 'approved' : 'denied'}.`,
            flags: 64
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
          } catch {}

          guildSuggestionsAD[suggestionIndex] = suggestionData;
          saveSuggestions(guildSuggestionsAD);

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
            flags: 64
          });

        } catch (error) {
          console.error('Error updating suggestion:', error);
          await interaction.reply({
            content: lang === 'es' ? '❌ Hubo un error al actualizar la sugerencia.' : '❌ There was an error updating the suggestion.',
            flags: 64
          });
        }
        break;

      case 'list': {
        const guildSuggestionsList = loadSuggestions();
        if (!guildSuggestionsList || guildSuggestionsList.length === 0) {
          return await interaction.reply({
            content: lang === 'es' ? '📭 No hay sugerencias en este servidor.' : '📭 There are no suggestions in this server.',
            flags: 64
          });
        }

        const pending = guildSuggestionsList.filter(s => s.status === 'pending');

        if (pending.length === 0) {
          return await interaction.reply({
            content: lang === 'es' ? '📭 No hay sugerencias pendientes.' : '📭 There are no pending suggestions.',
            flags: 64
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

        await interaction.reply({ embeds: [listEmbed], flags: 64 });
        break;
      }

      case 'view': {
        const viewId = interaction.options.getInteger('id');
        const guildSuggestionsView = loadSuggestions();

        if (!guildSuggestionsView || guildSuggestionsView.length === 0) {
          return await interaction.reply({
            content: lang === 'es' ? '❌ No hay sugerencias en este servidor.' : '❌ There are no suggestions in this server.',
            flags: 64
          });
        }

        const viewSuggestion = guildSuggestionsView.find(s => s.id === viewId);

        if (!viewSuggestion) {
          return await interaction.reply({
            content: lang === 'es' ? `❌ No se encontró la sugerencia #${viewId}.` : `❌ Suggestion #${viewId} not found.`,
            flags: 64
          });
        }

        const statusEmoji = { pending: '⏳', approved: '✅', denied: '❌' };
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
        await interaction.reply({ embeds: [viewEmbed], flags: 64 });
        break;
      }
    }
  },
};
