const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: {
    name: 'say',
    description: 'Make the bot say something',
    options: [
      {
        name: 'message',
        description: 'Message to send',
        type: 3, // STRING type
        required: true,
      },
      {
        name: 'channel',
        description: 'Channel to send the message (default: current channel)',
        type: 7, // CHANNEL type
        required: false,
      },
    ],
  },
  async execute(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        const lang = interaction.client.getLanguage(interaction.guild.id);
        const msg = lang === 'es' 
          ? '❌ No tienes permisos para gestionar mensajes.'
          : '❌ You don\'t have permission to manage messages.';
        return await interaction.reply({
          content: msg,
          ephemeral: true
        });
      }

      const message = interaction.options.getString('message');
      const channel = interaction.options.getChannel('channel') || interaction.channel;
      const lang = interaction.client.getLanguage(interaction.guild.id);

      await channel.send(message);

      const successMsg = lang === 'es'
        ? `✅ Mensaje enviado en ${channel}.`
        : `✅ Message sent in ${channel}.`;

      await interaction.reply({
        content: successMsg,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error en comando say:', error);
      await interaction.reply({
        content: '❌ Hubo un error al ejecutar este comando.',
        ephemeral: true
      }).catch(console.error);
    }
  },
};
