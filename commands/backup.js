const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const BackupSystem = require('../backup-system');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Gestionar backups del bot / Manage bot backups')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('create')
        .setDescription('Crear un backup / Create a backup'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('Listar backups disponibles / List available backups'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('restore')
        .setDescription('Restaurar un backup / Restore a backup')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('Nombre del backup / Backup name')
            .setRequired(true)
            .setAutocomplete(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Eliminar un backup / Delete a backup')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('Nombre del backup / Backup name')
            .setRequired(true)
            .setAutocomplete(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('cleanup')
        .setDescription('Limpiar backups antiguos / Clean up old backups')
        .addIntegerOption(option =>
          option.setName('days')
            .setDescription('Días a mantener / Days to keep')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(365))),

  async autocomplete(interaction) {
    const backupSystem = new BackupSystem(interaction.client);
    const backups = backupSystem.listBackups();
    
    const choices = backups.map(backup => ({
      name: `${backup.name} (${new Date(backup.timestamp).toLocaleString()})`,
      value: backup.name
    })).slice(0, 25); // Discord limita a 25 opciones

    await interaction.respond(choices);
  },

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const subcommand = interaction.options.getSubcommand();

    // Solo el owner puede usar este comando
    if (interaction.user.id !== interaction.guild.ownerId) {
      return await interaction.reply({
        content: lang === 'es' 
          ? '❌ Solo el dueño del servidor puede usar este comando.'
          : '❌ Only the server owner can use this command.',
        ephemeral: true
      });
    }

    const backupSystem = new BackupSystem(interaction.client);

    switch (subcommand) {
      case 'create':
        await interaction.deferReply({ ephemeral: true });

        const createResult = await backupSystem.createBackup(interaction.guild.id);

        if (createResult.success) {
          const embed = new EmbedBuilder()
            .setTitle(lang === 'es' ? '✅ Backup Creado' : '✅ Backup Created')
            .setDescription(lang === 'es'
              ? `Se ha creado un backup exitosamente.`
              : `A backup has been created successfully.`)
            .setColor(0x57F287)
            .addFields(
              { name: lang === 'es' ? '📦 Nombre' : '📦 Name', value: `\`${createResult.backupName}\``, inline: false },
              { name: lang === 'es' ? '📁 Archivos' : '📁 Files', value: `\`${createResult.files}\``, inline: true },
              { name: lang === 'es' ? '📅 Fecha' : '📅 Date', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
            )
            .setFooter({ text: lang === 'es' ? 'Usa /backup restore para restaurar' : 'Use /backup restore to restore' })
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });
        } else {
          await interaction.editReply({
            content: lang === 'es'
              ? `❌ Error al crear backup: ${createResult.error}`
              : `❌ Error creating backup: ${createResult.error}`
          });
        }
        break;

      case 'list':
        const backups = backupSystem.listBackups();

        if (backups.length === 0) {
          return await interaction.reply({
            content: lang === 'es' ? '📭 No hay backups disponibles.' : '📭 No backups available.',
            ephemeral: true
          });
        }

        const listEmbed = new EmbedBuilder()
          .setTitle(lang === 'es' ? '📦 Backups Disponibles' : '📦 Available Backups')
          .setDescription(backups.slice(0, 10).map((backup, index) => {
            const date = new Date(backup.timestamp).toLocaleString();
            const size = backupSystem.formatSize(backup.size);
            return `**${index + 1}.** \`${backup.name}\`\n📅 ${date} • 📁 ${backup.files.length} archivos • 💾 ${size}`;
          }).join('\n\n'))
          .setColor(0x5865F2)
          .setFooter({ text: lang === 'es' ? `Total: ${backups.length} backups` : `Total: ${backups.length} backups` })
          .setTimestamp();

        await interaction.reply({ embeds: [listEmbed], ephemeral: true });
        break;

      case 'restore':
        const backupName = interaction.options.getString('name');

        await interaction.deferReply({ ephemeral: true });

        const restoreResult = await backupSystem.restoreBackup(backupName);

        if (restoreResult.success) {
          const embed = new EmbedBuilder()
            .setTitle(lang === 'es' ? '✅ Backup Restaurado' : '✅ Backup Restored')
            .setDescription(lang === 'es'
              ? `El backup ha sido restaurado exitosamente.\n\n⚠️ **Importante:** Reinicia el bot para aplicar los cambios.`
              : `The backup has been restored successfully.\n\n⚠️ **Important:** Restart the bot to apply changes.`)
            .setColor(0x57F287)
            .addFields(
              { name: lang === 'es' ? '📦 Backup' : '📦 Backup', value: `\`${backupName}\``, inline: false },
              { name: lang === 'es' ? '📁 Archivos Restaurados' : '📁 Files Restored', value: `\`${restoreResult.files}\``, inline: true },
              { name: lang === 'es' ? '📅 Fecha del Backup' : '📅 Backup Date', value: `<t:${Math.floor(restoreResult.metadata.timestamp / 1000)}:F>`, inline: true }
            )
            .setTimestamp();

          await interaction.editReply({ embeds: [embed] });
        } else {
          await interaction.editReply({
            content: lang === 'es'
              ? `❌ Error al restaurar backup: ${restoreResult.error}`
              : `❌ Error restoring backup: ${restoreResult.error}`
          });
        }
        break;

      case 'delete':
        const deleteBackupName = interaction.options.getString('name');

        const deleteResult = backupSystem.deleteBackup(deleteBackupName);

        if (deleteResult.success) {
          await interaction.reply({
            embeds: [{
              title: lang === 'es' ? '🗑️ Backup Eliminado' : '🗑️ Backup Deleted',
              description: lang === 'es'
                ? `El backup \`${deleteBackupName}\` ha sido eliminado.`
                : `Backup \`${deleteBackupName}\` has been deleted.`,
              color: 0xED4245,
              timestamp: new Date()
            }],
            ephemeral: true
          });
        } else {
          await interaction.reply({
            content: lang === 'es'
              ? `❌ Error al eliminar backup: ${deleteResult.error}`
              : `❌ Error deleting backup: ${deleteResult.error}`,
            ephemeral: true
          });
        }
        break;

      case 'cleanup':
        const days = interaction.options.getInteger('days') || 30;

        await interaction.deferReply({ ephemeral: true });

        const cleanupResult = backupSystem.cleanupOldBackups(days);

        if (cleanupResult.success) {
          await interaction.editReply({
            embeds: [{
              title: lang === 'es' ? '🧹 Limpieza Completada' : '🧹 Cleanup Completed',
              description: lang === 'es'
                ? `Se eliminaron ${cleanupResult.deleted} backups con más de ${days} días de antigüedad.`
                : `Deleted ${cleanupResult.deleted} backups older than ${days} days.`,
              color: 0x57F287,
              timestamp: new Date()
            }]
          });
        } else {
          await interaction.editReply({
            content: lang === 'es'
              ? `❌ Error en limpieza: ${cleanupResult.error}`
              : `❌ Cleanup error: ${cleanupResult.error}`
          });
        }
        break;
    }
  },
};
