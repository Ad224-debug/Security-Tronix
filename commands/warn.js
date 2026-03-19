const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { createCase } = require('./case.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Advierte a un usuario')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(opt => opt.setName('user').setDescription('Usuario a advertir').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Razón de la advertencia').setRequired(true)),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const usuario = interaction.options.getUser('user');
    const razon = interaction.options.getString('reason');

    const miembro = await interaction.guild.members.fetch(usuario.id).catch(() => null);

    if (usuario.id === interaction.user.id)
      return interaction.reply({ content: '❌ No puedes advertirte a ti mismo.', ephemeral: true });
    if (usuario.id === interaction.guild.ownerId)
      return interaction.reply({ content: '❌ No puedes advertir al dueño del servidor.', ephemeral: true });
    if (miembro && miembro.roles.highest.position >= interaction.member.roles.highest.position)
      return interaction.reply({ content: '❌ No puedes advertir a alguien con un rol igual o superior al tuyo.', ephemeral: true });

    // Guardar warning
    const warningsPath = path.join(__dirname, '../warnings.json');
    let warnings = fs.existsSync(warningsPath) ? JSON.parse(fs.readFileSync(warningsPath, 'utf8')) : {};
    const key = `${interaction.guild.id}-${usuario.id}`;
    if (!warnings[key]) warnings[key] = [];
    warnings[key].push({ reason: razon, moderator: interaction.user.id, timestamp: Date.now() });
    fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));
    const warnCount = warnings[key].length;

    // Crear caso
    const caseId = createCase(interaction.guild.id, 'warn', usuario.id, interaction.user.id, razon);

    // DM al usuario
    try {
      await usuario.send({ embeds: [
        new EmbedBuilder()
          .setTitle('⚠️ Has recibido una advertencia')
          .setDescription(`Has recibido una advertencia en **${interaction.guild.name}**`)
          .addFields(
            { name: '📝 Razón', value: razon },
            { name: '⚠️ Total advertencias', value: `${warnCount}` }
          )
          .setColor(0xFEE75C).setTimestamp()
      ]});
    } catch { /* DMs cerrados */ }

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Usuario Advertido')
      .setThumbnail(usuario.displayAvatarURL())
      .addFields(
        { name: '👤 Usuario', value: `${usuario} (${usuario.id})`, inline: true },
        { name: '👮 Moderador', value: `${interaction.user}`, inline: true },
        { name: '📝 Razón', value: razon, inline: false },
        { name: '⚠️ Total advertencias', value: `${warnCount}`, inline: true },
        { name: '📋 Caso', value: `#${caseId}`, inline: true }
      )
      .setColor(0xFEE75C).setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Acción automática por umbral
    const warnConfigPath = path.join(__dirname, '../warn-config.json');
    const warnConfig = fs.existsSync(warnConfigPath) ? JSON.parse(fs.readFileSync(warnConfigPath, 'utf8')) : {};
    const guildConfig = warnConfig[interaction.guild.id] || { autoAction: 'none', autoActionThreshold: 3 };

    if (guildConfig.autoAction !== 'none' && warnCount >= guildConfig.autoActionThreshold && miembro) {
      const autoReason = `Acción automática: ${warnCount} advertencias`;
      try {
        if (guildConfig.autoAction === 'kick') await miembro.kick(autoReason);
        else if (guildConfig.autoAction === 'ban') await interaction.guild.members.ban(usuario, { reason: autoReason });
        else if (guildConfig.autoAction === 'timeout') await miembro.timeout(60 * 60 * 1000, autoReason); // 1h
        await interaction.followUp({ content: `⚡ Acción automática ejecutada: **${guildConfig.autoAction}** por alcanzar ${warnCount} advertencias.`, ephemeral: true });
      } catch (e) { console.error('Error en acción automática:', e); }
    }
  }
};
