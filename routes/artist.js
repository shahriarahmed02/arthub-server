const express = require('express');
const router = express.Router();
const Artwork = require('../models/Artwork');
const Transaction = require('../models/Transaction');

// Get all artworks uploaded by a specific artist
router.get('/my-artworks/:artistName', async (req, res) => {
  try {
    const artworks = await Artwork.find({ artistName: req.params.artistName }).sort({ createdAt: -1 });
    res.json(artworks);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching artist artworks', error: err.message });
  }
});

// Get sales history for artist's sold artworks
router.get('/sales-history/:artistName', async (req, res) => {
  try {
    const myArtworks = await Artwork.find({ artistName: req.params.artistName }).select('_id');
    const artworkIds = myArtworks.map(a => a._id);

    const sales = await Transaction.find({ artworkId: { $in: artworkIds } })
      .populate('artworkId')
      .sort({ createdAt: -1 });

    res.json(sales);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching sales history', error: err.message });
  }
});

module.exports = router;