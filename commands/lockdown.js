const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Lock or unlock all text channels in the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Lock or unlock channels')
        .setRequired(true)
        .addChoices(
          { name: 'Lock', value: 'lock' },
          { name: 'Unlock', value: 'unlock' }
        ))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for lockdown')
        .setRequired(false)),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: lang === 'es' ? '❌ Solo administradores pueden usar este comando.' : '❌ Only administrators can use this command.',
        ephemeral: true
      });
    }

    const action = interaction.options.getString('action');
    const razon = interaction.options.getString('reason') || (lang === 'es' ? 'No especificada' : 'Not specified');

    await interaction.deferReply();

    try {
      const channels = interaction.guild.channels.cache.filter(
        channel => channel.type === ChannelType.GuildText
      );

      let successCount = 0;
      let failCount = 0;

      for (const [id, channel] of channels) {
        try {
          await channel.permissionOverwrites.edit(interaction.guild.id, {
            SendMessages: action === 'lock' ? false : null
          });
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Error ${action}ing channel ${channel.name}:`, error);
        }
      }

      const embed = new EmbedBuilder()
        .setTitle(action === 'lock' 
          ? (lang === 'es' ? '🔒 Servidor Bloqueado' : '🔒 Server Locked')
          : (lang === 'es' ? '🔓 Servidor Desbloqueado' : '🔓 Server Unlocked'))
        .setDescription(action === 'lock'
          ? (lang === 'es' ? 'Todos los canales de texto han sido bloqueados.' : 'All text channels have been locked.')
          : (lang === 'es' ? 'Todos los canales de texto han sido desbloqueados.' : 'All text channels have been unlocked.'))
        .addFields(
          { name: lang === 'es' ? '✅ Exitosos' : '✅ Successful', value: `${successCount}`, inline: true },
          { name: lang === 'es' ? '❌ Fallidos' : '❌ Failed', value: `${failCount}`, inline: true },
          { name: lang === 'es' ? '👮 Moderador' : '👮 Moderator', value: `${interaction.user}`, inline: true },
          { name: lang === 'es' ? '📝 Razón' : '📝 Reason', value: razon, inline: false }
        )
        .setColor(action === 'lock' ? 0xED4245 : 0x57F287)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en lockdown:', error);
      await interaction.editReply({
        content: lang === 'es' ? '❌ Hubo un error al ejecutar el lockdown.' : '❌ There was an error executing the lockdown.',
      });
    }
  },
};
