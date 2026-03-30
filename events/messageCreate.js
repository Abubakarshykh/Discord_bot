const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const conversations = new Map();

// Rate limiting — track last message time per user
const lastMessageTime = new Map();
const COOLDOWN_SECONDS = 10;

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

    // ✅ Cooldown check
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
      conversations.set(userId, []);
    }

    const history = conversations.get(userId);

    await message.channel.sendTyping();

    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: `You are a friendly and helpful Discord bot assistant for the server "${message.guild.name}". 
        You respond in a casual, friendly tone. Keep responses concise and clear.
        You can help with questions, have conversations, tell jokes, and assist members.`,
      });

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(userMessage);
      const reply = result.response.text();

      // Save to history
      history.push({ role: 'user', parts: [{ text: userMessage }] });
      history.push({ role: 'model', parts: [{ text: reply }] });

      // Keep last 10 messages only
      if (history.length > 10) {
        history.splice(0, 2);
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
      console.error('Gemini API Error:', error);

      if (error.status === 429) {
        await message.reply('⏳ I am a little busy right now, please wait a moment and try again!');
      } else {
        await message.reply('❌ Something went wrong. Please try again!');
      }
    }
  },
};