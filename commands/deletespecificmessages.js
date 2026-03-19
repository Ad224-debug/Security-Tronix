const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deletespecificmessages')
    .setDescription('Elimina mensajes que contengan una palabra clave en un canal')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt.setName('palabra').setDescription('Palabra o frase a buscar').setRequired(true))
    .addChannelOption(opt =>
      opt.setName('canal').setDescription('Canal donde buscar (por defecto: canal actual)').setRequired(false))
    .addIntegerOption(opt =>
      opt.setName('limite').setDescription('Máximo de mensajes a revisar (1-500, default: 100)').setMinValue(1).setMaxValue(500).setRequired(false)),

  async execute(interaction) {
    const palabra = interaction.options.getString('palabra').toLowerCase();
    const canal = interaction.options.getChannel('canal') || interaction.channel;
    const limite = interaction.options.getInteger('limite') || 100;

    // Defer ephemeral - solo el moderador ve el resultado
    await interaction.deferReply({ ephemeral: true });

    try {
      let eliminados = 0;
      let revisados = 0;
      let lastId = null;

      while (revisados < limite) {
        const fetchLimit = Math.min(100, limite - revisados);
        const options = { limit: fetchLimit };
        if (lastId) options.before = lastId;

        const messages = await canal.messages.fetch(options);
        if (messages.size === 0) break;

        revisados += messages.size;
        lastId = messages.last().id;

        // Solo mensajes de usuarios (no bots) que contengan la palabra
        const toDelete = messages.filter(m =>
          !m.author.bot && m.content.toLowerCase().includes(palabra)
        );

        if (toDelete.size > 0) {
          const recent = toDelete.filter(m => Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000);
          const old = toDelete.filter(m => Date.now() - m.createdTimestamp >= 14 * 24 * 60 * 60 * 1000);

          if (recent.size > 0) {
            const deleted = await canal.bulkDelete(recent, true);
            eliminados += deleted.size;
          }

          for (const [, msg] of old) {
            try {
              await msg.delete();
              eliminados++;
              await new Promise(r => setTimeout(r, 500));
            } catch { /* ya eliminado o sin permisos */ }
          }
        }

        if (messages.size < fetchLimit) break;
      }

      // Un solo embed con el resumen final
      const embed = new EmbedBuilder()
        .setTitle('🗑️ Limpieza Completada')
        .setColor(0xE74C3C)
        .addFields(
          { name: 'Palabra buscada', value: `\`${palabra}\``, inline: true },
          { name: 'Canal', value: `${canal}`, inline: true },
          { name: 'Mensajes revisados', value: `${revisados}`, inline: true },
          { name: 'Mensajes eliminados', value: `**${eliminados}**`, inline: true }
        )
        .setFooter({ text: `Ejecutado por ${interaction.user.tag}` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error en deletespecificmessages:', error);
      await interaction.editReply({ content: '❌ Error al eliminar mensajes. Verifica que el bot tenga permisos de Manage Messages.' });
    }
  }
};
