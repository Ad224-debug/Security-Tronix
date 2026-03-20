const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Muestra el avatar de un usuario')
    .addUserOption(o => o.setName('user').setDescription('Usuario (por defecto: tú)')),

  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    const avatarUrl = user.displayAvatarURL({ size: 1024, extension: 'png' });
    const serverAvatarUrl = member?.displayAvatarURL({ size: 1024, extension: 'png' });

    const embed = new EmbedBuilder()
      .setTitle(lang === 'es' ? `Avatar de ${user.username}` : `${user.username}'s avatar`)
      .setImage(avatarUrl)
      .setColor(0x5865F2)
      .setTimestamp();

    if (serverAvatarUrl && serverAvatarUrl !== avatarUrl) {
      embed.setDescription(lang === 'es'
        ? `[Avatar global](${avatarUrl}) • [Avatar del servidor](${serverAvatarUrl})`
        : `[Global avatar](${avatarUrl}) • [Server avatar](${serverAvatarUrl})`);
      embed.setImage(serverAvatarUrl);
    } else {
      embed.setDescription(`[PNG](${avatarUrl}) • [WebP](${user.displayAvatarURL({ size: 1024, extension: 'webp' })})`);
    }

    await interaction.reply({ embeds: [embed] });
  },
};
