const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('View moderation history of a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to check history')
        .setRequired(true)),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return await interaction.reply({
        content: lang === 'es' ? '❌ Solo administradores pueden usar este comando.' : '❌ Only administrators can use this command.',
        ephemeral: true
      });
    }

    const usuario = interaction.options.getUser('user');
    const warningsPath = path.join(__dirname, '../warnings.json');
    
    let warnings = {};
    if (fs.existsSync(warningsPath)) {
      warnings = JSON.parse(fs.readFileSync(warningsPath, 'utf8'));
    }

    const key = `${interaction.guild.id}-${usuario.id}`;
    const userWarnings = warnings[key] || [];

    const embed = new EmbedBuilder()
      .setTitle(lang === 'es' ? `📋 Historial de Moderación` : `📋 Moderation History`)
      .setDescription(`**${usuario.tag}** (${usuario.id})`)
      .setThumbnail(usuario.displayAvatarURL({ dynamic: true }))
      .setColor(0x5865F2)
      .setTimestamp();

    if (userWarnings.length === 0) {
      embed.addFields({
        name: lang === 'es' ? '✅ Sin advertencias' : '✅ No warnings',
        value: lang === 'es' ? 'Este usuario no tiene advertencias registradas.' : 'This user has no recorded warnings.'
      });
    } else {
      embed.addFields({
        name: lang === 'es' ? `⚠️ Total de Advertencias: ${userWarnings.length}` : `⚠️ Total Warnings: ${userWarnings.length}`,
        value: '\u200b'
      });

      // Mostrar las últimas 10 advertencias
      const recentWarnings = userWarnings.slice(-10).reverse();
      
      recentWarnings.forEach((warn, index) => {
        const moderator = interaction.guild.members.cache.get(warn.moderator);
        const modName = moderator ? moderator.user.tag : 'Moderador Desconocido';
        const date = new Date(warn.timestamp);
        const timestamp = Math.floor(date.getTime() / 1000);

        embed.addFields({
          name: `${lang === 'es' ? 'Advertencia' : 'Warning'} #${userWarnings.length - index}`,
          value: `**${lang === 'es' ? 'Razón' : 'Reason'}:** ${warn.reason}\n**${lang === 'es' ? 'Moderador' : 'Moderator'}:** ${modName}\n**${lang === 'es' ? 'Fecha' : 'Date'}:** <t:${timestamp}:R>`,
          inline: false
        });
      });

      if (userWarnings.length > 10) {
        embed.setFooter({ 
          text: lang === 'es' 
            ? `Mostrando las 10 advertencias más recientes de ${userWarnings.length}` 
            : `Showing 10 most recent warnings of ${userWarnings.length}`
        });
      }
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
