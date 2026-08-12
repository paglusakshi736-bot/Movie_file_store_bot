const TelegramBot = require('node-telegram-bot-api');
const http = require('http');

const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot Server is Running Successfully!');
}).listen(port, () => {
  console.log('Server is listening on port ' + port);
});

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("Error: BOT_TOKEN Environment Variable is missing!");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
const fileStore = {};

let BOT_USERNAME = "";
bot.getMe().then((me) => {
  BOT_USERNAME = me.username;
  console.log("Bot username loaded: " + BOT_USERNAME);
});

const MINI_APP_URL = "https://gleaming-hamster-2e0b5e.netlify.app";

function sendStoredFile(chatId, fileKey) {
  if (fileStore[fileKey]) {
    const storedFile = fileStore[fileKey];
    const captionText = storedFile.caption ? storedFile.caption : 'Movie File';
    bot.sendMessage(chatId, "🎉 Your Movie File is unlocked!\n\nTitle: " + captionText);
    
    if (storedFile.type === 'video') {
      bot.sendVideo(chatId, storedFile.id);
    } else if (storedFile.type === 'document') {
      bot.sendDocument(chatId, storedFile.id);
    }
  } else {
    bot.sendMessage(chatId, "❌ File expired or server restarted. Please re-upload the video.");
  }
}

// Start Command Handling
bot.onText(/\/start (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const fileKey = match[1];
  sendStoredFile(chatId, fileKey);
});

bot.onText(/\/start$/, (msg) => {
  bot.sendMessage(msg.chat.id, "Welcome! Send me a video file to generate an Ad-locked link.");
});

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

    const webAppUrl1 = MINI_APP_URL + "/?start=" + uniqueKey + "&ads=1&bot=" + BOT_USERNAME;
    const webAppUrl3 = MINI_APP_URL + "/?start=" + uniqueKey + "&ads=3&bot=" + BOT_USERNAME;

    const options = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🎬 Unlock via 1 Ad Mini App", web_app: { url: webAppUrl1 } }
          ],
          [
            { text: "🎬 Unlock via 3 Ads Mini App", web_app: { url: webAppUrl3 } }
          ]
        ]
      }
    };

    bot.sendMessage(chatId, "✅ *File Saved Successfully!*\nClick below to open the Mini App:", { parse_mode: 'Markdown', ...options });
  }
});

console.log("File Store Bot is running live...");
