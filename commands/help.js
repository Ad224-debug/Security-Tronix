const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Muestra todos los comandos disponibles / Shows all available commands')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Categoría de comandos / Command category')
        .setRequired(false)
        .addChoices(
          { name: '🛡️ Moderación / Moderation', value: 'moderation' },
          { name: '⚙️ Configuración / Configuration', value: 'config' },
          { name: '📊 Información / Information', value: 'info' },
          { name: '🎉 Diversión / Fun', value: 'fun' },
          { name: '🎤 Voz / Voice', value: 'voice' },
          { name: '📅 Eventos / Events', value: 'events' },
          { name: '🤖 Bot', value: 'bot' }
        )),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const category = interaction.options.getString('category');

    const commands = {
      moderation: {
        title: lang === 'es' ? '🛡️ Comandos de Moderación' : '🛡️ Moderation Commands',
        commands: [
          { name: '/kick', desc: lang === 'es' ? 'Expulsar usuario' : 'Kick user' },
          { name: '/ban', desc: lang === 'es' ? 'Banear usuario' : 'Ban user' },
          { name: '/unban', desc: lang === 'es' ? 'Desbanear usuario' : 'Unban user' },
          { name: '/tempban', desc: lang === 'es' ? 'Ban temporal' : 'Temporary ban' },
          { name: '/softban', desc: lang === 'es' ? 'Ban y desban (limpia mensajes)' : 'Ban and unban (clean messages)' },
          { name: '/warn', desc: lang === 'es' ? 'Advertir usuario' : 'Warn user' },
          { name: '/unwarn', desc: lang === 'es' ? 'Remover advertencia' : 'Remove warning' },
          { name: '/timeout', desc: lang === 'es' ? 'Aislar usuario' : 'Timeout user' },
          { name: '/untimeout', desc: lang === 'es' ? 'Quitar aislamiento' : 'Remove timeout' },
          { name: '/case', desc: lang === 'es' ? 'Ver caso de moderación' : 'View moderation case' },
          { name: '/history', desc: lang === 'es' ? 'Ver historial de moderación' : 'View moderation history' },
          { name: '/note', desc: lang === 'es' ? 'Agregar nota privada' : 'Add private note' },
          { name: '/lockdown', desc: lang === 'es' ? 'Bloquear/desbloquear servidor' : 'Lock/unlock server' },
          { name: '/nuke', desc: lang === 'es' ? 'Eliminar y recrear canal' : 'Delete and recreate channel' },
          { name: '/clear', desc: lang === 'es' ? 'Limpiar mensajes' : 'Clear messages' },
        ]
      },
      config: {
        title: lang === 'es' ? '⚙️ Comandos de Configuración' : '⚙️ Configuration Commands',
        commands: [
          { name: '/modsetup', desc: lang === 'es' ? 'Configurar canales de logs' : 'Configure log channels' },
          { name: '/rb3setup', desc: lang === 'es' ? 'Configurar sistema de strikes' : 'Configure strike system' },
          { name: '/automod', desc: lang === 'es' ? 'Configurar auto-moderación' : 'Configure auto-moderation' },
          { name: '/setreportchannel', desc: lang === 'es' ? 'Canal de reportes' : 'Report channel' },
          { name: '/setboostchannel', desc: lang === 'es' ? 'Canal de boosts' : 'Boost channel' },
          { name: '/setcmdpermission', desc: lang === 'es' ? 'Permisos de comandos' : 'Command permissions' },
          { name: '/botpermission', desc: lang === 'es' ? 'Control de bots' : 'Bot control' },
          { name: '/warnsetup', desc: lang === 'es' ? 'Configurar advertencias' : 'Configure warnings' },
          { name: '/setprefix', desc: lang === 'es' ? 'Cambiar prefijo' : 'Change prefix' },
          { name: '/resetprefix', desc: lang === 'es' ? 'Resetear prefijo' : 'Reset prefix' },
        ]
      },
      info: {
        title: lang === 'es' ? '📊 Comandos de Información' : '📊 Information Commands',
        commands: [
          { name: '/userinfo', desc: lang === 'es' ? 'Información de usuario' : 'User information' },
          { name: '/serverinfo', desc: lang === 'es' ? 'Información del servidor' : 'Server information' },
          { name: '/botinfo', desc: lang === 'es' ? 'Información del bot' : 'Bot information' },
          { name: '/roleinfo', desc: lang === 'es' ? 'Información de rol' : 'Role information' },
          { name: '/membercount', desc: lang === 'es' ? 'Contador de miembros' : 'Member count' },
          { name: '/invites', desc: lang === 'es' ? 'Ver invitaciones' : 'View invites' },
          { name: '/avatar', desc: lang === 'es' ? 'Ver avatar' : 'View avatar' },
        ]
      },
      fun: {
        title: lang === 'es' ? '🎉 Comandos de Diversión' : '🎉 Fun Commands',
        commands: [
          { name: '/hug', desc: lang === 'es' ? 'Abrazar a alguien' : 'Hug someone' },
          { name: '/kiss', desc: lang === 'es' ? 'Besar a alguien' : 'Kiss someone' },
          { name: '/pat', desc: lang === 'es' ? 'Acariciar a alguien' : 'Pat someone' },
          { name: '/slap', desc: lang === 'es' ? 'Abofetear a alguien' : 'Slap someone' },
          { name: '/dance', desc: lang === 'es' ? 'Bailar' : 'Dance' },
          { name: '/cry', desc: lang === 'es' ? 'Llorar' : 'Cry' },
          { name: '/poll', desc: lang === 'es' ? 'Crear encuesta' : 'Create poll' },
          { name: '/afk', desc: lang === 'es' ? 'Establecer estado AFK' : 'Set AFK status' },
          { name: '/announce', desc: lang === 'es' ? 'Hacer anuncio' : 'Make announcement' },
        ]
      },
      voice: {
        title: lang === 'es' ? '🎤 Comandos de Voz' : '🎤 Voice Commands',
        commands: [
          { name: '/vcjoin', desc: lang === 'es' ? 'Bot se une a voz' : 'Bot joins voice' },
          { name: '/vcleave', desc: lang === 'es' ? 'Bot sale de voz' : 'Bot leaves voice' },
          { name: '/vckick', desc: lang === 'es' ? 'Expulsar de voz' : 'Kick from voice' },
          { name: '/vcmute', desc: lang === 'es' ? 'Mutear en voz' : 'Mute in voice' },
          { name: '/vcunmute', desc: lang === 'es' ? 'Desmutear en voz' : 'Unmute in voice' },
          { name: '/vcban', desc: lang === 'es' ? 'Banear de canal de voz' : 'Ban from voice channel' },
        ]
      },
      events: {
        title: lang === 'es' ? '📅 Comandos de Eventos' : '📅 Event Commands',
        commands: [
          { name: '/event create', desc: lang === 'es' ? 'Crear evento' : 'Create event' },
          { name: '/event list', desc: lang === 'es' ? 'Listar eventos' : 'List events' },
          { name: '/event edit', desc: lang === 'es' ? 'Editar evento' : 'Edit event' },
          { name: '/event delete', desc: lang === 'es' ? 'Eliminar evento' : 'Delete event' },
          { name: '/event stats', desc: lang === 'es' ? 'Estadísticas de eventos' : 'Event statistics' },
        ]
      },
      bot: {
        title: lang === 'es' ? '🤖 Comandos del Bot' : '🤖 Bot Commands',
        commands: [
          { name: '/sync', desc: lang === 'es' ? 'Sincronizar comandos' : 'Sync commands' },
          { name: '/setbotname', desc: lang === 'es' ? 'Cambiar nombre del bot' : 'Change bot name' },
          { name: '/setbotavatar', desc: lang === 'es' ? 'Cambiar avatar del bot' : 'Change bot avatar' },
          { name: '/report', desc: lang === 'es' ? 'Reportar usuario' : 'Report user' },
        ]
      }
    };

    if (category && commands[category]) {
      const cat = commands[category];
      const embed = new EmbedBuilder()
        .setTitle(cat.title)
        .setDescription(cat.commands.map(cmd => `**${cmd.name}** - ${cmd.desc}`).join('\n'))
        .setColor(0x5865F2)
        .setFooter({ text: lang === 'es' ? 'Usa /help para ver todas las categorías' : 'Use /help to see all categories' })
        .setTimestamp();

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Mostrar todas las categorías
    const mainEmbed = new EmbedBuilder()
      .setTitle(lang === 'es' ? '📚 Centro de Ayuda' : '📚 Help Center')
      .setDescription(lang === 'es' 
        ? `¡Bienvenido al centro de ayuda! Selecciona una categoría para ver los comandos disponibles.\n\n**Total de comandos:** ${interaction.client.commands.size}`
        : `Welcome to the help center! Select a category to see available commands.\n\n**Total commands:** ${interaction.client.commands.size}`)
      .setColor(0x5865F2)
      .addFields(
        { name: '🛡️ Moderación', value: `${commands.moderation.commands.length} comandos`, inline: true },
        { name: '⚙️ Configuración', value: `${commands.config.commands.length} comandos`, inline: true },
        { name: '📊 Información', value: `${commands.info.commands.length} comandos`, inline: true },
        { name: '🎉 Diversión', value: `${commands.fun.commands.length} comandos`, inline: true },
        { name: '🎤 Voz', value: `${commands.voice.commands.length} comandos`, inline: true },
        { name: '📅 Eventos', value: `${commands.events.commands.length} comandos`, inline: true }
      )
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setFooter({ text: lang === 'es' ? 'Usa /help category:<categoría> para ver comandos específicos' : 'Use /help category:<category> to see specific commands' })
      .setTimestamp();

    await interaction.reply({ embeds: [mainEmbed], ephemeral: true });
  },
};
