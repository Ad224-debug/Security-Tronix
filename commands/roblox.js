const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
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

// Build the User Profile embed (Avi-style)
function buildProfileEmbed(d) {
  const { userId, userData, friendsData, followersData, followingData,
          badgesData, badgeThumbs, inventoryData, socialData, isPremium, presenceStatus, lastOnline } = d;

  const createdAt = new Date(userData.created);
  const isBanned = userData.isBanned;

  const friends   = fmt(friendsData.count);
  const followers = fmt(followersData.count);
  const following = fmt(followingData.count);

  // Inventory / RAP
  const inventoryPublic = !inventoryData?.errors && Array.isArray(inventoryData?.data);
  const rap = inventoryPublic
    ? fmt(inventoryData.data.reduce((s, i) => s + (i.recentAveragePrice || 0), 0))
    : '—';

  // Badges — show thumbnail URLs as links (Avi style: badge icons inline)
  // Discord embeds can't show multiple images, so we show badge names as links to their icons
  let badgeValue = '—';
  if (badgesData.data?.length) {
    const badges = badgesData.data.slice(0, 5);
    // Map badge id → imageUrl from thumbs
    const thumbMap = {};
    for (const t of (badgeThumbs || [])) thumbMap[t.targetId] = t.imageUrl;
    badgeValue = badges.map(b => {
      const url = thumbMap[b.id];
      return url ? `[${b.name}](${url})` : b.name;
    }).join('\n');
  }

  // Presence
  const presTypes = { 0: '⚫ Offline', 1: '🟢 Online', 2: '🎮 In Game', 3: '🔧 Studio' };
  const presLabel = presTypes[presenceStatus?.type ?? 0] || '⚫ Offline';
  const presGame  = presenceStatus?.lastLocation && presenceStatus?.type === 2
    ? ` • ${presenceStatus.lastLocation}` : '';

  // Last Online — use Discord relative timestamp if available
  let lastOnlineValue = '—';
  if (lastOnline instanceof Date && !isNaN(lastOnline)) {
    lastOnlineValue = `<t:${Math.floor(lastOnline.getTime() / 1000)}:R>`;
  }

  // Social connections
  const socialLines = [];
  if (socialData?.xboxUsername)    socialLines.push(`🎮 Xbox: **${socialData.xboxUsername}**`);
  if (socialData?.youtubeUsername) socialLines.push(`▶️ YouTube: **${socialData.youtubeUsername}**`);
  if (socialData?.twitterUsername) socialLines.push(`🐦 Twitter: **${socialData.twitterUsername}**`);
  if (socialData?.twitchUsername)  socialLines.push(`🟣 Twitch: **${socialData.twitchUsername}**`);

  // Language
  const locale = userData.locale || null;
  const localeNames = {
    'en_us': 'English (US)', 'es_es': 'Spanish (Spain)', 'es_mx': 'Spanish (Mexico)',
    'pt_br': 'Portuguese (Brazil)', 'fr_fr': 'French', 'de_de': 'German',
    'it_it': 'Italian', 'ja_jp': 'Japanese', 'ko_kr': 'Korean',
    'zh_cn': 'Chinese (Simplified)', 'zh_tw': 'Chinese (Traditional)',
    'ru_ru': 'Russian', 'pl_pl': 'Polish', 'tr_tr': 'Turkish'
  };
  const langLabel = locale ? (localeNames[locale.toLowerCase()] || locale) : null;
  if (langLabel) socialLines.push(`🌐 Language: **${langLabel}** (${locale})`);

  const descLines = [`**${friends} Friends | ${followers} Followers | ${following} Following**`];
  if (isPremium) descLines.push('💎 Roblox Premium');
  if (isBanned)  descLines.push('🚫 **Account Banned**');
  if (socialLines.length) descLines.push('', ...socialLines);

  const embed = new EmbedBuilder()
    .setColor(isBanned ? 0xFF0000 : isPremium ? 0xF5A623 : 0x5865F2)
    .setAuthor({
      name: `${userData.displayName} (@${userData.name})`,
      url: `https://www.roblox.com/users/${userId}/profile`
    })
    .setDescription(descLines.join('\n'))
    .addFields(
      { name: 'ID',          value: `${userId}`,                                                                                    inline: true },
      { name: 'Verified',    value: 'N/A',                                                                                          inline: true },
      { name: 'Inventory',   value: inventoryPublic ? 'Public' : 'Private',                                                         inline: true },
      { name: 'RAP',         value: rap,                                                                                             inline: true },
      { name: 'Value',       value: '—',                                                                                             inline: true },
      { name: 'Visits',      value: '0',                                                                                             inline: true },
      { name: 'Created',     value: `<t:${Math.floor(createdAt.getTime() / 1000)}:D>`,                                               inline: true },
      { name: 'Last Online', value: lastOnlineValue,                                                                                 inline: true },
      { name: 'Badges',      value: badgeValue,                                                                                      inline: true }
    )
    .setFooter({ text: `${presLabel}${presGame}` })
    .setTimestamp();

  if (d.avatarUrl) embed.setThumbnail(d.avatarUrl);
  if (userData.description?.trim()) embed.addFields({ name: 'Description', value: userData.description.slice(0, 300) });

  return embed;
}

// Build Avatar embed
function buildAvatarEmbed(d) {
  return new EmbedBuilder()
    .setColor(0x5865F2)
    .setAuthor({ name: `${d.userData.displayName} (@${d.userData.name})`, url: `https://www.roblox.com/users/${d.userId}/profile` })
    .setTitle('Avatar')
    .setImage(d.fullAvatarUrl || d.avatarUrl)
    .setFooter({ text: `ID: ${d.userId}` });
}

// Build Groups embed
function buildGroupsEmbed(d) {
  const groups = d.groupsData.data || [];
  const desc = groups.length
    ? groups.slice(0, 15).map(g => `**${g.group.name}** — ${g.role.name} • [Ver](https://www.roblox.com/groups/${g.group.id})`).join('\n')
    : '*No groups*';
  return new EmbedBuilder()
    .setColor(0x9B59B6)
    .setAuthor({ name: `${d.userData.displayName} (@${d.userData.name})`, url: `https://www.roblox.com/users/${d.userId}/profile` })
    .setTitle(`Groups (${groups.length})`)
    .setDescription(desc)
    .setThumbnail(d.avatarUrl)
    .setFooter({ text: `ID: ${d.userId}` });
}

// Build Games embed
function buildGamesEmbed(d) {
  const games = d.gamesData.data || [];
  const desc = games.length
    ? games.slice(0, 10).map(g => `**[${g.name}](https://www.roblox.com/games/${g.rootPlace?.id})** — 👁️ ${fmt(g.visits)} visitas`).join('\n')
    : '*No public games*';
  return new EmbedBuilder()
    .setColor(0x57F287)
    .setAuthor({ name: `${d.userData.displayName} (@${d.userData.name})`, url: `https://www.roblox.com/users/${d.userId}/profile` })
    .setTitle(`Games (${games.length})`)
    .setDescription(desc)
    .setThumbnail(d.avatarUrl)
    .setFooter({ text: `ID: ${d.userId}` });
}

// Build Currently Wearing embed
function buildWearingEmbed(d) {
  const items = d.wearingData || [];
  const desc = items.length
    ? items.slice(0, 15).map(i => `• [${i.name}](https://www.roblox.com/catalog/${i.id})`).join('\n')
    : '*No items / private*';
  return new EmbedBuilder()
    .setColor(0xFEE75C)
    .setAuthor({ name: `${d.userData.displayName} (@${d.userData.name})`, url: `https://www.roblox.com/users/${d.userId}/profile` })
    .setTitle('Currently Wearing')
    .setDescription(desc)
    .setThumbnail(d.avatarUrl)
    .setFooter({ text: `ID: ${d.userId}` });
}

function buildSelectMenu(userId) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`roblox_view:${userId}`)
      .setPlaceholder('User Profile')
      .addOptions([
        { label: 'User Profile', value: 'profile',  emoji: '👤', default: true  },
        { label: 'Avatar',       value: 'avatar',   emoji: '🧍'                 },
        { label: 'Groups',       value: 'groups',   emoji: '👾'                 },
        { label: 'Games',        value: 'games',    emoji: '🎮'                 },
        { label: 'Currently Wearing', value: 'wearing', emoji: '👕'             },
      ])
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roblox')
    .setDescription('Comandos de Roblox / Roblox commands')
    .addSubcommand(s => s.setName('user')
      .setDescription('Perfil completo de un usuario de Roblox')
      .addStringOption(o => o.setName('username').setDescription('Nombre de usuario de Roblox').setRequired(true)))
    .addSubcommand(s => s.setName('game')
      .setDescription('Información de un juego de Roblox')
      .addStringOption(o => o.setName('query').setDescription('Nombre o ID del juego').setRequired(true)))
    .addSubcommand(s => s.setName('group')
      .setDescription('Información de un grupo de Roblox')
      .addStringOption(o => o.setName('query').setDescription('Nombre o ID del grupo').setRequired(true))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const lang = interaction.client.getLanguage ? interaction.client.getLanguage(interaction.guild.id) : 'es';
    const L = (es, en) => lang === 'es' ? es : en;

    await interaction.deferReply();

    // ── USER (Avi-style) ─────────────────────────────────────────────────────
    if (sub === 'user') {
      const username = interaction.options.getString('username');
      const cacheKey = `roblox:user:${username.toLowerCase()}`;
      try {
        let d = cache.get(cacheKey);
        const fromCache = !!d;

        if (!d) {
          const resolved = await resolveUser(username);
          if (!resolved) return interaction.editReply({ content: `❌ No se encontró **${username}** en Roblox.` });
          const userId = resolved.id;

          const [
            userRes, friendsRes, followersRes, followingRes,
            badgesRes, groupsRes, gamesRes, premiumRes,
            avatarHeadRes, avatarFullRes, inventoryRes, socialRes
          ] = await Promise.all([
            fetch(`https://users.roblox.com/v1/users/${userId}`),
            fetch(`https://friends.roblox.com/v1/users/${userId}/friends/count`),
            fetch(`https://friends.roblox.com/v1/users/${userId}/followers/count`),
            fetch(`https://friends.roblox.com/v1/users/${userId}/followings/count`),
            fetch(`https://badges.roblox.com/v1/users/${userId}/badges?limit=10&sortOrder=Desc`),
            fetch(`https://groups.roblox.com/v1/users/${userId}/groups/roles`),
            fetch(`https://games.roblox.com/v2/users/${userId}/games?limit=10&sortOrder=Desc`),
            fetch(`https://premiumfeatures.roblox.com/v1/users/${userId}/validate-membership`),
            fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png`),
            fetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=720x720&format=Png`),
            fetch(`https://inventory.roblox.com/v1/users/${userId}/assets/collectibles?limit=100&sortOrder=Desc`),
            fetch(`https://accountinformation.roblox.com/v1/users/${userId}/promotion-channels`)
          ]);

          const [
            userData, friendsData, followersData, followingData,
            badgesData, groupsData, gamesData,
            avatarHeadData, avatarFullData, inventoryData
          ] = await Promise.all([
            userRes.json(), friendsRes.json(), followersRes.json(), followingRes.json(),
            badgesRes.json(), groupsRes.json(), gamesRes.json(),
            avatarHeadRes.json(), avatarFullRes.json(),
            inventoryRes.json()
          ]);

          // Social data — promotion-channels requires auth, try but don't fail
          let socialData = {};
          try {
            const sd = await socialRes.json();
            // Only use if it has actual data (not an error response)
            if (!sd.errors && (sd.xboxUsername || sd.youtubeUsername || sd.twitterUsername || sd.twitchUsername)) {
              socialData = sd;
            }
          } catch { /* skip */ }

          let isPremium = false;
          try {
            const pd = await premiumRes.json().catch(() => null);
            if (typeof pd === 'boolean') isPremium = pd;
            else if (pd?.isPremium) isPremium = true;
            else isPremium = premiumRes.status === 200;
          } catch { isPremium = false; }

          // Presence + lastOnline
          let presenceStatus = { type: 0, lastLocation: null };
          let lastOnline = null;
          try {
            const presRes = await fetch('https://presence.roblox.com/v1/presence/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userIds: [userId] })
            });
            const presData = await presRes.json();
            const p = presData.userPresences?.[0];
            if (p) {
              presenceStatus = { type: p.userPresenceType, lastLocation: p.lastLocation };
              if (p.lastOnline) lastOnline = new Date(p.lastOnline);
            }
          } catch { /* skip */ }

          // Fallback: legacy API returns LastOnline without auth
          if (!lastOnline) {
            try {
              const legacyRes = await fetch(`https://api.roblox.com/users/${userId}/onlinestatus`);
              if (legacyRes.ok) {
                const legacyData = await legacyRes.json();
                if (legacyData.LastOnline) lastOnline = new Date(legacyData.LastOnline);
              }
            } catch { /* skip */ }
          }

          // Currently wearing
          let wearingData = [];
          try {
            const wearRes = await fetch(`https://avatar.roblox.com/v1/users/${userId}/currently-wearing`);
            const wearJson = await wearRes.json();
            if (wearJson.assetIds?.length) {
              // Fetch names for up to 15 items
              const ids = wearJson.assetIds.slice(0, 15);
              const detailRes = await fetch(`https://catalog.roblox.com/v1/catalog/items/details`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: ids.map(id => ({ itemType: 'Asset', id })) })
              });
              const detailData = await detailRes.json();
              wearingData = detailData.data || ids.map(id => ({ id, name: `Asset ${id}` }));
            }
          } catch { /* skip */ }

          // Badge thumbnails — fetch icons for up to 5 badges
          let badgeThumbs = [];
          try {
            const badgeIds = badgesData.data?.slice(0, 5).map(b => b.id) || [];
            if (badgeIds.length) {
              const btRes = await fetch(`https://thumbnails.roblox.com/v1/badges/icons?badgeIds=${badgeIds.join(',')}&size=150x150&format=Png`);
              const btData = await btRes.json();
              badgeThumbs = btData.data || [];
            }
          } catch { /* skip */ }

          d = {
            userId,
            userData, friendsData, followersData, followingData,
            badgesData, groupsData, gamesData, inventoryData, socialData,
            avatarUrl: avatarHeadData.data?.[0]?.imageUrl || null,
            fullAvatarUrl: avatarFullData.data?.[0]?.imageUrl || null,
            isPremium, presenceStatus, lastOnline, wearingData, badgeThumbs
          };
          cache.set(cacheKey, d, 10 * 60 * 1000);
        }

        const embed = buildProfileEmbed(d);
        const row = buildSelectMenu(d.userId);

        const msg = await interaction.editReply({ embeds: [embed], components: [row] });

        // Collector for select menu interactions
        const collector = msg.createMessageComponentCollector({ time: 5 * 60 * 1000 });
        collector.on('collect', async i => {
          if (i.user.id !== interaction.user.id) {
            return i.reply({ content: '❌ Solo quien usó el comando puede navegar.', ephemeral: true });
          }
          const view = i.values[0];
          let newEmbed;
          if (view === 'profile') newEmbed = buildProfileEmbed(d);
          else if (view === 'avatar') newEmbed = buildAvatarEmbed(d);
          else if (view === 'groups') newEmbed = buildGroupsEmbed(d);
          else if (view === 'games') newEmbed = buildGamesEmbed(d);
          else if (view === 'wearing') newEmbed = buildWearingEmbed(d);

          // Update select menu default
          const updatedRow = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`roblox_view:${d.userId}`)
              .setPlaceholder(i.values[0])
              .addOptions([
                { label: 'User Profile',      value: 'profile',  emoji: '👤', default: view === 'profile'  },
                { label: 'Avatar',            value: 'avatar',   emoji: '🧍', default: view === 'avatar'   },
                { label: 'Groups',            value: 'groups',   emoji: '👾', default: view === 'groups'   },
                { label: 'Games',             value: 'games',    emoji: '🎮', default: view === 'games'    },
                { label: 'Currently Wearing', value: 'wearing',  emoji: '👕', default: view === 'wearing'  },
              ])
          );

          await i.update({ embeds: [newEmbed], components: [updatedRow] });
        });

        collector.on('end', () => {
          interaction.editReply({ components: [] }).catch(() => {});
        });

        return;
      } catch (err) {
        console.error('[roblox user]', err);
        return interaction.editReply({ content: '❌ Error al obtener datos de Roblox.' });
      }
    }

    // ── GAME ─────────────────────────────────────────────────────────────────
    if (sub === 'game') {
      const query = interaction.options.getString('query');
      try {
        let universeId;

        if (/^\d+$/.test(query)) {
          // Numeric: could be placeId or universeId — try place→universe first
          const convRes = await fetch(`https://apis.roblox.com/universes/v1/places/${query}/universe`);
          const convData = await convRes.json();
          universeId = convData.universeId;
          // If that fails, treat as universeId directly
          if (!universeId) universeId = query;
        } else {
          // Search by name using the games search API
          const searchRes = await fetch(`https://games.roblox.com/v1/games/list?model.keyword=${encodeURIComponent(query)}&model.maxRows=6&model.startRows=0`);
          const searchData = await searchRes.json();
          if (!searchData.games?.length) return interaction.editReply({ content: `❌ No se encontró el juego **${query}**.` });
          universeId = searchData.games[0].universeId;
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

  }
};
