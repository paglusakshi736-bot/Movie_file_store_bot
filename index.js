const express = require('express');
const app = express();
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');

// Setup
const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.MONGODB_URI || process.env.DATABASE_URI;

// Bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// DB
mongoose.connect(MONGO_URI).then(() => console.log('DB Connected'));

bot.on('message', async (msg) => {
  // Safe condition check
  const hasContent = msg.video  msg.document  msg.photo;
  
  if (hasContent) {
    try {
      // Basic saving logic
      bot.sendMessage(msg.chat.id, "File received! Saving to DB...");
    } catch (e) {
      console.log(e);
    }
  }
});

app.get('/', (req, res) => res.send('Bot is running'));
app.listen(process.env.PORT || 10000);
