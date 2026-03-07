const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sync')
    .setDescription('Sincroniza los comandos slash del bot (Owner only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option.setName('scope')
        .setDescription('Ámbito de sincronización')
        .setRequired(false)
        .addChoices(
          { name: 'Este servidor (rápido)', value: 'guild' },
          { name: 'Global (puede tardar hasta 1 hora)', value: 'global' }
        )),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);

    // Solo el owner puede usar este comando
    if (interaction.user.id !== interaction.guild.ownerId) {
      return await interaction.reply({
        content: lang === 'es' 
          ? '❌ Solo el dueño del servidor puede usar este comando.'
          : '❌ Only the server owner can use this command.',
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const scope = interaction.options.getString('scope') || 'guild';
      
      // Cargar todos los comandos
      const commands = [];
      const commandsPath = path.join(__dirname);
      const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

      for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        // Limpiar cache para obtener la versión más reciente
        delete require.cache[require.resolve(filePath)];
        const command = require(filePath);
        if (command.data) {
          commands.push(command.data);
        }
      }

      const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

      const startEmbed = new EmbedBuilder()
        .setTitle('🔄 Sincronizando Comandos')
        .setDescription(lang === 'es'
          ? `Sincronizando ${commands.length} comandos...\n\n**Ámbito:** ${scope === 'guild' ? 'Este servidor' : 'Global'}`
          : `Syncing ${commands.length} commands...\n\n**Scope:** ${scope === 'guild' ? 'This server' : 'Global'}`)
        .setColor(0xFFA500)
        .setTimestamp();

      await interaction.editReply({ embeds: [startEmbed] });

      if (scope === 'guild') {
        // Sincronización por servidor (instantánea)
        await rest.put(
          Routes.applicationGuildCommands(interaction.client.user.id, interaction.guild.id),
          { body: commands }
        );
      } else {
        // Sincronización global (puede tardar hasta 1 hora)
        await rest.put(
          Routes.applicationCommands(interaction.client.user.id),
          { body: commands }
        );
      }

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ Comandos Sincronizados')
        .setDescription(lang === 'es'
          ? `Se sincronizaron **${commands.length}** comandos exitosamente.\n\n**Ámbito:** ${scope === 'guild' ? 'Este servidor (cambios inmediatos)' : 'Global (puede tardar hasta 1 hora)'}`
          : `Successfully synced **${commands.length}** commands.\n\n**Scope:** ${scope === 'guild' ? 'This server (immediate changes)' : 'Global (may take up to 1 hour)'}`)
        .setColor(0x57F287)
        .addFields(
          { name: lang === 'es' ? '📊 Total de comandos' : '📊 Total commands', value: `${commands.length}`, inline: true },
          { name: lang === 'es' ? '⚡ Sincronizado por' : '⚡ Synced by', value: `${interaction.user.tag}`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
      console.error('Error syncing commands:', error);

      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Error al Sincronizar')
        .setDescription(lang === 'es'
          ? `Hubo un error al sincronizar los comandos:\n\`\`\`${error.message}\`\`\``
          : `There was an error syncing commands:\n\`\`\`${error.message}\`\`\``)
        .setColor(0xED4245)
        .setTimestamp();

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};
