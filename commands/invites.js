const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: 'invites',
    description: 'Show server invites and their usage',
  },
  async execute(interaction) {
    try {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
        const lang = interaction.client.getLanguage(interaction.guild.id);
        const msg = lang === 'es' 
          ? '❌ No tienes permisos para ver las invitaciones.'
          : '❌ You don\'t have permission to view invites.';
        return await interaction.reply({
          content: msg,
          ephemeral: true
        });
      }

      const lang = interaction.client.getLanguage(interaction.guild.id);
      const invites = await interaction.guild.invites.fetch();

      if (invites.size === 0) {
        const msg = lang === 'es'
          ? '❌ No hay invitaciones activas en este servidor.'
          : '❌ There are no active invites in this server.';
        return await interaction.reply({
          content: msg,
          ephemeral: true
        });
      }

      const title = lang === 'es' ? '📨 Invitaciones del Servidor' : '📨 Server Invites';
      const inviterField = lang === 'es' ? 'Creador' : 'Inviter';
      const usesField = lang === 'es' ? 'Usos' : 'Uses';
      const codeField = lang === 'es' ? 'Código' : 'Code';

      const inviteList = invites.map(invite => {
        const uses = invite.uses || 0;
        const maxUses = invite.maxUses || '∞';
        const inviter = invite.inviter?.tag || 'Desconocido';
        return `**${codeField}:** \`${invite.code}\` | **${inviterField}:** ${inviter} | **${usesField}:** ${uses}/${maxUses}`;
      }).join('\n');

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(inviteList)
        .setColor(0x5865F2)
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error en comando invites:', error);
      await interaction.reply({
        content: '❌ Hubo un error al ejecutar este comando.',
        ephemeral: true
      }).catch(console.error);
    }
  },
};
