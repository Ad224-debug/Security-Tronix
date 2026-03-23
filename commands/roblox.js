const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const cache = require('../cache');

// Helper: resolve username → userId
async function resolveUser(username) {
  const res = await fetch('https://users.roblox.com/v1/usernames/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernames: [username], excludeBannedUsers: false })
  });
  const data = await res.json();
  if (!data.data?.length) return null;
  return data.data[0];
}

// Helper: format large numbers
function fmt(n) {
  if (n == null) return 'N/A';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roblox')
    .setDescription('Comandos de Roblox / Roblox commands')
    .addSubcommand(s => s.setName('user')
      .setDescription('Perfil completo de un usuario de Roblox')
      .addStringOption(o => o.setName('username').setDescription('Nombre de usuario').setRequired(true)))
    .addSubcommand(s => s.setName('avatar')
      .setDescription('Avatar de un usuario de Roblox')
      .addStringOption(o => o.setName('username').setDescription('Nombre de usuario').setRequired(true))
      .addStringOption(o => o.setName('tipo').setDescription('Tipo de imagen')
        .addChoices(
          { name: '🎭 Headshot (cara)', value: 'headshot' },
          { name: '👤 Busto', value: 'bust' },
          { name: '🧍 Cuerpo completo', value: 'full' }
        )))
    .addSubcommand(s => s.setName('game')
      .setDescription('Información de un juego de Roblox')
      .addStringOption(o => o.setName('query').setDescription('Nombre o ID del juego').setRequired(true)))
    .addSubcommand(s => s.setName('group')
      .setDescription('Información de un grupo de Roblox')
      .addStringOption(o => o.setName('query').setDescription('Nombre o ID del grupo').setRequired(true)))
    .addSubcommand(s => s.setName('badges')
      .setDescription('Badges de un usuario de Roblox')
      .addStringOption(o => o.setName('username').setDescription('Nombre de usuario').setRequired(true)))
    .addSubcommand(s => s.setName('friends')
      .setDescription('Lista de amigos de un usuario de Roblox')
      .addStringOption(o => o.setName('username').setDescription('Nombre de usuario').setRequired(true)))
    .addSubcommand(s => s.setName('rap')
      .setDescription('Valor de inventario (RAP) de un usuario de Roblox')
      .addStringOption(o => o.setName('username').setDescription('Nombre de usuario').setRequired(true))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const lang = interaction.client.getLanguage ? interaction.client.getLanguage(interaction.guild.id) : 'es';
    const L = (es, en) => lang === 'es' ? es : en;

    await interaction.deferReply();

    // ── USER ─────────────────────────────────────────────────────────────────
    if (sub === 'user') {
      const username = interaction.options.getString('username');
      const cacheKey = `roblox:user:${username.toLowerCase()}`;
      try {
        let data = cache.get(cacheKey);
        const fromCache = !!data;

        if (!data) {
          const resolved = await resolveUser(username);
          if (!resolved) return interaction.editReply({ content: `❌ No se encontró **${username}** en Roblox.` });
          const userId = resolved.id;

          const [
            userRes, friendsRes, followersRes, followingRes,
            badgesRes, groupsRes, gamesRes, premiumRes, avatarRes
          ] = await Promise.all([
            fetch(`https://users.roblox.com/v1/users/${userId}`),
            fetch(`https://friends.roblox.com/v1/users/${userId}/friends/count`),
            fetch(`https://friends.roblox.com/v1/users/${userId}/followers/count`),
            fetch(`https://friends.roblox.com/v1/users/${userId}/followings/count`),
            fetch(`https://badges.roblox.com/v1/users/${userId}/badges?limit=6&sortOrder=Desc`),
            fetch(`https://groups.roblox.com/v1/users/${userId}/groups/roles`),
            fetch(`https://games.roblox.com/v2/users/${userId}/games?limit=6&sortOrder=Desc`),
            fetch(`https://premiumfeatures.roblox.com/v1/users/${userId}/validate-membership`),
            fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png`)
          ]);

          const [
            userData, friendsData, followersData, followingData,
            badgesData, groupsData, gamesData, avatarData
          ] = await Promise.all([
            userRes.json(), friendsRes.json(), followersRes.json(), followingRes.json(),
            badgesRes.json(), groupsRes.json(), gamesRes.json(), avatarRes.json()
          ]);

          let isPremium = false;
          try {
            const premiumData = await premiumRes.json().catch(() => null);
            if (typeof premiumData === 'boolean') isPremium = premiumData;
            else if (premiumData?.isPremium) isPremium = true;
            else isPremium = premiumRes.status === 200;
          } catch { isPremium = false; }

          // Presence
          let presenceStatus = L('⚫ Offline', '⚫ Offline');
          try {
            const presRes = await fetch('https://presence.roblox.com/v1/presence/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userIds: [userId] })
            });
            const presData = await presRes.json();
            const p = presData.userPresences?.[0];
            if (p) {
              const types = {
                0: L('⚫ Offline', '⚫ Offline'),
                1: L('🟢 Online (Web)', '🟢 Online (Web)'),
                2: L('🎮 En juego', '🎮 In game'),
                3: L('🔧 En Studio', '🔧 In Studio')
              };
              presenceStatus = types[p.userPresenceType] || L('⚫ Offline', '⚫ Offline');
              if (p.lastLocation && p.userPresenceType === 2) presenceStatus += `\n└ *${p.lastLocation}*`;
            }
          } catch { /* presence may require auth */ }

          data = { userId, userData, friendsData, followersData, followingData, badgesData, groupsData, gamesData, avatarData, isPremium, presenceStatus };
          cache.set(cacheKey, data, 10 * 60 * 1000); // 10 min cache
        }

        const { userId, userData, friendsData, followersData, followingData, badgesData, groupsData, gamesData, avatarData, isPremium, presenceStatus } = data;
        const avatarUrl = avatarData.data?.[0]?.imageUrl || null;
        const createdAt = new Date(userData.created);
        const totalDays = Math.floor((Date.now() - createdAt.getTime()) / 86400000);
        const years = Math.floor(totalDays / 365);
        const ageStr = years > 0 ? `${years} ${L('año(s)', 'year(s)')}, ${totalDays % 365} ${L('día(s)', 'day(s)')}` : `${totalDays} ${L('día(s)', 'day(s)')}`;

        const badgeList = badgesData.data?.slice(0, 5).map(b => `• ${b.name}`).join('\n') || `• ${L('Ninguno', 'None')}`;
        const groupList = groupsData.data?.slice(0, 4).map(g => `• **${g.group.name}** *(${g.role.name})*`).join('\n') || `• ${L('Ninguno', 'None')}`;
        const gameList = gamesData.data?.slice(0, 4).map(g => `• [${g.name}](https://www.roblox.com/games/${g.rootPlace?.id})`).join('\n') || `• ${L('Ninguno', 'None')}`;

        const isBanned = userData.isBanned;
        const embed = new EmbedBuilder()
          .setTitle(`${isBanned ? '🚫 ' : ''}${userData.displayName} (@${userData.name})`)
          .setURL(`https://www.roblox.com/users/${userId}/profile`)
          .setColor(isBanned ? 0xFF0000 : isPremium ? 0xF5A623 : 0x00B2FF)
          .setDescription(userData.description?.slice(0, 350) || `*${L('Sin descripción', 'No description')}*`)
          .addFields(
            { name: '🆔 ID', value: `${userId}`, inline: true },
            { name: '💎 Premium', value: isPremium ? '✅' : '❌', inline: true },
            { name: '🚦 Estado', value: presenceStatus, inline: true },
            { name: L('📅 Creado', '📅 Created'), value: `<t:${Math.floor(createdAt.getTime() / 1000)}:D>`, inline: true },
            { name: L('⏳ Antigüedad', '⏳ Age'), value: ageStr, inline: true },
            { name: L('🔒 Cuenta', '🔒 Account'), value: isBanned ? `🚫 ${L('Baneada', 'Banned')}` : `✅ ${L('Activa', 'Active')}`, inline: true },
            { name: L('👥 Amigos', '👥 Friends'), value: fmt(friendsData.count), inline: true },
            { name: L('👁️ Seguidores', '👁️ Followers'), value: fmt(followersData.count), inline: true },
            { name: L('➡️ Siguiendo', '➡️ Following'), value: fmt(followingData.count), inline: true },
            { name: `🏅 ${L('Últimos badges', 'Recent badges')} (${badgesData.data?.length ?? 0})`, value: badgeList },
            { name: `👾 ${L('Grupos', 'Groups')} (${groupsData.data?.length ?? 0})`, value: groupList, inline: true },
            { name: `🎮 ${L('Juegos creados', 'Created games')} (${gamesData.data?.length ?? 0})`, value: gameList, inline: true }
          )
          .setFooter({ text: `Roblox API${fromCache ? ' • 📦 Caché' : ''}` })
          .setTimestamp();

        if (avatarUrl) embed.setThumbnail(avatarUrl);
        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error('[roblox user]', err);
        return interaction.editReply({ content: '❌ Error al obtener datos de Roblox.' });
      }
    }

    // ── AVATAR ───────────────────────────────────────────────────────────────
    if (sub === 'avatar') {
      const username = interaction.options.getString('username');
      const tipo = interaction.options.getString('tipo') || 'full';
      try {
        const resolved = await resolveUser(username);
        if (!resolved) return interaction.editReply({ content: `❌ No se encontró **${username}** en Roblox.` });
        const userId = resolved.id;

        const endpoints = {
          headshot: `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=720x720&format=Png`,
          bust:     `https://thumbnails.roblox.com/v1/users/avatar-bust?userIds=${userId}&size=420x420&format=Png`,
          full:     `https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=720x720&format=Png`
        };
        const labels = { headshot: '🎭 Headshot', bust: '👤 Busto', full: '🧍 Cuerpo completo' };

        const thumbRes = await fetch(endpoints[tipo]);
        const thumbData = await thumbRes.json();
        const imageUrl = thumbData.data?.[0]?.imageUrl;
        if (!imageUrl) return interaction.editReply({ content: '❌ No se pudo obtener el avatar.' });

        const embed = new EmbedBuilder()
          .setTitle(`${labels[tipo]} — ${resolved.displayName} (@${username})`)
          .setURL(`https://www.roblox.com/users/${userId}/profile`)
          .setColor(0x00B2FF)
          .setImage(imageUrl)
          .setFooter({ text: `ID: ${userId} • Roblox` })
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error('[roblox avatar]', err);
        return interaction.editReply({ content: '❌ Error al obtener el avatar.' });
      }
    }

    // ── GAME ─────────────────────────────────────────────────────────────────
    if (sub === 'game') {
      const query = interaction.options.getString('query');
      try {
        let universeId, placeId;

        // If numeric, treat as place ID
        if (/^\d+$/.test(query)) {
          placeId = query;
          const convRes = await fetch(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
          const convData = await convRes.json();
          universeId = convData.universeId;
        } else {
          // Search by name
          const searchRes = await fetch(`https://games.roblox.com/v1/games/list?model.keyword=${encodeURIComponent(query)}&model.maxRows=1`);
          const searchData = await searchRes.json();
          if (!searchData.games?.length) return interaction.editReply({ content: `❌ No se encontró el juego **${query}**.` });
          universeId = searchData.games[0].universeId;
          placeId = searchData.games[0].placeId;
        }

        if (!universeId) return interaction.editReply({ content: `❌ No se encontró el juego **${query}**.` });

        const [gameRes, thumbRes] = await Promise.all([
          fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`),
          fetch(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png`)
        ]);

        const gameData = await gameRes.json();
        const thumbData = await thumbRes.json();
        const game = gameData.data?.[0];
        if (!game) return interaction.editReply({ content: '❌ No se pudo obtener información del juego.' });

        const iconUrl = thumbData.data?.[0]?.imageUrl || null;
        const createdAt = new Date(game.created);
        const updatedAt = new Date(game.updated);

        const embed = new EmbedBuilder()
          .setTitle(`🎮 ${game.name}`)
          .setURL(`https://www.roblox.com/games/${game.rootPlaceId}`)
          .setColor(0x00B2FF)
          .setDescription(game.description?.slice(0, 400) || `*${L('Sin descripción', 'No description')}*`)
          .addFields(
            { name: '🆔 Universe ID', value: `${universeId}`, inline: true },
            { name: L('👤 Creador', '👤 Creator'), value: game.creator?.name || 'N/A', inline: true },
            { name: L('🔒 Acceso', '🔒 Access'), value: game.isPrivateServer ? L('Privado', 'Private') : L('Público', 'Public'), inline: true },
            { name: L('👥 Jugando ahora', '👥 Playing now'), value: fmt(game.playing), inline: true },
            { name: L('👁️ Visitas', '👁️ Visits'), value: fmt(game.visits), inline: true },
            { name: L('👍 Favoritos', '👍 Favorites'), value: fmt(game.favoritedCount), inline: true },
            { name: L('📅 Creado', '📅 Created'), value: `<t:${Math.floor(createdAt.getTime() / 1000)}:D>`, inline: true },
            { name: L('🔄 Actualizado', '🔄 Updated'), value: `<t:${Math.floor(updatedAt.getTime() / 1000)}:R>`, inline: true },
            { name: L('🔞 Contenido', '🔞 Content'), value: game.contentRatingTypeId === 2 ? '🔞 17+' : '✅ Todos', inline: true }
          )
          .setFooter({ text: 'Roblox API' })
          .setTimestamp();

        if (iconUrl) embed.setThumbnail(iconUrl);
        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error('[roblox game]', err);
        return interaction.editReply({ content: '❌ Error al obtener datos del juego.' });
      }
    }

    // ── GROUP ────────────────────────────────────────────────────────────────
    if (sub === 'group') {
      const query = interaction.options.getString('query');
      try {
        let groupId;

        if (/^\d+$/.test(query)) {
          groupId = query;
        } else {
          const searchRes = await fetch(`https://groups.roblox.com/v1/groups/search?keyword=${encodeURIComponent(query)}&limit=1`);
          const searchData = await searchRes.json();
          if (!searchData.data?.length) return interaction.editReply({ content: `❌ No se encontró el grupo **${query}**.` });
          groupId = searchData.data[0].id;
        }

        const [groupRes, thumbRes] = await Promise.all([
          fetch(`https://groups.roblox.com/v1/groups/${groupId}`),
          fetch(`https://thumbnails.roblox.com/v1/groups/icons?groupIds=${groupId}&size=420x420&format=Png`)
        ]);

        const group = await groupRes.json();
        const thumbData = await thumbRes.json();
        if (group.errors) return interaction.editReply({ content: `❌ Grupo no encontrado.` });

        const iconUrl = thumbData.data?.[0]?.imageUrl || null;

        const embed = new EmbedBuilder()
          .setTitle(`👾 ${group.name}`)
          .setURL(`https://www.roblox.com/groups/${groupId}`)
          .setColor(0x9B59B6)
          .setDescription(group.description?.slice(0, 400) || `*${L('Sin descripción', 'No description')}*`)
          .addFields(
            { name: '🆔 ID', value: `${groupId}`, inline: true },
            { name: L('👑 Dueño', '👑 Owner'), value: group.owner?.username || L('Sin dueño', 'No owner'), inline: true },
            { name: L('👥 Miembros', '👥 Members'), value: fmt(group.memberCount), inline: true },
            { name: L('🔒 Tipo', '🔒 Type'), value: group.publicEntryAllowed ? L('Público', 'Public') : L('Privado', 'Private'), inline: true },
            { name: L('✅ Verificado', '✅ Verified'), value: group.isBuildersClubOnly ? '💎 BC Only' : group.publicEntryAllowed ? '✅' : '🔒', inline: true },
            { name: L('🔔 Enemigos', '🔔 Enemies'), value: group.areEnemiesAllowed ? L('Permitidos', 'Allowed') : L('No', 'No'), inline: true }
          )
          .setFooter({ text: 'Roblox API' })
          .setTimestamp();

        if (iconUrl) embed.setThumbnail(iconUrl);
        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error('[roblox group]', err);
        return interaction.editReply({ content: '❌ Error al obtener datos del grupo.' });
      }
    }

    // ── BADGES ───────────────────────────────────────────────────────────────
    if (sub === 'badges') {
      const username = interaction.options.getString('username');
      try {
        const resolved = await resolveUser(username);
        if (!resolved) return interaction.editReply({ content: `❌ No se encontró **${username}** en Roblox.` });
        const userId = resolved.id;

        const badgesRes = await fetch(`https://badges.roblox.com/v1/users/${userId}/badges?limit=24&sortOrder=Desc`);
        const badgesData = await badgesRes.json();
        const badges = badgesData.data || [];

        const embed = new EmbedBuilder()
          .setTitle(`🏅 Badges — ${resolved.displayName} (@${username})`)
          .setURL(`https://www.roblox.com/users/${userId}/profile`)
          .setColor(0xF5A623)
          .setFooter({ text: `ID: ${userId} • Roblox` })
          .setTimestamp();

        if (!badges.length) {
          embed.setDescription(L('Este usuario no tiene badges.', 'This user has no badges.'));
        } else {
          const badgeText = badges.slice(0, 20).map((b, i) => `**${i + 1}.** ${b.name}`).join('\n');
          embed.setDescription(badgeText);
          embed.addFields({ name: L('Total mostrado', 'Total shown'), value: `${badges.length}`, inline: true });
        }

        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error('[roblox badges]', err);
        return interaction.editReply({ content: '❌ Error al obtener badges.' });
      }
    }

    // ── FRIENDS ──────────────────────────────────────────────────────────────
    if (sub === 'friends') {
      const username = interaction.options.getString('username');
      try {
        const resolved = await resolveUser(username);
        if (!resolved) return interaction.editReply({ content: `❌ No se encontró **${username}** en Roblox.` });
        const userId = resolved.id;

        const [friendsRes, countRes] = await Promise.all([
          fetch(`https://friends.roblox.com/v1/users/${userId}/friends?limit=25`),
          fetch(`https://friends.roblox.com/v1/users/${userId}/friends/count`)
        ]);

        const friendsData = await friendsRes.json();
        const countData = await countRes.json();
        const friends = friendsData.data || [];
        const total = countData.count ?? friends.length;

        const embed = new EmbedBuilder()
          .setTitle(`👥 Amigos — ${resolved.displayName} (@${username})`)
          .setURL(`https://www.roblox.com/users/${userId}/profile`)
          .setColor(0x57F287)
          .setFooter({ text: `ID: ${userId} • Roblox` })
          .setTimestamp();

        if (!friends.length) {
          embed.setDescription(L('Este usuario no tiene amigos públicos.', 'This user has no public friends.'));
        } else {
          const friendText = friends.slice(0, 20).map((f, i) => `**${i + 1}.** [${f.displayName}](https://www.roblox.com/users/${f.id}/profile) (@${f.name})`).join('\n');
          embed.setDescription(friendText);
          embed.addFields({ name: L('Total de amigos', 'Total friends'), value: `${fmt(total)}`, inline: true });
        }

        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error('[roblox friends]', err);
        return interaction.editReply({ content: '❌ Error al obtener amigos.' });
      }
    }

    // ── RAP ──────────────────────────────────────────────────────────────────
    if (sub === 'rap') {
      const username = interaction.options.getString('username');
      try {
        const resolved = await resolveUser(username);
        if (!resolved) return interaction.editReply({ content: `❌ No se encontró **${username}** en Roblox.` });
        const userId = resolved.id;

        // RAP requires inventory to be public
        const [inventoryRes, avatarRes] = await Promise.all([
          fetch(`https://inventory.roblox.com/v1/users/${userId}/assets/collectibles?limit=100&sortOrder=Desc`),
          fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`)
        ]);

        const inventoryData = await inventoryRes.json();
        const avatarData = await avatarRes.json();
        const avatarUrl = avatarData.data?.[0]?.imageUrl || null;

        if (inventoryData.errors || !inventoryData.data) {
          const embed = new EmbedBuilder()
            .setTitle(`💰 RAP — ${resolved.displayName} (@${username})`)
            .setURL(`https://www.roblox.com/users/${userId}/profile`)
            .setColor(0xFEE75C)
            .setDescription(L('⚠️ El inventario de este usuario es privado o no tiene limiteds.', '⚠️ This user\'s inventory is private or they have no limiteds.'))
            .setFooter({ text: `ID: ${userId} • Roblox` })
            .setTimestamp();
          if (avatarUrl) embed.setThumbnail(avatarUrl);
          return interaction.editReply({ embeds: [embed] });
        }

        const items = inventoryData.data || [];
        const totalRAP = items.reduce((sum, item) => sum + (item.recentAveragePrice || 0), 0);
        const topItems = items
          .sort((a, b) => (b.recentAveragePrice || 0) - (a.recentAveragePrice || 0))
          .slice(0, 8);

        const itemList = topItems.length
          ? topItems.map(i => `• **${i.name}** — ${fmt(i.recentAveragePrice)} R$`).join('\n')
          : L('Sin items con RAP', 'No items with RAP');

        const embed = new EmbedBuilder()
          .setTitle(`💰 RAP — ${resolved.displayName} (@${username})`)
          .setURL(`https://www.roblox.com/users/${userId}/profile`)
          .setColor(0xFEE75C)
          .addFields(
            { name: L('💎 RAP Total', '💎 Total RAP'), value: `**${fmt(totalRAP)} R$**`, inline: true },
            { name: L('📦 Limiteds', '📦 Limiteds'), value: `${items.length}`, inline: true },
            { name: L('🏆 Top items', '🏆 Top items'), value: itemList }
          )
          .setFooter({ text: `ID: ${userId} • Roblox` })
          .setTimestamp();

        if (avatarUrl) embed.setThumbnail(avatarUrl);
        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error('[roblox rap]', err);
        return interaction.editReply({ content: '❌ Error al obtener el RAP.' });
      }
    }
  }
};
