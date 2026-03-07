const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Shows server information'),
    
  async execute(interaction) {
    const { guild } = interaction;
    const lang = interaction.client.getLanguage(interaction.guild.id);
    
    const totalMembers = guild.memberCount;
    const humans = guild.members.cache.filter(member => !member.user.bot).size;
    const bots = guild.members.cache.filter(member => member.user.bot).size;
    const boostLevel = guild.premiumTier;
    const boostCount = guild.premiumSubscriptionCount || 0;
    const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
    const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
    const categories = guild.channels.cache.filter(c => c.type === 4).size;
    const roles = guild.roles.cache.size;
    const emojis = guild.emojis.cache.size;
    const stickers = guild.stickers.cache.size;

    const title = lang === 'es' ? `📊 Información de ${guild.name}` : `📊 ${guild.name} Information`;
    const description = guild.description || (lang === 'es' ? 'Sin descripción' : 'No description');
    
    const fields = lang === 'es' ? [
      { name: '👑 Dueño', value: `<@${guild.ownerId}>`, inline: true },
      { name: '📅 Creado', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
      { name: '🆔 ID', value: `\`${guild.id}\``, inline: true },
      { name: '👥 Miembros', value: `\`${totalMembers}\` (${humans} humanos, ${bots} bots)`, inline: false },
      { name: '📝 Canales', value: `\`${guild.channels.cache.size}\` (${textChannels} texto, ${voiceChannels} voz, ${categories} categorías)`, inline: false },
      { name: '🎭 Roles', value: `\`${roles}\``, inline: true },
      { name: '😀 Emojis', value: `\`${emojis}\``, inline: true },
      { name: '🎨 Stickers', value: `\`${stickers}\``, inline: true },
      { name: '💎 Nivel de Boost', value: `\`Nivel ${boostLevel}\` (${boostCount} boosts)`, inline: false },
      { name: '🔒 Nivel de Verificación', value: `\`${guild.verificationLevel}\``, inline: true },
      { name: '🛡️ Filtro de Contenido', value: `\`${guild.explicitContentFilter}\``, inline: true },
    ] : [
      { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
      { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
      { name: '🆔 ID', value: `\`${guild.id}\``, inline: true },
      { name: '👥 Members', value: `\`${totalMembers}\` (${humans} humans, ${bots} bots)`, inline: false },
      { name: '📝 Channels', value: `\`${guild.channels.cache.size}\` (${textChannels} text, ${voiceChannels} voice, ${categories} categories)`, inline: false },
      { name: '🎭 Roles', value: `\`${roles}\``, inline: true },
      { name: '😀 Emojis', value: `\`${emojis}\``, inline: true },
      { name: '🎨 Stickers', value: `\`${stickers}\``, inline: true },
      { name: '💎 Boost Level', value: `\`Level ${boostLevel}\` (${boostCount} boosts)`, inline: false },
      { name: '🔒 Verification Level', value: `\`${guild.verificationLevel}\``, inline: true },
      { name: '🛡️ Content Filter', value: `\`${guild.explicitContentFilter}\``, inline: true },
    ];

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setFields(fields)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .setColor(0x5865F2)
      .setTimestamp();

    if (guild.bannerURL()) {
      embed.setImage(guild.bannerURL({ size: 512 }));
    }

    await interaction.reply({ embeds: [embed] });
  },
};
