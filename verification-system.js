/**
 * verification-system.js
 * Handles the verification gate: button, math captcha, or password modes.
 * Stores pending sessions in memory (Map). Config persists in SQLite via guild-config.
 */
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
        ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const guildConfig = require('./guild-config');

// In-memory sessions: guildId+userId → { answer, expiresAt }
const pendingSessions = new Map();

// ── Helpers ──────────────────────────────────────────────────────────────────

function getConfig(guildId) {
  return guildConfig.get(guildId, 'verifyConfig') || null;
}

function saveConfig(guildId, cfg) {
  guildConfig.set(guildId, 'verifyConfig', cfg);
}

/** Generate a simple math question: a + b or a * b */
function generateMath() {
  const ops = ['+', '-', '*'];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a, b, answer;
  if (op === '+') { a = Math.floor(Math.random() * 20) + 1; b = Math.floor(Math.random() * 20) + 1; answer = a + b; }
  else if (op === '-') { a = Math.floor(Math.random() * 20) + 10; b = Math.floor(Math.random() * 10) + 1; answer = a - b; }
  else { a = Math.floor(Math.random() * 10) + 2; b = Math.floor(Math.random() * 10) + 2; answer = a * b; }
  return { question: `${a} ${op} ${b}`, answer: String(answer) };
}

// ── Send verification message to a member ────────────────────────────────────

async function sendVerificationToMember(member, cfg) {
  const lang = guildConfig.get(member.guild.id, 'language') || 'es';
  const L = (es, en) => lang === 'es' ? es : en;

  if (cfg.mode === 'button') {
    const embed = new EmbedBuilder()
      .setTitle(L('✅ Verificación Requerida', '✅ Verification Required'))
      .setDescription(L(
        `Bienvenido a **${member.guild.name}**!\nHaz click en el botón de abajo para verificarte y acceder al servidor.`,
        `Welcome to **${member.guild.name}**!\nClick the button below to verify yourself and access the server.`
      ))
      .setColor(0x5865F2)
      .setThumbnail(member.guild.iconURL())
      .setFooter({ text: L('Este mensaje expira en 10 minutos', 'This message expires in 10 minutes') });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`verify_button_${member.guild.id}_${member.id}`)
        .setLabel(L('✅ Verificarme', '✅ Verify Me'))
        .setStyle(ButtonStyle.Success)
    );

    // Try DM first, fallback to verify channel
    let sent = false;
    try {
      await member.send({ embeds: [embed], components: [row] });
      sent = true;
    } catch {}

    if (!sent && cfg.channelId) {
      const ch = member.guild.channels.cache.get(cfg.channelId);
      if (ch) await ch.send({ content: `${member}`, embeds: [embed], components: [row] });
    }

  } else if (cfg.mode === 'captcha') {
    const { question, answer } = generateMath();
    const key = `${member.guild.id}-${member.id}`;
    pendingSessions.set(key, { answer, expiresAt: Date.now() + 10 * 60 * 1000 });

    const embed = new EmbedBuilder()
      .setTitle(L('🔢 Verificación — Captcha Matemático', '🔢 Verification — Math Captcha'))
      .setDescription(L(
        `Bienvenido a **${member.guild.name}**!\nResuelve la siguiente operación para verificarte:`,
        `Welcome to **${member.guild.name}**!\nSolve the following operation to verify yourself:`
      ))
      .addFields({ name: L('❓ Pregunta', '❓ Question'), value: `\`\`\`${question} = ?\`\`\`` })
      .setColor(0x5865F2)
      .setThumbnail(member.guild.iconURL())
      .setFooter({ text: L('Tienes 10 minutos para responder', 'You have 10 minutes to answer') });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`verify_captcha_${member.guild.id}_${member.id}`)
        .setLabel(L('📝 Responder', '📝 Answer'))
        .setStyle(ButtonStyle.Primary)
    );

    let sent = false;
    try {
      await member.send({ embeds: [embed], components: [row] });
      sent = true;
    } catch {}

    if (!sent && cfg.channelId) {
      const ch = member.guild.channels.cache.get(cfg.channelId);
      if (ch) await ch.send({ content: `${member}`, embeds: [embed], components: [row] });
    }

  } else if (cfg.mode === 'password') {
    const embed = new EmbedBuilder()
      .setTitle(L('🔑 Verificación — Contraseña', '🔑 Verification — Password'))
      .setDescription(L(
        `Bienvenido a **${member.guild.name}**!\nIngresa la contraseña del servidor para verificarte.`,
        `Welcome to **${member.guild.name}**!\nEnter the server password to verify yourself.`
      ))
      .setColor(0x5865F2)
      .setThumbnail(member.guild.iconURL())
      .setFooter({ text: L('Tienes 10 minutos para responder', 'You have 10 minutes to answer') });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`verify_password_${member.guild.id}_${member.id}`)
        .setLabel(L('🔑 Ingresar contraseña', '🔑 Enter password'))
        .setStyle(ButtonStyle.Primary)
    );

    let sent = false;
    try {
      await member.send({ embeds: [embed], components: [row] });
      sent = true;
    } catch {}

    if (!sent && cfg.channelId) {
      const ch = member.guild.channels.cache.get(cfg.channelId);
      if (ch) await ch.send({ content: `${member}`, embeds: [embed], components: [row] });
    }
  }
}

// ── Handle button/modal interactions ─────────────────────────────────────────

async function handleVerifyInteraction(interaction, client) {
  const id = interaction.customId;
  if (!id?.startsWith('verify_')) return false;

  const lang = guildConfig.get(interaction.guild?.id, 'language') || 'es';
  const L = (es, en) => lang === 'es' ? es : en;

  // ── Button: simple verify ─────────────────────────────────────────────────
  if (interaction.isButton() && id.startsWith('verify_button_')) {
    const [, , guildId, userId] = id.split('_');
    if (interaction.user.id !== userId) {
      return interaction.reply({ content: L('❌ Este botón no es para ti.', '❌ This button is not for you.'), ephemeral: true });
    }
    await grantVerification(interaction, guildId, userId, client, L);
    return true;
  }

  // ── Button: open captcha modal ────────────────────────────────────────────
  if (interaction.isButton() && id.startsWith('verify_captcha_')) {
    const [, , guildId, userId] = id.split('_');
    if (interaction.user.id !== userId) {
      return interaction.reply({ content: L('❌ Este botón no es para ti.', '❌ This button is not for you.'), ephemeral: true });
    }
    const key = `${guildId}-${userId}`;
    const session = pendingSessions.get(key);
    if (!session || Date.now() > session.expiresAt) {
      return interaction.reply({ content: L('❌ La sesión expiró. Contacta a un moderador.', '❌ Session expired. Contact a moderator.'), ephemeral: true });
    }
    const modal = new ModalBuilder()
      .setCustomId(`verify_captcha_modal_${guildId}_${userId}`)
      .setTitle(L('🔢 Responde el Captcha', '🔢 Answer the Captcha'));
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('captcha_answer')
          .setLabel(L('Tu respuesta', 'Your answer'))
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(10)
      )
    );
    await interaction.showModal(modal);
    return true;
  }

  // ── Modal submit: captcha answer ──────────────────────────────────────────
  if (interaction.isModalSubmit() && id.startsWith('verify_captcha_modal_')) {
    const parts = id.split('_');
    const guildId = parts[4];
    const userId = parts[5];
    if (interaction.user.id !== userId) {
      return interaction.reply({ content: L('❌ Esta sesión no es tuya.', '❌ This session is not yours.'), ephemeral: true });
    }
    const key = `${guildId}-${userId}`;
    const session = pendingSessions.get(key);
    if (!session || Date.now() > session.expiresAt) {
      return interaction.reply({ content: L('❌ La sesión expiró. Contacta a un moderador.', '❌ Session expired. Contact a moderator.'), ephemeral: true });
    }
    const userAnswer = interaction.fields.getTextInputValue('captcha_answer').trim();
    if (userAnswer !== session.answer) {
      pendingSessions.delete(key);
      return interaction.reply({ content: L(`❌ Respuesta incorrecta. La respuesta era \`${session.answer}\`. Contacta a un moderador.`, `❌ Wrong answer. The answer was \`${session.answer}\`. Contact a moderator.`), ephemeral: true });
    }
    pendingSessions.delete(key);
    await grantVerification(interaction, guildId, userId, client, L);
    return true;
  }

  // ── Button: open password modal ───────────────────────────────────────────
  if (interaction.isButton() && id.startsWith('verify_password_')) {
    const [, , guildId, userId] = id.split('_');
    if (interaction.user.id !== userId) {
      return interaction.reply({ content: L('❌ Este botón no es para ti.', '❌ This button is not for you.'), ephemeral: true });
    }
    const modal = new ModalBuilder()
      .setCustomId(`verify_password_modal_${guildId}_${userId}`)
      .setTitle(L('🔑 Contraseña del Servidor', '🔑 Server Password'));
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('password_input')
          .setLabel(L('Contraseña', 'Password'))
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(100)
      )
    );
    await interaction.showModal(modal);
    return true;
  }

  // ── Modal submit: password ────────────────────────────────────────────────
  if (interaction.isModalSubmit() && id.startsWith('verify_password_modal_')) {
    const parts = id.split('_');
    const guildId = parts[4];
    const userId = parts[5];
    if (interaction.user.id !== userId) {
      return interaction.reply({ content: L('❌ Esta sesión no es tuya.', '❌ This session is not yours.'), ephemeral: true });
    }
    const cfg = getConfig(guildId);
    if (!cfg) return interaction.reply({ content: '❌ Sistema de verificación no configurado.', ephemeral: true });
    const input = interaction.fields.getTextInputValue('password_input').trim();
    if (input !== cfg.password) {
      return interaction.reply({ content: L('❌ Contraseña incorrecta.', '❌ Wrong password.'), ephemeral: true });
    }
    await grantVerification(interaction, guildId, userId, client, L);
    return true;
  }

  return false;
}

// ── Grant the member role ─────────────────────────────────────────────────────

async function grantVerification(interaction, guildId, userId, client, L) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return interaction.reply({ content: '❌ Servidor no encontrado.', ephemeral: true });

  const cfg = getConfig(guildId);
  if (!cfg) return interaction.reply({ content: '❌ Sistema de verificación no configurado.', ephemeral: true });

  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) return interaction.reply({ content: L('❌ No se encontró el miembro.', '❌ Member not found.'), ephemeral: true });

  const role = guild.roles.cache.get(cfg.memberRoleId);
  if (!role) return interaction.reply({ content: L('❌ El rol de miembro no existe. Contacta a un admin.', '❌ Member role not found. Contact an admin.'), ephemeral: true });

  try {
    await member.roles.add(role, 'Verificación completada');
    await interaction.reply({
      content: L(`✅ ¡Verificado! Bienvenido a **${guild.name}**, ${member}.`, `✅ Verified! Welcome to **${guild.name}**, ${member}.`),
      ephemeral: true
    });
  } catch (err) {
    console.error('[verify] Error granting role:', err);
    await interaction.reply({ content: L('❌ No pude asignarte el rol. Contacta a un moderador.', '❌ Could not assign your role. Contact a moderator.'), ephemeral: true });
  }
}

module.exports = { getConfig, saveConfig, sendVerificationToMember, handleVerifyInteraction };
