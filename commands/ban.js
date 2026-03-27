const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption(option => 
      option.setName('target')
        .setDescription('The member to ban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for ban')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    const member = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const guildMember = interaction.guild.members.cache.get(member.id);

    if (!guildMember) return interaction.reply({ content: '❌ Member not found.', ephemeral: true });
    if (!guildMember.bannable) return interaction.reply({ content: '❌ I cannot ban this member.', ephemeral: true });

    await guildMember.ban({ reason });
    await interaction.reply({ content: `✅ Banned ${member.tag}.\nReason: ${reason}` });
  },
};