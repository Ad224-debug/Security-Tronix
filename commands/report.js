const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Report a user to moderators')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to report')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the report')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('evidence')
        .setDescription('Evidence (message link, screenshot link, etc.)')
        .setRequired(false)),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const usuario = interaction.options.getUser('user');
    const razon = interaction.options.getString('reason');
    const evidencia = interaction.options.getString('evidence');

    if (usuario.id === interaction.user.id) {
      return await interaction.reply({
        content: lang === 'es' ? '❌ No puedes reportarte a ti mismo.' : '❌ You cannot report yourself.',
        ephemeral: true
      });
    }

    if (usuario.bot) {
      return await interaction.reply({
        content: lang === 'es' ? '❌ No puedes reportar bots.' : '❌ You cannot report bots.',
        ephemeral: true
      });
    }

    // Obtener canal de reportes
    const configPath = path.join(__dirname, '../config.json');
    let reportChannelId = null;
    
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      reportChannelId = config.reportChannels?.[interaction.guild.id];
    }

    if (!reportChannelId) {
      return await interaction.reply({
        content: lang === 'es' 
          ? '❌ No se ha configurado un canal de reportes. Un administrador debe usar `/config reportchannel` primero.'
          : '❌ No report channel has been configured. An administrator must use `/config reportchannel` first.',
        ephemeral: true
      });
    }

    const reportChannel = await interaction.guild.channels.fetch(reportChannelId).catch(() => null);

    if (!reportChannel) {
      return await interaction.reply({
        content: lang === 'es' ? '❌ El canal de reportes configurado no existe.' : '❌ The configured report channel does not exist.',
        ephemeral: true
      });
    }

    // Crear ID único para el reporte
    const reportId = `${Date.now()}-${interaction.user.id}`;

    const embed = new EmbedBuilder()
      .setTitle(lang === 'es' ? '🚨 Nuevo Reporte' : '🚨 New Report')
      .setColor(0xED4245)
      .addFields(
        { name: lang === 'es' ? '👤 Usuario Reportado' : '👤 Reported User', value: `${usuario} (${usuario.tag})\nID: ${usuario.id}`, inline: true },
        { name: lang === 'es' ? '👮 Reportado por' : '👮 Reported by', value: `${interaction.user} (${interaction.user.tag})\nID: ${interaction.user.id}`, inline: true },
        { name: lang === 'es' ? '📝 Razón' : '📝 Reason', value: razon, inline: false }
      )
      .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: `Report ID: ${reportId}` })
      .setTimestamp();

    if (evidencia) {
      embed.addFields({
        name: lang === 'es' ? '🔗 Evidencia' : '🔗 Evidence',
        value: evidencia,
        inline: false
      });
    }

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`report_action_${reportId}_warn`)
          .setLabel(lang === 'es' ? 'Advertir' : 'Warn')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('⚠️'),
        new ButtonBuilder()
          .setCustomId(`report_action_${reportId}_timeout`)
          .setLabel(lang === 'es' ? 'Timeout' : 'Timeout')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('⏱️'),
        new ButtonBuilder()
          .setCustomId(`report_action_${reportId}_kick`)
          .setLabel(lang === 'es' ? 'Expulsar' : 'Kick')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('👢'),
        new ButtonBuilder()
          .setCustomId(`report_action_${reportId}_ban`)
          .setLabel(lang === 'es' ? 'Banear' : 'Ban')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🔨'),
        new ButtonBuilder()
          .setCustomId(`report_action_${reportId}_dismiss`)
          .setLabel(lang === 'es' ? 'Descartar' : 'Dismiss')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('✖️')
      );

    await reportChannel.send({ 
      content: `<@&${interaction.guild.roles.cache.find(r => r.permissions.has('Administrator'))?.id || interaction.guild.ownerId}>`,
      embeds: [embed],
      components: [row]
    });

    await interaction.reply({
      content: lang === 'es' 
        ? '✅ Tu reporte ha sido enviado al equipo de moderación. Gracias por ayudar a mantener la comunidad segura.'
        : '✅ Your report has been sent to the moderation team. Thank you for helping keep the community safe.',
      ephemeral: true
    });
  },
};
