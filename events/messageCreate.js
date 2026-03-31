const Groq = require('groq-sdk');
const { addXP, xpForNextLevel } = require('../utils/xpManager');
const { EmbedBuilder } = require('discord.js');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const conversations = new Map();
const lastMessageTime = new Map();
const xpCooldown = new Map();
const COOLDOWN_SECONDS = 5;
const XP_COOLDOWN = 60000; // 1 minute XP cooldown

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;

    // ✅ XP System — runs for every message
    const xpNow = Date.now();
    const lastXP = xpCooldown.get(message.author.id) || 0;

    if (xpNow - lastXP > XP_COOLDOWN) {
      xpCooldown.set(message.author.id, xpNow);

      // Random XP between 15-25
      const xpAmount = Math.floor(Math.random() * 11) + 15;
      const result = addXP(message.author.id, message.guild.id, xpAmount);

      // Level up announcement
      if (result.leveledUp) {
        const nextLevelXP = xpForNextLevel(result.level);

        const embed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('⬆️ Level Up!')
          .setDescription(`${message.author} just leveled up!`)
          .addFields(
            { name: '🏆 New Level', value: `**${result.level}**`, inline: true },
            { name: '✨ Total XP', value: `**${result.xp}**`, inline: true },
            { name: '📈 Next Level', value: `**${Math.floor(nextLevelXP)} XP**`, inline: true }
          )
          .setThumbnail(message.author.displayAvatarURL())
          .setTimestamp();

        message.channel.send({ embeds: [embed] });
      }
    }

    // ✅ AI Chat — only when bot is mentioned
    if (!message.mentions.has(message.client.user)) return;

    const userMessage = message.content
      .replace(`<@${message.client.user.id}>`, '')
      .trim();

    if (!userMessage) {
      return message.reply('Hey! 👋 Ask me anything, I\'m here to help!');
    }

    const userId = message.author.id;
    const now = Date.now();
    const lastTime = lastMessageTime.get(userId) || 0;
    const diff = (now - lastTime) / 1000;

    if (diff < COOLDOWN_SECONDS) {
      const remaining = Math.ceil(COOLDOWN_SECONDS - diff);
      return message.reply(`⏳ Please wait **${remaining} seconds** before asking again!`);
    }

    lastMessageTime.set(userId, now);

    if (!conversations.has(userId)) {
      conversations.set(userId, [
        {
          role: 'system',
          content: `You are a friendly and helpful Discord bot assistant for the server "${message.guild.name}". 
          You respond in a casual, friendly tone. Keep responses concise and clear.`
        }
      ]);
    }

    const history = conversations.get(userId);
    history.push({ role: 'user', content: userMessage });

    await message.channel.sendTyping();

    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: history,
        max_tokens: 500,
        temperature: 0.7,
      });

      const reply = response.choices[0].message.content;
      history.push({ role: 'assistant', content: reply });

      if (history.length > 11) history.splice(1, 2);
      conversations.set(userId, history);

      if (reply.length > 2000) {
        const chunks = reply.match(/[\s\S]{1,2000}/g);
        for (const chunk of chunks) await message.reply(chunk);
      } else {
        await message.reply(reply);
      }

    } catch (error) {
      console.error('Groq API Error:', error);
      if (error.status === 429) {
        await message.reply('⏳ I am a little busy right now, please wait a moment!');
      } else {
        await message.reply('❌ Something went wrong. Please try again!');
      }
    }
  },
};