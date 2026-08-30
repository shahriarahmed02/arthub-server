const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Artwork = require('../models/Artwork');
const Transaction = require('../models/Transaction');

// Get Platform Analytics Data
router.get('/analytics', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalArtists = await User.countDocuments({ role: 'artist' });
    const totalArtworks = await Artwork.countDocuments();
    const totalSold = await Artwork.countDocuments({ isSold: true });

    const transactions = await Transaction.find();
    const totalRevenue = transactions.reduce((sum, item) => sum + item.amount, 0);

    res.json({
      totalUsers,
      totalArtists,
      totalArtworks,
      totalSold,
      totalRevenue: totalRevenue.toFixed(2)
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching analytics', error: err.message });
  }
});

// Get All Users & Update Role
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update role' });
  }
});

// Get All Transactions
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

module.exports = router;