const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: {
    name: 'warnings',
    description: 'Shows user warnings',
    options: [
      {
        name: 'user',
        description: 'User to check warnings',
        type: 6, // USER type
        required: true,
      },
    ],
  },
  async execute(interaction) {
    const getText = (key) => interaction.client.getText(interaction.guild.id, key);

    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return await interaction.reply({
        content: getText('no_permission'),
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

    if (userWarnings.length === 0) {
      return await interaction.reply({
        content: getText('no_warnings'),
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`${getText('warn_list')} - ${usuario.username}`)
      .setThumbnail(usuario.displayAvatarURL())
      .setColor(0xFEE75C)
      .setDescription(`${getText('total_warnings')}: ${userWarnings.length}`)
      .setTimestamp();

    userWarnings.slice(-10).forEach((warn, index) => {
      embed.addFields({
        name: `${getText('warnings')} #${index + 1}`,
        value: `**${getText('afk_reason')}:** ${warn.reason}\n**${getText('moderator')}:** <@${warn.moderator}>\n**Fecha:** <t:${Math.floor(warn.timestamp / 1000)}:R>`,
      });
    });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
