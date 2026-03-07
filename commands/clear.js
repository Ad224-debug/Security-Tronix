const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: {
    name: 'clear',
    description: 'Deletes messages from the channel',
    options: [
      {
        name: 'amount',
        description: 'Amount of messages to delete (1-100)',
        type: 4, // INTEGER type
        required: true,
        min_value: 1,
        max_value: 100,
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

    const cantidad = interaction.options.getInteger('amount');

    try {
      await interaction.deferReply({ ephemeral: true });

      const mensajes = await interaction.channel.bulkDelete(cantidad, true);

      const lang = interaction.client.getLanguage(interaction.guild.id);
      const message = lang === 'es' 
        ? `✅ Se borraron ${mensajes.size} mensaje(s) exitosamente.`
        : `✅ Successfully deleted ${mensajes.size} message(s).`;

      await interaction.editReply({ content: message });
    } catch (error) {
      const lang = interaction.client.getLanguage(interaction.guild.id);
      const errorMsg = lang === 'es'
        ? '❌ Hubo un error al borrar los mensajes. Solo puedo borrar mensajes de menos de 14 días.'
        : '❌ There was an error deleting messages. I can only delete messages less than 14 days old.';
      
      await interaction.editReply({ content: errorMsg });
    }
  },
};
