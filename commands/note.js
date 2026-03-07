const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { createCase } = require('./case.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('note')
    .setDescription('Add a private note to a user (user will not be notified)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to add note to')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('note')
        .setDescription('Note content')
        .setRequired(true)),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: lang === 'es' ? '❌ Solo administradores pueden usar este comando.' : '❌ Only administrators can use this command.',
        ephemeral: true
      });
    }

    const usuario = interaction.options.getUser('user');
    const note = interaction.options.getString('note');

    // Crear caso de moderación
    const caseId = createCase(
      interaction.guild.id,
      'note',
      usuario.id,
      interaction.user.id,
      note
    );

    const embed = new EmbedBuilder()
      .setTitle(lang === 'es' ? '📝 Nota Agregada' : '📝 Note Added')
      .setDescription(lang === 'es' 
        ? `Se agregó una nota privada a **${usuario.tag}**`
        : `Added a private note to **${usuario.tag}**`)
      .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: lang === 'es' ? '👤 Usuario' : '👤 User', value: `${usuario} (${usuario.id})`, inline: true },
        { name: lang === 'es' ? '👮 Moderador' : '👮 Moderator', value: `${interaction.user}`, inline: true },
        { name: lang === 'es' ? '📝 Nota' : '📝 Note', value: note, inline: false },
        { name: lang === 'es' ? '📋 Caso' : '📋 Case', value: `#${caseId}`, inline: true }
      )
      .setColor(0x5865F2)
      .setFooter({ text: lang === 'es' ? 'El usuario NO será notificado' : 'User will NOT be notified' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
