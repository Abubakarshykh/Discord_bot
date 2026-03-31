const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserXP, getLevel, xpForNextLevel } = require('../utils/xpManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Check your XP and level')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Check another user rank')
        .setRequired(false)),
  async execute(interaction) {
    const user = interaction.options.getUser('target') || interaction.user;
    const data = getUserXP(user.id, interaction.guild.id);
    const nextLevelXP = Math.floor(xpForNextLevel(data.level));
    const progress = Math.floor((data.xp / nextLevelXP) * 20);
    const progressBar = '█'.repeat(progress) + '░'.repeat(20 - progress);

    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`${user.username}'s Rank`)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: '🏆 Level', value: `**${data.level}**`, inline: true },
        { name: '✨ XP', value: `**${data.xp}**`, inline: true },
        { name: '📈 Next Level', value: `**${nextLevelXP} XP**`, inline: true },
        { name: '📊 Progress', value: `\`${progressBar}\` ${Math.floor((data.xp / nextLevelXP) * 100)}%` }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};