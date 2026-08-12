const TelegramBot = require('node-telegram-bot-api');
const http = require('http');

// Render Port Fix
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot Server is Running Successfully!');
}).listen(port, () => {
  console.log('Server is listening on port ' + port);
});

// Telegram Bot Logic
const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("Error: BOT_TOKEN Environment Variable is missing!");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
const fileStore = {};

// Netlify Mini App URL
const MINI_APP_URL = "https://gleaming-hamster-2e0b5e.netlify.app";

// Start Command with File Key
bot.onText(/\/start (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const fileId = match[1];

  if (fileStore[fileId]) {
    const storedFile = fileStore[fileId];
    const captionText = storedFile.caption ? storedFile.caption : 'Movie File';
    bot.sendMessage(chatId, "🎉 Your Movie File is unlocked!\n\nTitle: " + captionText);
    
    if (storedFile.type === 'video') {
      bot.sendVideo(chatId, storedFile.id);
    } else if (storedFile.type === 'document') {
      bot.sendDocument(chatId, storedFile.id);
    }
  } else {
    bot.sendMessage(chatId, "File missing or expired.");
  }
});

// Normal /start
bot.onText(/\/start$/, (msg) => {
  bot.sendMessage(msg.chat.id, "Welcome Pawan! Send me a video file to generate an Ad-locked link.");
});

// File Upload & WebApp Data Handling
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.text && msg.text.startsWith('/start')) return;

  // Mini App से फाइल अनलॉक डेटा मिलना
  if (msg.web_app_data) {
    const fileKey = msg.web_app_data.data;
    if (fileStore[fileKey]) {
      const storedFile = fileStore[fileKey];
      const captionText = storedFile.caption ? storedFile.caption : 'Movie File';
      bot.sendMessage(chatId, "🎉 Here is your requested movie file!\n\nTitle: " + captionText);
      
      if (storedFile.type === 'video') {
        bot.sendVideo(chatId, storedFile.id);
      } else if (storedFile.type === 'document') {
        bot.sendDocument(chatId, storedFile.id);
      }
    }
    return;
  }

  let fileId = null;
  let fileType = null;
  let caption = msg.caption || '';

  if (msg.video) {
    fileId = msg.video.file_id;
    fileType = 'video';
  } else if (msg.document) {
    fileId = msg.document.file_id;
    fileType = 'document';
  }

  if (fileId) {
    const uniqueKey = 'file_' + Date.now();
    fileStore[uniqueKey] = { id: fileId, type: fileType, caption: caption };

    const shareLink1Ad = ${MINI_APP_URL}/?start=${uniqueKey}&ads=1;
    const shareLink3Ads = ${MINI_APP_URL}/?start=${uniqueKey}&ads=3;

    const responseMsg = ✅ *File Saved Successfully!*\n\n +
      🔗 *1 Ad Link:*\n${shareLink1Ad}\n\n +
      🔗 *3 Ads Link:*\n${shareLink3Ads};

    bot.sendMessage(chatId, responseMsg, { parse_mode: 'Markdown' });
  }
});

console.log("File Store Bot is running live...");
