const {
  SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle
} = require('discord.js');
const guildConfig = require('../guild-config');

// ── Storage helpers ───────────────────────────────────────────────────────────

function loadTriggers(guildId) {
  return guildConfig.get(guildId, 'triggers') || [];
}

function saveTriggers(guildId, triggers) {
  guildConfig.set(guildId, 'triggers', triggers);
}

// ── Panel builder ─────────────────────────────────────────────────────────────

function buildPanel(guildId) {
  const triggers = loadTriggers(guildId);

  const embed = new EmbedBuilder()
    .setTitle('⚡ Panel de Auto-Respuestas')
    .setColor(0x5865F2)
    .setDescription(
      triggers.length === 0
        ? '*No hay triggers configurados. Usa el botón "➕ Agregar" para crear uno.*'
        : triggers.map((t, i) =>
            `**${i + 1}.** \`${t.keyword}\` — ${t.matchType === 'exact' ? '🎯 Exacto' : t.matchType === 'startswith' ? '🔤 Empieza con' : '🔍 Contiene'} ${t.replyType === 'embed' ? '📋 Embed' : '💬 Texto'}`
          ).join('\n')
    )
    .setFooter({ text: `${triggers.length} trigger(s) configurado(s)` })
    .setTimestamp();

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('trigger_add')
      .setLabel('➕ Agregar')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('trigger_delete')
      .setLabel('🗑️ Eliminar')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(triggers.length === 0),
    new ButtonBuilder()
      .setCustomId('trigger_test')
      .setLabel('🧪 Probar')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(triggers.length === 0),
    new ButtonBuilder()
      .setCustomId('trigger_refresh')
      .setLabel('🔄 Actualizar')
      .setStyle(ButtonStyle.Secondary)
  );

  return { embed, components: [row1] };
}

// ── Module export ─────────────────────────────────────────────────────────────

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trigger')
    .setDescription('Panel de auto-respuestas por palabras clave')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const { embed, components } = buildPanel(interaction.guild.id);
    await interaction.reply({ embeds: [embed], components, flags: 64 });
  },

  async handleInteraction(interaction) {
    if (!interaction.customId?.startsWith('trigger_')) return false;
    const guildId = interaction.guild.id;
    const lang = interaction.client.getLanguage(guildId);
    const L = (es, en) => lang === 'es' ? es : en;

    // ── REFRESH ───────────────────────────────────────────────────────────────
    if (interaction.isButton() && interaction.customId === 'trigger_refresh') {
      const { embed, components } = buildPanel(guildId);
      return interaction.update({ embeds: [embed], components });
    }

    // ── ADD — open modal ──────────────────────────────────────────────────────
    if (interaction.isButton() && interaction.customId === 'trigger_add') {
      const modal = new ModalBuilder()
        .setCustomId('trigger_add_modal')
        .setTitle('➕ Nuevo Auto-Respuesta');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('trigger_keyword')
            .setLabel('Palabra clave (lo que escribe el usuario)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('ej: link, ¿cuál es el link?, reglas')
            .setRequired(true)
            .setMaxLength(100)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('trigger_match')
            .setLabel('Tipo de coincidencia: contains / exact / startswith')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('contains')
            .setRequired(true)
            .setMaxLength(20)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('trigger_reply_type')
            .setLabel('Tipo de respuesta: text / embed')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('embed')
            .setRequired(true)
            .setMaxLength(10)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('trigger_title')
            .setLabel('Título del embed (o deja vacío para texto plano)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('📌 Link del servidor')
            .setRequired(false)
            .setMaxLength(256)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('trigger_content')
            .setLabel('Contenido / descripción del embed')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('https://discord.gg/...')
            .setRequired(true)
            .setMaxLength(2000)
        )
      );

      return interaction.showModal(modal);
    }

    // ── ADD — modal submit ────────────────────────────────────────────────────
    if (interaction.isModalSubmit() && interaction.customId === 'trigger_add_modal') {
      const keyword   = interaction.fields.getTextInputValue('trigger_keyword').trim().toLowerCase();
      const matchRaw  = interaction.fields.getTextInputValue('trigger_match').trim().toLowerCase();
      const replyRaw  = interaction.fields.getTextInputValue('trigger_reply_type').trim().toLowerCase();
      const title     = interaction.fields.getTextInputValue('trigger_title').trim();
      const content   = interaction.fields.getTextInputValue('trigger_content').trim();

      const validMatch = ['contains', 'exact', 'startswith'];
      const matchType = validMatch.includes(matchRaw) ? matchRaw : 'contains';
      const replyType = replyRaw === 'text' ? 'text' : 'embed';

      const triggers = loadTriggers(guildId);

      // Evitar duplicados
      if (triggers.find(t => t.keyword === keyword)) {
        const { embed, components } = buildPanel(guildId);
        await interaction.update({ embeds: [embed], components });
        return interaction.followUp({ content: L(`❌ Ya existe un trigger para \`${keyword}\`.`, `❌ A trigger for \`${keyword}\` already exists.`), flags: 64 });
      }

      triggers.push({ keyword, matchType, replyType, title: title || null, content, createdBy: interaction.user.id, createdAt: Date.now() });
      saveTriggers(guildId, triggers);

      const { embed, components } = buildPanel(guildId);
      await interaction.update({ embeds: [embed], components });
      return interaction.followUp({ content: L(`✅ Trigger \`${keyword}\` creado.`, `✅ Trigger \`${keyword}\` created.`), flags: 64 });
    }

    // ── DELETE — open modal ───────────────────────────────────────────────────
    if (interaction.isButton() && interaction.customId === 'trigger_delete') {
      const triggers = loadTriggers(guildId);
      const modal = new ModalBuilder()
        .setCustomId('trigger_delete_modal')
        .setTitle('🗑️ Eliminar Trigger');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('trigger_delete_id')
            .setLabel(`Número del trigger a eliminar (1-${triggers.length})`)
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(4)
        )
      );
      return interaction.showModal(modal);
    }

    // ── DELETE — modal submit ─────────────────────────────────────────────────
    if (interaction.isModalSubmit() && interaction.customId === 'trigger_delete_modal') {
      const triggers = loadTriggers(guildId);
      const num = parseInt(interaction.fields.getTextInputValue('trigger_delete_id').trim());
      if (isNaN(num) || num < 1 || num > triggers.length) {
        const { embed, components } = buildPanel(guildId);
        await interaction.update({ embeds: [embed], components });
        return interaction.followUp({ content: L('❌ Número inválido.', '❌ Invalid number.'), flags: 64 });
      }
      const removed = triggers.splice(num - 1, 1)[0];
      saveTriggers(guildId, triggers);
      const { embed, components } = buildPanel(guildId);
      await interaction.update({ embeds: [embed], components });
      return interaction.followUp({ content: L(`✅ Trigger \`${removed.keyword}\` eliminado.`, `✅ Trigger \`${removed.keyword}\` deleted.`), flags: 64 });
    }

    // ── TEST — open modal ─────────────────────────────────────────────────────
    if (interaction.isButton() && interaction.customId === 'trigger_test') {
      const modal = new ModalBuilder()
        .setCustomId('trigger_test_modal')
        .setTitle('🧪 Probar Trigger');
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('trigger_test_input')
            .setLabel('Escribe un mensaje para probar')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(200)
        )
      );
      return interaction.showModal(modal);
    }

    // ── TEST — modal submit ───────────────────────────────────────────────────
    if (interaction.isModalSubmit() && interaction.customId === 'trigger_test_modal') {
      const input = interaction.fields.getTextInputValue('trigger_test_input').trim();
      const match = findTrigger(guildId, input);
      if (!match) {
        return interaction.reply({ content: L(`🧪 Sin coincidencia para: \`${input}\``, `🧪 No match for: \`${input}\``), flags: 64 });
      }
      const response = buildTriggerResponse(match);
      return interaction.reply({ content: L(`🧪 Coincide con trigger \`${match.keyword}\`:`, `🧪 Matches trigger \`${match.keyword}\`:`), ...response, flags: 64 });
    }

    return false;
  },

  // Exported for use in messageCreate
  findTrigger,
  buildTriggerResponse,
};

// ── Core matching logic ───────────────────────────────────────────────────────

function findTrigger(guildId, messageContent) {
  const triggers = loadTriggers(guildId);
  const lower = messageContent.toLowerCase();

  for (const t of triggers) {
    const kw = t.keyword.toLowerCase();
    if (t.matchType === 'exact'      && lower === kw)          return t;
    if (t.matchType === 'contains'   && lower.includes(kw))    return t;
    if (t.matchType === 'startswith' && lower.startsWith(kw))  return t;
  }
  return null;
}

function buildTriggerResponse(trigger) {
  if (trigger.replyType === 'text') {
    return { content: trigger.content };
  }
  // embed
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setDescription(trigger.content)
    .setTimestamp();
  if (trigger.title) embed.setTitle(trigger.title);
  return { embeds: [embed] };
}
