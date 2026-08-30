const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// 1. Get User Profile by Email
router.get('/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user profile', error: err.message });
  }
});

// 2. Get User's Purchased Artworks & Transaction History
router.get('/purchases/:email', async (req, res) => {
  try {
    const transactions = await Transaction.find({ userEmail: req.params.email })
      .populate('artworkId')
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching purchase history', error: err.message });
  }
});

// 3. Update Subscription Tier
router.patch('/subscription', async (req, res) => {
  try {
    const { email, tier } = req.body;

    if (!email || !tier) {
      return res.status(400).json({ message: 'Email and subscription tier are required' });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { subscriptionTier: tier },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: `Successfully upgraded to ${tier} tier!`, user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update subscription tier', error: err.message });
  }
});

module.exports = router;