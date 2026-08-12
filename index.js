const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 10000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.DATABASE_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => console.error('MongoDB Connection Error:', err));

const movieSchema = new mongoose.Schema({
  title: String,
  file_id: String,
  file_size: String,
  caption: String,
  photo_file_id: String, 
});

const Movie = mongoose.model('Movie', movieSchema);

// API 1: Fetch single movie details
app.get('/api/movie/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// API 2: Fetch all movies for full library
app.get('/api/movies', async (req, res) => {
  try {
    const movies = await Movie.find({});
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// API 3: Poster image proxy from Telegram
app.get('/poster/:file_id', async (req, res) => {
  try {
    const fileId = req.params.file_id;
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
    res.redirect('https://via.placeholder.com/300x450?text=No+Poster+Available');
  }
});

app.listen(PORT, () => {
  console.log(Server is running on port ${PORT});
});
