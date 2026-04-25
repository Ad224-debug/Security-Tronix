const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { unlockGuild, getRaidState, getAntiRaidConfig } = require('../antiraid-system');
const guildConfig = require('../guild-config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antiraid')
    .setDescription('Gestionar el sistema anti-raid')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s => s.setName('unlock').setDescription('Levantar el lockdown manualmente'))
    .addSubcommand(s => s.setName('status').setDescription('Ver estado actual del anti-raid'))
    .addSubcommand(s => s
      .setName('config')
      .setDescription('Configurar el sistema anti-raid')
      .addBooleanOption(o => o.setName('enabled').setDescription('Activar o desactivar').setRequired(true))
      .addStringOption(o => o.setName('action').setDescription('Acción al detectar raid').addChoices(
        { name: 'Kick (recomendado)', value: 'kick' },
        { name: 'Ban', value: 'ban' },
        { name: 'Lockdown', value: 'lockdown' },
        { name: 'Timeout', value: 'timeout' }
      ))
      .addIntegerOption(o => o.setName('threshold').setDescription('Joins para activar raid (default: 10)').setMinValue(3).setMaxValue(50))
      .addIntegerOption(o => o.setName('window').setDescription('Ventana en segundos (default: 30)').setMinValue(5).setMaxValue(120))
      .addIntegerOption(o => o.setName('min_age').setDescription('Edad mínima de cuenta en días (0=off)').setMinValue(0).setMaxValue(365))
      .addIntegerOption(o => o.setName('channel_limit').setDescription('Canales eliminados para activar (default: 3)').setMinValue(1).setMaxValue(10))
      .addIntegerOption(o => o.setName('role_limit').setDescription('Roles eliminados para activar (default: 3)').setMinValue(1).setMaxValue(10))
      .addIntegerOption(o => o.setName('ban_limit').setDescription('Bans masivos para activar (default: 5)').setMinValue(2).setMaxValue(20))
    ),

  async execute(interaction) {
    try {
      if (!interaction.guild) return interaction.reply({ content: '❌ Solo en servidores.', flags: 64 });
      await interaction.deferReply({ flags: 64 });
      const sub  = interaction.options.getSubcommand();
      const lang = interaction.client.getLanguage(interaction.guild.id);
      const L    = (es, en) => lang === 'es' ? es : en;
      const sendLog = (guild, embed) => interaction.client.sendLog(guild, embed);

      // ── UNLOCK ──────────────────────────────────────────────────────────────
      if (sub === 'unlock') {
        const state = getRaidState(interaction.guild.id);
        if (!state.active) {
          return interaction.editReply({ content: L('ℹ️ No hay ningún lockdown activo.', 'ℹ️ No active lockdown.') });
        }
        const ok = await unlockGuild(interaction.guild, sendLog, 'manual');
        return interaction.editReply({ content: ok
          ? L('✅ Lockdown levantado correctamente.', '✅ Lockdown lifted successfully.')
          : L('❌ No se pudo levantar el lockdown.', '❌ Could not lift the lockdown.')
        });
      }

      // ── STATUS ──────────────────────────────────────────────────────────────
      if (sub === 'status') {
        const state = getRaidState(interaction.guild.id);
        const cfg   = getAntiRaidConfig(interaction.guild.id);

        const embed = new EmbedBuilder()
          .setTitle(L('🛡️ Estado Anti-Raid', '🛡️ Anti-Raid Status'))
          .setColor(state.active ? 0xFF0000 : cfg.enabled ? 0x57F287 : 0x99AAB5)
          .addFields(
            { name: L('Sistema', 'System'), value: cfg.enabled ? '✅ Activo' : '❌ Inactivo', inline: true },
            { name: L('Lockdown', 'Lockdown'), value: state.active ? '🔒 En curso' : '🔓 Sin lockdown', inline: true },
            { name: L('Canales bloqueados', 'Locked channels'), value: `${state.lockedChannels?.length ?? 0}`, inline: true },
            { name: L('Acción', 'Action'), value: cfg.action ?? 'kick', inline: true },
            { name: L('Umbral joins', 'Join threshold'), value: `${cfg.threshold ?? 10} joins / ${(cfg.windowMs ?? 30000) / 1000}s`, inline: true },
            { name: L('Edad mín. cuenta', 'Min account age'), value: `${cfg.minAccountAge ?? 7} días`, inline: true },
            { name: L('Límite canales', 'Channel limit'), value: `${cfg.channelDeleteLimit ?? 3} eliminaciones`, inline: true },
            { name: L('Límite roles', 'Role limit'), value: `${cfg.roleDeleteLimit ?? 3} eliminaciones`, inline: true },
            { name: L('Límite bans', 'Ban limit'), value: `${cfg.banLimit ?? 5} bans`, inline: true },
          )
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }

      // ── CONFIG ──────────────────────────────────────────────────────────────
      if (sub === 'config') {
        const current = getAntiRaidConfig(interaction.guild.id);

        const enabled      = interaction.options.getBoolean('enabled');
        const action       = interaction.options.getString('action')       ?? current.action;
        const threshold    = interaction.options.getInteger('threshold')   ?? current.threshold;
        const windowSec    = interaction.options.getInteger('window')      ?? (current.windowMs / 1000);
        const minAge       = interaction.options.getInteger('min_age')     ?? current.minAccountAge;
        const channelLimit = interaction.options.getInteger('channel_limit') ?? current.channelDeleteLimit;
        const roleLimit    = interaction.options.getInteger('role_limit')  ?? current.roleDeleteLimit;
        const banLimit     = interaction.options.getInteger('ban_limit')   ?? current.banLimit;

        const newCfg = {
          ...current,
          enabled,
          action,
          threshold,
          windowMs:           windowSec * 1000,
          minAccountAge:      minAge,
          channelDeleteLimit: channelLimit,
          roleDeleteLimit:    roleLimit,
          banLimit,
        };

        guildConfig.set(interaction.guild.id, 'antiRaidConfig', newCfg);

        const embed = new EmbedBuilder()
          .setTitle('🛡️ Anti-Raid Configurado')
          .setColor(enabled ? 0x57F287 : 0xED4245)
          .addFields(
            { name: 'Estado', value: enabled ? '✅ Activado' : '❌ Desactivado', inline: true },
            { name: 'Acción', value: action, inline: true },
            { name: 'Umbral joins', value: `${threshold} en ${windowSec}s`, inline: true },
            { name: 'Edad mín. cuenta', value: `${minAge} días`, inline: true },
            { name: 'Límite canales', value: `${channelLimit} eliminaciones/10s`, inline: true },
            { name: 'Límite roles', value: `${roleLimit} eliminaciones/10s`, inline: true },
            { name: 'Límite bans', value: `${banLimit} bans/10s`, inline: true },
          )
          .setFooter({ text: 'Usa /antiraid status para ver el estado en cualquier momento' })
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }

    } catch (err) {
      console.error('[antiraid] Error:', err);
      const msg = { content: `❌ Error interno: \`${err.message}\`` };
      if (interaction.replied || interaction.deferred) return interaction.editReply(msg);
      return interaction.reply({ ...msg, flags: 64 });
    }
  }
};
