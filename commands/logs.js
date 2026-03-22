const {
  SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle
} = require('discord.js');
const guildConfig = require('../guild-config');

// Definición de todos los tipos de log
const LOG_TYPES = [
  { id: 'messages', label: 'Mensajes',  emoji: '💬', desc: 'Edits, deletes, reacciones, purges' },
  { id: 'voice',    label: 'Voz',       emoji: '🔊', desc: 'Join, leave, move entre canales' },
  { id: 'members',  label: 'Miembros',  emoji: '👥', desc: 'Join, leave, roles, apodos' },
  { id: 'bans',     label: 'Bans',      emoji: '🔨', desc: 'Bans y unbans' },
  { id: 'kicks',    label: 'Kicks',     emoji: '👢', desc: 'Expulsiones' },
  { id: 'warnings', label: 'Warnings',  emoji: '⚠️', desc: 'Advertencias' },
  { id: 'timeouts', label: 'Timeouts',  emoji: '⏱️', desc: 'Timeouts aplicados/removidos' },
  { id: 'automod',  label: 'Automod',   emoji: '🤖', desc: 'Acciones del automod' },
  { id: 'server',   label: 'Servidor',  emoji: '🏠', desc: 'Canales, roles, emojis, guild' },
  { id: 'invites',  label: 'Invites',   emoji: '🔗', desc: 'Invitaciones creadas/eliminadas' },
];

function loadLogs(guildId) {
  return guildConfig.get(guildId, 'modLogs') || {};
}

function saveLogs(guildId, data) {
  guildConfig.set(guildId, 'modLogs', data);
}

function buildPanel(guildId) {
  const cfg = loadLogs(guildId);
  const s = (id) => cfg[id] ? '🟢' : '🔴';

  const embed = new EmbedBuilder()
    .setTitle('📋 Panel de Logs')
    .setColor(0x5865F2)
    .setDescription('Haz click en un botón para **activar** (te pedirá el canal) o **desactivar** ese tipo de log.\n\u200b')
    .addFields(
      LOG_TYPES.map(t => ({
        name: `${s(t.id)} ${t.emoji} ${t.label}`,
        value: cfg[t.id] ? `<#${cfg[t.id]}>` : `*${t.desc}*`,
        inline: true
      }))
    )
    .setFooter({ text: '🟢 = Activo  |  🔴 = Inactivo' })
    .setTimestamp();

  // Máximo 5 botones por fila, necesitamos 2 filas para 10 tipos
  const rows = [];
  for (let i = 0; i < LOG_TYPES.length; i += 5) {
    const row = new ActionRowBuilder().addComponents(
      LOG_TYPES.slice(i, i + 5).map(t =>
        new ButtonBuilder()
          .setCustomId(`logs_toggle_${t.id}`)
          .setLabel(t.label)
          .setEmoji(t.emoji)
          .setStyle(cfg[t.id] ? ButtonStyle.Success : ButtonStyle.Danger)
      )
    );
    rows.push(row);
  }

  return { embed, components: rows };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Panel interactivo de configuración de logs')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const { embed, components } = buildPanel(interaction.guild.id);
    await interaction.reply({ embeds: [embed], components, ephemeral: true });
  },

  async handleInteraction(interaction) {
    if (!interaction.customId?.startsWith('logs_')) return false;
    const guildId = interaction.guild.id;

    // Modal submit — guardar canal
    if (interaction.isModalSubmit() && interaction.customId.startsWith('logs_modal_')) {
      const typeId = interaction.customId.replace('logs_modal_', '');
      const raw = interaction.fields.getTextInputValue('logs_channel_id').trim();

      // Aceptar mención <#ID>, solo ID, o nombre
      const channelId = raw.replace(/[<#>]/g, '');
      const channel = interaction.guild.channels.cache.get(channelId)
        || interaction.guild.channels.cache.find(c => c.name === raw);

      if (!channel) {
        return interaction.reply({ content: `❌ Canal no encontrado: \`${raw}\`\nUsa el ID, la mención o el nombre exacto.`, ephemeral: true });
      }

      const cfg = loadLogs(guildId);
      cfg[typeId] = channel.id;
      saveLogs(guildId, cfg);

      const { embed, components } = buildPanel(guildId);
      return interaction.update({ embeds: [embed], components });
    }

    if (!interaction.isButton()) return false;

    // Toggle button
    if (interaction.customId.startsWith('logs_toggle_')) {
      const typeId = interaction.customId.replace('logs_toggle_', '');
      const type = LOG_TYPES.find(t => t.id === typeId);
      if (!type) return false;

      const cfg = loadLogs(guildId);

      if (cfg[typeId]) {
        // Ya está activo → desactivar
        delete cfg[typeId];
        saveLogs(guildId, cfg);
        const { embed, components } = buildPanel(guildId);
        return interaction.update({ embeds: [embed], components });
      } else {
        // No está activo → pedir canal via modal
        const modal = new ModalBuilder()
          .setCustomId(`logs_modal_${typeId}`)
          .setTitle(`${type.emoji} Activar logs: ${type.label}`);
        modal.addComponents(
          new ActionRowBuilder().addComponents(
            new TextInputBuilder()
              .setCustomId('logs_channel_id')
              .setLabel('ID o nombre del canal de texto')
              .setPlaceholder('Ej: 123456789012345678 o #logs-mensajes')
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
          )
        );
        return interaction.showModal(modal);
      }
    }

    return false;
  }
};
