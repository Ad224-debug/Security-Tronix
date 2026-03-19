const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roblox')
    .setDescription('Muestra información de una cuenta de Roblox')
    .addStringOption(opt =>
      opt.setName('usuario')
        .setDescription('Nombre de usuario de Roblox')
        .setRequired(true)),

  async execute(interaction) {
    const username = interaction.options.getString('usuario');
    await interaction.deferReply();

    try {
      // 1. Buscar ID por username
      const searchRes = await fetch('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username], excludeBannedUsers: false })
      });
      const searchData = await searchRes.json();

      if (!searchData.data || searchData.data.length === 0) {
        return interaction.editReply({ content: `❌ No se encontró ningún usuario con el nombre **${username}** en Roblox.` });
      }

      const userId = searchData.data[0].id;
      const displayName = searchData.data[0].displayName;

      // 2. Info del usuario
      const [userRes, friendsRes, followersRes, followingRes, badgesRes] = await Promise.all([
        fetch(`https://users.roblox.com/v1/users/${userId}`),
        fetch(`https://friends.roblox.com/v1/users/${userId}/friends/count`),
        fetch(`https://friends.roblox.com/v1/users/${userId}/followers/count`),
        fetch(`https://friends.roblox.com/v1/users/${userId}/followings/count`),
        fetch(`https://badges.roblox.com/v1/users/${userId}/badges?limit=10&sortOrder=Desc`)
      ]);

      const [userData, friendsData, followersData, followingData, badgesData] = await Promise.all([
        userRes.json(), friendsRes.json(), followersRes.json(), followingRes.json(), badgesRes.json()
      ]);

      // 3. Avatar headshot
      const avatarRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`);
      const avatarData = await avatarRes.json();
      const avatarUrl = avatarData.data?.[0]?.imageUrl || null;

      // Formatear fecha de creación
      const createdAt = new Date(userData.created);
      const createdStr = `<t:${Math.floor(createdAt.getTime() / 1000)}:D>`;

      // Calcular antigüedad en días
      const days = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const years = Math.floor(days / 365);
      const remainingDays = days % 365;
      const ageStr = years > 0 ? `${years} año(s) y ${remainingDays} día(s)` : `${days} día(s)`;

      // Badges de Roblox (primeros 5)
      const badgeList = badgesData.data?.slice(0, 5).map(b => b.name).join('\n') || 'Ninguno';

      const embed = new EmbedBuilder()
        .setTitle(`${userData.isBanned ? '🚫 ' : ''}${displayName} (@${userData.name})`)
        .setURL(`https://www.roblox.com/users/${userId}/profile`)
        .setColor(userData.isBanned ? 0xFF0000 : 0x00B2FF)
        .setDescription(userData.description?.slice(0, 300) || '*Sin descripción*')
        .addFields(
          { name: '🆔 ID', value: `${userId}`, inline: true },
          { name: '📅 Creado', value: createdStr, inline: true },
          { name: '⏳ Antigüedad', value: ageStr, inline: true },
          { name: '👥 Amigos', value: `${friendsData.count ?? 'N/A'}`, inline: true },
          { name: '👁️ Seguidores', value: `${followersData.count ?? 'N/A'}`, inline: true },
          { name: '➡️ Siguiendo', value: `${followingData.count ?? 'N/A'}`, inline: true },
          { name: '🏅 Últimos badges', value: badgeList, inline: false }
        )
        .setFooter({ text: 'Roblox', iconURL: 'https://images.rbxcdn.com/e1c5c5e5e5e5e5e5e5e5e5e5e5e5e5e5.png' })
        .setTimestamp();

      if (avatarUrl) embed.setThumbnail(avatarUrl);
      if (userData.isBanned) embed.addFields({ name: '⚠️ Estado', value: 'Esta cuenta está **baneada**', inline: false });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error en /roblox:', error);
      await interaction.editReply({ content: '❌ Error al obtener datos de Roblox. Intenta de nuevo.' });
    }
  }
};
