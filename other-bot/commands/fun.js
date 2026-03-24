const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const hugGifs = ['https://media.tenor.com/SYsRdiK-T7gAAAAC/hug-anime.gif','https://media.tenor.com/tbzuQSodu58AAAAC/oshi-no-ko-onk.gif','https://media.tenor.com/7oCaSR-q1kkAAAAC/alice-vt.gif','https://media.tenor.com/J7eGDvGeP9IAAAAC/enage-kiss-anime-hug.gif'];
const kissGifs = ['https://media.tenor.com/cQzRWAWrN6kAAAAC/ichigo-hiro.gif','https://media.tenor.com/WA9iLncZE5MAAAAC/girls-love.gif','https://media.tenor.com/cbIOD1pMlEQAAAAC/mst.gif','https://media.tenor.com/L-NTpww8HTUAAAAC/kiss-anime-anime-kiss.gif'];
const patGifs = ['https://media.tenor.com/rtHwrLRPlAkAAAAC/class-no-daikirai.gif','https://media.tenor.com/MDc4TSck5PQAAAAC/frieren-anime.gif','https://media.tenor.com/TJfdUVQ-7MgAAAAC/spyxfamily-anya-forger.gif'];
const slapGifs = ['https://media.tenor.com/eU5H6GbVjrcAAAAC/slap-jjk.gif','https://media.tenor.com/Ws6Dm1ZW_vMAAAAC/girl-slap.gif','https://media.tenor.com/nVvUhW4FBxcAAAAC/slap.gif'];
const cryGifs = ['https://media.giphy.com/media/ROF8OQvDmxytW/giphy.gif','https://media.giphy.com/media/d2lcHJTG5Tscg/giphy.gif','https://media.giphy.com/media/L95W4wv8nnb9K/giphy.gif'];
const danceGifs = ['https://media.tenor.com/g3T6Du7fTnoAAAAC/dance-moves.gif','https://media.tenor.com/cfLmJVoxuw0AAAAC/dog-dance.gif','https://media.tenor.com/y8XLIk_9IWUAAAAC/black-kid-blue-shirt-dancing.gif'];
const rejectGifs = ['https://media.tenor.com/-DlZlNxVMnIAAAAC/hmpf.gif','https://media.tenor.com/fMSMIlEjSoMAAAAC/refuse-head-shake.gif'];

const rand = arr => arr[Math.floor(Math.random() * arr.length)];

// AFK storage
if (!global.afkUsers) global.afkUsers = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fun')
    .setDescription('Comandos de diversión')
    .addSubcommand(s => s.setName('hug').setDescription('Abrazar a alguien').addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)))
    .addSubcommand(s => s.setName('kiss').setDescription('Besar a alguien').addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)))
    .addSubcommand(s => s.setName('pat').setDescription('Acariciar a alguien').addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)))
    .addSubcommand(s => s.setName('slap').setDescription('Abofetear a alguien').addUserOption(o => o.setName('user').setDescription('Usuario').setRequired(true)))
    .addSubcommand(s => s.setName('cry').setDescription('Mostrar que estás llorando'))
    .addSubcommand(s => s.setName('dance').setDescription('Bailar').addUserOption(o => o.setName('user').setDescription('Bailar con alguien')))
    .addSubcommand(s => s.setName('afk').setDescription('Activar modo AFK').addStringOption(o => o.setName('reason').setDescription('Razón')))
    .addSubcommand(s => s.setName('poll').setDescription('Crear una encuesta')
      .addStringOption(o => o.setName('question').setDescription('Pregunta').setRequired(true))
      .addStringOption(o => o.setName('option1').setDescription('Opción 1').setRequired(true))
      .addStringOption(o => o.setName('option2').setDescription('Opción 2').setRequired(true))
      .addStringOption(o => o.setName('option3').setDescription('Opción 3'))
      .addStringOption(o => o.setName('option4').setDescription('Opción 4'))
      .addStringOption(o => o.setName('option5').setDescription('Opción 5'))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const L = (es, en) => lang === 'es' ? es : en;

    // ── HUG ──────────────────────────────────────────────────────────────────
    if (sub === 'hug') {
      const usuario = interaction.options.getUser('user');
      if (usuario.id === interaction.user.id) return interaction.reply({ content: L('❌ No puedes abrazarte a ti mismo.', '❌ Cannot hug yourself.'), flags: 64 });
      const gif = rand(hugGifs);
      const desc = L(`🤗💕 **${interaction.user.username}** abrazó a **${usuario.username}**! ¡Qué tierno! ✨`, `🤗💕 **${interaction.user.username}** hugged **${usuario.username}**! So sweet! ✨`);
      const embed = new EmbedBuilder().setDescription(desc).setImage(gif).setColor(0xFF69B4).setTimestamp();
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`fun_hug_accept_${interaction.user.id}_${usuario.id}`).setLabel(L('🤗 Devolver abrazo','🤗 Hug back')).setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`fun_hug_reject_${interaction.user.id}_${usuario.id}`).setLabel(L('❌ Rechazar','❌ Reject')).setStyle(ButtonStyle.Danger)
      );
      return interaction.reply({ embeds: [embed], components: [row], allowedMentions: { users: [] } });
    }

    // ── KISS ─────────────────────────────────────────────────────────────────
    if (sub === 'kiss') {
      const usuario = interaction.options.getUser('user');
      if (usuario.id === interaction.user.id) return interaction.reply({ content: L('❌ No puedes besarte a ti mismo.', '❌ Cannot kiss yourself.'), flags: 64 });
      const gif = rand(kissGifs);
      const desc = L(`😘💕 **${interaction.user.username}** besó a **${usuario.username}**! ¡Qué romántico! ✨`, `😘💕 **${interaction.user.username}** kissed **${usuario.username}**! How romantic! ✨`);
      const embed = new EmbedBuilder().setDescription(desc).setImage(gif).setColor(0xFF1493).setTimestamp();
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`fun_kiss_accept_${interaction.user.id}_${usuario.id}`).setLabel(L('😘 Devolver beso','😘 Kiss back')).setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`fun_kiss_reject_${interaction.user.id}_${usuario.id}`).setLabel(L('❌ Rechazar','❌ Reject')).setStyle(ButtonStyle.Danger)
      );
      return interaction.reply({ embeds: [embed], components: [row], allowedMentions: { users: [] } });
    }

    // ── PAT ──────────────────────────────────────────────────────────────────
    if (sub === 'pat') {
      const usuario = interaction.options.getUser('user');
      if (usuario.id === interaction.user.id) return interaction.reply({ content: L('❌ No puedes acariciarte a ti mismo.', '❌ Cannot pat yourself.'), flags: 64 });
      const desc = L(`✨ **${interaction.user.username}** acarició a **${usuario.username}**! 🥰`, `✨ **${interaction.user.username}** patted **${usuario.username}**! 🥰`);
      return interaction.reply({ embeds: [new EmbedBuilder().setDescription(desc).setImage(rand(patGifs)).setColor(0xFFB6C1).setTimestamp()], allowedMentions: { users: [] } });
    }

    // ── SLAP ─────────────────────────────────────────────────────────────────
    if (sub === 'slap') {
      const usuario = interaction.options.getUser('user');
      if (usuario.id === interaction.user.id) return interaction.reply({ content: L('❌ No puedes abofetearte.', '❌ Cannot slap yourself.'), flags: 64 });
      const desc = L(`💥 **${interaction.user.username}** abofeteó a **${usuario.username}**! 😤`, `💥 **${interaction.user.username}** slapped **${usuario.username}**! 😤`);
      const embed = new EmbedBuilder().setDescription(desc).setImage(rand(slapGifs)).setColor(0xFF4500).setTimestamp();
      const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`fun_slap_revenge_${interaction.user.id}_${usuario.id}`).setLabel(L('😤 Devolver','😤 Slap back')).setStyle(ButtonStyle.Danger));
      return interaction.reply({ embeds: [embed], components: [row], allowedMentions: { users: [] } });
    }

    // ── CRY ──────────────────────────────────────────────────────────────────
    if (sub === 'cry') {
      const desc = L(`😢💔 **${interaction.user.username}** está llorando... ¡Alguien dele un abrazo! 🥺`, `😢💔 **${interaction.user.username}** is crying... Someone give them a hug! 🥺`);
      return interaction.reply({ embeds: [new EmbedBuilder().setDescription(desc).setImage(rand(cryGifs)).setColor(0x4682B4).setTimestamp()], allowedMentions: { users: [] } });
    }

    // ── DANCE ────────────────────────────────────────────────────────────────
    if (sub === 'dance') {
      const usuario = interaction.options.getUser('user');
      const desc = usuario
        ? L(`💃🕺 **${interaction.user.username}** está bailando con **${usuario.username}**! 🎵`, `💃🕺 **${interaction.user.username}** is dancing with **${usuario.username}**! 🎵`)
        : L(`💃✨ **${interaction.user.username}** está bailando como si nadie mirara! 🎵`, `💃✨ **${interaction.user.username}** is dancing like nobody's watching! 🎵`);
      return interaction.reply({ embeds: [new EmbedBuilder().setDescription(desc).setImage(rand(danceGifs)).setColor(0x9370DB).setTimestamp()], allowedMentions: { users: [] } });
    }

    // ── AFK ──────────────────────────────────────────────────────────────────
    if (sub === 'afk') {
      const reason = interaction.options.getString('reason') || L('No especificada', 'Not specified');
      global.afkUsers.set(interaction.user.id, { reason, timestamp: Date.now(), guildId: interaction.guild.id });
      try {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const currentNick = member.nickname || member.user.username;
        if (!currentNick.startsWith('[AFK] ')) await member.setNickname(`[AFK] ${currentNick}`.substring(0, 32)).catch(() => {});
      } catch {}
      return interaction.reply({ embeds: [new EmbedBuilder().setTitle(L('💤 AFK Activado','💤 AFK Activated')).addFields({ name: L('Razón','Reason'), value: reason }, { name: L('Nota','Note'), value: L('Escribe cualquier mensaje para desactivar.','Send any message to deactivate.') }).setColor(0x5865F2).setTimestamp()] });
    }

    // ── POLL ─────────────────────────────────────────────────────────────────
    if (sub === 'poll') {
      const question = interaction.options.getString('question');
      const options = [1,2,3,4,5].map(i => interaction.options.getString(`option${i}`)).filter(Boolean);
      const emojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣'];
      const optionsText = options.map((opt, i) => `${emojis[i]} ${opt}`).join('\n');
      const embed = new EmbedBuilder().setTitle(L('📊 Encuesta','📊 Poll')).setDescription(`**${question}**\n\n${optionsText}`).setColor(0x5865F2).setFooter({ text: L('Reacciona para votar','React to vote') }).setTimestamp();
      const message = await interaction.reply({ embeds: [embed], fetchReply: true });
      for (let i = 0; i < options.length; i++) await message.react(emojis[i]);
      return;
    }
  },

  // Handler for fun buttons (called from index.js)
  async handleButton(interaction) {
    const lang = interaction.client.getLanguage(interaction.guild.id);
    const L = (es, en) => lang === 'es' ? es : en;
    const parts = interaction.customId.split('_');
    // fun_hug_accept_senderId_targetId
    const action = parts[1]; // hug, kiss, slap
    const type = parts[2];   // accept, reject, revenge
    const senderId = parts[3];
    const targetId = parts[4];

    if (interaction.user.id !== targetId && type !== 'revenge') return interaction.reply({ content: L('❌ Este botón no es para ti.', '❌ This button is not for you.'), flags: 64 });
    if (type === 'revenge' && interaction.user.id !== targetId) return interaction.reply({ content: L('❌ Este botón no es para ti.', '❌ This button is not for you.'), flags: 64 });

    const sender = await interaction.client.users.fetch(senderId).catch(() => null);
    const target = await interaction.client.users.fetch(targetId).catch(() => null);

    if (action === 'hug') {
      if (type === 'accept') {
        const desc = L(`💕✨ **${target?.username}** devolvió el abrazo a **${sender?.username}**! 🥰`, `💕✨ **${target?.username}** hugged **${sender?.username}** back! 🥰`);
        return interaction.update({ embeds: [...interaction.message.embeds, new EmbedBuilder().setDescription(desc).setImage(rand(hugGifs)).setColor(0xFF1493).setTimestamp()], components: [], allowedMentions: { users: [] } });
      } else {
        const desc = L(`💔 **${target?.username}** rechazó el abrazo de **${sender?.username}**... 😢`, `💔 **${target?.username}** rejected **${sender?.username}**'s hug... 😢`);
        return interaction.update({ embeds: [...interaction.message.embeds, new EmbedBuilder().setDescription(desc).setImage(rand(rejectGifs)).setColor(0x808080).setTimestamp()], components: [], allowedMentions: { users: [] } });
      }
    }
    if (action === 'kiss') {
      if (type === 'accept') {
        const desc = L(`💋💕 **${target?.username}** devolvió el beso a **${sender?.username}**! 😍`, `💋💕 **${target?.username}** kissed **${sender?.username}** back! 😍`);
        return interaction.update({ embeds: [...interaction.message.embeds, new EmbedBuilder().setDescription(desc).setImage(rand(kissGifs)).setColor(0xFF69B4).setTimestamp()], components: [], allowedMentions: { users: [] } });
      } else {
        const desc = L(`💔 **${target?.username}** rechazó el beso de **${sender?.username}**... 😢`, `💔 **${target?.username}** rejected **${sender?.username}**'s kiss... 😢`);
        return interaction.update({ embeds: [...interaction.message.embeds, new EmbedBuilder().setDescription(desc).setImage(rand(rejectGifs)).setColor(0x808080).setTimestamp()], components: [], allowedMentions: { users: [] } });
      }
    }
    if (action === 'slap' && type === 'revenge') {
      const desc = L(`💥💢 **${target?.username}** devolvió la cachetada a **${sender?.username}**! 😈`, `💥💢 **${target?.username}** slapped **${sender?.username}** back! 😈`);
      return interaction.update({ embeds: [...interaction.message.embeds, new EmbedBuilder().setDescription(desc).setImage(rand(slapGifs)).setColor(0xDC143C).setTimestamp()], components: [], allowedMentions: { users: [] } });
    }
  }
};
