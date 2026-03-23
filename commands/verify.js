const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder,
        ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const { getConfig, saveConfig } = require('../verification-system');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Configurar el sistema de verificación de entrada')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s => s.setName('setup')
      .setDescription('Configurar el sistema de verificación')
      .addStringOption(o => o.setName('mode')
        .setDescription('Modo de verificación')
        .setRequired(true)
        .addChoices(
          { name: '✅ Botón (un click)', value: 'button' },
          { name: '🔢 Captcha matemático', value: 'captcha' },
          { name: '🔑 Contraseña', value: 'password' }
        ))
      .addRoleOption(o => o.setName('member_role')
        .setDescription('Rol que se asigna al verificarse')
        .setRequired(true))
      .addChannelOption(o => o.setName('channel')
        .setDescription('Canal donde se envía el mensaje de verificación (fallback si DM falla)')
        .addChannelTypes(ChannelType.GuildText))
      .addStringOption(o => o.setName('password')
        .setDescription('Contraseña (solo para modo contraseña)')))
    .addSubcommand(s => s.setName('disable')
      .setDescription('Desactivar el sistema de verificación'))
    .addSubcommand(s => s.setName('status')
      .setDescription('Ver configuración actual'))
    .addSubcommand(s => s.setName('panel')
      .setDescription('Enviar el panel de verificación al canal configurado')),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const L = (es, en) => lang === 'es' ? es : en;
    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      const mode = interaction.options.getString('mode');
      const role = interaction.options.getRole('member_role');
      const channel = interaction.options.getChannel('channel');
      const password = interaction.options.getString('password');

      if (mode === 'password' && !password) {
        return interaction.reply({ content: L('❌ Debes ingresar una contraseña para el modo contraseña.', '❌ You must provide a password for password mode.'), ephemeral: true });
      }

      const cfg = {
        enabled: true,
        mode,
        memberRoleId: role.id,
        channelId: channel?.id || null,
        password: mode === 'password' ? password : null,
      };
      saveConfig(interaction.guild.id, cfg);

      const modeLabels = { button: '✅ Botón', captcha: '🔢 Captcha matemático', password: '🔑 Contraseña' };
      const embed = new EmbedBuilder()
        .setTitle(L('✅ Verificación Configurada', '✅ Verification Configured'))
        .setColor(0x57F287)
        .addFields(
          { name: L('Modo', 'Mode'), value: modeLabels[mode], inline: true },
          { name: L('Rol de miembro', 'Member role'), value: `${role}`, inline: true },
          { name: L('Canal fallback', 'Fallback channel'), value: channel ? `${channel}` : L('Solo DM', 'DM only'), inline: true },
        )
        .setFooter({ text: L('Usa /verify panel para enviar el mensaje de verificación al canal.', 'Use /verify panel to send the verification message to the channel.') })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'disable') {
      const cfg = getConfig(interaction.guild.id);
      if (!cfg) return interaction.reply({ content: L('❌ El sistema no está configurado.', '❌ System is not configured.'), ephemeral: true });
      cfg.enabled = false;
      saveConfig(interaction.guild.id, cfg);
      return interaction.reply({ content: L('✅ Sistema de verificación desactivado.', '✅ Verification system disabled.'), ephemeral: true });
    }

    if (sub === 'status') {
      const cfg = getConfig(interaction.guild.id);
      if (!cfg) return interaction.reply({ content: L('❌ El sistema no está configurado. Usa `/verify setup`.', '❌ System not configured. Use `/verify setup`.'), ephemeral: true });
      const modeLabels = { button: '✅ Botón', captcha: '🔢 Captcha matemático', password: '🔑 Contraseña' };
      const embed = new EmbedBuilder()
        .setTitle(L('🔍 Estado del Sistema de Verificación', '🔍 Verification System Status'))
        .setColor(cfg.enabled ? 0x57F287 : 0xED4245)
        .addFields(
          { name: L('Estado', 'Status'), value: cfg.enabled ? '✅ Activo' : '❌ Inactivo', inline: true },
          { name: L('Modo', 'Mode'), value: modeLabels[cfg.mode] || cfg.mode, inline: true },
          { name: L('Rol de miembro', 'Member role'), value: `<@&${cfg.memberRoleId}>`, inline: true },
          { name: L('Canal fallback', 'Fallback channel'), value: cfg.channelId ? `<#${cfg.channelId}>` : L('Solo DM', 'DM only'), inline: true },
          { name: L('Contraseña', 'Password'), value: cfg.mode === 'password' ? `||\`${cfg.password}\`||` : 'N/A', inline: true },
        )
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === 'panel') {
      const cfg = getConfig(interaction.guild.id);
      if (!cfg || !cfg.enabled) return interaction.reply({ content: L('❌ El sistema no está activo. Usa `/verify setup` primero.', '❌ System not active. Use `/verify setup` first.'), ephemeral: true });
      if (!cfg.channelId) return interaction.reply({ content: L('❌ No hay canal configurado. Agrega un canal en `/verify setup`.', '❌ No channel configured. Add a channel in `/verify setup`.'), ephemeral: true });

      const ch = interaction.guild.channels.cache.get(cfg.channelId);
      if (!ch) return interaction.reply({ content: L('❌ El canal configurado no existe.', '❌ Configured channel does not exist.'), ephemeral: true });

      const modeLabels = { button: '✅ Botón', captcha: '🔢 Captcha matemático', password: '🔑 Contraseña' };
      const embed = new EmbedBuilder()
        .setTitle(L('🔐 Verificación de Entrada', '🔐 Entry Verification'))
        .setDescription(L(
          `Para acceder al servidor debes verificarte.\n\nModo: **${modeLabels[cfg.mode]}**\n\nCuando te unas al servidor recibirás las instrucciones por DM (o aquí si tienes los DMs cerrados).`,
          `To access the server you must verify yourself.\n\nMode: **${modeLabels[cfg.mode]}**\n\nWhen you join the server you will receive instructions via DM (or here if your DMs are closed).`
        ))
        .setColor(0x5865F2)
        .setThumbnail(interaction.guild.iconURL())
        .setTimestamp();

      await ch.send({ embeds: [embed] });
      return interaction.reply({ content: L(`✅ Panel enviado a ${ch}.`, `✅ Panel sent to ${ch}.`), ephemeral: true });
    }
  }
};
