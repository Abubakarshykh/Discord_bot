const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Store conversation history per user
const conversations = new Map();

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    // Ignore bots and messages that don't mention the bot
    if (message.author.bot) return;
    if (!message.mentions.has(message.client.user)) return;

    // Remove the bot mention from the message
    const userMessage = message.content
      .replace(`<@${message.client.user.id}>`, '')
      .trim();

    if (!userMessage) {
      return message.reply('Hey! 👋 Ask me anything, I\'m here to help!');
    }

    // Get or create conversation history for this user
    const userId = message.author.id;
    if (!conversations.has(userId)) {
      conversations.set(userId, [
        {
          role: 'system',
          content: `You are a friendly and helpful Discord bot assistant for the server "${message.guild.name}". 
          You respond in a casual, friendly tone. Keep responses concise and clear.
          You can help with questions, have conversations, tell jokes, and assist members.`
        }
      ]);
    }

    const history = conversations.get(userId);

    // Add user message to history
    history.push({
      role: 'user',
      content: userMessage
    });

    // Show typing indicator
    await message.channel.sendTyping();

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: history,
        max_tokens: 500,
        temperature: 0.7,
      });

      const reply = response.choices[0].message.content;

      // Add bot reply to history
      history.push({
        role: 'assistant',
        content: reply
      });

      // Keep conversation history to last 10 messages to save tokens
      if (history.length > 11) {
        history.splice(1, 2);
      }

      // Save updated history
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
      console.error('OpenAI Error:', error);

      if (error.status === 429) {
        await message.reply('⚠️ I am a little busy right now, please try again in a moment!');
      } else if (error.status === 401) {
        await message.reply('⚠️ AI service is not configured correctly. Please contact an admin!');
      } else {
        await message.reply('❌ Something went wrong. Please try again!');
      }
    }
  },
};