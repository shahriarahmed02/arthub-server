const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// Get User's Purchased Artworks & Transaction History
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

// Update Subscription Tier
router.patch('/subscription', async (req, res) => {
  try {
    const { email, tier } = req.body;
    const user = await User.findOneAndUpdate(
      { email },
      { subscriptionTier: tier },
      { new: true }
    ).select('-password');

    res.json({ message: `Successfully upgraded to ${tier} tier!`, user });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update subscription tier' });
  }
});

module.exports = router;