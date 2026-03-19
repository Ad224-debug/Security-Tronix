const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const BackupSystem = require('../backup-system');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Comandos de administración')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s => s.setName('clear').setDescription('Eliminar mensajes del canal')
      .addIntegerOption(o => o.setName('amount').setDescription('Cantidad (1-100)').setMinValue(1).setMaxValue(100).setRequired(true)))
    .addSubcommand(s => s.setName('lockdown').setDescription('Bloquear/desbloquear todos los canales')
      .addStringOption(o => o.setName('action').setDescription('Acción').setRequired(true).addChoices({ name: 'Bloquear', value: 'lock' }, { name: 'Desbloquear', value: 'unlock' }))
      .addStringOption(o => o.setName('reason').setDescription('Razón')))
    .addSubcommand(s => s.setName('nuke').setDescription('Clonar y eliminar el canal (solo owner)'))
    .addSubcommand(s => s.setName('announce').setDescription('Enviar anuncio a un canal')
      .addChannelOption(o => o.setName('channel').setDescription('Canal').addChannelTypes(ChannelType.GuildText).setRequired(true))
      .addStringOption(o => o.setName('title').setDescription('Título').setRequired(true))
      .addStringOption(o => o.setName('message').setDescription('Mensaje').setRequired(true))
      .addBooleanOption(o => o.setName('mention').setDescription('Mencionar @everyone'))
      .addStringOption(o => o.setName('color').setDescription('Color hex (ej: FF0000)')))
    .addSubcommand(s => s.setName('dm').setDescription('Enviar DM a un usuario o a todos')
      .addStringOption(o => o.setName('target').setDescription('Mención, ID, o "all"').setRequired(true))
      .addStringOption(o => o.setName('message').setDescription('Mensaje').setRequired(true)))
    .addSubcommand(s => s.setName('purge').setDescription('Eliminar mensajes con una palabra clave')
      .addStringOption(o => o.setName('word').setDescription('Palabra a buscar').setRequired(true))
      .addChannelOption(o => o.setName('channel').setDescription('Canal (por defecto: actual)'))
      .addIntegerOption(o => o.setName('limit').setDescription('Máximo de mensajes a revisar (1-500)').setMinValue(1).setMaxValue(500)))
    .addSubcommand(s => s.setName('backup').setDescription('Gestionar backups')
      .addStringOption(o => o.setName('action').setDescription('Acción').setRequired(true).addChoices({ name: 'Crear', value: 'create' }, { name: 'Listar', value: 'list' }, { name: 'Restaurar', value: 'restore' }, { name: 'Eliminar', value: 'delete' }))
      .addStringOption(o => o.setName('name').setDescription('Nombre del backup (para restaurar/eliminar)'))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const L = (es, en) => lang === 'es' ? es : en;

    // ── CLEAR ────────────────────────────────────────────────────────────────
    if (sub === 'clear') {
      const cantidad = interaction.options.getInteger('amount');
      await interaction.deferReply({ ephemeral: true });
      try {
        const fetched = await interaction.channel.messages.fetch({ limit: cantidad });
        if (fetched.size === 0) return interaction.editReply({ content: L('❌ No hay mensajes.', '❌ No messages.') });
        const cutoff = Date.now() - 14 * 86400000;
        const recent = fetched.filter(m => m.createdTimestamp > cutoff);
        const old = fetched.filter(m => m.createdTimestamp <= cutoff);
        let eliminados = 0;
        if (recent.size >= 2) { const d = await interaction.channel.bulkDelete(recent, true); eliminados += d.size; }
        else if (recent.size === 1) { await recent.first().delete(); eliminados++; }
        for (const [, msg] of old) { try { await msg.delete(); eliminados++; await new Promise(r => setTimeout(r, 300)); } catch {} }
        return interaction.editReply({ content: L(`✅ Se borraron **${eliminados}** mensaje(s).`, `✅ Deleted **${eliminados}** message(s).`) });
      } catch { return interaction.editReply({ content: L('❌ Error al borrar mensajes.', '❌ Error deleting messages.') }); }
    }

    // ── LOCKDOWN ─────────────────────────────────────────────────────────────
    if (sub === 'lockdown') {
      const action = interaction.options.getString('action');
      const razon = interaction.options.getString('reason') || L('No especificada', 'Not specified');
      await interaction.deferReply();
      const channels = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
      let success = 0, fail = 0;
      for (const [, channel] of channels) {
        try { await channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: action === 'lock' ? false : null }); success++; } catch { fail++; }
      }
      return interaction.editReply({ embeds: [new EmbedBuilder().setTitle(action === 'lock' ? L('🔒 Servidor Bloqueado','🔒 Server Locked') : L('🔓 Servidor Desbloqueado','🔓 Server Unlocked')).addFields({ name: '✅', value: `${success}`, inline: true }, { name: '❌', value: `${fail}`, inline: true }, { name: L('Moderador','Moderator'), value: `${interaction.user}`, inline: true }, { name: L('Razón','Reason'), value: razon }).setColor(action === 'lock' ? 0xED4245 : 0x57F287).setTimestamp()] });
    }

    // ── NUKE ─────────────────────────────────────────────────────────────────
    if (sub === 'nuke') {
      if (interaction.user.id !== interaction.guild.ownerId) return interaction.reply({ content: L('❌ Solo el dueño puede usar esto.', '❌ Owner only.'), ephemeral: true });
      const channel = interaction.channel;
      await interaction.reply({ content: L('💣 Nukeando en 3 segundos...', '💣 Nuking in 3 seconds...'), ephemeral: true });
      await new Promise(r => setTimeout(r, 3000));
      try {
        const newChannel = await channel.clone({ reason: `Nukeado por ${interaction.user.tag}` });
        await channel.delete();
        await newChannel.send({ embeds: [new EmbedBuilder().setTitle(L('💥 Canal Nukeado','💥 Channel Nuked')).setDescription(L('Todos los mensajes anteriores han sido eliminados.','All previous messages have been deleted.')).addFields({ name: L('Moderador','Moderator'), value: `${interaction.user}`, inline: true }).setColor(0xED4245).setImage('https://media.giphy.com/media/HhTXt43pk1I1W/giphy.gif').setTimestamp()] });
      } catch (e) { console.error('Error en nuke:', e); }
      return;
    }

    // ── ANNOUNCE ─────────────────────────────────────────────────────────────
    if (sub === 'announce') {
      const channel = interaction.options.getChannel('channel');
      const title = interaction.options.getString('title');
      const message = interaction.options.getString('message');
      const mention = interaction.options.getBoolean('mention') || false;
      const colorHex = interaction.options.getString('color') || '5865F2';
      let color;
      try { color = parseInt(colorHex.replace('#', ''), 16); } catch { color = 0x5865F2; }
      const embed = new EmbedBuilder().setTitle(`📢 ${title}`).setDescription(message).setColor(color).setFooter({ text: `${interaction.user.username}` }).setTimestamp();
      try {
        await channel.send({ content: mention ? '@everyone' : null, embeds: [embed] });
        return interaction.reply({ content: L(`✅ Anuncio enviado a ${channel}.`, `✅ Announcement sent to ${channel}.`), ephemeral: true });
      } catch { return interaction.reply({ content: L('❌ No pude enviar el anuncio.', '❌ Could not send announcement.'), ephemeral: true }); }
    }

    // ── DM ───────────────────────────────────────────────────────────────────
    if (sub === 'dm') {
      const destino = interaction.options.getString('target');
      const mensaje = interaction.options.getString('message');
      await interaction.deferReply({ ephemeral: true });
      const dmEmbed = new EmbedBuilder().setTitle(`📨 Mensaje de ${interaction.guild.name}`).setDescription(mensaje).setColor(0x3498DB).setFooter({ text: `Enviado por ${interaction.user.tag}` }).setTimestamp();
      if (destino.toLowerCase() === 'all') {
        let enviados = 0, fallidos = 0;
        await interaction.editReply({ content: '⏳ Enviando DMs...' });
        const members = await interaction.guild.members.fetch();
        const humans = members.filter(m => !m.user.bot);
        for (const [, member] of humans) {
          try { await member.send({ embeds: [dmEmbed] }); enviados++; if (enviados % 5 === 0) await new Promise(r => setTimeout(r, 1000)); } catch { fallidos++; }
        }
        return interaction.editReply({ content: '', embeds: [new EmbedBuilder().setTitle('📨 DM Masivo').setColor(0x2ECC71).addFields({ name: '✅ Enviados', value: `${enviados}`, inline: true }, { name: '❌ Fallidos', value: `${fallidos}`, inline: true }).setTimestamp()] });
      }
      const mentionMatch = destino.match(/^<@!?(\d+)>$/) || destino.match(/^(\d+)$/);
      if (!mentionMatch) return interaction.editReply({ content: '❌ Usa una mención, ID, o "all".' });
      let targetUser;
      try { targetUser = await interaction.client.users.fetch(mentionMatch[1]); } catch { return interaction.editReply({ content: '❌ Usuario no encontrado.' }); }
      try {
        await targetUser.send({ embeds: [dmEmbed] });
        return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('✅ DM Enviado').setColor(0x2ECC71).addFields({ name: 'Destinatario', value: targetUser.tag, inline: true }, { name: 'Mensaje', value: mensaje }).setTimestamp()] });
      } catch { return interaction.editReply({ content: `❌ No se pudo enviar DM a **${targetUser.tag}**. Puede tener DMs cerrados.` }); }
    }

    // ── PURGE ────────────────────────────────────────────────────────────────
    if (sub === 'purge') {
      const palabra = interaction.options.getString('word').toLowerCase();
      const canal = interaction.options.getChannel('channel') || interaction.channel;
      const limite = interaction.options.getInteger('limit') || 100;
      await interaction.deferReply({ ephemeral: true });
      let eliminados = 0, revisados = 0, lastId = null;
      while (revisados < limite) {
        const fetchLimit = Math.min(100, limite - revisados);
        const options = { limit: fetchLimit };
        if (lastId) options.before = lastId;
        const messages = await canal.messages.fetch(options);
        if (messages.size === 0) break;
        revisados += messages.size;
        lastId = messages.last().id;
        const toDelete = messages.filter(m => !m.author.bot && m.content.toLowerCase().includes(palabra));
        if (toDelete.size > 0) {
          const recent = toDelete.filter(m => Date.now() - m.createdTimestamp < 14 * 86400000);
          const old = toDelete.filter(m => Date.now() - m.createdTimestamp >= 14 * 86400000);
          if (recent.size > 0) { const d = await canal.bulkDelete(recent, true); eliminados += d.size; }
          for (const [, msg] of old) { try { await msg.delete(); eliminados++; await new Promise(r => setTimeout(r, 500)); } catch {} }
        }
        if (messages.size < fetchLimit) break;
      }
      return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('🗑️ Limpieza Completada').setColor(0xE74C3C).addFields({ name: 'Palabra', value: `\`${palabra}\``, inline: true }, { name: 'Canal', value: `${canal}`, inline: true }, { name: 'Revisados', value: `${revisados}`, inline: true }, { name: 'Eliminados', value: `**${eliminados}**`, inline: true }).setFooter({ text: `Por ${interaction.user.tag}` }).setTimestamp()] });
    }

    // ── BACKUP ───────────────────────────────────────────────────────────────
    if (sub === 'backup') {
      if (interaction.user.id !== interaction.guild.ownerId) return interaction.reply({ content: L('❌ Solo el dueño puede usar esto.', '❌ Owner only.'), ephemeral: true });
      const action = interaction.options.getString('action');
      const backupName = interaction.options.getString('name');
      const backupSystem = new BackupSystem(interaction.client);

      if (action === 'create') {
        await interaction.deferReply({ ephemeral: true });
        const result = await backupSystem.createBackup(interaction.guild.id);
        if (result.success) return interaction.editReply({ embeds: [new EmbedBuilder().setTitle(L('✅ Backup Creado','✅ Backup Created')).addFields({ name: L('Nombre','Name'), value: `\`${result.backupName}\``, inline: true }, { name: L('Archivos','Files'), value: `\`${result.files}\``, inline: true }).setColor(0x57F287).setTimestamp()] });
        return interaction.editReply({ content: `❌ Error: ${result.error}` });
      }
      if (action === 'list') {
        const backups = backupSystem.listBackups();
        if (backups.length === 0) return interaction.reply({ content: L('📭 No hay backups.', '📭 No backups.'), ephemeral: true });
        const desc = backups.slice(0, 10).map((b, i) => `**${i+1}.** \`${b.name}\` — ${new Date(b.timestamp).toLocaleString()}`).join('\n');
        return interaction.reply({ embeds: [new EmbedBuilder().setTitle(L('📦 Backups','📦 Backups')).setDescription(desc).setColor(0x5865F2).setFooter({ text: `Total: ${backups.length}` }).setTimestamp()], ephemeral: true });
      }
      if (action === 'restore') {
        if (!backupName) return interaction.reply({ content: '❌ Especifica el nombre del backup.', ephemeral: true });
        await interaction.deferReply({ ephemeral: true });
        const result = await backupSystem.restoreBackup(backupName);
        if (result.success) return interaction.editReply({ content: L(`✅ Backup \`${backupName}\` restaurado. Reinicia el bot.`, `✅ Backup \`${backupName}\` restored. Restart the bot.`) });
        return interaction.editReply({ content: `❌ Error: ${result.error}` });
      }
      if (action === 'delete') {
        if (!backupName) return interaction.reply({ content: '❌ Especifica el nombre del backup.', ephemeral: true });
        const result = backupSystem.deleteBackup(backupName);
        if (result.success) return interaction.reply({ content: L(`✅ Backup \`${backupName}\` eliminado.`, `✅ Backup \`${backupName}\` deleted.`), ephemeral: true });
        return interaction.reply({ content: `❌ Error: ${result.error}`, ephemeral: true });
      }
    }
  }
};
