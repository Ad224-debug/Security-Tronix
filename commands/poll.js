const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Creates a poll with multiple options')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('The poll question')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('option1')
        .setDescription('First option')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('option2')
        .setDescription('Second option')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('option3')
        .setDescription('Third option')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('option4')
        .setDescription('Fourth option')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('option5')
        .setDescription('Fifth option')
        .setRequired(false)),
  async execute(interaction) {
    const getText = (key) => interaction.client.getText(interaction.guild.id, key);
    const lang = interaction.client.getLanguage(interaction.guild.id);

    const question = interaction.options.getString('question');
    const options = [
      interaction.options.getString('option1'),
      interaction.options.getString('option2'),
      interaction.options.getString('option3'),
      interaction.options.getString('option4'),
      interaction.options.getString('option5'),
    ].filter(opt => opt !== null);

    const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
    
    const optionsText = options.map((opt, index) => `${emojis[index]} ${opt}`).join('\n');

    const embed = new EmbedBuilder()
      .setTitle(getText('poll_created'))
      .setDescription(`**${getText('poll_question')}:** ${question}\n\n**${getText('poll_options')}:**\n${optionsText}`)
      .setColor(0x5865F2)
      .setFooter({ text: getText('poll_vote') })
      .setTimestamp();

    const message = await interaction.reply({ embeds: [embed], fetchReply: true });

    for (let i = 0; i < options.length; i++) {
      await message.react(emojis[i]);
    }
  },
};
