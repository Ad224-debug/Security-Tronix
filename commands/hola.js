const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hello')
    .setDescription('The bot greets you'),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    await interaction.reply(lang === 'es' ? `¡Hola ${interaction.user}! 👋` : `Hello ${interaction.user}! 👋`);
  },
};
