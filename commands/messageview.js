const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

const messageHistory = new Map();
const deletedMessages = new Map();

function setupMessageTracking(client) {
  client.on('messageCreate', (message) => {
    if (!message.guild) return;
    
    const key = `${message.guild.id}-${message.author.id}`;
    if (!messageHistory.has(key)) {
      messageHistory.set(key, []);
    }
    
    const history = messageHistory.get(key);
    history.push({
      content: message.content,
      channelId: message.channel.id,
      channelName: message.channel.name,
      timestamp: message.createdTimestamp,
      messageId: message.id,
      deleted: false,
    });
    
    if (history.length > 50) {
      history.shift();
    }
  });

  client.on('messageDelete', (message) => {
    if (!message.guild || !message.author) return;
    
    const key = `${message.guild.id}-${message.author.id}`;
    const history = messageHistory.get(key);
    
    if (history) {
      const msg = history.find(m => m.messageId === message.id);
      if (msg) {
        msg.deleted = true;
      }
    }
    
    const deletedKey = `${message.guild.id}-${message.author.id}`;
    if (!deletedMessages.has(deletedKey)) {
      deletedMessages.set(deletedKey, []);
    }
    
    deletedMessages.get(deletedKey).push({
      content: message.content || '[Content not available]',
      channelId: message.channel.id,
      channelName: message.channel.name,
      timestamp: message.createdTimestamp,
      deletedAt: Date.now(),
    });
  });
}

module.exports = {
  data: {
    name: 'messageview',
    description: 'View user message history',
    options: [
      {
        name: 'user',
        description: 'User whose history you want to see',
        type: 6, // USER type
        required: true,
      },
      {
        name: 'type',
        description: 'Type of messages to show',
        type: 3, // STRING type
        required: false,
        choices: [
          { name: 'All messages', value: 'all' },
          { name: 'Deleted only', value: 'deleted' },
        ],
      },
    ],
  },
  async execute(interaction) {
    const getText = (key) => interaction.client.getText(interaction.guild.id, key);
    
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return await interaction.reply({
        content: getText('no_permission'),
        ephemeral: true
      });
    }

    const usuario = interaction.options.getUser('user');
    const tipo = interaction.options.getString('type') || 'all';
    const key = `${interaction.guild.id}-${usuario.id}`;

    await interaction.deferReply({ ephemeral: true });

    const history = messageHistory.get(key) || [];
    const deleted = deletedMessages.get(key) || [];
    const lang = interaction.client.getLanguage(interaction.guild.id);

    if (history.length === 0 && deleted.length === 0) {
      const msg = lang === 'es'
        ? `📭 No hay historial de mensajes registrado para ${usuario.username}.\n\n⚠️ Nota: Solo se registran mensajes desde que el bot está activo.`
        : `📭 No message history recorded for ${usuario.username}.\n\n⚠️ Note: Only messages since the bot is active are recorded.`;
      return await interaction.editReply({ content: msg });
    }

    let messagesToShow = [];

    if (tipo === 'deleted') {
      messagesToShow = deleted.map(msg => ({
        content: msg.content,
        channel: `<#${msg.channelId}>`,
        time: `<t:${Math.floor(msg.timestamp / 1000)}:R>`,
        status: lang === 'es' ? '🗑️ Eliminado' : '🗑️ Deleted',
      }));
    } else {
      messagesToShow = history.slice(-20).map(msg => ({
        content: msg.content || (lang === 'es' ? '[Sin contenido]' : '[No content]'),
        channel: `<#${msg.channelId}>`,
        time: `<t:${Math.floor(msg.timestamp / 1000)}:R>`,
        status: msg.deleted ? (lang === 'es' ? '🗑️ Eliminado' : '🗑️ Deleted') : (lang === 'es' ? '✅ Activo' : '✅ Active'),
      }));
    }

    if (messagesToShow.length === 0) {
      const msg = lang === 'es'
        ? `📭 No hay mensajes ${tipo === 'deleted' ? 'eliminados' : ''} para mostrar.`
        : `📭 No ${tipo === 'deleted' ? 'deleted ' : ''}messages to show.`;
      return await interaction.editReply({ content: msg });
    }

    const title = lang === 'es' 
      ? `📜 Historial de Mensajes - ${usuario.username}`
      : `📜 Message History - ${usuario.username}`;

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setThumbnail(usuario.displayAvatarURL())
      .setColor(0x5865F2)
      .setTimestamp();

    messagesToShow.slice(-10).forEach((msg) => {
      embed.addFields({
        name: `${msg.status} ${msg.time} ${lang === 'es' ? 'en' : 'in'} ${msg.channel}`,
        value: msg.content.substring(0, 200) || (lang === 'es' ? '[Vacío]' : '[Empty]'),
      });
    });

    const footerText = lang === 'es'
      ? `Mostrando últimos ${messagesToShow.length} mensajes | Total registrado: ${history.length}`
      : `Showing last ${messagesToShow.length} messages | Total recorded: ${history.length}`;

    embed.setFooter({ text: footerText });

    await interaction.editReply({ embeds: [embed] });
  },
  setupMessageTracking,
};
