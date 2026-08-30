const express = require('express');
const Stripe = require('stripe');
const User = require('../models/User');
const Artwork = require('../models/Artwork');
const Transaction = require('../models/Transaction');
const jwt = require('jsonwebtoken');

const router = express.Router();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Create Stripe Checkout Session for Purchasing Artwork
router.post('/create-checkout-session', verifyToken, async (req, res) => {
  try {
    const { artworkId } = req.body;
    const user = await User.findById(req.user.id);
    const artwork = await Artwork.findById(artworkId);

    if (!artwork || artwork.isSold) {
      return res.status(400).json({ message: 'Artwork is not available or sold out' });
    }

    // Check Subscription Purchase Limits
    const limits = { free: 3, pro: 9, premium: Infinity };
    if (user.purchaseCount >= limits[user.subscriptionTier]) {
      return res.status(403).json({
        message: `Limit reached for ${user.subscriptionTier} tier. Please upgrade your subscription!`
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: artwork.title, images: [artwork.imageUrl] },
          unit_amount: Math.round(artwork.price * 100)
        },
        quantity: 1
      }],
      metadata: {
        type: 'purchase',
        userId: user._id.toString(),
        artworkId: artwork._id.toString(),
        artistId: artwork.artistId.toString()
      },
      success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/user?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/artworks/${artwork._id}`
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    res.status(500).json({ message: 'Stripe Session Error', error: error.message });
  }
});

// Confirm Payment Success & Update DB
router.post('/payment-success', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      const { type, userId, artworkId, artistId } = session.metadata;

      const existingTx = await Transaction.findOne({ transactionId: session.id });
      if (!existingTx) {
        await Transaction.create({
          transactionId: session.id,
          type: 'purchase',
          userId,
          userEmail: session.customer_details?.email || req.user.email,
          artworkId,
          artistId,
          amount: session.amount_total / 100
        });

        await Artwork.findByIdAndUpdate(artworkId, { isSold: true });
        await User.findByIdAndUpdate(userId, { $inc: { purchaseCount: 1 } });
      }
      return res.json({ success: true, message: 'Purchase confirmed!' });
    }
    res.status(400).json({ success: false, message: 'Payment incomplete' });
  } catch (error) {
    res.status(500).json({ message: 'Payment confirmation failed', error: error.message });
  }
});

module.exports = router;