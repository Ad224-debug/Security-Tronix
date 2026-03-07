const { PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: {
    name: 'purge',
    description: 'Delete multiple messages with filters',
    options: [
      {
        name: 'amount',
        description: 'Number of messages to check (1-100)',
        type: 4, // INTEGER type
        required: true,
      },
      {
        name: 'user',
        description: 'Only delete messages from this user',
        type: 6, // USER type
        required: false,
      },
      {
        name: 'contains',
        description: 'Only delete messages containing this text',
        type: 3, // STRING type
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

      const amount = interaction.options.getInteger('amount');
      const targetUser = interaction.options.getUser('user');
      const contains = interaction.options.getString('contains');
      const lang = interaction.client.getLanguage(interaction.guild.id);

      if (amount < 1 || amount > 100) {
        const msg = lang === 'es'
          ? '❌ La cantidad debe estar entre 1 y 100.'
          : '❌ Amount must be between 1 and 100.';
        return await interaction.reply({
          content: msg,
          ephemeral: true
        });
      }

      await interaction.deferReply({ ephemeral: true });

      const messages = await interaction.channel.messages.fetch({ limit: amount });
      let messagesToDelete = messages;

      // Filtrar por usuario si se especificó
      if (targetUser) {
        messagesToDelete = messagesToDelete.filter(msg => msg.author.id === targetUser.id);
      }

      // Filtrar por contenido si se especificó
      if (contains) {
        messagesToDelete = messagesToDelete.filter(msg => 
          msg.content.toLowerCase().includes(contains.toLowerCase())
        );
      }

      // Filtrar mensajes que no sean muy antiguos (Discord no permite borrar mensajes de más de 14 días)
      const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
      messagesToDelete = messagesToDelete.filter(msg => msg.createdTimestamp > twoWeeksAgo);

      if (messagesToDelete.size === 0) {
        const msg = lang === 'es'
          ? '❌ No se encontraron mensajes para eliminar con esos filtros.'
          : '❌ No messages found to delete with those filters.';
        return await interaction.editReply({ content: msg });
      }

      await interaction.channel.bulkDelete(messagesToDelete, true);

      const successMsg = lang === 'es'
        ? `✅ Se eliminaron ${messagesToDelete.size} mensaje(s).`
        : `✅ Deleted ${messagesToDelete.size} message(s).`;

      await interaction.editReply({ content: successMsg });
    } catch (error) {
      console.error('Error en comando purge:', error);
      await interaction.editReply({
        content: '❌ Hubo un error al ejecutar este comando.'
      }).catch(console.error);
    }
  },
};
