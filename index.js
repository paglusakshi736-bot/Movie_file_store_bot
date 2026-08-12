const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Public folder se static files serve karega
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.DATABASE_URI;

// MongoDB Connection
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Movie Schema Definition
const movieSchema = new mongoose.Schema({
  title: String,
  file_id: String,
  file_size: String,
  caption: String,
  poster_url: String,
});

const Movie = mongoose.model('Movie', movieSchema);

// API 1: Specific Movie ka Data lane ke liye
app.get('/api/movie/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// API 2: View Full Library ke liye Saari Movies lane ki API
app.get('/api/movies', async (req, res) => {
  try {
    const movies = await Movie.find({});
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// FrontEnd route fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
