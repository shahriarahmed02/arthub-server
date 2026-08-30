const express = require('express');
const Artwork = require('../models/Artwork');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware: Verify JWT Token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized access' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// 1. Get All Artworks (With Search, Filter, Pagination) - Public
router.get('/', async (req, res) => {
  try {
    const { search, category, page = 1, limit = 9, sort } = req.query;

    let query = {};

    // Search by title
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Sorting
    let sortOptions = { createdAt: -1 }; // Default: Newest
    if (sort === 'low-to-high') sortOptions = { price: 1 };
    if (sort === 'high-to-low') sortOptions = { price: -1 };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const artworks = await Artwork.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    const total = await Artwork.countDocuments(query);

    res.json({
      artworks,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      totalArtworks: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch artworks', error: error.message });
  }
});

// 2. Get Featured Artworks (Latest 6) - Public
router.get('/featured', async (req, res) => {
  try {
    const featured = await Artwork.find({ isSold: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(6);
    res.json(featured);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch featured artworks', error: error.message });
  }
});

// 3. Get Artworks by Specific Artist (My Artworks Page) - Protected
router.get('/my-artworks', verifyToken, async (req, res) => {
  try {
    const artworks = await Artwork.find({ artistId: req.user.id }).sort({ createdAt: -1 });
    res.json(artworks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch artist artworks', error: error.message });
  }
});

// 4. Get Single Artwork Details - Public
router.get('/:id', async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return res.status(404).json({ message: 'Artwork not found' });
    res.json(artwork);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching artwork details', error: error.message });
  }
});

// 5. Create New Artwork (Artist or Admin Only) - Protected
router.post('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'artist' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only artists can post artwork' });
    }

    const { title, description, price, category, imageUrl, artistName } = req.body;

    if (!title || !price || !category || !imageUrl) {
      return res.status(400).json({ message: 'Title, price, category, and imageUrl are required' });
    }

    const newArtwork = new Artwork({
      title,
      description,
      price: Number(price),
      category,
      imageUrl,
      artistId: req.user.id,
      artistName: artistName || req.user.name || 'Unknown Artist'
    });

    await newArtwork.save();
    res.status(201).json({ message: 'Artwork created successfully', artwork: newArtwork });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create artwork', error: error.message });
  }
});

// 6. Update Artwork (Owner Artist or Admin Only) - Protected
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return res.status(404).json({ message: 'Artwork not found' });

    // Authorization check
    if (artwork.artistId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to update this artwork' });
    }

    const updatedArtwork = await Artwork.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.json({ message: 'Artwork updated successfully', artwork: updatedArtwork });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update artwork', error: error.message });
  }
});

// 7. Delete Artwork (Owner Artist or Admin Only) - Protected
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    if (!artwork) return res.status(404).json({ message: 'Artwork not found' });

    // Authorization check
    if (artwork.artistId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to delete this artwork' });
    }

    await Artwork.findByIdAndDelete(req.params.id);
    res.json({ message: 'Artwork deleted successfully', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete artwork', error: error.message });
  }
});

module.exports = router;