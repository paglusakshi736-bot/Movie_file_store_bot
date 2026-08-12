const TelegramBot = require('node-telegram-bot-api');

// आपका बॉट टोकन
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// फाइलों को सेव करने के लिए सिंपल इन-मेमोरी स्टोरेज
const fileStore = {};

// /start कमांड को हैंडल करना
bot.onText(/\/start (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const fileId = match[1];

  if (fileStore[fileId]) {
    const storedFile = fileStore[fileId];
    bot.sendMessage(chatId, 🎬 **आपकी मूवी फाइल तैयार है!**\n\n📌 Title: ${storedFile.caption || 'Movie File'});
    
    // फाइल टाइप के हिसाब से सेंड करना
    if (storedFile.type === 'video') {
      bot.sendVideo(chatId, storedFile.id);
    } else if (storedFile.type === 'document') {
      bot.sendDocument(chatId, storedFile.id);
    }
  } else {
    bot.sendMessage(chatId, "❌ माफ कीजिए, यह फाइल या लिंक अमान्य (Expired) हो चुका है।");
  }
});

// डिफ़ॉल्ट /start (बिना लिंक के)
bot.onText(/\/start$/, (msg) => {
  bot.sendMessage(msg.chat.id, "👋 आपका स्वागत है! मूवीज डाउनलोड करने के लिए मिनी ऐप का इस्तेमाल करें।");
});

// एडमिन द्वारा भेजी गई मूवी फाइल को सेव करना
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // केवल तब काम करे जब मैसेज /start न हो
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

    // बॉट का यूजरनेम निकाल कर डायरेक्ट लिंक बनाना
    bot.getMe().then((me) => {
      const shareableLink = https://t.me/${me.username}?start=${uniqueKey};
      bot.sendMessage(chatId, ✅ **फाइल सफलतापूर्वक स्टोर हो गई है!**\n\n🔗 **यूनिक मूवी लिंक:**\n\${shareableLink}\\n\n*(इस लिंक को अपने मिनी ऐप के एडमिन पैनल में पेस्ट करें)*, { parse_mode: 'Markdown' });
    });
  }
});

console.log("File Store Bot 24/7 चालू है...");

