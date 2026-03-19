const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stoplog')
    .setDescription('Detiene el registro de mensajes y guarda el archivo')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Usuario cuyo log detener').setRequired(true))
    .addBooleanOption(opt =>
      opt.setName('enviar_dm').setDescription('¿Enviar el archivo por DM al moderador?').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const sendDm = interaction.options.getBoolean('enviar_dm') ?? true;
    const key = `${interaction.guild.id}-${target.id}`;

    if (!global.activeLogs || !global.activeLogs.has(key)) {
      return interaction.reply({ content: `❌ No hay ningún log activo para **${target.tag}**.`, ephemeral: true });
    }

    const logData = global.activeLogs.get(key);
    global.activeLogs.delete(key);

    await interaction.deferReply({ ephemeral: true });

    if (logData.messages.length === 0) {
      return interaction.editReply({ content: `⚠️ No se registraron mensajes de **${target.tag}** durante el log.` });
    }

    // Generar contenido del archivo
    const duration = Math.round((Date.now() - logData.startedAt) / 1000 / 60);
    let content = `=== LOG DE MENSAJES ===\n`;
    content += `Usuario: ${logData.userTag} (${logData.userId})\n`;
    content += `Servidor: ${interaction.guild.name}\n`;
    content += `Duración: ${duration} minutos\n`;
    content += `Total mensajes: ${logData.messages.length}\n`;
    content += `======================\n\n`;

    for (const msg of logData.messages) {
      const date = new Date(msg.timestamp).toLocaleString('es-ES');
      content += `[${date}] #${msg.channel}\n`;
      content += `${msg.content}\n`;
      if (msg.attachments > 0) content += `[${msg.attachments} adjunto(s)]\n`;
      content += `---\n`;
    }

    const buffer = Buffer.from(content, 'utf-8');
    const attachment = new AttachmentBuilder(buffer, { name: `log_${target.username}_${Date.now()}.txt` });

    const embed = new EmbedBuilder()
      .setTitle('📋 Log Finalizado')
      .setColor(0xE74C3C)
      .addFields(
        { name: 'Usuario', value: `${target.tag}`, inline: true },
        { name: 'Mensajes registrados', value: `${logData.messages.length}`, inline: true },
        { name: 'Duración', value: `${duration} minutos`, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed], files: [attachment] });

    // Enviar por DM si se solicitó
    if (sendDm) {
      try {
        const dmAttachment = new AttachmentBuilder(buffer, { name: `log_${target.username}_${Date.now()}.txt` });
        await interaction.user.send({
          content: `📋 Log de **${target.tag}** en **${interaction.guild.name}**`,
          files: [dmAttachment]
        });
      } catch (e) {
        // DMs cerrados, ignorar
      }
    }
  }
};
