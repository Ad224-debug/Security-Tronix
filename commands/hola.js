module.exports = {
  data: {
    name: 'hello',
    description: 'The bot greets you',
  },
  async execute(interaction) {
    const getText = (key) => interaction.client.getText(interaction.guild.id, key);
    const lang = interaction.client.getLanguage(interaction.guild.id);
    
    const greeting = lang === 'es' 
      ? `¡Hola ${interaction.user.username}!`
      : `Hello ${interaction.user.username}!`;
    
    await interaction.reply(greeting);
  },
};
