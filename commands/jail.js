const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');
const guildConfig = require('../guild-config');
const { createCase } = require('../utils/createCase');

// ── Helpers ───────────────────────────────────────────────────────────────────

function getJailConfig(guildId) {
  return guildConfig.get(guildId, 'jailConfig') || null;
}

function saveJailConfig(guildId, cfg) {
  guildConfig.set(guildId, 'jailConfig', cfg);
}

function getJailedUsers(guildId) {
  return guildConfig.get(guildId, 'jailedUsers') || {};
}

function saveJailedUsers(guildId, data) {
  guildConfig.set(guildId, 'jailedUsers', data);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('jail')
    .setDescription('Sistema de cuarentena de usuarios')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s => s.setName('setup')
      .setDescription('Configurar el sistema de jail')
      .addRoleOption(o => o.setName('jail_role')
        .setDescription('Rol de "Aislado" (solo puede ver el canal de jail)')
        .setRequired(true))
      .addChannelOption(o => o.setName('jail_channel')
        .setDescription('Canal donde el usuario aislado puede hablar con los mods')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)))
    .addSubcommand(s => s.setName('user')
      .setDescription('Aislar a un usuario (guardar roles y asignar rol de jail)')
      .addUserOption(o => o.setName('user').setDescription('Usuario a aislar').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Razón').setRequired(true)))
    .addSubcommand(s => s.setName('free')
      .setDescription('Liberar a un usuario (devolver sus roles originales)')
      .addUserOption(o => o.setName('user').setDescription('Usuario a liberar').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Razón')))
    .addSubcommand(s => s.setName('list')
      .setDescription('Ver usuarios actualmente aislados')),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const L = (es, en) => lang === 'es' ? es : en;
    const sub = interaction.options.getSubcommand();

    // ── SETUP ─────────────────────────────────────────────────────────────────
    if (sub === 'setup') {
      if (interaction.user.id !== interaction.guild.ownerId) {
        return interaction.reply({ content: L('❌ Solo el dueño puede configurar el jail.', '❌ Only the owner can configure jail.'), ephemeral: true });
      }
      const role = interaction.options.getRole('jail_role');
      const channel = interaction.options.getChannel('jail_channel');
      saveJailConfig(interaction.guild.id, { roleId: role.id, channelId: channel.id });
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle(L('✅ Sistema de Jail Configurado', '✅ Jail System Configured'))
          .setColor(0x57F287)
          .addFields(
            { name: L('Rol de aislado', 'Jail role'), value: `${role}`, inline: true },
            { name: L('Canal de jail', 'Jail channel'), value: `${channel}`, inline: true }
          )
          .setFooter({ text: L('Asegúrate de que el rol de jail solo tenga acceso al canal de jail.', 'Make sure the jail role only has access to the jail channel.') })
          .setTimestamp()],
        ephemeral: true
      });
    }

    // ── JAIL USER ─────────────────────────────────────────────────────────────
    if (sub === 'user') {
      const cfg = getJailConfig(interaction.guild.id);
      if (!cfg) return interaction.reply({ content: L('❌ El sistema de jail no está configurado. Usa `/jail setup`.', '❌ Jail system not configured. Use `/jail setup`.'), ephemeral: true });

      const usuario = interaction.options.getUser('user');
      const razon = interaction.options.getString('reason');
      const miembro = await interaction.guild.members.fetch(usuario.id).catch(() => null);

      if (!miembro) return interaction.reply({ content: L('❌ Usuario no encontrado.', '❌ User not found.'), ephemeral: true });
      if (usuario.id === interaction.user.id) return interaction.reply({ content: '❌', ephemeral: true });
      if (usuario.id === interaction.guild.ownerId) return interaction.reply({ content: L('❌ No puedes aislar al dueño.', '❌ Cannot jail the owner.'), ephemeral: true });
      if (miembro.roles.highest.position >= interaction.member.roles.highest.position) {
        return interaction.reply({ content: L('❌ Rol igual o superior.', '❌ Equal or higher role.'), ephemeral: true });
      }

      const jailRole = interaction.guild.roles.cache.get(cfg.roleId);
      if (!jailRole) return interaction.reply({ content: L('❌ El rol de jail no existe. Reconfigura con `/jail setup`.', '❌ Jail role not found. Reconfigure with `/jail setup`.'), ephemeral: true });

      // Verificar que no esté ya en jail
      const jailed = getJailedUsers(interaction.guild.id);
      if (jailed[usuario.id]) return interaction.reply({ content: L('❌ Este usuario ya está aislado.', '❌ This user is already jailed.'), ephemeral: true });

      await interaction.deferReply();

      // Guardar roles actuales (excepto @everyone y el rol de jail)
      const rolesToSave = miembro.roles.cache
        .filter(r => r.id !== interaction.guild.id && r.id !== cfg.roleId)
        .map(r => r.id);

      // Quitar todos los roles y asignar jail
      try {
        await miembro.roles.set([jailRole], `[JAIL] ${razon}`);
      } catch (err) {
        return interaction.editReply({ content: L(`❌ No pude modificar los roles: \`${err.message}\``, `❌ Could not modify roles: \`${err.message}\``) });
      }

      // Persistir
      jailed[usuario.id] = {
        roles: rolesToSave,
        jailedBy: interaction.user.id,
        reason: razon,
        jailedAt: Date.now()
      };
      saveJailedUsers(interaction.guild.id, jailed);

      const caseId = createCase(interaction.guild.id, 'jail', usuario.id, interaction.user.id, razon);

      // Notificar al usuario
      try {
        await usuario.send({ embeds: [new EmbedBuilder()
          .setTitle(L('🔒 Has sido aislado', '🔒 You have been jailed'))
          .setDescription(L(`En **${interaction.guild.name}**`, `In **${interaction.guild.name}**`))
          .addFields(
            { name: L('Razón', 'Reason'), value: razon },
            { name: L('Canal', 'Channel'), value: `<#${cfg.channelId}>` }
          )
          .setColor(0xED4245).setTimestamp()] });
      } catch {}

      const embed = new EmbedBuilder()
        .setTitle(L('🔒 Usuario Aislado', '🔒 User Jailed'))
        .setThumbnail(usuario.displayAvatarURL())
        .setColor(0xED4245)
        .addFields(
          { name: L('Usuario', 'User'), value: `${usuario} (${usuario.id})`, inline: true },
          { name: L('Moderador', 'Moderator'), value: `${interaction.user}`, inline: true },
          { name: L('Razón', 'Reason'), value: razon },
          { name: L('Roles guardados', 'Saved roles'), value: `${rolesToSave.length}`, inline: true },
          { name: L('Canal de jail', 'Jail channel'), value: `<#${cfg.channelId}>`, inline: true },
          { name: L('Caso', 'Case'), value: `#${caseId}`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      await interaction.client.sendTypedLog(interaction.guild, 'kicks', embed);
      return;
    }

    // ── FREE USER ─────────────────────────────────────────────────────────────
    if (sub === 'free') {
      const cfg = getJailConfig(interaction.guild.id);
      if (!cfg) return interaction.reply({ content: L('❌ El sistema de jail no está configurado.', '❌ Jail system not configured.'), ephemeral: true });

      const usuario = interaction.options.getUser('user');
      const razon = interaction.options.getString('reason') || L('No especificada', 'Not specified');
      const miembro = await interaction.guild.members.fetch(usuario.id).catch(() => null);

      const jailed = getJailedUsers(interaction.guild.id);
      if (!jailed[usuario.id]) return interaction.reply({ content: L('❌ Este usuario no está aislado.', '❌ This user is not jailed.'), ephemeral: true });

      await interaction.deferReply();

      const savedRoles = jailed[usuario.id].roles;

      // Restaurar roles
      if (miembro) {
        try {
          // Quitar jail role y restaurar los guardados
          const rolesToRestore = savedRoles.filter(id => interaction.guild.roles.cache.has(id));
          await miembro.roles.set(rolesToRestore, `[UNJAIL] ${razon}`);
        } catch (err) {
          return interaction.editReply({ content: L(`❌ No pude restaurar los roles: \`${err.message}\``, `❌ Could not restore roles: \`${err.message}\``) });
        }
      }

      // Limpiar de la DB
      delete jailed[usuario.id];
      saveJailedUsers(interaction.guild.id, jailed);

      const caseId = createCase(interaction.guild.id, 'unjail', usuario.id, interaction.user.id, razon);

      try {
        await usuario.send({ embeds: [new EmbedBuilder()
          .setTitle(L('🔓 Has sido liberado', '🔓 You have been freed'))
          .setDescription(L(`En **${interaction.guild.name}**`, `In **${interaction.guild.name}**`))
          .addFields({ name: L('Razón', 'Reason'), value: razon })
          .setColor(0x57F287).setTimestamp()] });
      } catch {}

      const embed = new EmbedBuilder()
        .setTitle(L('🔓 Usuario Liberado', '🔓 User Freed'))
        .setThumbnail(usuario.displayAvatarURL())
        .setColor(0x57F287)
        .addFields(
          { name: L('Usuario', 'User'), value: `${usuario} (${usuario.id})`, inline: true },
          { name: L('Moderador', 'Moderator'), value: `${interaction.user}`, inline: true },
          { name: L('Razón', 'Reason'), value: razon },
          { name: L('Roles restaurados', 'Restored roles'), value: `${savedRoles.length}`, inline: true },
          { name: L('Caso', 'Case'), value: `#${caseId}`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // ── LIST ──────────────────────────────────────────────────────────────────
    if (sub === 'list') {
      const jailed = getJailedUsers(interaction.guild.id);
      const entries = Object.entries(jailed);
      if (entries.length === 0) return interaction.reply({ content: L('✅ No hay usuarios aislados actualmente.', '✅ No users are currently jailed.'), ephemeral: true });

      const embed = new EmbedBuilder()
        .setTitle(L('🔒 Usuarios Aislados', '🔒 Jailed Users'))
        .setColor(0xED4245)
        .setTimestamp();

      for (const [userId, data] of entries.slice(0, 10)) {
        embed.addFields({
          name: `<@${userId}> (${userId})`,
          value: `**${L('Razón', 'Reason')}:** ${data.reason}\n**${L('Por', 'By')}:** <@${data.jailedBy}>\n**${L('Desde', 'Since')}:** <t:${Math.floor(data.jailedAt / 1000)}:R>`,
        });
      }
      if (entries.length > 10) embed.setFooter({ text: `Mostrando 10 de ${entries.length}` });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  // Exported helpers for use in index.js (role restore on rejoin)
  getJailConfig,
  getJailedUsers,
  saveJailedUsers,
};
