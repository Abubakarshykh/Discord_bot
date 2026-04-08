const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith('captcha_')) return;

    // Parse button data
    const parts = interaction.customId.split('_');
    const memberId = parts[1];
    const clickedEmoji = parts[2];

    // Only the correct member can click
    if (interaction.user.id !== memberId) {
      return interaction.reply({
        content: '❌ This verification is not for you!',
        ephemeral: true
      });
    }

    const correctEmoji = client.captchaAnswers?.get(memberId);

    if (!correctEmoji) {
      return interaction.reply({
        content: '❌ Verification expired! Please rejoin the server.',
        ephemeral: true
      });
    }

    const member = await interaction.guild.members.fetch(memberId).catch(() => null);
    if (!member) return;

    // ✅ Correct emoji clicked
    if (clickedEmoji === correctEmoji) {
      client.captchaAnswers.delete(memberId);

      // Remove Unverified role
      const unverifiedRole = interaction.guild.roles.cache.get(process.env.UNVERIFIED_ROLE_ID);
      if (unverifiedRole) await member.roles.remove(unverifiedRole).catch(console.error);

      // Add Verified role
      const verifiedRole = interaction.guild.roles.cache.get(process.env.VERIFIED_ROLE_ID);
      if (verifiedRole) await member.roles.add(verifiedRole).catch(console.error);

      // Remove Night role if exists and replace with Verified
      const nightRole = interaction.guild.roles.cache.find(r => r.name === 'Night');
      if (nightRole) await member.roles.add(nightRole).catch(console.error);

      // Success embed
      const successEmbed = new EmbedBuilder()
        .setColor('#00FF99')
        .setTitle('✅ Verification Successful!')
        .setDescription(`${member} has been verified and can now access the server!`)
        .addFields(
          { name: '🎉 Welcome!', value: 'Head over to **#general** to start chatting!' }
        )
        .setThumbnail(member.user.displayAvatarURL())
        .setTimestamp();

      await interaction.update({ embeds: [successEmbed], components: [] });

      // Send welcome message in general after 2 seconds
      setTimeout(async () => {
        const guildConfig = require('../config.json');
        const welcomeChannelId = guildConfig[interaction.guild.id]?.welcomeChannel || process.env.WELCOME_CHANNEL_ID;
        const welcomeChannel = interaction.guild.channels.cache.get(welcomeChannelId);

        if (welcomeChannel) {
          const welcomeEmbed = new EmbedBuilder()
            .setColor('#00ff99')
            .setTitle('👋 Welcome to the Server!')
            .setDescription(`Hey ${member}, welcome to **${interaction.guild.name}**! You are now verified 🎉`)
            .setThumbnail(member.user.displayAvatarURL())
            .addFields(
              { name: '👥 Members', value: `${interaction.guild.memberCount}`, inline: true },
              { name: '🎭 Role Given', value: '`Verified`', inline: true }
            )
            .setFooter({ text: 'Enjoy your stay!' })
            .setTimestamp();

          welcomeChannel.send({ embeds: [welcomeEmbed] });
        }
      }, 2000);

    } else {
      // ❌ Wrong emoji clicked
      const wrongEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Wrong Emoji!')
        .setDescription('That was the wrong emoji! Please try again.')
        .setTimestamp();

      await interaction.reply({ embeds: [wrongEmbed], ephemeral: true });
    }
  },
};