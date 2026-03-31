const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const conversations = new Map();
const lastMessageTime = new Map();
const COOLDOWN_SECONDS = 5;

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;
    if (!message.mentions.has(message.client.user)) return;

    const userMessage = message.content
      .replace(`<@${message.client.user.id}>`, '')
      .trim();

    if (!userMessage) {
      return message.reply('Hey! 👋 Ask me anything, I\'m here to help!');
    }

    // Cooldown check
    const userId = message.author.id;
    const now = Date.now();
    const lastTime = lastMessageTime.get(userId) || 0;
    const diff = (now - lastTime) / 1000;

    if (diff < COOLDOWN_SECONDS) {
      const remaining = Math.ceil(COOLDOWN_SECONDS - diff);
      return message.reply(`⏳ Please wait **${remaining} seconds** before asking again!`);
    }

    lastMessageTime.set(userId, now);

    // Get or create conversation history
    if (!conversations.has(userId)) {
      conversations.set(userId, [
        {
          role: 'system',
          content: `You are a slay, aesthetic Discord bot for "${message.guild.name}" 💅✨
Your vibe is gen-z, chaotic-cute, and lowkey iconic.
Use casual spelling like "soooo", "omg", "ngl", "bestie", "im screaming 😭".
Use emojis liberally. Be dramatic but helpful.
Examples of your tone:
- "omg yesss that's literally SO valid 💀"
- "ngl im kinda obsessed with this question soooo 👀"
- "bestie i GOTCHU here's what you need to know ✨"
Keep answers helpful but make them feel like a text from your funniest friend.`
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

      // Save to history
      history.push({ role: 'assistant', content: reply });

      // Keep last 10 messages only
      if (history.length > 11) {
        history.splice(1, 2);
      }

      conversations.set(userId, history);

      // Send reply — split if too long
      if (reply.length > 2000) {
        const chunks = reply.match(/[\s\S]{1,2000}/g);
        for (const chunk of chunks) {
          await message.reply(chunk);
        }
      } else {
        await message.reply(reply);
      }

    } catch (error) {
      console.error('Groq API Error:', error);
      if (error.status === 429) {
        await message.reply('⏳ I am a little busy right now, please wait a moment and try again!');
      } else {
        await message.reply('❌ Something went wrong. Please try again!');
      }
    }
  },
};