const TelegramBot = require('node-telegram-bot-api');
const http = require('http');

// Render Port Issue Fix: Web Server to keep Render active
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

// Handle /start with File Key
bot.onText(/\/start (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const fileId = match[1];

  if (fileStore[fileId]) {
    const storedFile = fileStore[fileId];
    const captionText = storedFile.caption ? storedFile.caption : 'Movie File';
    bot.sendMessage(chatId, "Your Movie File is ready!\n\nTitle: " + captionText);
    
    if (storedFile.type === 'video') {
      bot.sendVideo(chatId, storedFile.id);
    } else if (storedFile.type === 'document') {
      bot.sendDocument(chatId, storedFile.id);
    }
  } else {
    bot.sendMessage(chatId, "File missing or expired.");
  }
});

// Handle simple /start
bot.onText(/\/start$/, (msg) => {
  bot.sendMessage(msg.chat.id, "Welcome! Use the Mini App to download movies.");
});

// Store movie files sent by Admin
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.text && msg.text.startsWith('/start')) return;

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

    bot.getMe().then((me) => {
      const shareableLink = "https://t.me/" + me.username + "?start=" + uniqueKey;
      bot.sendMessage(chatId, "File Saved Successfully!\n\nMovie Link:\n" + shareableLink);
    });
  }
});

console.log("File Store Bot is running live...");
