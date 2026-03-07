const fs = require('fs');
const path = require('path');

// Tracking de strikes por usuario
const userStrikes = new Map();

function getRB3Config(guildId) {
  const rb3Path = path.join(__dirname, 'data/rb3-config.json');
  
  if (!fs.existsSync(rb3Path)) {
    return null;
  }

  const rb3 = JSON.parse(fs.readFileSync(rb3Path, 'utf8'));
  return rb3[guildId] || null;
}

function getUserStrikes(guildId, userId) {
  const strikesPath = path.join(__dirname, 'data/rb3-strikes.json');
  
  if (!fs.existsSync(strikesPath)) {
    return [];
  }

  const strikes = JSON.parse(fs.readFileSync(strikesPath, 'utf8'));
  const key = `${guildId}-${userId}`;
  return strikes[key] || [];
}

function addStrike(guildId, userId, reason) {
  const strikesPath = path.join(__dirname, 'data/rb3-strikes.json');
  
  let strikes = {};
  if (fs.existsSync(strikesPath)) {
    strikes = JSON.parse(fs.readFileSync(strikesPath, 'utf8'));
  }

  const key = `${guildId}-${userId}`;
  if (!strikes[key]) {
    strikes[key] = [];
  }

  strikes[key].push({
    reason,
    timestamp: Date.now()
  });

  // Crear directorio si no existe
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(strikesPath, JSON.stringify(strikes, null, 2));
  
  return strikes[key].length;
}

function cleanOldStrikes(guildId, userId, resetDays) {
  if (resetDays === 0) return; // No reset

  const strikesPath = path.join(__dirname, 'data/rb3-strikes.json');
  
  if (!fs.existsSync(strikesPath)) return;

  const strikes = JSON.parse(fs.readFileSync(strikesPath, 'utf8'));
  const key = `${guildId}-${userId}`;
  
  if (!strikes[key]) return;

  const now = Date.now();
  const resetTime = resetDays * 24 * 60 * 60 * 1000;
  
  strikes[key] = strikes[key].filter(strike => now - strike.timestamp < resetTime);
  
  fs.writeFileSync(strikesPath, JSON.stringify(strikes, null, 2));
}

async function applyRB3Action(guild, userId, strikeCount, reason, client) {
  const config = getRB3Config(guild.id);
  if (!config || !config.enabled) return null;

  let action = null;
  if (strikeCount === 1) action = config.strike1;
  else if (strikeCount === 2) action = config.strike2;
  else if (strikeCount >= 3) action = config.strike3;

  if (!action) return null;

  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return null;

  const lang = guild.preferredLocale?.startsWith('es') ? 'es' : 'en';
  const { EmbedBuilder } = require('discord.js');

  try {
    // Enviar DM al usuario
    const dmEmbed = new EmbedBuilder()
      .setTitle(lang === 'es' ? '⚠️ Sistema RB3 Activado' : '⚠️ RB3 System Activated')
      .setDescription(lang === 'es' 
        ? `Has acumulado **${strikeCount} strike(s)** en **${guild.name}**`
        : `You have accumulated **${strikeCount} strike(s)** in **${guild.name}**`)
      .addFields(
        { name: lang === 'es' ? '📝 Razón' : '📝 Reason', value: reason },
        { name: lang === 'es' ? '🎯 Strikes Totales' : '🎯 Total Strikes', value: `${strikeCount}/3` }
      )
      .setColor(0xFEE75C)
      .setTimestamp();

    // Aplicar acción
    switch (action) {
      case 'warn':
        dmEmbed.addFields({ 
          name: lang === 'es' ? '⚠️ Acción' : '⚠️ Action', 
          value: lang === 'es' ? 'Advertencia oficial' : 'Official warning' 
        });
        await member.send({ embeds: [dmEmbed] }).catch(() => {});
        break;

      case 'timeout_1h':
        await member.timeout(60 * 60 * 1000, `[RB3] ${reason}`);
        dmEmbed.addFields({ 
          name: lang === 'es' ? '⏱️ Acción' : '⏱️ Action', 
          value: lang === 'es' ? 'Timeout de 1 hora' : 'Timeout for 1 hour' 
        });
        await member.send({ embeds: [dmEmbed] }).catch(() => {});
        break;

      case 'timeout_6h':
        await member.timeout(6 * 60 * 60 * 1000, `[RB3] ${reason}`);
        dmEmbed.addFields({ 
          name: lang === 'es' ? '⏱️ Acción' : '⏱️ Action', 
          value: lang === 'es' ? 'Timeout de 6 horas' : 'Timeout for 6 hours' 
        });
        await member.send({ embeds: [dmEmbed] }).catch(() => {});
        break;

      case 'timeout_12h':
        await member.timeout(12 * 60 * 60 * 1000, `[RB3] ${reason}`);
        dmEmbed.addFields({ 
          name: lang === 'es' ? '⏱️ Acción' : '⏱️ Action', 
          value: lang === 'es' ? 'Timeout de 12 horas' : 'Timeout for 12 hours' 
        });
        await member.send({ embeds: [dmEmbed] }).catch(() => {});
        break;

      case 'timeout_24h':
        await member.timeout(24 * 60 * 60 * 1000, `[RB3] ${reason}`);
        dmEmbed.addFields({ 
          name: lang === 'es' ? '⏱️ Acción' : '⏱️ Action', 
          value: lang === 'es' ? 'Timeout de 24 horas' : 'Timeout for 24 hours' 
        });
        await member.send({ embeds: [dmEmbed] }).catch(() => {});
        break;

      case 'timeout_3d':
        await member.timeout(3 * 24 * 60 * 60 * 1000, `[RB3] ${reason}`);
        dmEmbed.addFields({ 
          name: lang === 'es' ? '⏱️ Acción' : '⏱️ Action', 
          value: lang === 'es' ? 'Timeout de 3 días' : 'Timeout for 3 days' 
        });
        await member.send({ embeds: [dmEmbed] }).catch(() => {});
        break;

      case 'timeout_7d':
        await member.timeout(7 * 24 * 60 * 60 * 1000, `[RB3] ${reason}`);
        dmEmbed.addFields({ 
          name: lang === 'es' ? '⏱️ Acción' : '⏱️ Action', 
          value: lang === 'es' ? 'Timeout de 7 días' : 'Timeout for 7 days' 
        });
        await member.send({ embeds: [dmEmbed] }).catch(() => {});
        break;

      case 'kick':
        dmEmbed.addFields({ 
          name: lang === 'es' ? '👢 Acción' : '👢 Action', 
          value: lang === 'es' ? 'Expulsión del servidor' : 'Kicked from server' 
        });
        await member.send({ embeds: [dmEmbed] }).catch(() => {});
        await member.kick(`[RB3] ${reason}`);
        break;

      case 'tempban_7d':
        dmEmbed.addFields({ 
          name: lang === 'es' ? '⏰ Acción' : '⏰ Action', 
          value: lang === 'es' ? 'Baneo temporal de 7 días' : 'Temporary ban for 7 days' 
        });
        await member.send({ embeds: [dmEmbed] }).catch(() => {});
        await guild.members.ban(userId, { reason: `[RB3 TEMPBAN 7d] ${reason}` });
        
        // Programar desbaneo automático en 7 días
        setTimeout(async () => {
          try {
            await guild.members.unban(userId, 'RB3 Tempban expired (7 days)');
            console.log(`✅ RB3 Tempban expired for user ${userId} in guild ${guild.id}`);
          } catch (error) {
            console.error('Error unbanning user:', error);
          }
        }, 7 * 24 * 60 * 60 * 1000);
        break;

      case 'tempban_30d':
        dmEmbed.addFields({ 
          name: lang === 'es' ? '⏰ Acción' : '⏰ Action', 
          value: lang === 'es' ? 'Baneo temporal de 30 días' : 'Temporary ban for 30 days' 
        });
        await member.send({ embeds: [dmEmbed] }).catch(() => {});
        await guild.members.ban(userId, { reason: `[RB3 TEMPBAN 30d] ${reason}` });
        
        // Programar desbaneo automático en 30 días
        setTimeout(async () => {
          try {
            await guild.members.unban(userId, 'RB3 Tempban expired (30 days)');
            console.log(`✅ RB3 Tempban expired for user ${userId} in guild ${guild.id}`);
          } catch (error) {
            console.error('Error unbanning user:', error);
          }
        }, 30 * 24 * 60 * 60 * 1000);
        break;

      case 'ban':
        dmEmbed.addFields({ 
          name: lang === 'es' ? '🔨 Acción' : '🔨 Action', 
          value: lang === 'es' ? 'Baneo permanente' : 'Permanent ban' 
        });
        await member.send({ embeds: [dmEmbed] }).catch(() => {});
        await guild.members.ban(userId, { reason: `[RB3] ${reason}` });
        break;
    }

    return { action, strikeCount };
  } catch (error) {
    console.error('Error applying RB3 action:', error);
    return null;
  }
}

async function handleRB3Strike(guild, userId, reason, client) {
  const config = getRB3Config(guild.id);
  if (!config || !config.enabled) return null;

  // Limpiar strikes antiguos
  cleanOldStrikes(guild.id, userId, config.resetDays);

  // Agregar nuevo strike
  const strikeCount = addStrike(guild.id, userId, reason);

  // Aplicar acción
  return await applyRB3Action(guild, userId, strikeCount, reason, client);
}

module.exports = { handleRB3Strike, getUserStrikes, getRB3Config };
