const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows all available commands'),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('🤖 Bot Commands')
      .setDescription('Here is a list of all available commands:')
      .addFields(
        { name: '📋 General', value: '`/ping` — Check bot latency\n`/help` — Show this message' },
        { name: 'ℹ️ Info', value: '`/serverinfo` — Show server information\n`/userinfo [@user]` — Show user information' },
        { name: '🔨 Moderation', value: '`/ban @user [reason]` — Ban a member\n`/kick @user [reason]` — Kick a member' },
        { name: '⚙️ Admin', value: '`/setwelcome #channel` — Set the welcome channel' }
      )
      .setFooter({ text: 'Use / to get started!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};