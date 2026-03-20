const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { unlockGuild, getRaidState, getAntiRaidConfig } = require('../antiraid-system');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antiraid')
    .setDescription('Gestionar el sistema anti-raid')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(s => s.setName('unlock').setDescription('Levantar el lockdown manualmente'))
    .addSubcommand(s => s.setName('status').setDescription('Ver estado actual del anti-raid')),

  async execute(interaction) {
    const sub  = interaction.options.getSubcommand();
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const L    = (es, en) => lang === 'es' ? es : en;

    const sendLog = (guild, embed) => interaction.client.sendLog(guild, embed);

    if (sub === 'unlock') {
      const state = getRaidState(interaction.guild.id);
      if (!state.active) {
        return interaction.reply({ content: L('ℹ️ No hay ningún lockdown activo.', 'ℹ️ No active lockdown.'), ephemeral: true });
      }
      await interaction.deferReply({ ephemeral: true });
      const ok = await unlockGuild(interaction.guild, sendLog, 'manual');
      return interaction.editReply({ content: ok
        ? L('✅ Lockdown levantado correctamente.', '✅ Lockdown lifted successfully.')
        : L('❌ No se pudo levantar el lockdown.', '❌ Could not lift the lockdown.')
      });
    }

    if (sub === 'status') {
      const state = getRaidState(interaction.guild.id);
      const cfg   = getAntiRaidConfig(interaction.guild.id);

      const embed = new EmbedBuilder()
        .setTitle(L('🛡️ Estado Anti-Raid', '🛡️ Anti-Raid Status'))
        .setColor(state.active ? 0xFF0000 : cfg.enabled ? 0x57F287 : 0x99AAB5)
        .addFields(
          { name: L('Sistema', 'System'), value: cfg.enabled ? '✅ Activo' : '❌ Inactivo', inline: true },
          { name: L('Lockdown', 'Lockdown'), value: state.active ? '🔒 En curso' : '🔓 Sin lockdown', inline: true },
          { name: L('Canales bloqueados', 'Locked channels'), value: `${state.lockedChannels.length}`, inline: true },
          { name: L('Umbral', 'Threshold'), value: `${cfg.threshold} joins / ${cfg.windowMs / 1000}s`, inline: true },
          { name: L('Acción', 'Action'), value: cfg.action, inline: true },
          { name: L('Edad mín. cuenta', 'Min account age'), value: `${cfg.minAccountAge} días`, inline: true },
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};
