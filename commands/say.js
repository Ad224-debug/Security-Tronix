const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make the bot send a message')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(o => o.setName('message').setDescription('Message to send').setRequired(true))
    .addChannelOption(o => o.setName('channel').setDescription('Target channel (default: current)')),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const L = (es, en) => lang === 'es' ? es : en;
    const message = interaction.options.getString('message');
    const channel = interaction.options.getChannel('channel') || interaction.channel;

    try {
      await channel.send(message);
      await interaction.reply({ content: L(`✅ Mensaje enviado en ${channel}.`, `✅ Message sent in ${channel}.`), ephemeral: true });
    } catch (error) {
      await interaction.reply({ content: '❌ Error al enviar el mensaje.', ephemeral: true });
    }
  },
};
