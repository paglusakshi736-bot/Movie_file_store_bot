const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 10000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.DATABASE_URI;

// Initialize Telegram Bot safely
let bot;
if (BOT_TOKEN) {
  bot = new TelegramBot(BOT_TOKEN, { polling: true });
} else {
  console.error("CRITICAL ERROR: BOT_TOKEN is missing in Render Environment Variables!");
}

// MongoDB Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Database Schema
const movieSchema = new mongoose.Schema({
  title: String,
  file_id: String,
  file_size: String,
  caption: String,
  photo_file_id: String,
});

const Movie = mongoose.model('Movie', movieSchema);

// BOT HANDLERS
if (bot) {
  bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Welcome! Send or forward any video, photo or document to save to MongoDB database.");
  });

  bot.on('message', async (msg) => {
    if (msg.video  msg.document  msg.photo) {
      try {
        let fileId = "";
        let photoFileId = "";
        let title = msg.caption || "Untitled Movie";

        if (msg.video) {
          fileId = msg.video.file_id;
          if (msg.video.thumbnail) photoFileId = msg.video.thumbnail.file_id;
        } else if (msg.document) {
          fileId = msg.document.file_id;
          if (msg.document.thumbnail) photoFileId = msg.document.thumbnail.file_id;
          if (!msg.caption && msg.document.file_name) title = msg.document.file_name;
        } else if (msg.photo) {
          fileId = msg.photo[msg.photo.length - 1].file_id;
          photoFileId = fileId;
        }

        const newMovie = new Movie({
          title: title,
          file_id: fileId,
          caption: msg.caption || '',
          photo_file_id: photoFileId
        });

        await newMovie.save();
        bot.sendMessage(msg.chat.id, "Saved to Database successfully! Title: " + title);
      } catch (err) {
        console.error('Error saving movie:', err);
        bot.sendMessage(msg.chat.id, "Error saving file to database.");
      }
    }

    if (msg.web_app_data) {
      try {
        const data = JSON.parse(msg.web_app_data.data);
        if (data.action === 'get_file' && data.movieId) {
          const movie = await Movie.findById(data.movieId);
          if (movie) {
            bot.sendDocument(msg.chat.id, movie.file_id, { caption: movie.caption || movie.title });
          } else {
            bot.sendMessage(msg.chat.id, "File not found in database.");
          }
        }
      } catch (err) {
        console.error('Error in web_app_data:', err);
      }
    }
  });
}

// EXPRESS APIs FOR MINI APP

app.get('/api/movie/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/movies', async (req, res) => {
  try {
    const movies = await Movie.find({});
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/poster/:file_id', async (req, res) => {
  try {
    const fileId = req.params.file_id;
    if (!fileId || fileId === 'undefined') {
      return res.redirect('https://via.placeholder.com/300x450?text=No+Poster');
    }

    const fileRes = await axios.get(https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId});
    const filePath = fileRes.data.result.file_path;
    
    const imageStream = await axios({
      url: https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath},
      method: 'GET',
      responseType: 'stream'
    });
    res.setHeader('Content-Type', 'image/jpeg');
    imageStream.data.pipe(res);
  } catch (err) {
    console.error('Poster proxy error:', err.message);
    res.redirect('https://via.placeholder.com/300x450?text=No+Poster');
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(Server is running on port ${PORT});
});
