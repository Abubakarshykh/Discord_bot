const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'messageDelete',
  execute(message) {
    if (message.partial || message.author.bot) return;

    const channel = message.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle('Message Deleted 🗑️')
      .addFields(
        { name: 'Author', value: `${message.author.tag}`, inline: true },
        { name: 'Channel', value: `${message.channel}`, inline: true },
        { name: 'Content', value: message.content || 'No content' }
      );

    channel.send({ embeds: [embed] });
  },
};