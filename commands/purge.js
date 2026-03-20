const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete multiple messages with filters')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(o => o.setName('amount').setDescription('Number of messages to check (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(o => o.setName('user').setDescription('Only delete messages from this user'))
    .addStringOption(o => o.setName('contains').setDescription('Only delete messages containing this text')),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const L = (es, en) => lang === 'es' ? es : en;
    const amount = interaction.options.getInteger('amount');
    const targetUser = interaction.options.getUser('user');
    const contains = interaction.options.getString('contains');

    await interaction.deferReply({ ephemeral: true });

    const messages = await interaction.channel.messages.fetch({ limit: amount });
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

    let toDelete = messages.filter(m => m.createdTimestamp > twoWeeksAgo);
    if (targetUser) toDelete = toDelete.filter(m => m.author.id === targetUser.id);
    if (contains) toDelete = toDelete.filter(m => m.content.toLowerCase().includes(contains.toLowerCase()));

    if (toDelete.size === 0) {
      return interaction.editReply({ content: L('❌ No se encontraron mensajes con esos filtros.', '❌ No messages found with those filters.') });
    }

    await interaction.channel.bulkDelete(toDelete, true);
    await interaction.editReply({ content: L(`✅ ${toDelete.size} mensaje(s) eliminado(s).`, `✅ Deleted ${toDelete.size} message(s).`) });
  },
};
