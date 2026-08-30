const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const artworkRoutes = require('./routes/artwork');
const commentRoutes = require('./routes/comment');
const paymentRoutes = require('./routes/payment');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const artistRoutes = require('./routes/artist');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/artworks', artworkRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user', userRoutes);
app.use('/api/artist', artistRoutes);

// Base Route
app.get('/', (req, res) => {
  res.send('ArtHub Server is Running Smoothly!');
});

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port: ${PORT}`);
});