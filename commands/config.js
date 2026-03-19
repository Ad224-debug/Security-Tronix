const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configuración del servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    // modlogs
    .addSubcommand(s => s.setName('modlogs').setDescription('Configurar canales de logs de moderación')
      .addStringOption(o => o.setName('type').setDescription('Tipo de log').setRequired(true).addChoices({ name: 'Kicks', value: 'kicks' }, { name: 'Bans', value: 'bans' }, { name: 'Warnings', value: 'warnings' }, { name: 'Timeouts', value: 'timeouts' }, { name: 'Automod', value: 'automod' }, { name: 'Todos', value: 'all' }))
      .addChannelOption(o => o.setName('channel').setDescription('Canal').addChannelTypes(ChannelType.GuildText).setRequired(true)))
    // modlogs view
    .addSubcommand(s => s.setName('modlogs_view').setDescription('Ver configuración de logs de moderación'))
    // boostchannel
    .addSubcommand(s => s.setName('boostchannel').setDescription('Canal de notificaciones de boost')
      .addChannelOption(o => o.setName('channel').setDescription('Canal').addChannelTypes(ChannelType.GuildText).setRequired(true)))
    // reportchannel
    .addSubcommand(s => s.setName('reportchannel').setDescription('Canal de reportes')
      .addChannelOption(o => o.setName('channel').setDescription('Canal').addChannelTypes(ChannelType.GuildText).setRequired(true)))
    // prefix
    .addSubcommand(s => s.setName('prefix').setDescription('Cambiar prefijo del bot')
      .addStringOption(o => o.setName('prefix').setDescription('Nuevo prefijo').setRequired(true).setMaxLength(3)))
    // warnsetup
    .addSubcommand(s => s.setName('warnsetup').setDescription('Configurar sistema de advertencias')
      .addBooleanOption(o => o.setName('dm').setDescription('Notificar por DM al advertir').setRequired(true))
      .addStringOption(o => o.setName('action').setDescription('Acción automática').addChoices({ name: 'Ninguna', value: 'none' }, { name: 'Kick', value: 'kick' }, { name: 'Ban', value: 'ban' }, { name: 'Timeout', value: 'timeout' }))
      .addIntegerOption(o => o.setName('threshold').setDescription('Advertencias para acción automática').setMinValue(1).setMaxValue(20)))
    // rb3setup
    .addSubcommand(s => s.setName('rb3').setDescription('Configurar sistema RB3')
      .addStringOption(o => o.setName('option').setDescription('Opción').setRequired(true).addChoices({ name: 'Activar/Desactivar', value: 'enable' }, { name: 'Strike 1', value: 'strike1' }, { name: 'Strike 2', value: 'strike2' }, { name: 'Strike 3', value: 'strike3' }, { name: 'Ver config', value: 'view' }))
      .addStringOption(o => o.setName('value').setDescription('Valor (para strikes: warn/timeout_1h/timeout_6h/timeout_24h/kick/ban)')))
    // botpermission
    .addSubcommand(s => s.setName('botperm').setDescription('Gestionar permisos para agregar bots (solo owner)')
      .addStringOption(o => o.setName('action').setDescription('Acción').setRequired(true).addChoices({ name: 'Agregar usuario', value: 'add' }, { name: 'Remover usuario', value: 'remove' }, { name: 'Listar', value: 'list' }, { name: 'Activar/Desactivar', value: 'toggle' }))
      .addUserOption(o => o.setName('user').setDescription('Usuario'))
      .addBooleanOption(o => o.setName('enabled').setDescription('Activar o desactivar')))
    // cmdpermission
    .addSubcommand(s => s.setName('cmdperm').setDescription('Configurar permisos de comandos')
      .addStringOption(o => o.setName('command').setDescription('Nombre del comando').setRequired(true))
      .addStringOption(o => o.setName('action').setDescription('Acción').setRequired(true).addChoices({ name: 'Agregar usuario', value: 'add_user' }, { name: 'Agregar rol', value: 'add_role' }, { name: 'Remover usuario', value: 'remove_user' }, { name: 'Remover rol', value: 'remove_role' }, { name: 'Limpiar', value: 'clear' }, { name: 'Ver', value: 'view' }))
      .addUserOption(o => o.setName('user').setDescription('Usuario'))
      .addRoleOption(o => o.setName('role').setDescription('Rol'))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const L = (es, en) => lang === 'es' ? es : en;
    const configPath = path.join(__dirname, '../config.json');
    let config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
    const save = () => fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // ── MODLOGS ──────────────────────────────────────────────────────────────
    if (sub === 'modlogs') {
      const type = interaction.options.getString('type');
      const channel = interaction.options.getChannel('channel');
      if (!config.modLogs) config.modLogs = {};
      if (!config.modLogs[interaction.guild.id]) config.modLogs[interaction.guild.id] = {};
      if (type === 'all') {
        ['kicks', 'bans', 'warnings', 'timeouts', 'automod'].forEach(t => config.modLogs[interaction.guild.id][t] = channel.id);
      } else {
        config.modLogs[interaction.guild.id][type] = channel.id;
      }
      save();
      return interaction.reply({ content: `✅ Canal de logs **${type}** configurado: ${channel}`, ephemeral: true });
    }

    if (sub === 'modlogs_view') {
      if (!config.modLogs) config.modLogs = {};
      const gl = config.modLogs[interaction.guild.id] || {};
      const fmt = (id) => id ? `<#${id}>` : L('No configurado', 'Not configured');
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle(L('⚙️ Logs de Moderación','⚙️ Moderation Logs')).addFields({ name: '👢 Kicks', value: fmt(gl.kicks), inline: true }, { name: '🔨 Bans', value: fmt(gl.bans), inline: true }, { name: '⚠️ Warnings', value: fmt(gl.warnings), inline: true }, { name: '⏱️ Timeouts', value: fmt(gl.timeouts), inline: true }, { name: '🤖 Automod', value: fmt(gl.automod), inline: true }).setColor(0x5865F2).setTimestamp()], ephemeral: true });
    }

    // ── BOOSTCHANNEL ─────────────────────────────────────────────────────────
    if (sub === 'boostchannel') {
      const channel = interaction.options.getChannel('channel');
      if (!config.boostChannels) config.boostChannels = {};
      config.boostChannels[interaction.guild.id] = channel.id;
      save();
      return interaction.reply({ content: `✅ Canal de boost configurado: ${channel}`, ephemeral: true });
    }

    // ── REPORTCHANNEL ────────────────────────────────────────────────────────
    if (sub === 'reportchannel') {
      const channel = interaction.options.getChannel('channel');
      if (!config.reportChannels) config.reportChannels = {};
      config.reportChannels[interaction.guild.id] = channel.id;
      save();
      return interaction.reply({ content: `✅ Canal de reportes configurado: ${channel}`, ephemeral: true });
    }

    // ── PREFIX ───────────────────────────────────────────────────────────────
    if (sub === 'prefix') {
      const prefix = interaction.options.getString('prefix');
      if (!config.prefixes) config.prefixes = {};
      config.prefixes[interaction.guild.id] = prefix;
      save();
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle(L('✅ Prefijo Actualizado','✅ Prefix Updated')).setDescription(L(`Nuevo prefijo: \`${prefix}\``,`New prefix: \`${prefix}\``)).setColor(0x57F287).setTimestamp()], ephemeral: true });
    }

    // ── WARNSETUP ────────────────────────────────────────────────────────────
    if (sub === 'warnsetup') {
      const dm = interaction.options.getBoolean('dm');
      const action = interaction.options.getString('action') || 'none';
      const threshold = interaction.options.getInteger('threshold') || 3;
      const warnConfigPath = path.join(__dirname, '../warn-config.json');
      let warnConfig = fs.existsSync(warnConfigPath) ? JSON.parse(fs.readFileSync(warnConfigPath, 'utf8')) : {};
      warnConfig[interaction.guild.id] = { dmNotifications: dm, autoAction: action, autoActionThreshold: threshold };
      fs.writeFileSync(warnConfigPath, JSON.stringify(warnConfig, null, 2));
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle(L('⚙️ Sistema de Advertencias','⚙️ Warning System')).addFields({ name: L('DM Notificaciones','DM Notifications'), value: dm ? '✅' : '❌', inline: true }, { name: L('Acción Auto','Auto Action'), value: action, inline: true }, { name: L('Umbral','Threshold'), value: `${threshold}`, inline: true }).setColor(0x5865F2).setTimestamp()], ephemeral: true });
    }

    // ── RB3 ──────────────────────────────────────────────────────────────────
    if (sub === 'rb3') {
      const option = interaction.options.getString('option');
      const value = interaction.options.getString('value');
      const rb3Path = path.join(__dirname, '../data/rb3-config.json');
      let rb3Config = fs.existsSync(rb3Path) ? JSON.parse(fs.readFileSync(rb3Path, 'utf8')) : {};
      if (!rb3Config[interaction.guild.id]) rb3Config[interaction.guild.id] = { enabled: false, strike1: 'warn', strike2: 'timeout_12h', strike3: 'tempban_7d', resetDays: 30 };
      const gc = rb3Config[interaction.guild.id];
      if (option === 'view') {
        return interaction.reply({ embeds: [new EmbedBuilder().setTitle('⚙️ RB3 Config').setDescription(`Estado: ${gc.enabled ? '✅ Activo' : '❌ Inactivo'}`).addFields({ name: '1️⃣ Strike 1', value: gc.strike1, inline: true }, { name: '2️⃣ Strike 2', value: gc.strike2, inline: true }, { name: '3️⃣ Strike 3', value: gc.strike3, inline: true }, { name: '🔄 Reset', value: `${gc.resetDays} días`, inline: true }).setColor(gc.enabled ? 0x57F287 : 0xED4245).setTimestamp()], ephemeral: true });
      }
      if (option === 'enable') gc.enabled = !gc.enabled;
      else if (option === 'strike1' && value) gc.strike1 = value;
      else if (option === 'strike2' && value) gc.strike2 = value;
      else if (option === 'strike3' && value) gc.strike3 = value;
      const dataDir = path.join(__dirname, '../data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(rb3Path, JSON.stringify(rb3Config, null, 2));
      return interaction.reply({ content: `✅ RB3 actualizado`, ephemeral: true });
    }

    // ── BOTPERM ──────────────────────────────────────────────────────────────
    if (sub === 'botperm') {
      if (interaction.user.id !== interaction.guild.ownerId) return interaction.reply({ content: L('❌ Solo el dueño puede usar esto.', '❌ Owner only.'), ephemeral: true });
      const action = interaction.options.getString('action');
      const user = interaction.options.getUser('user');
      const enabled = interaction.options.getBoolean('enabled');
      if (!config.botPermissions) config.botPermissions = {};
      if (!config.botPermissions[interaction.guild.id]) config.botPermissions[interaction.guild.id] = { enabled: true, allowedUsers: [interaction.guild.ownerId] };
      const gc = config.botPermissions[interaction.guild.id];
      if (action === 'add' && user) { if (!gc.allowedUsers.includes(user.id)) gc.allowedUsers.push(user.id); save(); return interaction.reply({ content: `✅ ${user.tag} puede agregar bots.`, ephemeral: true }); }
      if (action === 'remove' && user) { if (user.id === interaction.guild.ownerId) return interaction.reply({ content: '❌ No puedes remover al dueño.', ephemeral: true }); gc.allowedUsers = gc.allowedUsers.filter(id => id !== user.id); save(); return interaction.reply({ content: `✅ ${user.tag} ya no puede agregar bots.`, ephemeral: true }); }
      if (action === 'toggle' && enabled !== null) { gc.enabled = enabled; save(); return interaction.reply({ content: `✅ Protección de bots ${enabled ? 'activada' : 'desactivada'}.`, ephemeral: true }); }
      if (action === 'list') {
        const users = [];
        for (const id of gc.allowedUsers) { try { const u = await interaction.client.users.fetch(id); users.push(`${u.tag}${id === interaction.guild.ownerId ? ' 👑' : ''}`); } catch { users.push(id); } }
        return interaction.reply({ embeds: [new EmbedBuilder().setTitle(L('🤖 Permisos de Bots','🤖 Bot Permissions')).setDescription(`**Sistema:** ${gc.enabled ? '✅' : '❌'}\n\n${users.join('\n')}`).setColor(0x5865F2).setTimestamp()], ephemeral: true });
      }
    }

    // ── CMDPERM ──────────────────────────────────────────────────────────────
    if (sub === 'cmdperm') {
      const commandName = interaction.options.getString('command').toLowerCase();
      const action = interaction.options.getString('action');
      const user = interaction.options.getUser('user');
      const role = interaction.options.getRole('role');
      if (!config.commandPermissions) config.commandPermissions = {};
      if (!config.commandPermissions[interaction.guild.id]) config.commandPermissions[interaction.guild.id] = {};
      if (!config.commandPermissions[interaction.guild.id][commandName]) config.commandPermissions[interaction.guild.id][commandName] = { users: [], roles: [] };
      const cp = config.commandPermissions[interaction.guild.id][commandName];
      if (action === 'add_user' && user) { if (!cp.users.includes(user.id)) cp.users.push(user.id); save(); return interaction.reply({ content: `✅ ${user.tag} puede usar \`/${commandName}\`.`, ephemeral: true }); }
      if (action === 'add_role' && role) { if (!cp.roles.includes(role.id)) cp.roles.push(role.id); save(); return interaction.reply({ content: `✅ ${role.name} puede usar \`/${commandName}\`.`, ephemeral: true }); }
      if (action === 'remove_user' && user) { cp.users = cp.users.filter(id => id !== user.id); save(); return interaction.reply({ content: `✅ Removido.`, ephemeral: true }); }
      if (action === 'remove_role' && role) { cp.roles = cp.roles.filter(id => id !== role.id); save(); return interaction.reply({ content: `✅ Removido.`, ephemeral: true }); }
      if (action === 'clear') { config.commandPermissions[interaction.guild.id][commandName] = { users: [], roles: [] }; save(); return interaction.reply({ content: `✅ Permisos de \`/${commandName}\` limpiados.`, ephemeral: true }); }
      if (action === 'view') {
        const users = cp.users.length > 0 ? cp.users.map(id => `<@${id}>`).join(', ') : 'Ninguno';
        const roles = cp.roles.length > 0 ? cp.roles.map(id => `<@&${id}>`).join(', ') : 'Ninguno';
        return interaction.reply({ embeds: [new EmbedBuilder().setTitle(`Permisos: /${commandName}`).addFields({ name: 'Usuarios', value: users }, { name: 'Roles', value: roles }).setColor(0x5865F2).setTimestamp()], ephemeral: true });
      }
    }
  }
};
