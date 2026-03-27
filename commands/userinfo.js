const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Shows information about a user')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Select a user')
        .setRequired(false)),
  async execute(interaction) {
    const user = interaction.options.getUser('target') || interaction.user;
    const member = interaction.guild.members.cache.get(user.id);

    const embed = new EmbedBuilder()
      .setColor('#00ff99')
      .setTitle(`${user.tag}'s Info`)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: 'ID', value: `${user.id}`, inline: true },
        { name: 'Joined Server', value: member ? `${member.joinedAt.toDateString()}` : 'N/A', inline: true },
        { name: 'Account Created', value: `${user.createdAt.toDateString()}`, inline: true },
        { name: 'Roles', value: member ? member.roles.cache.map(r => r.name).join(', ') : 'N/A' }
      );

    await interaction.reply({ embeds: [embed] });
  },
};