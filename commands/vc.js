const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const { createCase } = require('./case.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vc')
    .setDescription('Comandos de voz')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(s => s.setName('join').setDescription('Bot se une a tu canal de voz'))
    .addSubcommand(s => s.setName('leave').setDescription('Bot abandona el canal de voz'))
    .addSubcommand(s => s.setName('kick').setDescription('Expulsa a un usuario del canal de voz')
      .addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Razón').setRequired(true)))
    .addSubcommand(s => s.setName('mute').setDescription('Mutea a un usuario en voz')
      .addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Razón')))
    .addSubcommand(s => s.setName('unmute').setDescription('Desmutea a un usuario en voz')
      .addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)))
    .addSubcommand(s => s.setName('ban').setDescription('Banea a un usuario de un canal de voz')
      .addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Razón').setRequired(true))
      .addChannelOption(o => o.setName('channel').setDescription('Canal de voz (por defecto: canal del usuario)'))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const L = (es, en) => lang === 'es' ? es : en;

    // ── JOIN ─────────────────────────────────────────────────────────────────
    if (sub === 'join') {
      if (!interaction.member.voice.channel) return interaction.reply({ content: L('❌ Debes estar en un canal de voz.', '❌ You must be in a voice channel.'), ephemeral: true });
      const channel = interaction.member.voice.channel;
      try {
        const connection = joinVoiceChannel({ channelId: channel.id, guildId: interaction.guild.id, adapterCreator: interaction.guild.voiceAdapterCreator, selfDeaf: false });
        if (!interaction.client.voiceConnections) interaction.client.voiceConnections = new Map();
        interaction.client.voiceConnections.set(interaction.guild.id, connection);
        return interaction.reply({ embeds: [new EmbedBuilder().setTitle(L('🔊 Bot Conectado','🔊 Bot Connected')).addFields({ name: L('Canal','Channel'), value: channel.name, inline: true }, { name: L('Moderador','Moderator'), value: `${interaction.user}`, inline: true }).setColor(0x57F287).setTimestamp()] });
      } catch { return interaction.reply({ content: L('❌ No pude unirme al canal.', '❌ Could not join channel.'), ephemeral: true }); }
    }

    // ── LEAVE ────────────────────────────────────────────────────────────────
    if (sub === 'leave') {
      const connection = getVoiceConnection(interaction.guild.id);
      if (!connection) return interaction.reply({ content: L('❌ El bot no está en ningún canal.', '❌ Bot is not in any channel.'), ephemeral: true });
      const channelId = connection.joinConfig.channelId;
      const channel = interaction.guild.channels.cache.get(channelId);
      connection.destroy();
      if (interaction.client.voiceConnections) interaction.client.voiceConnections.delete(interaction.guild.id);
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle(L('🔇 Bot Desconectado','🔇 Bot Disconnected')).addFields({ name: L('Canal','Channel'), value: channel?.name || '?', inline: true }, { name: L('Moderador','Moderator'), value: `${interaction.user}`, inline: true }).setColor(0xED4245).setTimestamp()] });
    }

    // ── KICK ─────────────────────────────────────────────────────────────────
    if (sub === 'kick') {
      const usuario = interaction.options.getUser('user');
      const razon = interaction.options.getString('reason');
      const miembro = await interaction.guild.members.fetch(usuario.id).catch(() => null);
      if (!miembro) return interaction.reply({ content: '❌ Usuario no encontrado.', ephemeral: true });
      if (!miembro.voice.channel) return interaction.reply({ content: L('❌ El usuario no está en voz.', '❌ User is not in voice.'), ephemeral: true });
      if (usuario.id === interaction.user.id || usuario.id === interaction.guild.ownerId) return interaction.reply({ content: '❌', ephemeral: true });
      if (miembro.roles.highest.position >= interaction.member.roles.highest.position) return interaction.reply({ content: L('❌ Rol igual o superior.', '❌ Equal or higher role.'), ephemeral: true });
      const voiceChannel = miembro.voice.channel;
      try { await usuario.send({ embeds: [new EmbedBuilder().setTitle(L('🔊 Expulsado de voz','🔊 Kicked from voice')).addFields({ name: L('Canal','Channel'), value: voiceChannel.name }, { name: L('Razón','Reason'), value: razon }).setColor(0xFEE75C).setTimestamp()] }); } catch {}
      await miembro.voice.disconnect(razon);
      const caseId = createCase(interaction.guild.id, 'vckick', usuario.id, interaction.user.id, razon);
      const embed = new EmbedBuilder().setTitle(L('🔊 Usuario Expulsado de Voz','🔊 User Kicked from Voice')).setThumbnail(usuario.displayAvatarURL()).addFields({ name: L('Usuario','User'), value: `${usuario} (${usuario.id})`, inline: true }, { name: L('Canal','Channel'), value: voiceChannel.name, inline: true }, { name: L('Moderador','Moderator'), value: `${interaction.user}`, inline: true }, { name: L('Razón','Reason'), value: razon }, { name: L('Caso','Case'), value: `#${caseId}`, inline: true }).setColor(0xFEE75C).setTimestamp();
      await interaction.reply({ embeds: [embed] });
      await interaction.client.sendTypedLog(interaction.guild, 'kicks', embed);
      return;
    }

    // ── MUTE ─────────────────────────────────────────────────────────────────
    if (sub === 'mute') {
      const usuario = interaction.options.getUser('user');
      const razon = interaction.options.getString('reason') || L('No especificada', 'Not specified');
      const miembro = await interaction.guild.members.fetch(usuario.id).catch(() => null);
      if (!miembro?.voice.channel) return interaction.reply({ content: L('❌ El usuario no está en voz.', '❌ User is not in voice.'), ephemeral: true });
      if (miembro.voice.serverMute) return interaction.reply({ content: L('❌ Ya está muteado.', '❌ Already muted.'), ephemeral: true });
      await miembro.voice.setMute(true, razon);
      const embed = new EmbedBuilder().setTitle(L('🔇 Usuario Muteado en Voz','🔇 User Muted in Voice')).addFields({ name: L('Usuario','User'), value: `${usuario}`, inline: true }, { name: L('Canal','Channel'), value: miembro.voice.channel.name, inline: true }, { name: L('Moderador','Moderator'), value: `${interaction.user}`, inline: true }, { name: L('Razón','Reason'), value: razon }).setColor(0xED4245).setTimestamp();
      await interaction.reply({ embeds: [embed] });
      await interaction.client.sendTypedLog(interaction.guild, 'timeouts', embed);
      return;
    }

    // ── UNMUTE ───────────────────────────────────────────────────────────────
    if (sub === 'unmute') {
      const usuario = interaction.options.getUser('user');
      const miembro = await interaction.guild.members.fetch(usuario.id).catch(() => null);
      if (!miembro?.voice.channel) return interaction.reply({ content: L('❌ El usuario no está en voz.', '❌ User is not in voice.'), ephemeral: true });
      if (!miembro.voice.serverMute) return interaction.reply({ content: L('❌ No está muteado.', '❌ Not muted.'), ephemeral: true });
      await miembro.voice.setMute(false);
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle(L('🔊 Usuario Desmuteado','🔊 User Unmuted')).addFields({ name: L('Usuario','User'), value: `${usuario}`, inline: true }, { name: L('Canal','Channel'), value: miembro.voice.channel.name, inline: true }, { name: L('Moderador','Moderator'), value: `${interaction.user}`, inline: true }).setColor(0x57F287).setTimestamp()] });
    }

    // ── BAN ──────────────────────────────────────────────────────────────────
    if (sub === 'ban') {
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) return interaction.reply({ content: L('❌ Solo administradores pueden banear de voz.', '❌ Only administrators can voice ban.'), ephemeral: true });
      const usuario = interaction.options.getUser('user');
      const razon = interaction.options.getString('reason');
      let channel = interaction.options.getChannel('channel');
      const miembro = await interaction.guild.members.fetch(usuario.id).catch(() => null);
      if (!miembro) return interaction.reply({ content: '❌ Usuario no encontrado.', ephemeral: true });
      if (!channel) channel = miembro.voice.channel;
      if (!channel || channel.type !== 2) return interaction.reply({ content: L('❌ Canal de voz inválido.', '❌ Invalid voice channel.'), ephemeral: true });
      const vcBansPath = path.join(__dirname, '../data/voice-bans.json');
      let vcBans = fs.existsSync(vcBansPath) ? JSON.parse(fs.readFileSync(vcBansPath, 'utf8')) : {};
      const key = `${interaction.guild.id}-${channel.id}`;
      if (!vcBans[key]) vcBans[key] = [];
      if (vcBans[key].includes(usuario.id)) return interaction.reply({ content: L('❌ Ya está baneado de este canal.', '❌ Already banned from this channel.'), ephemeral: true });
      vcBans[key].push(usuario.id);
      const dataDir = path.join(__dirname, '../data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(vcBansPath, JSON.stringify(vcBans, null, 2));
      if (miembro.voice.channel?.id === channel.id) await miembro.voice.disconnect(razon);
      await channel.permissionOverwrites.create(usuario.id, { Connect: false, Speak: false });
      const caseId = createCase(interaction.guild.id, 'vcban', usuario.id, interaction.user.id, `VC ban ${channel.name}: ${razon}`);
      try { await usuario.send({ embeds: [new EmbedBuilder().setTitle(L('🔇 Baneado de canal de voz','🔇 Banned from voice channel')).addFields({ name: L('Canal','Channel'), value: channel.name }, { name: L('Razón','Reason'), value: razon }).setColor(0xED4245).setTimestamp()] }); } catch {}
      const embed = new EmbedBuilder().setTitle(L('🔇 Usuario Baneado de Voz','🔇 User Banned from Voice')).setThumbnail(usuario.displayAvatarURL()).addFields({ name: L('Usuario','User'), value: `${usuario} (${usuario.id})`, inline: true }, { name: L('Canal','Channel'), value: channel.name, inline: true }, { name: L('Moderador','Moderator'), value: `${interaction.user}`, inline: true }, { name: L('Razón','Reason'), value: razon }, { name: L('Caso','Case'), value: `#${caseId}`, inline: true }).setColor(0xED4245).setTimestamp();
      await interaction.reply({ embeds: [embed] });
      await interaction.client.sendTypedLog(interaction.guild, 'bans', embed);
      return;
    }
  }
};
