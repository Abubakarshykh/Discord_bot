const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.json');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {

    // ✅ 1. Assign Unverified role
    const unverifiedRole = member.guild.roles.cache.get(process.env.UNVERIFIED_ROLE_ID);
    if (unverifiedRole) {
      await member.roles.add(unverifiedRole).catch(console.error);
    }

    // ✅ 2. Send verification message in verification channel
    const verificationChannel = member.guild.channels.cache.get(process.env.VERIFICATION_CHANNEL_ID);
    if (!verificationChannel) return;

    // Generate emoji captcha
    const emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯'];
    const correctEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    const wrongEmojis = emojis.filter(e => e !== correctEmoji).sort(() => Math.random() - 0.5).slice(0, 3);
    const allEmojis = [correctEmoji, ...wrongEmojis].sort(() => Math.random() - 0.5);

    // Store correct answer temporarily
    if (!member.client.captchaAnswers) member.client.captchaAnswers = new Map();
    member.client.captchaAnswers.set(member.id, correctEmoji);

    // Build buttons
    const row = new ActionRowBuilder().addComponents(
      allEmojis.map(emoji =>
        new ButtonBuilder()
          .setCustomId(`captcha_${member.id}_${emoji}`)
          .setLabel(emoji)
          .setStyle(ButtonStyle.Secondary)
      )
    );

    const embed = new EmbedBuilder()
      .setColor('#FF6B6B')
      .setTitle('🔐 Verification Required')
      .setDescription(`Welcome ${member}! To access the server please complete the verification below.`)
      .addFields({
        name: '📋 Instructions',
        value: `Click the **${correctEmoji}** emoji button below to verify you are human!`
      })
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({ text: 'You have 5 minutes to complete verification' })
      .setTimestamp();

    const msg = await verificationChannel.send({
      content: `${member}`,
      embeds: [embed],
      components: [row]
    });

    // ✅ 3. Auto delete after 5 minutes if not verified
    setTimeout(async () => {
      if (member.client.captchaAnswers?.has(member.id)) {
        member.client.captchaAnswers.delete(member.id);
        await msg.delete().catch(() => {});
        await member.kick('Failed to verify within 5 minutes').catch(console.error);
      }
    }, 5 * 60 * 1000);

    // ✅ 4. Send DM with instructions
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle(`👋 Welcome to ${member.guild.name}!`)
        .setDescription('Please complete the verification in the **#verification** channel to access the server!')
        .addFields(
          { name: '📜 Server Rules', value: '1️⃣ Be respectful\n2️⃣ No spam\n3️⃣ No NSFW\n4️⃣ No advertising\n5️⃣ Follow Discord ToS' },
          { name: '📢 Channels', value: '💬 **#general** — Main chat\n👋 **#goodbye** — Farewell messages' },
          { name: '🤖 Bot Commands', value: '`/ping` `/help` `/serverinfo` `/userinfo` `/rank` `/leaderboard`' }
        )
        .setFooter({ text: `${member.guild.name} • Complete verification to get started!` })
        .setTimestamp();

      await member.send({ embeds: [dmEmbed] });
    } catch {
      console.log(`Could not DM ${member.user.tag}`);
    }
  },
};