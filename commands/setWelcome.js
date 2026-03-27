const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setwelcome')
    .setDescription('Set the welcome channel for the server')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Select a channel')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');

    config[interaction.guild.id] = { welcomeChannel: channel.id };
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

    await interaction.reply(`✅ Welcome channel set to ${channel}`);
  },
};