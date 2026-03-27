const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildMemberRemove',
  execute(member) {
    const channel = member.guild.channels.cache.get(process.env.GOODBYE_CHANNEL_ID);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor('#ff0000')
      .setTitle('👋 Goodbye!')
      .setDescription(`**${member.user.tag}** has left the server. We'll miss you!`)
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: '👥 Members Remaining', value: `${member.guild.memberCount}`, inline: true }
      )
      .setFooter({ text: 'Hope to see you again someday!' })
      .setTimestamp();

    channel.send({ embeds: [embed] });
  },
};