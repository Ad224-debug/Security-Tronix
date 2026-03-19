const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dm')
    .setDescription('Envía un mensaje directo a un usuario o a todos los miembros')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(opt =>
      opt.setName('destino')
        .setDescription('Menciona un usuario (@usuario) o escribe "all" para todos')
        .setRequired(true))
    .addStringOption(opt =>
      opt.setName('mensaje')
        .setDescription('Mensaje a enviar')
        .setRequired(true)),

  async execute(interaction) {
    const destino = interaction.options.getString('destino');
    const mensaje = interaction.options.getString('mensaje');

    await interaction.deferReply({ ephemeral: true });

    // Construir embed del DM
    const dmEmbed = new EmbedBuilder()
      .setTitle(`📨 Mensaje de ${interaction.guild.name}`)
      .setDescription(mensaje)
      .setColor(0x3498DB)
      .setFooter({ text: `Enviado por ${interaction.user.tag}` })
      .setTimestamp();

    // Enviar a todos
    if (destino.toLowerCase() === 'all') {
      let enviados = 0;
      let fallidos = 0;

      await interaction.editReply({ content: '⏳ Enviando DMs a todos los miembros... esto puede tardar.' });

      const members = await interaction.guild.members.fetch();
      const humans = members.filter(m => !m.user.bot);

      for (const [, member] of humans) {
        try {
          await member.send({ embeds: [dmEmbed] });
          enviados++;
          // Rate limit: esperar 1 segundo cada 5 mensajes
          if (enviados % 5 === 0) await new Promise(r => setTimeout(r, 1000));
        } catch {
          fallidos++;
        }
      }

      const resultEmbed = new EmbedBuilder()
        .setTitle('📨 DM Masivo Completado')
        .setColor(0x2ECC71)
        .addFields(
          { name: '✅ Enviados', value: `${enviados}`, inline: true },
          { name: '❌ Fallidos', value: `${fallidos}`, inline: true },
          { name: 'Total miembros', value: `${humans.size}`, inline: true }
        )
        .setTimestamp();

      return interaction.editReply({ content: '', embeds: [resultEmbed] });
    }

    // Enviar a usuario específico - extraer ID de mención o buscar por nombre
    let targetUser = null;

    // Intentar extraer ID de mención <@123456>
    const mentionMatch = destino.match(/^<@!?(\d+)>$/) || destino.match(/^(\d+)$/);
    if (mentionMatch) {
      try {
        targetUser = await interaction.client.users.fetch(mentionMatch[1]);
      } catch { /* no encontrado */ }
    }

    if (!targetUser) {
      return interaction.editReply({ content: `❌ No se encontró el usuario. Usa una mención (@usuario), un ID, o "all".` });
    }

    try {
      await targetUser.send({ embeds: [dmEmbed] });

      const embed = new EmbedBuilder()
        .setTitle('✅ DM Enviado')
        .setColor(0x2ECC71)
        .addFields(
          { name: 'Destinatario', value: `${targetUser.tag}`, inline: true },
          { name: 'Mensaje', value: mensaje, inline: false }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch {
      await interaction.editReply({ content: `❌ No se pudo enviar DM a **${targetUser.tag}**. Puede tener los DMs cerrados.` });
    }
  }
};
