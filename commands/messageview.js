const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const messageHistory = new Map(); // key -> [{ content, channelId, timestamp, deleted }]
const deletedMessages = new Map(); // key -> [{ content, channelId, timestamp }]
const TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

function pruneOld(map) {
  const cutoff = Date.now() - TTL;
  for (const [key, arr] of map) {
    const filtered = arr.filter(m => (m.deletedAt || m.timestamp) > cutoff);
    if (filtered.length === 0) map.delete(key);
    else map.set(key, filtered);
  }
}

function setupMessageTracking(client) {
  // Prune every 6 hours
  setInterval(() => { pruneOld(messageHistory); pruneOld(deletedMessages); }, 6 * 60 * 60 * 1000);

  client.on('messageCreate', (message) => {
    if (!message.guild || message.author.bot) return;
    const key = `${message.guild.id}-${message.author.id}`;
    const history = messageHistory.get(key) || [];
    history.push({ content: message.content, channelId: message.channel.id, timestamp: message.createdTimestamp, messageId: message.id, deleted: false });
    if (history.length > 50) history.shift();
    messageHistory.set(key, history);
  });

  client.on('messageDelete', (message) => {
    if (!message.guild || !message.author || message.author.bot) return;
    const key = `${message.guild.id}-${message.author.id}`;

    const history = messageHistory.get(key);
    if (history) {
      const msg = history.find(m => m.messageId === message.id);
      if (msg) msg.deleted = true;
    }

    const deleted = deletedMessages.get(key) || [];
    deleted.push({ content: message.content || '[Content unavailable]', channelId: message.channel.id, timestamp: message.createdTimestamp, deletedAt: Date.now() });
    if (deleted.length > 50) deleted.shift();
    deletedMessages.set(key, deleted);
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('messageview')
    .setDescription('View user message history')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addUserOption(o => o.setName('user').setDescription('User to inspect').setRequired(true))
    .addStringOption(o => o.setName('type').setDescription('Type of messages').addChoices(
      { name: 'All', value: 'all' },
      { name: 'Deleted only', value: 'deleted' }
    )),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const L = (es, en) => lang === 'es' ? es : en;
    const usuario = interaction.options.getUser('user');
    const tipo = interaction.options.getString('type') || 'all';
    const key = `${interaction.guild.id}-${usuario.id}`;

    await interaction.deferReply({ flags: 64 });

    const history = messageHistory.get(key) || [];
    const deleted = deletedMessages.get(key) || [];

    if (history.length === 0 && deleted.length === 0) {
      return interaction.editReply({ content: L(`📭 Sin historial para ${usuario.username}. Solo se registran mensajes desde que el bot está activo.`, `📭 No history for ${usuario.username}. Only messages since the bot started are recorded.`) });
    }

    const source = tipo === 'deleted' ? deleted : history.slice(-20);
    if (source.length === 0) {
      return interaction.editReply({ content: L('📭 No hay mensajes para mostrar.', '📭 No messages to show.') });
    }

    const embed = new EmbedBuilder()
      .setTitle(L(`📜 Historial — ${usuario.username}`, `📜 History — ${usuario.username}`))
      .setThumbnail(usuario.displayAvatarURL())
      .setColor(0x5865F2)
      .setTimestamp();

    source.slice(-10).forEach(msg => {
      const status = msg.deleted || tipo === 'deleted' ? '🗑️' : '✅';
      const time = `<t:${Math.floor((msg.timestamp || msg.deletedAt) / 1000)}:R>`;
      embed.addFields({
        name: `${status} ${time} — <#${msg.channelId}>`,
        value: (msg.content || L('[Sin contenido]', '[No content]')).substring(0, 200),
      });
    });

    embed.setFooter({ text: L(`Total registrado: ${history.length}`, `Total recorded: ${history.length}`) });
    await interaction.editReply({ embeds: [embed] });
  },
  setupMessageTracking,
};
