const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock or unlock a channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addStringOption(o => o.setName('action').setDescription('Action').setRequired(true)
      .addChoices({ name: 'Lock', value: 'lock' }, { name: 'Unlock', value: 'unlock' }))
    .addChannelOption(o => o.setName('channel').setDescription('Channel (default: current)')),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const L = (es, en) => lang === 'es' ? es : en;
    const action = interaction.options.getString('action');
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const isLock = action === 'lock';

    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        SendMessages: isLock ? false : null,
      });

      const embed = new EmbedBuilder()
        .setTitle(isLock ? L('🔒 Canal Bloqueado', '🔒 Channel Locked') : L('🔓 Canal Desbloqueado', '🔓 Channel Unlocked'))
        .setDescription(isLock
          ? L(`${channel} ha sido bloqueado.`, `${channel} has been locked.`)
          : L(`${channel} ha sido desbloqueado.`, `${channel} has been unlocked.`))
        .addFields({ name: L('Moderador', 'Moderator'), value: `${interaction.user}`, inline: true })
        .setColor(isLock ? 0xED4245 : 0x57F287)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en lock:', error);
      await interaction.reply({ content: '❌ Error al ejecutar el comando.', ephemeral: true });
    }
  },
};
