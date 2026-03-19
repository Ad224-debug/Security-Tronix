const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

// Map global para almacenar logs activos: guildId+userId -> array de mensajes
if (!global.activeLogs) global.activeLogs = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('log')
    .setDescription('Comienza a registrar todos los mensajes de un usuario')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(opt =>
      opt.setName('usuario').setDescription('Usuario a registrar').setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('usuario');
    const key = `${interaction.guild.id}-${target.id}`;

    if (global.activeLogs.has(key)) {
      return interaction.reply({ content: `⚠️ Ya se está registrando a **${target.tag}**. Usa \`/stoplog\` para detenerlo.`, ephemeral: true });
    }

    global.activeLogs.set(key, {
      messages: [],
      startedBy: interaction.user.id,
      startedAt: Date.now(),
      guildId: interaction.guild.id,
      userId: target.id,
      userTag: target.tag
    });

    const embed = new EmbedBuilder()
      .setTitle('📋 Log Iniciado')
      .setColor(0x3498DB)
      .addFields(
        { name: 'Usuario', value: `${target.tag} (${target.id})`, inline: true },
        { name: 'Moderador', value: interaction.user.tag, inline: true },
        { name: 'Estado', value: '🟢 Registrando mensajes...', inline: false }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },

  // Exportar para uso en index.js
  activeLogs: global.activeLogs
};
