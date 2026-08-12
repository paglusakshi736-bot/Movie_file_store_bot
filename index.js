const TelegramBot = require('node-telegram-bot-api');
const http = require('http');

const port = process.env.PORT || 3000;
const ADMIN_ID = 7351417552;

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
});

const MINI_APP_URL = "https://gleaming-hamster-2e0b5e.netlify.app";

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  if (req.url === '/api/movies') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const moviesList = Object.keys(fileStore).map(key => ({
      id: key,
      title: fileStore[key].caption || "Untitled Movie",
      poster: fileStore[key].poster || "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&auto=format&fit=crop"
    }));
    res.end(JSON.stringify(moviesList));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot Server is Running Successfully!');
  }
}).listen(port, () => {
  console.log('Server is listening on port ' + port);
});

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
    bot.sendMessage(chatId, "❌ File expired or server restarted.");
  }
}

bot.onText(/\/start (.+)/, (msg, match) => {
  sendStoredFile(msg.chat.id, match[1]);
});

bot.onText(/\/start$/, (msg) => {
  bot.sendMessage(msg.chat.id, "Welcome! Send me a video file to generate an Ad-locked link.");
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (msg.text && msg.text.startsWith('/start')) return;

  if (msg.from.id !== ADMIN_ID) {
    if (msg.video || msg.document) {
      bot.sendMessage(chatId, "❌ Only Admin has permission to upload.");
    }
    return;
  }

  let fileId = null;
  let fileType = null;
  let caption = msg.caption || 'Movie File';
  let thumbId = null;

  if (msg.video) {
    fileId = msg.video.file_id;
    fileType = 'video';
    if (msg.video.thumbnail) thumbId = msg.video.thumbnail.file_id;
  } else if (msg.document) {
    fileId = msg.document.file_id;
    fileType = 'document';
    if (msg.document.thumbnail) thumbId = msg.document.thumbnail.file_id;
  }

  if (fileId) {
    const uniqueKey = 'file_' + Date.now();
    let posterLink = "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&auto=format&fit=crop";

    if (thumbId) {
      try {
        posterLink = await bot.getFileLink(thumbId);
      } catch (e) {
        console.log("Could not fetch thumbnail.");
      }
    }

    fileStore[uniqueKey] = { id: fileId, type: fileType, caption: caption, poster: posterLink };

    const encodedTitle = encodeURIComponent(caption);
    const encodedPoster = encodeURIComponent(posterLink);

    const webAppUrl = MINI_APP_URL + "/?start=" + uniqueKey + "&bot=" + BOT_USERNAME + "&title=" + encodedTitle + "&poster=" + encodedPoster;

    const options = {
      reply_markup: {
        inline_keyboard: [
          [ { text: "🎬 View Movie in Mini App", web_app: { url: webAppUrl } } ]
        ]
      }
    };

    bot.sendMessage(chatId, "✅ *File Saved to Library!*", { parse_mode: 'Markdown', ...options });
  }
});

console.log("Movie Store Bot running live...");
