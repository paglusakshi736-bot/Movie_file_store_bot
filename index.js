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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

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
    res.end('Bot Server is Running!');
  }
}).listen(port, () => {
  console.log('Server is listening on port ' + port);
});

function sendStoredFile(chatId, fileKey) {
  if (fileStore[fileKey]) {
    const storedFile = fileStore[fileKey];
    bot.sendMessage(chatId, "🎉 File unlocked successfully!\n\nTitle: " + storedFile.caption);
    
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
  const libraryUrl = MINI_APP_URL + "/?bot=" + BOT_USERNAME;
  const options = {
    reply_markup: {
      inline_keyboard: [
        [ { text: "🎬 Open Movie Library", web_app: { url: libraryUrl } } ]
      ]
    }
  };
  bot.sendMessage(msg.chat.id, "Welcome to Movie Hub! Click below to browse movies:", options);
});

bot.on('message', async (msg) => {
  if (msg.text && msg.text.startsWith('/start')) return;

  if (msg.from.id !== ADMIN_ID) {
    if (msg.video || msg.document) {
      bot.sendMessage(msg.chat.id, "❌ Only Admin can upload files.");
    }
    return;
  }

  let fileId = msg.video ? msg.video.file_id : (msg.document ? msg.document.file_id : null);
  let fileType = msg.video ? 'video' : 'document';
  let caption = msg.caption || 'Movie File';
  let thumbId = (msg.video && msg.video.thumbnail) ? msg.video.thumbnail.file_id : null;

  if (fileId) {
    const uniqueKey = 'file_' + Date.now();
    let posterLink = "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&auto=format&fit=crop";

    if (thumbId) {
      try { posterLink = await bot.getFileLink(thumbId); } catch (e) {}
    }

    fileStore[uniqueKey] = { id: fileId, type: fileType, caption: caption, poster: posterLink };

    const webAppUrl = MINI_APP_URL + "/?start=" + uniqueKey + "&bot=" + BOT_USERNAME + "&title=" + encodeURIComponent(caption) + "&poster=" + encodeURIComponent(posterLink);
    const options = {
      reply_markup: {
        inline_keyboard: [ [ { text: "🎬 View Movie", web_app: { url: webAppUrl } } ] ]
      }
    };
    bot.sendMessage(msg.chat.id, "✅ *File Added to Library!*", { parse_mode: 'Markdown', ...options });
  }
});
