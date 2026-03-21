const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('case')
    .setDescription('View details of a moderation case')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addIntegerOption(option =>
      option.setName('case_id')
        .setDescription('Case ID to view')
        .setMinValue(1)
        .setRequired(true)),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: lang === 'es' ? '❌ Solo administradores pueden usar este comando.' : '❌ Only administrators can use this command.',
        ephemeral: true
      });
    }

    const caseId = interaction.options.getInteger('case_id');
    const casesPath = path.join(__dirname, '../data/mod-cases.json');
    
    let cases = {};
    if (fs.existsSync(casesPath)) {
      cases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
    }

    const guildCases = cases[interaction.guild.id] || [];
    const modCase = guildCases.find(c => c.id === caseId);

    if (!modCase) {
      return await interaction.reply({
        content: lang === 'es' ? `❌ No se encontró el caso #${caseId}` : `❌ Case #${caseId} not found`,
        ephemeral: true
      });
    }

    const moderator = await interaction.client.users.fetch(modCase.moderatorId).catch(() => null);
    const target = await interaction.client.users.fetch(modCase.targetId).catch(() => null);

    const typeEmojis = {
      warn: '⚠️',
      kick: '👢',
      ban: '🔨',
      tempban: '⏰',
      softban: '🧹',
      timeout: '⏱️',
      unban: '🔓',
      note: '📝'
    };

    const typeNames = lang === 'es' ? {
      warn: 'Advertencia',
      kick: 'Expulsión',
      ban: 'Baneo',
      tempban: 'Baneo Temporal',
      softban: 'Softban',
      timeout: 'Timeout',
      unban: 'Desbaneo',
      note: 'Nota'
    } : {
      warn: 'Warning',
      kick: 'Kick',
      ban: 'Ban',
      tempban: 'Temporary Ban',
      softban: 'Softban',
      timeout: 'Timeout',
      unban: 'Unban',
      note: 'Note'
    };

    const embed = new EmbedBuilder()
      .setTitle(`${typeEmojis[modCase.type]} ${lang === 'es' ? 'Caso' : 'Case'} #${caseId}`)
      .setColor(modCase.type === 'ban' || modCase.type === 'tempban' ? 0xED4245 : 
                modCase.type === 'warn' ? 0xFEE75C : 
                modCase.type === 'note' ? 0x5865F2 : 0xFFA500)
      .addFields(
        { name: lang === 'es' ? '📋 Tipo' : '📋 Type', value: typeNames[modCase.type], inline: true },
        { name: lang === 'es' ? '👤 Usuario' : '👤 User', value: target ? `${target.tag} (${target.id})` : modCase.targetId, inline: true },
        { name: lang === 'es' ? '👮 Moderador' : '👮 Moderator', value: moderator ? moderator.tag : 'Desconocido', inline: true },
        { name: lang === 'es' ? '📝 Razón' : '📝 Reason', value: modCase.reason || (lang === 'es' ? 'No especificada' : 'Not specified'), inline: false },
        { name: lang === 'es' ? '🕐 Fecha' : '🕐 Date', value: `<t:${Math.floor(modCase.timestamp / 1000)}:F>`, inline: true }
      )
      .setTimestamp(modCase.timestamp);

    if (modCase.duration) {
      embed.addFields({
        name: lang === 'es' ? '⏰ Duración' : '⏰ Duration',
        value: modCase.duration,
        inline: true
      });
    }

    if (modCase.expiresAt) {
      embed.addFields({
        name: lang === 'es' ? '⏳ Expira' : '⏳ Expires',
        value: `<t:${Math.floor(modCase.expiresAt / 1000)}:R>`,
        inline: true
      });
    }

    await interaction.reply({ embeds: [embed] });
  },
};

// Función helper para crear casos
function createCase(guildId, type, targetId, moderatorId, reason, duration = null, expiresAt = null) {
  const casesPath = path.join(__dirname, '../data/mod-cases.json');
  
  let cases = {};
  if (fs.existsSync(casesPath)) {
    cases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
  }

  if (!cases[guildId]) {
    cases[guildId] = [];
  }

  const caseId = cases[guildId].length + 1;
  const newCase = {
    id: caseId,
    type,
    targetId,
    moderatorId,
    reason,
    timestamp: Date.now(),
    duration,
    expiresAt
  };

  cases[guildId].push(newCase);

  // Crear directorio si no existe
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(casesPath, JSON.stringify(cases, null, 2));
  return caseId;
}

module.exports.createCase = createCase;
