module.exports = {
  data: {
    name: 'avatar',
    description: 'Shows a user avatar',
    options: [
      {
        name: 'user',
        description: 'The user whose avatar you want to see',
        type: 6, // USER type
        required: false,
      },
    ],
  },
  async execute(interaction) {
    const user = interaction.options.getUser('user') || interaction.user;
    const lang = interaction.client.getLanguage(interaction.guild.id);
    
    const text = lang === 'es' ? `Avatar de ${user.username}:` : `${user.username}'s avatar:`;
    
    await interaction.reply({
      content: text,
      embeds: [{
        image: { url: user.displayAvatarURL({ size: 512 }) },
        color: 0x5865F2,
      }]
    });
  },
};
