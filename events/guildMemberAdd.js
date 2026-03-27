const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {

    // ✅ 1. Auto-assign "Night" role
    const role = member.guild.roles.cache.find(r => r.name === 'Night');
    if (role) {
      await member.roles.add(role).catch(console.error);
    }

    // ✅ 2. Send welcome embed in welcome channel
    const guildConfig = config[member.guild.id];
    if (guildConfig && guildConfig.welcomeChannel) {
      const welcomeChannel = member.guild.channels.cache.get(guildConfig.welcomeChannel);
      if (welcomeChannel) {
        const welcomeEmbed = new EmbedBuilder()
          .setColor('#00ff99')
          .setTitle('👋 Welcome to the Server!')
          .setDescription(`Hey ${member}, welcome to **${member.guild.name}**! We're glad to have you 🎉`)
          .setThumbnail(member.user.displayAvatarURL())
          .addFields(
            { name: '📌 Get Started', value: 'Check your DM for a full server guide!' },
            { name: '👥 Members', value: `${member.guild.memberCount}`, inline: true },
            { name: '🎭 Role Given', value: '`Night`', inline: true }
          )
          .setFooter({ text: 'Enjoy your stay!' })
          .setTimestamp();

        welcomeChannel.send({ embeds: [welcomeEmbed] });
      }
    }

    // ✅ 3. Send DM with server guide
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`👋 Welcome to ${member.guild.name}!`)
        .setDescription('Here is everything you need to know to get started:')
        .addFields(
          {
            name: '📜 Server Rules',
            value: [
              '1️⃣ Be respectful to all members',
              '2️⃣ No spamming or flooding the chat',
              '3️⃣ No NSFW content',
              '4️⃣ No self-promotion or advertising',
              '5️⃣ Follow Discord\'s Terms of Service',
            ].join('\n')
          },
          {
            name: '📢 Channels Guide',
            value: [
              '💬 **#general** — Main chatting channel, say hi!',
              '👋 **#goodbye** — Members who leave are announced here',
            ].join('\n')
          },
          {
            name: '🤖 Bot Commands',
            value: [
              '`/ping` — Check bot latency',
              '`/help` — Show all commands',
              '`/serverinfo` — See server details',
              '`/userinfo` — See your profile info',
            ].join('\n')
          },
          {
            name: '🎭 Your Role',
            value: 'You have been automatically given the `Night` role!'
          }
        )
        .setFooter({ text: `${member.guild.name} • Enjoy your stay!` })
        .setTimestamp();

      await member.send({ embeds: [dmEmbed] });
    } catch (err) {
      console.log(`Could not DM ${member.user.tag} — DMs may be disabled.`);
    }
  },
};