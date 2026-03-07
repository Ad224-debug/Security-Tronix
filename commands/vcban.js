const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');
const { sendModLog } = require('./modsetup.js');
const { createCase } = require('./case.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vcban')
    .setDescription('Ban a user from a specific voice channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to ban from voice')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(true))
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Voice channel to ban from (leave empty for current)')
        .setRequired(false)),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const usuario = interaction.options.getUser('user');
    const razon = interaction.options.getString('reason');
    let channel = interaction.options.getChannel('channel');

    const miembro = await interaction.guild.members.fetch(usuario.id).catch(() => null);
    if (!miembro) {
      return await interaction.reply({
        content: lang === 'es' ? '❌ Usuario no encontrado.' : '❌ User not found.',
        ephemeral: true
      });
    }

    // Si no se especifica canal, usar el canal donde está el usuario o el del bot
    if (!channel) {
      if (miembro.voice.channel) {
        channel = miembro.voice.channel;
      } else {
        const connection = getVoiceConnection(interaction.guild.id);
        if (connection) {
          const channelId = connection.joinConfig.channelId;
          channel = interaction.guild.channels.cache.get(channelId);
        }
      }
    }

    if (!channel || channel.type !== 2) { // 2 = GUILD_VOICE
      return await interaction.reply({
        content: lang === 'es' 
          ? '❌ Debes especificar un canal de voz válido.'
          : '❌ You must specify a valid voice channel.',
        ephemeral: true
      });
    }

    try {
      // Guardar baneo en archivo
      const vcBansPath = path.join(__dirname, '../data/voice-bans.json');
      let vcBans = {};
      
      if (fs.existsSync(vcBansPath)) {
        vcBans = JSON.parse(fs.readFileSync(vcBansPath, 'utf8'));
      }

      const key = `${interaction.guild.id}-${channel.id}`;
      if (!vcBans[key]) {
        vcBans[key] = [];
      }

      if (vcBans[key].includes(usuario.id)) {
        return await interaction.reply({
          content: lang === 'es' 
            ? '❌ Este usuario ya está baneado de este canal de voz.'
            : '❌ This user is already banned from this voice channel.',
          ephemeral: true
        });
      }

      vcBans[key].push(usuario.id);

      // Crear directorio si no existe
      const dataDir = path.join(__dirname, '../data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(vcBansPath, JSON.stringify(vcBans, null, 2));

      // Si el usuario está en el canal, desconectarlo
      if (miembro.voice.channel && miembro.voice.channel.id === channel.id) {
        await miembro.voice.disconnect(razon);
      }

      // Denegar permisos de conexión al canal
      await channel.permissionOverwrites.create(usuario.id, {
        Connect: false,
        Speak: false,
        Stream: false
      });

      // Crear caso
      const caseId = createCase(
        interaction.guild.id,
        'vcban',
        usuario.id,
        interaction.user.id,
        `Voice ban from ${channel.name}: ${razon}`
      );

      // Enviar DM
      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle(lang === 'es' ? '🔇 Baneado de Canal de Voz' : '🔇 Banned from Voice Channel')
          .setDescription(lang === 'es' 
            ? `Has sido baneado del canal de voz **${channel.name}** en **${interaction.guild.name}**`
            : `You have been banned from voice channel **${channel.name}** in **${interaction.guild.name}**`)
          .addFields(
            { name: lang === 'es' ? '📝 Razón' : '📝 Reason', value: razon },
            { name: lang === 'es' ? '👮 Moderador' : '👮 Moderator', value: interaction.user.tag }
          )
          .setColor(0xED4245)
          .setTimestamp();

        await usuario.send({ embeds: [dmEmbed] });
      } catch (error) {
        // Usuario tiene DMs desactivados
      }

      const embed = new EmbedBuilder()
        .setTitle(lang === 'es' ? '🔇 Usuario Baneado de Canal de Voz' : '🔇 User Banned from Voice Channel')
        .setDescription(`**${usuario.tag}** ${lang === 'es' ? 'ha sido baneado del canal de voz' : 'has been banned from voice channel'}`)
        .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: lang === 'es' ? '👤 Usuario' : '👤 User', value: `${usuario} (${usuario.id})`, inline: true },
          { name: lang === 'es' ? '📍 Canal' : '📍 Channel', value: channel.name, inline: true },
          { name: lang === 'es' ? '👮 Moderador' : '👮 Moderator', value: `${interaction.user}`, inline: true },
          { name: lang === 'es' ? '📝 Razón' : '📝 Reason', value: razon, inline: false },
          { name: lang === 'es' ? '📋 Caso' : '📋 Case', value: `#${caseId}`, inline: true }
        )
        .setColor(0xED4245)
        .setFooter({ text: lang === 'es' ? 'Baneo de canal de voz' : 'Voice channel ban' })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
      await sendModLog(interaction.client, interaction.guild.id, 'bans', embed);

      // Mensaje en canal
      const channelMessage = lang === 'es'
        ? `🔇 ${usuario} ha sido baneado del canal de voz **${channel.name}**\n📝 **Razón:** ${razon}\n👮 **Moderador:** ${interaction.user}`
        : `🔇 ${usuario} has been banned from voice channel **${channel.name}**\n📝 **Reason:** ${razon}\n👮 **Moderator:** ${interaction.user}`;

      await interaction.channel.send(channelMessage);

    } catch (error) {
      console.error('Error en vcban:', error);
      await interaction.reply({
        content: lang === 'es' ? '❌ Hubo un error al banear al usuario.' : '❌ There was an error banning the user.',
        ephemeral: true
      });
    }
  },
};
