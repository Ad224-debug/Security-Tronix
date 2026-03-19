const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const os = require('os');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Comandos de información')
    .addSubcommand(s => s.setName('user').setDescription('Información de un usuario').addUserOption(o => o.setName('user').setDescription('Usuario')))
    .addSubcommand(s => s.setName('server').setDescription('Información del servidor'))
    .addSubcommand(s => s.setName('bot').setDescription('Información del bot'))
    .addSubcommand(s => s.setName('role').setDescription('Información de un rol').addRoleOption(o => o.setName('role').setDescription('Rol').setRequired(true)))
    .addSubcommand(s => s.setName('members').setDescription('Estadísticas de miembros'))
    .addSubcommand(s => s.setName('invites').setDescription('Invitaciones del servidor'))
    .addSubcommand(s => s.setName('ping').setDescription('Latencia del bot')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const L = (es, en) => lang === 'es' ? es : en;

    // ── USER ─────────────────────────────────────────────────────────────────
    if (sub === 'user') {
      await interaction.deferReply();
      const usuario = interaction.options.getUser('user') || interaction.user;
      const miembro = await interaction.guild.members.fetch(usuario.id).catch(() => null);
      if (!miembro) return interaction.editReply({ content: L('❌ Usuario no encontrado.', '❌ User not found.') });
      const usuarioCompleto = await usuario.fetch();
      const embed = new EmbedBuilder().setColor(miembro.displayColor || 0x5865F2).setThumbnail(usuario.displayAvatarURL({ size: 512, dynamic: true })).setTitle(L(`👤 Información de ${usuario.username}`, `👤 ${usuario.username}'s Info`)).setTimestamp();
      if (usuarioCompleto.banner) embed.setImage(usuarioCompleto.bannerURL({ size: 1024, dynamic: true }));
      embed.addFields({ name: L('📋 Cuenta','📋 Account'), value: [`**ID:** \`${usuario.id}\``, `**Tag:** ${usuario.tag}`, `**Tipo:** ${usuario.bot ? '🤖 Bot' : '👥 Usuario'}`].join('\n') });
      const badges = [];
      const badgeMap = { Staff: '👨‍💼 Discord Staff', Partner: '🤝 Partner', BugHunterLevel1: '🐛 Bug Hunter', PremiumEarlySupporter: '⭐ Early Supporter', VerifiedDeveloper: '🔧 Bot Developer', ActiveDeveloper: '⚡ Active Developer' };
      (usuarioCompleto.flags?.toArray() || []).forEach(f => { if (badgeMap[f]) badges.push(badgeMap[f]); });
      if (miembro.premiumSince) badges.push(`💎 Server Booster`);
      if (badges.length > 0) embed.addFields({ name: L('🏅 Insignias','🏅 Badges'), value: badges.join('\n') });
      embed.addFields({ name: L('🏠 Servidor','🏠 Server'), value: [`**Apodo:** ${miembro.nickname || 'Ninguno'}`, `**Cuenta creada:** <t:${Math.floor(usuario.createdTimestamp/1000)}:R>`, `**Se unió:** <t:${Math.floor(miembro.joinedTimestamp/1000)}:R>`].join('\n') });
      const roles = miembro.roles.cache.filter(r => r.id !== interaction.guild.id).sort((a, b) => b.position - a.position).map(r => r.toString());
      if (roles.length > 0) embed.addFields({ name: L(`🎭 Roles [${roles.length}]`, `🎭 Roles [${roles.length}]`), value: roles.slice(0, 20).join(', ') + (roles.length > 20 ? '...' : '') });
      embed.setFooter({ text: L(`Rol más alto: ${miembro.roles.highest.name}`, `Highest role: ${miembro.roles.highest.name}`) });
      return interaction.editReply({ embeds: [embed] });
    }

    // ── SERVER ───────────────────────────────────────────────────────────────
    if (sub === 'server') {
      const { guild } = interaction;
      const embed = new EmbedBuilder().setTitle(L(`📊 ${guild.name}`, `📊 ${guild.name}`)).setDescription(guild.description || L('Sin descripción', 'No description')).setThumbnail(guild.iconURL({ size: 256 })).setColor(0x5865F2).setTimestamp();
      if (guild.bannerURL()) embed.setImage(guild.bannerURL({ size: 512 }));
      embed.addFields(
        { name: L('👑 Dueño','👑 Owner'), value: `<@${guild.ownerId}>`, inline: true },
        { name: L('📅 Creado','📅 Created'), value: `<t:${Math.floor(guild.createdTimestamp/1000)}:R>`, inline: true },
        { name: '🆔 ID', value: `\`${guild.id}\``, inline: true },
        { name: L('👥 Miembros','👥 Members'), value: `${guild.memberCount}`, inline: true },
        { name: L('📝 Canales','📝 Channels'), value: `${guild.channels.cache.size}`, inline: true },
        { name: L('🎭 Roles','🎭 Roles'), value: `${guild.roles.cache.size}`, inline: true },
        { name: L('💎 Boost','💎 Boost'), value: `Nivel ${guild.premiumTier} (${guild.premiumSubscriptionCount || 0} boosts)`, inline: true }
      );
      return interaction.reply({ embeds: [embed] });
    }

    // ── BOT ──────────────────────────────────────────────────────────────────
    if (sub === 'bot') {
      const uptime = process.uptime();
      const d = Math.floor(uptime/86400), h = Math.floor(uptime/3600)%24, m = Math.floor(uptime/60)%60, s = Math.floor(uptime%60);
      const embed = new EmbedBuilder().setTitle(L('🤖 Información del Bot','🤖 Bot Information')).setColor(0x5865F2).setThumbnail(interaction.client.user.displayAvatarURL()).addFields(
        { name: L('⏰ Uptime','⏰ Uptime'), value: `\`${d}d ${h}h ${m}m ${s}s\``, inline: true },
        { name: L('📡 Latencia','📡 Latency'), value: `\`${interaction.client.ws.ping}ms\``, inline: true },
        { name: L('🌐 Servidores','🌐 Servers'), value: `\`${interaction.client.guilds.cache.size}\``, inline: true },
        { name: L('💾 Memoria','💾 Memory'), value: `\`${(process.memoryUsage().heapUsed/1024/1024).toFixed(2)}MB\``, inline: true },
        { name: L('⚡ Comandos','⚡ Commands'), value: `\`${interaction.client.commands.size}\``, inline: true },
        { name: L('💻 Plataforma','💻 Platform'), value: `\`${os.platform()}\``, inline: true }
      ).setFooter({ text: `Node.js ${process.version} • Discord.js v14` }).setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    // ── ROLE ─────────────────────────────────────────────────────────────────
    if (sub === 'role') {
      const role = interaction.options.getRole('role');
      const members = interaction.guild.members.cache.filter(m => m.roles.cache.has(role.id)).size;
      const embed = new EmbedBuilder().setTitle(L('🎭 Información del Rol','🎭 Role Information')).setColor(role.color || 0x5865F2).addFields(
        { name: L('Nombre','Name'), value: role.name, inline: true },
        { name: 'ID', value: role.id, inline: true },
        { name: L('Color','Color'), value: role.hexColor, inline: true },
        { name: L('Miembros','Members'), value: `${members}`, inline: true },
        { name: L('Posición','Position'), value: `${role.position}`, inline: true },
        { name: L('Creado','Created'), value: `<t:${Math.floor(role.createdTimestamp/1000)}:R>`, inline: true },
        { name: L('Mencionable','Mentionable'), value: role.mentionable ? '✅' : '❌', inline: true },
        { name: L('Separado','Hoisted'), value: role.hoist ? '✅' : '❌', inline: true }
      ).setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    // ── MEMBERS ──────────────────────────────────────────────────────────────
    if (sub === 'members') {
      const members = await interaction.guild.members.fetch();
      const total = members.size, humans = members.filter(m => !m.user.bot).size, bots = members.filter(m => m.user.bot).size;
      const online = members.filter(m => m.presence?.status === 'online').size;
      const idle = members.filter(m => m.presence?.status === 'idle').size;
      const dnd = members.filter(m => m.presence?.status === 'dnd').size;
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle(L('📊 Estadísticas de Miembros','📊 Member Statistics')).setColor(0x5865F2).setThumbnail(interaction.guild.iconURL()).addFields({ name: L('Total','Total'), value: `${total}`, inline: true }, { name: L('Humanos','Humans'), value: `${humans}`, inline: true }, { name: L('Bots','Bots'), value: `${bots}`, inline: true }, { name: L('Estados','Status'), value: `🟢 ${online} | 🟡 ${idle} | 🔴 ${dnd} | ⚫ ${total-online-idle-dnd}` }).setTimestamp()] });
    }

    // ── INVITES ──────────────────────────────────────────────────────────────
    if (sub === 'invites') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) return interaction.reply({ content: L('❌ Sin permisos.', '❌ No permission.'), ephemeral: true });
      const invites = await interaction.guild.invites.fetch();
      if (invites.size === 0) return interaction.reply({ content: L('❌ No hay invitaciones activas.', '❌ No active invites.'), ephemeral: true });
      const list = invites.map(i => `\`${i.code}\` | ${i.inviter?.tag || '?'} | ${i.uses || 0}/${i.maxUses || '∞'}`).join('\n');
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle(L('📨 Invitaciones','📨 Invites')).setDescription(list).setColor(0x5865F2).setTimestamp()] });
    }

    // ── PING ─────────────────────────────────────────────────────────────────
    if (sub === 'ping') {
      const sent = await interaction.reply({ content: L('🏓 Calculando...', '🏓 Calculating...'), fetchReply: true });
      const ws = interaction.client.ws.ping, api = sent.createdTimestamp - interaction.createdTimestamp;
      const color = ws < 100 ? 0x57F287 : ws < 200 ? 0xFEE75C : ws < 400 ? 0xFFA500 : 0xED4245;
      const quality = ws < 100 ? L('Excelente','Excellent') : ws < 200 ? L('Buena','Good') : ws < 400 ? L('Regular','Fair') : L('Mala','Poor');
      return interaction.editReply({ content: null, embeds: [new EmbedBuilder().setTitle('🏓 Pong!').setColor(color).addFields({ name: L('📡 WebSocket','📡 WebSocket'), value: `\`${ws}ms\``, inline: true }, { name: L('⚡ API','⚡ API'), value: `\`${api}ms\``, inline: true }, { name: L('📊 Calidad','📊 Quality'), value: quality, inline: true }).setTimestamp()] });
    }
  }
};
