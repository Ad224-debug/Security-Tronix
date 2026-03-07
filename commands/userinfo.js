const { SlashCommandBuilder, EmbedBuilder, UserFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Shows detailed user information')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User whose information you want to see')
        .setRequired(false)),

  async execute(interaction) {
    await interaction.deferReply();

    const usuario = interaction.options.getUser('user') || interaction.user;
    const lang = interaction.client.getLanguage(interaction.guild.id);

    // Fetch para obtener información completa del usuario
    const miembro = await interaction.guild.members.fetch(usuario.id).catch(() => null);

    if (!miembro) {
      const errorMsg = lang === 'es' 
        ? '❌ No se pudo encontrar ese usuario en el servidor.'
        : '❌ Could not find that user on the server.';
      return await interaction.editReply({
        content: errorMsg,
        ephemeral: true
      });
    }

    // Fetch del usuario completo para obtener banner y badges
    const usuarioCompleto = await usuario.fetch();

    // Información básica
    const embed = new EmbedBuilder()
      .setColor(miembro.displayColor || 0x5865F2)
      .setThumbnail(usuario.displayAvatarURL({ size: 512, dynamic: true }))
      .setTimestamp();

    // Título con username y discriminator
    const title = lang === 'es' 
      ? `👤 Información de ${usuario.username}`
      : `👤 ${usuario.username}'s Information`;
    embed.setTitle(title);

    // Banner si existe
    if (usuarioCompleto.banner) {
      embed.setImage(usuarioCompleto.bannerURL({ size: 1024, dynamic: true }));
    }

    // === INFORMACIÓN DE LA CUENTA ===
    const accountInfo = [];
    accountInfo.push(`**🆔 ID:** \`${usuario.id}\``);
    accountInfo.push(`**👤 Tag:** ${usuario.tag}`);
    accountInfo.push(`**📛 Mención:** ${usuario}`);
    
    // Tipo de cuenta
    if (usuario.bot) {
      accountInfo.push(`**🤖 Tipo:** Bot`);
    } else if (usuario.system) {
      accountInfo.push(`**⚙️ Tipo:** Sistema`);
    } else {
      accountInfo.push(`**👥 Tipo:** Usuario`);
    }

    embed.addFields({
      name: lang === 'es' ? '📋 Información de Cuenta' : '📋 Account Information',
      value: accountInfo.join('\n'),
      inline: false
    });

    // === BADGES/INSIGNIAS ===
    const badges = [];
    const userFlags = usuarioCompleto.flags?.toArray() || [];
    
    const badgeEmojis = {
      Staff: '👨‍💼 Discord Staff',
      Partner: '🤝 Partnered Server Owner',
      Hypesquad: '🎉 HypeSquad Events',
      BugHunterLevel1: '🐛 Bug Hunter Level 1',
      BugHunterLevel2: '🐛 Bug Hunter Level 2',
      HypeSquadOnlineHouse1: '💜 HypeSquad Bravery',
      HypeSquadOnlineHouse2: '💖 HypeSquad Brilliance',
      HypeSquadOnlineHouse3: '💚 HypeSquad Balance',
      PremiumEarlySupporter: '⭐ Early Supporter',
      VerifiedBot: '✅ Verified Bot',
      VerifiedDeveloper: '🔧 Early Verified Bot Developer',
      CertifiedModerator: '🛡️ Certified Moderator',
      ActiveDeveloper: '⚡ Active Developer'
    };

    userFlags.forEach(flag => {
      if (badgeEmojis[flag]) {
        badges.push(badgeEmojis[flag]);
      }
    });

    if (miembro.premiumSince) {
      badges.push(`💎 Server Booster (desde <t:${Math.floor(miembro.premiumSinceTimestamp / 1000)}:R>)`);
    }

    if (badges.length > 0) {
      embed.addFields({
        name: lang === 'es' ? '🏅 Insignias' : '🏅 Badges',
        value: badges.join('\n'),
        inline: false
      });
    }

    // === INFORMACIÓN DEL SERVIDOR ===
    const serverInfo = [];
    
    // Apodo
    serverInfo.push(`**🎭 Apodo:** ${miembro.nickname || (lang === 'es' ? 'Sin apodo' : 'None')}`);
    
    // Fechas
    serverInfo.push(`**📅 Cuenta creada:** <t:${Math.floor(usuario.createdTimestamp / 1000)}:F>`);
    serverInfo.push(`**└─** <t:${Math.floor(usuario.createdTimestamp / 1000)}:R>`);
    serverInfo.push(`**📥 Se unió al servidor:** <t:${Math.floor(miembro.joinedTimestamp / 1000)}:F>`);
    serverInfo.push(`**└─** <t:${Math.floor(miembro.joinedTimestamp / 1000)}:R>`);

    // Posición de unión
    const sortedMembers = Array.from(interaction.guild.members.cache.values())
      .sort((a, b) => a.joinedTimestamp - b.joinedTimestamp);
    const joinPosition = sortedMembers.findIndex(m => m.id === miembro.id) + 1;
    serverInfo.push(`**📊 Posición de unión:** #${joinPosition} de ${interaction.guild.memberCount}`);

    // Timeout
    if (miembro.communicationDisabledUntilTimestamp) {
      const timeoutEnd = Math.floor(miembro.communicationDisabledUntilTimestamp / 1000);
      serverInfo.push(`**⏱️ Timeout hasta:** <t:${timeoutEnd}:F> (<t:${timeoutEnd}:R>)`);
    }

    embed.addFields({
      name: lang === 'es' ? '🏠 Información del Servidor' : '🏠 Server Information',
      value: serverInfo.join('\n'),
      inline: false
    });

    // === ROLES ===
    const roles = miembro.roles.cache
      .filter(role => role.id !== interaction.guild.id)
      .sort((a, b) => b.position - a.position)
      .map(role => role.toString());

    if (roles.length > 0) {
      const rolesText = roles.length > 20 
        ? roles.slice(0, 20).join(', ') + ` ${lang === 'es' ? 'y más...' : 'and more...'}`
        : roles.join(', ');
      
      embed.addFields({
        name: lang === 'es' ? `🎭 Roles [${roles.length}]` : `🎭 Roles [${roles.length}]`,
        value: rolesText,
        inline: false
      });
    }

    // === PERMISOS CLAVE ===
    const keyPermissions = [];
    const perms = miembro.permissions;

    const permissionChecks = [
      { flag: 'Administrator', emoji: '👑', name: lang === 'es' ? 'Administrador' : 'Administrator' },
      { flag: 'ManageGuild', emoji: '⚙️', name: lang === 'es' ? 'Gestionar Servidor' : 'Manage Server' },
      { flag: 'ManageRoles', emoji: '🎭', name: lang === 'es' ? 'Gestionar Roles' : 'Manage Roles' },
      { flag: 'ManageChannels', emoji: '📝', name: lang === 'es' ? 'Gestionar Canales' : 'Manage Channels' },
      { flag: 'KickMembers', emoji: '👢', name: lang === 'es' ? 'Expulsar Miembros' : 'Kick Members' },
      { flag: 'BanMembers', emoji: '🔨', name: lang === 'es' ? 'Banear Miembros' : 'Ban Members' },
      { flag: 'ManageMessages', emoji: '🗑️', name: lang === 'es' ? 'Gestionar Mensajes' : 'Manage Messages' },
      { flag: 'MentionEveryone', emoji: '📢', name: lang === 'es' ? 'Mencionar Everyone' : 'Mention Everyone' },
      { flag: 'ModerateMembers', emoji: '⏱️', name: lang === 'es' ? 'Moderar Miembros' : 'Moderate Members' }
    ];

    permissionChecks.forEach(perm => {
      if (perms.has(perm.flag)) {
        keyPermissions.push(`${perm.emoji} ${perm.name}`);
      }
    });

    if (keyPermissions.length > 0) {
      embed.addFields({
        name: lang === 'es' ? '🔑 Permisos Clave' : '🔑 Key Permissions',
        value: keyPermissions.join('\n'),
        inline: false
      });
    }

    // === INFORMACIÓN ADICIONAL ===
    const additionalInfo = [];
    additionalInfo.push(`**🎨 Color de rol:** ${miembro.displayHexColor}`);
    additionalInfo.push(`**🔗 Avatar URL:** [Click aquí](${usuario.displayAvatarURL({ size: 4096 })})`);
    
    if (usuarioCompleto.banner) {
      additionalInfo.push(`**🖼️ Banner URL:** [Click aquí](${usuarioCompleto.bannerURL({ size: 4096 })})`);
    }

    if (usuarioCompleto.accentColor) {
      additionalInfo.push(`**🎨 Color de perfil:** #${usuarioCompleto.accentColor.toString(16).padStart(6, '0')}`);
    }

    embed.addFields({
      name: lang === 'es' ? '📌 Información Adicional' : '📌 Additional Information',
      value: additionalInfo.join('\n'),
      inline: false
    });

    // Footer con el rol más alto
    const highestRole = miembro.roles.highest;
    const footerText = lang === 'es'
      ? `Rol más alto: ${highestRole.name}`
      : `Highest role: ${highestRole.name}`;
    embed.setFooter({ text: footerText });

    await interaction.editReply({ embeds: [embed] });
  },
};
