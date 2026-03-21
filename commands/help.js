const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Muestra todos los comandos disponibles / Shows all available commands')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Categoría de comandos / Command category')
        .setRequired(false)
        .addChoices(
          { name: '🛡️ Moderación', value: 'moderation' },
          { name: '⚙️ Configuración', value: 'config' },
          { name: '📊 Información', value: 'info' },
          { name: '🔒 Seguridad', value: 'security' },
          { name: '🎉 Diversión', value: 'fun' },
          { name: '🎤 Voz', value: 'voice' },
          { name: '📅 Eventos', value: 'events' },
          { name: '🤖 Admin/Bot', value: 'bot' }
        )),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const L = (es, en) => lang === 'es' ? es : en;
    const category = interaction.options.getString('category');

    const commands = {
      moderation: {
        title: L('🛡️ Moderación', '🛡️ Moderation'),
        color: 0xED4245,
        commands: [
          { name: '/mod ban', desc: L('Banear usuario', 'Ban user') },
          { name: '/mod kick', desc: L('Expulsar usuario', 'Kick user') },
          { name: '/mod unban', desc: L('Desbanear usuario', 'Unban user') },
          { name: '/mod tempban', desc: L('Ban temporal', 'Temporary ban') },
          { name: '/mod softban', desc: L('Ban y desban (limpia mensajes)', 'Ban and unban (clean messages)') },
          { name: '/mod warn', desc: L('Advertir usuario', 'Warn user') },
          { name: '/mod unwarn', desc: L('Remover advertencia', 'Remove warning') },
          { name: '/mod timeout', desc: L('Aislar usuario temporalmente', 'Timeout user') },
          { name: '/mod untimeout', desc: L('Quitar aislamiento', 'Remove timeout') },
          { name: '/mod history', desc: L('Historial de moderación de un usuario', 'User moderation history') },
          { name: '/mod case', desc: L('Ver detalles de un caso', 'View case details') },
          { name: '/mod note', desc: L('Agregar nota privada a un usuario', 'Add private note to user') },
          { name: '/mod log', desc: L('Registrar mensajes de un usuario', 'Log user messages') },
          { name: '/mod stoplog', desc: L('Detener registro y exportar', 'Stop log and export') },
          { name: '/case', desc: L('Ver caso de moderación por ID', 'View moderation case by ID') },
          { name: '/warnings', desc: L('Ver advertencias de un usuario', 'View user warnings') },
          { name: '/mute', desc: L('Mutear usuario en el canal', 'Mute user in channel') },
          { name: '/unmute', desc: L('Desmutear usuario en el canal', 'Unmute user in channel') },
          { name: '/purge', desc: L('Eliminar mensajes en masa', 'Bulk delete messages') },
          { name: '/lock', desc: L('Bloquear/desbloquear canal', 'Lock/unlock channel') },
          { name: '/slowmode', desc: L('Configurar modo lento del canal', 'Set channel slowmode') },
          { name: '/nickname', desc: L('Cambiar apodo de un usuario', 'Change user nickname') },
          { name: '/role', desc: L('Asignar/remover roles', 'Assign/remove roles') },
          { name: '/report', desc: L('Reportar usuario a moderadores', 'Report user to moderators') },
        ]
      },
      config: {
        title: L('⚙️ Configuración', '⚙️ Configuration'),
        color: 0x5865F2,
        commands: [
          { name: '/config modlogs', desc: L('Configurar canales de logs de moderación', 'Configure moderation log channels') },
          { name: '/config modlogs_view', desc: L('Ver configuración de logs', 'View log configuration') },
          { name: '/config language', desc: L('Cambiar idioma del bot', 'Change bot language') },
          { name: '/config prefix', desc: L('Cambiar prefijo del bot', 'Change bot prefix') },
          { name: '/config boostchannel', desc: L('Canal de notificaciones de boost', 'Boost notification channel') },
          { name: '/config reportchannel', desc: L('Canal de reportes', 'Report channel') },
          { name: '/config warnsetup', desc: L('Configurar sistema de advertencias', 'Configure warning system') },
          { name: '/config rb3', desc: L('Configurar sistema de strikes RB3', 'Configure RB3 strike system') },
          { name: '/config botperm', desc: L('Control de permisos para agregar bots', 'Bot add permission control') },
          { name: '/config cmdperm', desc: L('Permisos personalizados por comando', 'Custom command permissions') },
          { name: '/config joincheck', desc: L('Canal de análisis de reputación al unirse', 'Join reputation check channel') },
          { name: '/config antiraid', desc: L('Configurar sistema anti-raid', 'Configure anti-raid system') },
          { name: '/modsetup', desc: L('Configurar canales de logs (legacy)', 'Configure log channels (legacy)') },
          { name: '/automod', desc: L('Panel de auto-moderación', 'Auto-moderation panel') },
          { name: '/suggestion setup', desc: L('Configurar canal de sugerencias', 'Configure suggestion channel') },
        ]
      },
      info: {
        title: L('📊 Información', '📊 Information'),
        color: 0x3498DB,
        commands: [
          { name: '/info user', desc: L('Información de un usuario', 'User information') },
          { name: '/info server', desc: L('Información del servidor', 'Server information') },
          { name: '/info bot', desc: L('Información del bot', 'Bot information') },
          { name: '/info role', desc: L('Información de un rol', 'Role information') },
          { name: '/avatar', desc: L('Ver avatar de un usuario', 'View user avatar') },
          { name: '/messageview', desc: L('Ver historial de mensajes de un usuario', 'View user message history') },
          { name: '/suggestion list', desc: L('Listar sugerencias pendientes', 'List pending suggestions') },
          { name: '/suggestion view', desc: L('Ver detalles de una sugerencia', 'View suggestion details') },
        ]
      },
      security: {
        title: L('🔒 Seguridad', '🔒 Security'),
        color: 0xFF6600,
        commands: [
          { name: '/antiraid status', desc: L('Ver estado del sistema anti-raid', 'View anti-raid status') },
          { name: '/antiraid unlock', desc: L('Levantar lockdown manualmente', 'Manually lift lockdown') },
          { name: '/security ipinfo', desc: L('Información de una dirección IP', 'IP address information') },
          { name: '/security scanurl', desc: L('Analizar si una URL es maliciosa', 'Scan URL for malware') },
          { name: '/security usercheck', desc: L('Análisis de seguridad de un usuario', 'User security analysis') },
          { name: '/security roblox', desc: L('Información de cuenta de Roblox', 'Roblox account information') },
          { name: '/security roblox_avatar', desc: L('Avatar de cuenta de Roblox', 'Roblox account avatar') },
        ]
      },
      fun: {
        title: L('🎉 Diversión', '🎉 Fun'),
        color: 0xFEE75C,
        commands: [
          { name: '/fun hug', desc: L('Abrazar a alguien', 'Hug someone') },
          { name: '/fun kiss', desc: L('Besar a alguien', 'Kiss someone') },
          { name: '/fun pat', desc: L('Acariciar a alguien', 'Pat someone') },
          { name: '/fun slap', desc: L('Abofetear a alguien', 'Slap someone') },
          { name: '/fun dance', desc: L('Bailar', 'Dance') },
          { name: '/fun cry', desc: L('Llorar', 'Cry') },
          { name: '/fun poll', desc: L('Crear encuesta', 'Create poll') },
          { name: '/fun afk', desc: L('Establecer estado AFK', 'Set AFK status') },
          { name: '/fun announce', desc: L('Hacer un anuncio', 'Make an announcement') },
          { name: '/say', desc: L('Hacer que el bot envíe un mensaje', 'Make the bot send a message') },
          { name: '/embed', desc: L('Crear embed personalizado', 'Create custom embed') },
          { name: '/hello', desc: L('El bot te saluda', 'The bot greets you') },
          { name: '/suggestion', desc: L('Enviar sugerencia al servidor', 'Submit a suggestion') },
        ]
      },
      voice: {
        title: L('🎤 Voz', '🎤 Voice'),
        color: 0x57F287,
        commands: [
          { name: '/vc join', desc: L('Bot se une a tu canal de voz', 'Bot joins your voice channel') },
          { name: '/vc leave', desc: L('Bot abandona el canal de voz', 'Bot leaves voice channel') },
          { name: '/vc kick', desc: L('Expulsar usuario de voz', 'Kick user from voice') },
          { name: '/vc mute', desc: L('Mutear usuario en voz', 'Mute user in voice') },
          { name: '/vc unmute', desc: L('Desmutear usuario en voz', 'Unmute user in voice') },
          { name: '/vc ban', desc: L('Banear usuario de canal de voz', 'Ban user from voice channel') },
        ]
      },
      events: {
        title: L('📅 Eventos', '📅 Events'),
        color: 0x9B59B6,
        commands: [
          { name: '/event create', desc: L('Crear nuevo evento', 'Create new event') },
          { name: '/event list', desc: L('Listar eventos activos', 'List active events') },
          { name: '/event view', desc: L('Ver detalles de un evento', 'View event details') },
          { name: '/event edit', desc: L('Editar evento existente', 'Edit existing event') },
          { name: '/event delete', desc: L('Eliminar evento', 'Delete event') },
          { name: '/event cancel', desc: L('Cancelar evento', 'Cancel event') },
          { name: '/event stats', desc: L('Estadísticas de eventos', 'Event statistics') },
          { name: '/event rsvp', desc: L('Confirmar asistencia a evento', 'RSVP to event') },
          { name: '/event waitlist', desc: L('Ver lista de espera', 'View waitlist') },
        ]
      },
      bot: {
        title: L('🤖 Admin / Bot', '🤖 Admin / Bot'),
        color: 0x99AAB5,
        commands: [
          { name: '/admin clear', desc: L('Limpiar mensajes del canal', 'Clear channel messages') },
          { name: '/admin dm', desc: L('Enviar DM a usuario(s)', 'Send DM to user(s)') },
          { name: '/admin purgebot', desc: L('Eliminar mensajes de bots', 'Delete bot messages') },
          { name: '/admin backup', desc: L('Crear/restaurar backup de configuración', 'Create/restore config backup') },
          { name: '/setbotname', desc: L('Cambiar nombre del bot', 'Change bot name') },
          { name: '/setbotavatar', desc: L('Cambiar avatar del bot', 'Change bot avatar') },
          { name: '/sync', desc: L('Sincronizar comandos slash', 'Sync slash commands') },
          { name: '/suggestion approve', desc: L('Aprobar sugerencia', 'Approve suggestion') },
          { name: '/suggestion deny', desc: L('Rechazar sugerencia', 'Deny suggestion') },
        ]
      }
    };

    if (category && commands[category]) {
      const cat = commands[category];
      const embed = new EmbedBuilder()
        .setTitle(cat.title)
        .setDescription(cat.commands.map(cmd => `**${cmd.name}** — ${cmd.desc}`).join('\n'))
        .setColor(cat.color)
        .setFooter({ text: L('Usa /help para ver todas las categorías', 'Use /help to see all categories') })
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Vista general de categorías
    const total = Object.values(commands).reduce((acc, cat) => acc + cat.commands.length, 0);
    const mainEmbed = new EmbedBuilder()
      .setTitle(L('📚 Centro de Ayuda — Tronix', '📚 Help Center — Tronix'))
      .setDescription(L(
        `Selecciona una categoría para ver los comandos disponibles.\n\n**Total de comandos:** ${total}`,
        `Select a category to see available commands.\n\n**Total commands:** ${total}`
      ))
      .setColor(0x5865F2)
      .addFields(
        { name: '🛡️ Moderación', value: `${commands.moderation.commands.length} cmds`, inline: true },
        { name: '⚙️ Configuración', value: `${commands.config.commands.length} cmds`, inline: true },
        { name: '📊 Información', value: `${commands.info.commands.length} cmds`, inline: true },
        { name: '🔒 Seguridad', value: `${commands.security.commands.length} cmds`, inline: true },
        { name: '🎉 Diversión', value: `${commands.fun.commands.length} cmds`, inline: true },
        { name: '🎤 Voz', value: `${commands.voice.commands.length} cmds`, inline: true },
        { name: '📅 Eventos', value: `${commands.events.commands.length} cmds`, inline: true },
        { name: '🤖 Admin/Bot', value: `${commands.bot.commands.length} cmds`, inline: true },
      )
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setFooter({ text: L('Usa /help category:<categoría> para ver comandos específicos', 'Use /help category:<category> to see specific commands') })
      .setTimestamp();

    await interaction.reply({ embeds: [mainEmbed], ephemeral: true });
  },
};
