require('dotenv').config();
const { Client, GatewayIntentBits, Collection, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION']
});

// Cache para almacenar mensajes y poder recuperarlos cuando se eliminen
const messageCache = new Map();

client.commands = new Collection();

// Cargar configuración de prefijos
function getPrefix(guildId) {
  const configPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config.prefixes?.[guildId] || '!';
  }
  return '!';
}

// Cargar idioma del servidor
function getLanguage(guildId) {
  const configPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config.languages?.[guildId] || 'es';
  }
  return 'es';
}

// Obtener texto traducido
function getText(guildId, key) {
  const lang = getLanguage(guildId);
  const langPath = path.join(__dirname, 'languages.json');
  if (fs.existsSync(langPath)) {
    const languages = JSON.parse(fs.readFileSync(langPath, 'utf8'));
    return languages[lang]?.[key] || languages['es']?.[key] || key;
  }
  return key;
}

// Obtener canal de logs
function getLogChannel(guildId) {
  const configPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config.logChannels?.[guildId];
  }
  return null;
}

// Obtener canal de logs de mensajes eliminados
function getDeleteLogChannel(guildId) {
  const configPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config.deleteLogChannels?.[guildId];
  }
  return null;
}

// Obtener canal de notificaciones de boost
function getBoostChannel(guildId) {
  const configPath = path.join(__dirname, 'config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return config.boostChannels?.[guildId];
  }
  return null;
}

// Verificar permisos personalizados de comando
function hasCommandPermission(guildId, commandName, member) {
  const configPath = path.join(__dirname, 'config.json');
  if (!fs.existsSync(configPath)) return true;
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  // Si no hay permisos configurados para este comando, permitir acceso
  if (!config.commandPermissions?.[guildId]?.[commandName]) return true;
  
  const cmdPerms = config.commandPermissions[guildId][commandName];
  
  // Si no hay usuarios ni roles configurados, permitir acceso
  if (cmdPerms.users.length === 0 && cmdPerms.roles.length === 0) return true;
  
  // Verificar si el usuario está en la lista
  if (cmdPerms.users.includes(member.id)) return true;
  
  // Verificar si el usuario tiene alguno de los roles permitidos
  const hasRole = cmdPerms.roles.some(roleId => member.roles.cache.has(roleId));
  if (hasRole) return true;
  
  // Si es administrador, siempre permitir
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  
  return false;
}

// Enviar log al canal configurado
async function sendLog(guild, embed, isDeleteLog = false) {
  // Si es un log de mensaje eliminado, usar el canal específico si existe
  let logChannelId;
  if (isDeleteLog) {
    logChannelId = getDeleteLogChannel(guild.id) || getLogChannel(guild.id);
  } else {
    logChannelId = getLogChannel(guild.id);
  }
  
  if (!logChannelId) return;
  
  try {
    const logChannel = await guild.channels.fetch(logChannelId);
    if (logChannel) {
      await logChannel.send({ embeds: [embed] });
    }
  } catch (error) {
    console.error('Error enviando log:', error);
  }
}

// Exportar funciones para uso en comandos
client.getLanguage = getLanguage;
client.getText = getText;
client.sendLog = sendLog;

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
  
  // Inicializar tracking de mensajes si existe
  if (command.setupMessageTracking) {
    command.setupMessageTracking(client);
  }
  
  // Inicializar sistema AFK si existe
  if (command.setupAFKSystem) {
    command.setupAFKSystem(client);
  }
}

// Inicializar sistema de eventos
const EventManager = require('./events/managers/EventManager');
const RSVPManager = require('./events/managers/RSVPManager');
const RoleManager = require('./events/managers/RoleManager');
const ReminderScheduler = require('./events/managers/ReminderScheduler');
const StatisticsTracker = require('./events/managers/StatisticsTracker');
const { updateEventEmbed } = require('./events/utils/embedBuilder');
const cron = require('node-cron');

let eventManager, rsvpManager, roleManager, reminderScheduler, statsTracker;

client.once('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
  
  // Inicializar managers de eventos
  try {
    eventManager = new EventManager();
    rsvpManager = new RSVPManager(eventManager);
    roleManager = new RoleManager(client);
    reminderScheduler = new ReminderScheduler(client, eventManager);
    statsTracker = new StatisticsTracker(eventManager);
    
    console.log('✅ Event system initialized');
    
    // Configurar cron jobs
    setupCronJobs();
  } catch (error) {
    console.error('Error initializing event system:', error);
  }
});

function setupCronJobs() {
  // Verificar y enviar recordatorios cada 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    try {
      await reminderScheduler.checkAndSendReminders();
    } catch (error) {
      console.error('Error in reminder cron job:', error);
    }
  });

  // Actualizar estados de eventos cada 10 minutos
  cron.schedule('*/10 * * * *', () => {
    try {
      eventManager.checkAndUpdateEventStatuses();
    } catch (error) {
      console.error('Error in status update cron job:', error);
    }
  });

  // Limpieza diaria a las 2 AM
  cron.schedule('0 2 * * *', () => {
    try {
      reminderScheduler.cleanupOldReminders();
      statsTracker.cleanupOldStats();
      console.log('✅ Daily cleanup completed');
    } catch (error) {
      console.error('Error in cleanup cron job:', error);
    }
  });

  // Backup automático diario a las 3 AM
  cron.schedule('0 3 * * *', async () => {
    try {
      const BackupSystem = require('./backup-system');
      const backupSystem = new BackupSystem(client);
      
      const result = await backupSystem.createBackup();
      if (result.success) {
        console.log(`✅ Automatic backup created: ${result.backupName}`);
        
        // Limpiar backups antiguos (más de 30 días)
        const cleanup = backupSystem.cleanupOldBackups(30);
        if (cleanup.deleted > 0) {
          console.log(`🗑️ Cleaned up ${cleanup.deleted} old backups`);
        }
      } else {
        console.error('❌ Automatic backup failed:', result.error);
      }
    } catch (error) {
      console.error('Error in backup cron job:', error);
    }
  });

  console.log('✅ Cron jobs configured');
}

// ==================== SISTEMA DE VOZ ====================
// Listener para prevenir que usuarios baneados se unan a canales de voz
client.on('voiceStateUpdate', async (oldState, newState) => {
  // Si el usuario se está uniendo a un canal
  if (!oldState.channel && newState.channel) {
    const vcBansPath = path.join(__dirname, 'data/voice-bans.json');
    
    if (fs.existsSync(vcBansPath)) {
      const vcBans = JSON.parse(fs.readFileSync(vcBansPath, 'utf8'));
      const key = `${newState.guild.id}-${newState.channel.id}`;
      
      if (vcBans[key] && vcBans[key].includes(newState.member.id)) {
        // Usuario está baneado de este canal
        try {
          await newState.disconnect('Banned from this voice channel');
          
          const lang = getLanguage(newState.guild.id);
          const member = newState.member;
          
          try {
            await member.send(lang === 'es' 
              ? `❌ Estás baneado del canal de voz **${newState.channel.name}** en **${newState.guild.name}**`
              : `❌ You are banned from voice channel **${newState.channel.name}** in **${newState.guild.name}**`
            );
          } catch (error) {
            // Usuario tiene DMs desactivados
          }
        } catch (error) {
          console.error('Error disconnecting banned user from voice:', error);
        }
      }
    }
  }
});

// ==================== SISTEMA DE LOGS AUTOMÁTICO ====================
const { EmbedBuilder } = require('discord.js');

// Sistema de Auto-Moderación
const { checkAutomod } = require('./automod-system');

// Cachear mensajes para poder recuperarlos cuando se eliminen
client.on('messageCreate', async (message) => {
  if (!message.guild) return;

  // Capturar mensajes para logs activos
  if (global.activeLogs) {
    const key = `${message.guild.id}-${message.author.id}`;
    if (global.activeLogs.has(key)) {
      global.activeLogs.get(key).messages.push({
        content: message.content || '[sin texto]',
        channel: message.channel.name,
        timestamp: message.createdTimestamp,
        attachments: message.attachments.size
      });
    }
  }
  
  // Ejecutar auto-moderación
  await checkAutomod(message);
  
  // Guardar información del mensaje en cache
  messageCache.set(message.id, {
    content: message.content,
    author: {
      id: message.author.id,
      tag: message.author.tag,
      avatar: message.author.displayAvatarURL()
    },
    channel: {
      id: message.channel.id,
      name: message.channel.name
    },
    attachments: message.attachments.map(att => ({
      name: att.name,
      url: att.url,
      proxyURL: att.proxyURL,
      size: att.size,
      contentType: att.contentType
    })),
    embeds: message.embeds.length,
    stickers: message.stickers.map(s => s.name),
    createdTimestamp: message.createdTimestamp,
    guildId: message.guild.id
  });
  
  // Limpiar cache después de 24 horas para no consumir mucha memoria
  setTimeout(() => {
    messageCache.delete(message.id);
  }, 24 * 60 * 60 * 1000);
});

// Log: Mensajes eliminados (MEJORADO)
client.on('messageDelete', async (message) => {
  try {
    if (!message.guild) return;
    
    // Intentar obtener del cache si el mensaje no está completo
    let cachedData = null;
    
    if (messageCache.has(message.id)) {
      cachedData = messageCache.get(message.id);
    }
    
    // Si es un bot, ignorar (opcional, puedes quitarlo si quieres logs de bots también)
    if (message.author?.bot || cachedData?.author?.bot) return;
    
    const embed = new EmbedBuilder()
      .setTitle('🗑️ Mensaje Eliminado')
      .setColor(0xFF0000)
      .setTimestamp();

    // Información del autor
    let authorTag = 'Usuario Desconocido';
    let authorId = null;
    let authorAvatar = null;

    if (message.author) {
      authorTag = message.author.tag;
      authorId = message.author.id;
      authorAvatar = message.author.displayAvatarURL();
    } else if (cachedData?.author) {
      authorTag = cachedData.author.tag;
      authorId = cachedData.author.id;
      authorAvatar = cachedData.author.avatar;
    }

    if (authorAvatar) {
      embed.setAuthor({
        name: authorTag,
        iconURL: authorAvatar
      });
    } else {
      embed.setAuthor({ name: authorTag });
    }

    if (authorId) {
      embed.addFields({ name: '👤 Autor', value: `<@${authorId}>`, inline: true });
    }

    // Canal donde se eliminó
    embed.addFields({ name: '📍 Canal', value: `<#${message.channel.id}>`, inline: true });

    // Hora de creación del mensaje
    const createdAt = message.createdTimestamp || cachedData?.createdTimestamp;
    if (createdAt) {
      embed.addFields({ name: '🕐 Enviado', value: `<t:${Math.floor(createdAt / 1000)}:R>`, inline: true });
    }

    // Contenido del mensaje
    const content = message.content || cachedData?.content;
    if (content && content.length > 0) {
      const truncatedContent = content.length > 1024 ? content.substring(0, 1021) + '...' : content;
      embed.addFields({ name: '💬 Contenido', value: truncatedContent, inline: false });
    }

    // Archivos adjuntos (imágenes, GIFs, videos, etc.)
    let attachments = message.attachments;
    if ((!attachments || attachments.size === 0) && cachedData?.attachments) {
      attachments = new Map(cachedData.attachments.map(att => [att.name, att]));
    }

    if (attachments && attachments.size > 0) {
      const attachmentList = Array.from(attachments.values()).map((att, index) => {
        const size = att.size ? `(${(att.size / 1024).toFixed(2)} KB)` : '';
        return `${index + 1}. [${att.name}](${att.url}) ${size}`;
      }).join('\n');
      
      embed.addFields({ name: '📎 Archivos Adjuntos', value: attachmentList, inline: false });
      
      // Si es una imagen o GIF, mostrarla en el embed
      const firstAttachment = Array.from(attachments.values())[0];
      if (firstAttachment && firstAttachment.contentType?.startsWith('image/')) {
        embed.setImage(firstAttachment.proxyURL || firstAttachment.url);
      }
    }

    // Stickers
    let stickers = message.stickers;
    if ((!stickers || stickers.size === 0) && cachedData?.stickers) {
      stickers = new Map(cachedData.stickers.map((name, index) => [index, { name }]));
    }

    if (stickers && stickers.size > 0) {
      const stickerList = Array.from(stickers.values()).map(s => s.name || s).join(', ');
      embed.addFields({ name: '🎨 Stickers', value: stickerList, inline: false });
    }

    // Embeds en el mensaje
    const embedCount = message.embeds?.length || cachedData?.embeds || 0;
    if (embedCount > 0) {
      embed.addFields({ name: '📋 Embeds', value: `${embedCount} embed(s)`, inline: true });
    }

    // ID del mensaje
    embed.setFooter({ text: `ID del mensaje: ${message.id}` });

    await sendLog(message.guild, embed, true); // true indica que es un log de mensaje eliminado
    
    // Limpiar del cache
    messageCache.delete(message.id);
  } catch (error) {
    console.error('Error en log de mensaje eliminado:', error);
  }
});

// Log: Mensajes editados
client.on('messageUpdate', async (oldMessage, newMessage) => {
  if (newMessage.author?.bot) return;
  if (!newMessage.guild) return;
  if (oldMessage.content === newMessage.content) return;

  const embed = new EmbedBuilder()
    .setTitle('✏️ Mensaje Editado')
    .setColor(0xFFA500)
    .addFields(
      { name: 'Autor', value: `${newMessage.author.tag}`, inline: true },
      { name: 'Canal', value: `${newMessage.channel}`, inline: true },
      { name: 'Antes', value: oldMessage.content || '*Sin contenido*', inline: false },
      { name: 'Después', value: newMessage.content || '*Sin contenido*', inline: false },
      { name: 'Link', value: `[Ir al mensaje](${newMessage.url})`, inline: false }
    )
    .setTimestamp();

  await sendLog(newMessage.guild, embed);
});

// Log: Miembro se une + Sistema de protección de bots
client.on('guildMemberAdd', async (member) => {
  // Sistema de protección de bots
  if (member.user.bot) {
    const configPath = path.join(__dirname, 'config.json');
    
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const botPerms = config.botPermissions?.[member.guild.id];
      
      // Si el sistema está habilitado
      if (botPerms && botPerms.enabled) {
        // Obtener el audit log para ver quién agregó el bot
        try {
          const fetchedLogs = await member.guild.fetchAuditLogs({
            limit: 1,
            type: 28 // MEMBER_ADD
          });
          
          const auditEntry = fetchedLogs.entries.first();
          
          if (auditEntry && auditEntry.target.id === member.user.id) {
            const executor = auditEntry.executor;
            
            // Verificar si el usuario tiene permiso
            const hasPermission = botPerms.allowedUsers.includes(executor.id);
            
            if (!hasPermission) {
              // Kickear el bot
              await member.kick('Bot agregado sin autorización');
              
              const lang = getLanguage(member.guild.id);
              
              // Notificar al usuario que intentó agregar el bot
              try {
                await executor.send(lang === 'es'
                  ? `❌ No tienes permiso para agregar bots al servidor **${member.guild.name}**. El bot **${member.user.tag}** fue expulsado automáticamente.\n\nContacta al dueño del servidor si necesitas agregar un bot.`
                  : `❌ You don't have permission to add bots to **${member.guild.name}**. The bot **${member.user.tag}** was automatically kicked.\n\nContact the server owner if you need to add a bot.`
                );
              } catch (error) {
                // Usuario tiene DMs desactivados
              }
              
              // Log del bot expulsado
              const kickEmbed = new EmbedBuilder()
                .setTitle('🤖 Bot Expulsado (Sin Autorización)')
                .setColor(0xFF0000)
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                  { name: '🤖 Bot', value: `${member.user.tag}`, inline: true },
                  { name: '👤 Agregado por', value: `${executor.tag}`, inline: true },
                  { name: '❌ Razón', value: lang === 'es' ? 'Usuario sin permiso para agregar bots' : 'User without permission to add bots', inline: false }
                )
                .setTimestamp();
              
              await sendLog(member.guild, kickEmbed);
              return; // No continuar con el log normal
            } else {
              // Usuario tiene permiso, log especial
              const botAddEmbed = new EmbedBuilder()
                .setTitle('🤖 Bot Agregado (Autorizado)')
                .setColor(0x00FF00)
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                  { name: '🤖 Bot', value: `${member.user.tag}`, inline: true },
                  { name: '👤 Agregado por', value: `${executor.tag}`, inline: true },
                  { name: '✅ Estado', value: lang === 'es' ? 'Autorizado' : 'Authorized', inline: true }
                )
                .setTimestamp();
              
              await sendLog(member.guild, botAddEmbed);
              return; // No continuar con el log normal
            }
          }
        } catch (error) {
          console.error('Error checking bot permissions:', error);
        }
      }
    }
  }
  
  // Log normal de miembro nuevo (solo para usuarios humanos)
  const embed = new EmbedBuilder()
    .setTitle('📥 Miembro Nuevo')
    .setColor(0x00FF00)
    .setThumbnail(member.user.displayAvatarURL())
    .addFields(
      { name: 'Usuario', value: `${member.user.tag}`, inline: true },
      { name: 'ID', value: member.user.id, inline: true },
      { name: 'Cuenta Creada', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: false },
      { name: 'Miembros Totales', value: `${member.guild.memberCount}`, inline: true }
    )
    .setTimestamp();

  await sendLog(member.guild, embed);
});

// Log: Miembro se va
client.on('guildMemberRemove', async (member) => {
  const embed = new EmbedBuilder()
    .setTitle('📤 Miembro Salió')
    .setColor(0xFF0000)
    .setThumbnail(member.user.displayAvatarURL())
    .addFields(
      { name: 'Usuario', value: `${member.user.tag}`, inline: true },
      { name: 'ID', value: member.user.id, inline: true },
      { name: 'Se Unió', value: member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Desconocido', inline: false },
      { name: 'Miembros Totales', value: `${member.guild.memberCount}`, inline: true }
    )
    .setTimestamp();

  await sendLog(member.guild, embed);
});

// Log: Usuario baneado
client.on('guildBanAdd', async (ban) => {
  const embed = new EmbedBuilder()
    .setTitle('🔨 Usuario Baneado')
    .setColor(0x8B0000)
    .setThumbnail(ban.user.displayAvatarURL())
    .addFields(
      { name: 'Usuario', value: `${ban.user.tag}`, inline: true },
      { name: 'ID', value: ban.user.id, inline: true },
      { name: 'Razón', value: ban.reason || 'No especificada', inline: false }
    )
    .setTimestamp();

  await sendLog(ban.guild, embed);
});

// Log: Usuario desbaneado
client.on('guildBanRemove', async (ban) => {
  const embed = new EmbedBuilder()
    .setTitle('🔓 Usuario Desbaneado')
    .setColor(0x00FF00)
    .setThumbnail(ban.user.displayAvatarURL())
    .addFields(
      { name: 'Usuario', value: `${ban.user.tag}`, inline: true },
      { name: 'ID', value: ban.user.id, inline: true }
    )
    .setTimestamp();

  await sendLog(ban.guild, embed);
});

// Log: Rol asignado/removido
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  const addedRoles = newMember.roles.cache.filter(role => !oldMember.roles.cache.has(role.id));
  const removedRoles = oldMember.roles.cache.filter(role => !newMember.roles.cache.has(role.id));

  if (addedRoles.size > 0) {
    const embed = new EmbedBuilder()
      .setTitle('➕ Rol Asignado')
      .setColor(0x00FF00)
      .addFields(
        { name: 'Usuario', value: `${newMember.user.tag}`, inline: true },
        { name: 'Rol', value: addedRoles.map(r => r.name).join(', '), inline: true }
      )
      .setTimestamp();

    await sendLog(newMember.guild, embed);
  }

  if (removedRoles.size > 0) {
    const embed = new EmbedBuilder()
      .setTitle('➖ Rol Removido')
      .setColor(0xFF0000)
      .addFields(
        { name: 'Usuario', value: `${newMember.user.tag}`, inline: true },
        { name: 'Rol', value: removedRoles.map(r => r.name).join(', '), inline: true }
      )
      .setTimestamp();

    await sendLog(newMember.guild, embed);
  }

  // Log: Cambio de apodo
  if (oldMember.nickname !== newMember.nickname) {
    const embed = new EmbedBuilder()
      .setTitle('✏️ Apodo Cambiado')
      .setColor(0x3498DB)
      .addFields(
        { name: 'Usuario', value: `${newMember.user.tag}`, inline: true },
        { name: 'Antes', value: oldMember.nickname || 'Sin apodo', inline: true },
        { name: 'Después', value: newMember.nickname || 'Sin apodo', inline: true }
      )
      .setTimestamp();

    await sendLog(newMember.guild, embed);
  }

  // Sistema de notificaciones de boost
  const boostChannelId = getBoostChannel(newMember.guild.id);
  if (boostChannelId) {
    const oldBoostStatus = oldMember.premiumSince;
    const newBoostStatus = newMember.premiumSince;

    // Usuario empezó a boostear
    if (!oldBoostStatus && newBoostStatus) {
      try {
        const boostChannel = await newMember.guild.channels.fetch(boostChannelId);
        if (boostChannel) {
          const boostCount = newMember.guild.premiumSubscriptionCount || 0;
          const lang = getLanguage(newMember.guild.id);
          
          const embed = new EmbedBuilder()
            .setTitle(getText(newMember.guild.id, 'boost_thanks'))
            .setDescription(`${newMember} ${getText(newMember.guild.id, 'boost_thanks_desc')}`)
            .setColor(0xFF73FA)
            .setThumbnail(newMember.user.displayAvatarURL())
            .addFields({
              name: getText(newMember.guild.id, 'boost_count'),
              value: `${boostCount} boost${boostCount !== 1 ? 's' : ''}`,
              inline: true
            })
            .setTimestamp();

          await boostChannel.send({ content: `${newMember}`, embeds: [embed] });
        }
      } catch (error) {
        console.error('Error sending boost notification:', error);
      }
    }

    // Usuario dejó de boostear
    if (oldBoostStatus && !newBoostStatus) {
      try {
        const boostChannel = await newMember.guild.channels.fetch(boostChannelId);
        if (boostChannel) {
          const boostCount = newMember.guild.premiumSubscriptionCount || 0;
          const lang = getLanguage(newMember.guild.id);
          
          const embed = new EmbedBuilder()
            .setTitle(getText(newMember.guild.id, 'boost_removed'))
            .setDescription(`${newMember} ${getText(newMember.guild.id, 'boost_removed_desc')}`)
            .setColor(0x808080)
            .setThumbnail(newMember.user.displayAvatarURL())
            .addFields({
              name: getText(newMember.guild.id, 'boost_removed_count'),
              value: `${boostCount} boost${boostCount !== 1 ? 's' : ''}`,
              inline: true
            })
            .setTimestamp();

          await boostChannel.send({ embeds: [embed] });
        }
      } catch (error) {
        console.error('Error sending boost removal notification:', error);
      }
    }
  }
});

// Log: Canal creado
client.on('channelCreate', async (channel) => {
  if (!channel.guild) return;

  const embed = new EmbedBuilder()
    .setTitle('📝 Canal Creado')
    .setColor(0x00FF00)
    .addFields(
      { name: 'Canal', value: `${channel}`, inline: true },
      { name: 'Tipo', value: channel.type.toString(), inline: true },
      { name: 'ID', value: channel.id, inline: true }
    )
    .setTimestamp();

  await sendLog(channel.guild, embed);
});

// Log: Canal eliminado
client.on('channelDelete', async (channel) => {
  if (!channel.guild) return;

  const embed = new EmbedBuilder()
    .setTitle('🗑️ Canal Eliminado')
    .setColor(0xFF0000)
    .addFields(
      { name: 'Canal', value: channel.name, inline: true },
      { name: 'Tipo', value: channel.type.toString(), inline: true },
      { name: 'ID', value: channel.id, inline: true }
    )
    .setTimestamp();

  await sendLog(channel.guild, embed);
});

// Log: Rol creado
client.on('roleCreate', async (role) => {
  const embed = new EmbedBuilder()
    .setTitle('🎭 Rol Creado')
    .setColor(0x00FF00)
    .addFields(
      { name: 'Rol', value: role.name, inline: true },
      { name: 'Color', value: role.hexColor, inline: true },
      { name: 'ID', value: role.id, inline: true }
    )
    .setTimestamp();

  await sendLog(role.guild, embed);
});

// Log: Rol eliminado
client.on('roleDelete', async (role) => {
  const embed = new EmbedBuilder()
    .setTitle('🗑️ Rol Eliminado')
    .setColor(0xFF0000)
    .addFields(
      { name: 'Rol', value: role.name, inline: true },
      { name: 'Color', value: role.hexColor, inline: true },
      { name: 'ID', value: role.id, inline: true }
    )
    .setTimestamp();

  await sendLog(role.guild, embed);
});

// ==================== FIN SISTEMA DE LOGS ====================

// Manejar comandos slash
client.on('interactionCreate', async (interaction) => {
  // Manejar botones de RSVP
  if (interaction.isButton() && interaction.customId.startsWith('event_rsvp_')) {
    try {
      const parts = interaction.customId.split('_');
      const eventId = parts[2];
      const status = parts[3];

      if (!eventManager || !rsvpManager || !roleManager) {
        return await interaction.reply({
          content: '❌ El sistema de eventos no está inicializado',
          ephemeral: true
        });
      }

      const event = eventManager.getEvent(eventId);
      if (!event) {
        return await interaction.reply({
          content: '❌ Este evento ya no existe',
          ephemeral: true
        });
      }

      // Procesar RSVP
      const result = rsvpManager.handleRSVP(eventId, interaction.user.id, status, {
        username: interaction.user.username
      });

      // Asignar o remover rol si es necesario
      if (event.roleId) {
        if (result.needsRoleAssignment) {
          await roleManager.assignEventRole(interaction.guild, interaction.user.id, event.roleId);
        } else if (status === 'not_attending') {
          await roleManager.removeEventRole(interaction.guild, interaction.user.id, event.roleId);
        }
      }

      // Actualizar embed
      await updateEventEmbed(client, eventManager.getEvent(eventId));

      // Responder al usuario
      const lang = client.getLanguage(interaction.guild.id);
      let message;

      if (status === 'attending') {
        if (result.status === 'waitlist') {
          message = lang === 'en' 
            ? `⏳ Event is full. You've been added to the waitlist (position ${result.waitlistPosition})`
            : `⏳ El evento está lleno. Has sido agregado a la lista de espera (posición ${result.waitlistPosition})`;
        } else {
          message = lang === 'en'
            ? '✅ You confirmed attendance for this event!'
            : '✅ ¡Has confirmado tu asistencia a este evento!';
        }
      } else if (status === 'maybe') {
        message = lang === 'en'
          ? '❓ You marked yourself as "maybe" for this event'
          : '❓ Te has marcado como "tal vez" para este evento';
      } else {
        message = lang === 'en'
          ? '❌ You cancelled your attendance'
          : '❌ Has cancelado tu asistencia';
      }

      await interaction.reply({
        content: message,
        ephemeral: true
      });

      // Si alguien fue promovido del waitlist, notificarle
      if (status === 'not_attending') {
        const promoted = rsvpManager.moveFromWaitlist(eventId);
        if (promoted) {
          try {
            const user = await client.users.fetch(promoted.userId);
            const notifMsg = lang === 'en'
              ? `🎉 Great news! A spot opened up for **${event.title}**. You've been moved from the waitlist to confirmed attendees!`
              : `🎉 ¡Buenas noticias! Se liberó un lugar para **${event.title}**. ¡Has sido movido de la lista de espera a confirmados!`;
            
            await user.send(notifMsg);
            
            // Asignar rol al promovido
            if (event.roleId) {
              await roleManager.assignEventRole(interaction.guild, promoted.userId, event.roleId);
            }
            
            // Actualizar embed nuevamente
            await updateEventEmbed(client, eventManager.getEvent(eventId));
          } catch (error) {
            console.error('Error notifying promoted user:', error);
          }
        }
      }

    } catch (error) {
      console.error('Error handling RSVP:', error);
      await interaction.reply({
        content: `❌ ${error.message}`,
        ephemeral: true
      });
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  // Verificar permisos personalizados del comando
  if (!hasCommandPermission(interaction.guild.id, interaction.commandName, interaction.member)) {
    return await interaction.reply({
      content: getText(interaction.guild.id, 'cmd_perm_denied'),
      ephemeral: true
    });
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const errorMessage = {
      content: '❌ Hubo un error al ejecutar este comando.',
      ephemeral: true
    };
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Manejar comandos con prefijo
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const prefix = getPrefix(message.guild.id);
  
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);

  if (!command) return;

  try {
    // Para el comando AFK, pasar el mensaje completo
    if (commandName === 'afk') {
      const fakeInteraction = {
        user: message.author,
        member: message.member,
        guild: message.guild,
        channel: message.channel,
        content: message.content,
        reply: async (content) => {
          return await message.reply(content);
        },
      };
      await command.execute(fakeInteraction);
      return;
    }

    // Crear un objeto similar a interaction para compatibilidad
    const fakeInteraction = {
      user: message.author,
      member: message.member,
      guild: message.guild,
      channel: message.channel,
      memberPermissions: message.member.permissions,
      client: client,
      isChatInputCommand: () => false,
      options: {
        getUser: (name) => message.mentions.users.first(),
        getString: (name) => args[0],
        getInteger: (name) => parseInt(args[0]),
        getRole: (name) => message.mentions.roles.first(),
      },
      reply: async (options) => {
        if (typeof options === 'string') {
          return await message.reply(options);
        }
        return await message.reply(options);
      },
      deferReply: async () => {
        return await message.channel.sendTyping();
      },
      editReply: async (options) => {
        return await message.reply(options);
      },
    };

    await command.execute(fakeInteraction);
  } catch (error) {
    console.error(error);
    try {
      await message.reply('❌ Hubo un error al ejecutar este comando.');
    } catch (replyError) {
      console.error('No se pudo enviar mensaje de error:', replyError);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
