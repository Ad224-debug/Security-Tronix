const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nickname')
    .setDescription('Change a user\'s nickname')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
    .addUserOption(o => o.setName('user').setDescription('User to change nickname').setRequired(true))
    .addStringOption(o => o.setName('nickname').setDescription('New nickname (leave empty to reset)').setMaxLength(32)),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const L = (es, en) => lang === 'es' ? es : en;
    const usuario = interaction.options.getUser('user');
    const nickname = interaction.options.getString('nickname');

    try {
      const member = await interaction.guild.members.fetch(usuario.id);

      if (member.roles.highest.position >= interaction.member.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
        return interaction.reply({ content: L('❌ No puedes cambiar el apodo de alguien con un rol igual o superior al tuyo.', '❌ Cannot change nickname of someone with equal or higher role.'), flags: 64 });
      }

      const oldNick = member.nickname || usuario.username;
      await member.setNickname(nickname);

      const embed = new EmbedBuilder()
        .setTitle(L('✏️ Apodo Cambiado', '✏️ Nickname Changed'))
        .setColor(0x3498DB)
        .addFields(
          { name: L('Usuario', 'User'), value: `${usuario}`, inline: true },
          { name: L('Antes', 'Before'), value: oldNick, inline: true },
          { name: L('Después', 'After'), value: nickname || L('Restablecido', 'Reset'), inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      await interaction.reply({ content: '❌ Error al cambiar el apodo.', flags: 64 });
    }
  },
};
