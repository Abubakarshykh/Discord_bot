const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLeaderboard } = require('../utils/xpManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Shows top 10 members by XP'),
  async execute(interaction) {
    const top = getLeaderboard(interaction.guild.id);

    if (top.length === 0) {
      return interaction.reply('No XP data yet! Start chatting to earn XP! 💬');
    }

    const medals = ['🥇', '🥈', '🥉'];

    const description = await Promise.all(
      top.map(async (entry, index) => {
        const user = await interaction.client.users.fetch(entry.userId).catch(() => null);
        const name = user ? user.username : 'Unknown User';
        const medal = medals[index] || `**${index + 1}.**`;
        return `${medal} **${name}** — Level ${entry.level} | ${entry.xp} XP`;
      })
    );

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🏆 XP Leaderboard')
      .setDescription(description.join('\n'))
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};