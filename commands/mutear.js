const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute a user in this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName('user').setDescription('User to mute').setRequired(true))
    .addStringOption(o => o.setName('reason').setDescription('Reason for the mute')),

  async execute(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const L = (es, en) => lang === 'es' ? es : en;
    const usuario = interaction.options.getUser('user');
    const razon = interaction.options.getString('reason') || L('No especificada', 'Not specified');

    const miembro = await interaction.guild.members.fetch(usuario.id).catch(() => null);
    if (!miembro) {
      return interaction.reply({ content: L('❌ No se encontró ese usuario.', '❌ User not found.'), ephemeral: true });
    }

    try {
      // Aplicar overwrite de canal
      await interaction.channel.permissionOverwrites.create(miembro, { SendMessages: false });

      // Buscar rol "Muted" por nombre si existe
      const mutedRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === 'muted');
      if (mutedRole) await miembro.roles.add(mutedRole).catch(() => {});

      await interaction.reply({
        embeds: [{
          title: L('🔇 Usuario Muteado', '🔇 User Muted'),
          description: L(`${usuario} ha sido muteado en este canal.`, `${usuario} has been muted in this channel.`),
          fields: [
            { name: L('Razón', 'Reason'), value: razon, inline: true },
            { name: L('Moderador', 'Moderator'), value: `${interaction.user}`, inline: true },
          ],
          color: 0xED4245,
          timestamp: new Date(),
        }],
      });
    } catch (error) {
      console.error('Error en mute:', error);
      await interaction.reply({ content: '❌ Error al mutear al usuario.', ephemeral: true });
    }
  },
};
