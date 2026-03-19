const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Elimina mensajes del canal')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(opt =>
      opt.setName('cantidad')
        .setDescription('Cantidad de mensajes a eliminar (1-100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)),

  async execute(interaction) {
    const cantidad = interaction.options.getInteger('cantidad');
    const lang = interaction.client.getLanguage(interaction.guild.id);

    await interaction.deferReply({ ephemeral: true });

    try {
      // Fetch mensajes primero para tener control total
      const fetched = await interaction.channel.messages.fetch({ limit: cantidad });

      if (fetched.size === 0) {
        return interaction.editReply({ content: lang === 'es' ? '❌ No hay mensajes para eliminar.' : '❌ No messages to delete.' });
      }

      // Separar recientes (<14 días) de viejos
      const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const recent = fetched.filter(m => m.createdTimestamp > cutoff);
      const old = fetched.filter(m => m.createdTimestamp <= cutoff);

      let eliminados = 0;

      // Bulk delete para mensajes recientes
      if (recent.size >= 2) {
        const deleted = await interaction.channel.bulkDelete(recent, true);
        eliminados += deleted.size;
      } else if (recent.size === 1) {
        // bulkDelete no funciona con 1 solo mensaje
        await recent.first().delete();
        eliminados += 1;
      }

      // Eliminar mensajes viejos uno por uno
      for (const [, msg] of old) {
        try {
          await msg.delete();
          eliminados++;
          await new Promise(r => setTimeout(r, 300));
        } catch { /* ya eliminado */ }
      }

      const msg = lang === 'es'
        ? `✅ Se borraron **${eliminados}** mensaje(s) exitosamente.`
        : `✅ Successfully deleted **${eliminados}** message(s).`;

      await interaction.editReply({ content: msg });

    } catch (error) {
      console.error('Error en /clear:', error);
      const errorMsg = lang === 'es'
        ? '❌ Hubo un error al borrar los mensajes.'
        : '❌ There was an error deleting messages.';
      await interaction.editReply({ content: errorMsg });
    }
  },
};
