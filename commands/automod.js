const {
  SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder,
  TextInputBuilder, TextInputStyle
} = require('discord.js');
const fs = require('fs');
const path = require('path');

const automodPath = path.join(__dirname, '../data/automod.json');

function loadAutomod(guildId) {
  let data = {};
  if (fs.existsSync(automodPath)) data = JSON.parse(fs.readFileSync(automodPath, 'utf8'));
  if (!data[guildId]) {
    data[guildId] = {
      spam:     { enabled: false, messages: 5, seconds: 5 },
      mentions: { enabled: false, maxMentions: 5 },
      links:    { enabled: false },
      invites:  { enabled: false },
      caps:     { enabled: false, percentage: 70 },
      nsfw:     { enabled: true }
    };
  }
  return data;
}

function saveAutomod(data) {
  const dir = path.join(__dirname, '../data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(automodPath, JSON.stringify(data, null, 2));
}

function buildPanel(cfg) {
  const s = (v) => v ? '🟢' : '🔴';

  const embed = new EmbedBuilder()
    .setTitle('⚙️ Panel de Auto-Moderación')
    .setColor(0x5865F2)
    .setDescription('Usa los botones para activar/desactivar módulos o configurar sus valores.')
    .addFields(
      { name: `${s(cfg.spam.enabled)} Anti-Spam`,           value: cfg.spam.enabled     ? `${cfg.spam.messages} msgs / ${cfg.spam.seconds}s`  : 'Desactivado', inline: true },
      { name: `${s(cfg.mentions.enabled)} Menciones Masivas`, value: cfg.mentions.enabled ? `Max ${cfg.mentions.maxMentions} menciones`          : 'Desactivado', inline: true },
      { name: `${s(cfg.links.enabled)} Filtro de Links`,    value: cfg.links.enabled    ? 'Activado'                                           : 'Desactivado', inline: true },
      { name: `${s(cfg.invites.enabled)} Filtro de Invites`,value: cfg.invites.enabled  ? 'Activado'                                           : 'Desactivado', inline: true },
      { name: `${s(cfg.caps.enabled)} Mayúsculas Excesivas`,value: cfg.caps.enabled     ? `Max ${cfg.caps.percentage}%`                        : 'Desactivado', inline: true },
      { name: `${s(cfg.nsfw?.enabled)} Filtro NSFW`,        value: cfg.nsfw?.enabled    ? 'Activado'                                           : 'Desactivado', inline: true }
    )
    .setFooter({ text: '🟢 = Activo  |  🔴 = Inactivo' })
    .setTimestamp();

  // Fila 1: toggles
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('am_toggle_spam')     .setLabel('Spam')     .setStyle(cfg.spam.enabled     ? ButtonStyle.Success : ButtonStyle.Danger).setEmoji('📨'),
    new ButtonBuilder().setCustomId('am_toggle_mentions') .setLabel('Menciones').setStyle(cfg.mentions.enabled ? ButtonStyle.Success : ButtonStyle.Danger).setEmoji('👥'),
    new ButtonBuilder().setCustomId('am_toggle_links')    .setLabel('Links')    .setStyle(cfg.links.enabled    ? ButtonStyle.Success : ButtonStyle.Danger).setEmoji('🔗'),
    new ButtonBuilder().setCustomId('am_toggle_invites')  .setLabel('Invites')  .setStyle(cfg.invites.enabled  ? ButtonStyle.Success : ButtonStyle.Danger).setEmoji('📧'),
    new ButtonBuilder().setCustomId('am_toggle_caps')     .setLabel('Caps')     .setStyle(cfg.caps.enabled     ? ButtonStyle.Success : ButtonStyle.Danger).setEmoji('🔠')
  );

  // Fila 2: NSFW toggle + botones de configuración
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('am_toggle_nsfw')     .setLabel('NSFW')     .setStyle(cfg.nsfw?.enabled    ? ButtonStyle.Success : ButtonStyle.Danger).setEmoji('🔞'),
    new ButtonBuilder().setCustomId('am_config_spam')     .setLabel('Config Spam')    .setStyle(ButtonStyle.Secondary).setEmoji('⚙️'),
    new ButtonBuilder().setCustomId('am_config_mentions') .setLabel('Config Menciones').setStyle(ButtonStyle.Secondary).setEmoji('⚙️'),
    new ButtonBuilder().setCustomId('am_config_caps')     .setLabel('Config Caps')    .setStyle(ButtonStyle.Secondary).setEmoji('⚙️')
  );

  return { embed, components: [row1, row2] };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Panel de configuración de auto-moderación')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const data = loadAutomod(interaction.guild.id);
    const cfg = data[interaction.guild.id];
    const { embed, components } = buildPanel(cfg);
    await interaction.reply({ embeds: [embed], components, flags: 64 });
  },

  // Handler de botones e interacciones - se llama desde index.js
  async handleInteraction(interaction) {
    if (!interaction.customId?.startsWith('am_')) return false;

    const guildId = interaction.guild.id;
    const data = loadAutomod(guildId);
    const cfg = data[guildId];

    // --- MODALS de configuración ---
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'am_modal_spam') {
        const msgs = parseInt(interaction.fields.getTextInputValue('spam_messages')) || 5;
        const secs = parseInt(interaction.fields.getTextInputValue('spam_seconds')) || 5;
        cfg.spam.messages = Math.min(Math.max(msgs, 2), 20);
        cfg.spam.seconds  = Math.min(Math.max(secs, 1), 60);
        saveAutomod(data);
        const { embed, components } = buildPanel(cfg);
        return interaction.update({ embeds: [embed], components });
      }
      if (interaction.customId === 'am_modal_mentions') {
        const max = parseInt(interaction.fields.getTextInputValue('mentions_max')) || 5;
        cfg.mentions.maxMentions = Math.min(Math.max(max, 1), 50);
        saveAutomod(data);
        const { embed, components } = buildPanel(cfg);
        return interaction.update({ embeds: [embed], components });
      }
      if (interaction.customId === 'am_modal_caps') {
        const pct = parseInt(interaction.fields.getTextInputValue('caps_pct')) || 70;
        cfg.caps.percentage = Math.min(Math.max(pct, 10), 100);
        saveAutomod(data);
        const { embed, components } = buildPanel(cfg);
        return interaction.update({ embeds: [embed], components });
      }
      return false;
    }

    if (!interaction.isButton()) return false;

    // --- TOGGLES ---
    const toggleMap = {
      am_toggle_spam:     () => { cfg.spam.enabled     = !cfg.spam.enabled; },
      am_toggle_mentions: () => { cfg.mentions.enabled = !cfg.mentions.enabled; },
      am_toggle_links:    () => { cfg.links.enabled    = !cfg.links.enabled; },
      am_toggle_invites:  () => { cfg.invites.enabled  = !cfg.invites.enabled; },
      am_toggle_caps:     () => { cfg.caps.enabled     = !cfg.caps.enabled; },
      am_toggle_nsfw:     () => { if (!cfg.nsfw) cfg.nsfw = {}; cfg.nsfw.enabled = !cfg.nsfw.enabled; },
    };

    if (toggleMap[interaction.customId]) {
      toggleMap[interaction.customId]();
      saveAutomod(data);
      const { embed, components } = buildPanel(cfg);
      return interaction.update({ embeds: [embed], components });
    }

    // --- CONFIG MODALS ---
    if (interaction.customId === 'am_config_spam') {
      const modal = new ModalBuilder().setCustomId('am_modal_spam').setTitle('Configurar Anti-Spam');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('spam_messages').setLabel('Máximo de mensajes').setStyle(TextInputStyle.Short).setValue(String(cfg.spam.messages)).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('spam_seconds').setLabel('Ventana de tiempo (segundos)').setStyle(TextInputStyle.Short).setValue(String(cfg.spam.seconds)).setRequired(true)
        )
      );
      return interaction.showModal(modal);
    }

    if (interaction.customId === 'am_config_mentions') {
      const modal = new ModalBuilder().setCustomId('am_modal_mentions').setTitle('Configurar Menciones Masivas');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('mentions_max').setLabel('Máximo de menciones por mensaje').setStyle(TextInputStyle.Short).setValue(String(cfg.mentions.maxMentions)).setRequired(true)
        )
      );
      return interaction.showModal(modal);
    }

    if (interaction.customId === 'am_config_caps') {
      const modal = new ModalBuilder().setCustomId('am_modal_caps').setTitle('Configurar Mayúsculas Excesivas');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId('caps_pct').setLabel('Porcentaje máximo de mayúsculas (10-100)').setStyle(TextInputStyle.Short).setValue(String(cfg.caps.percentage)).setRequired(true)
        )
      );
      return interaction.showModal(modal);
    }

    return false;
  }
};
