const express = require('express');
const Comment = require('../models/Comment');
const Transaction = require('../models/Transaction');
const jwt = require('jsonwebtoken');

const router = express.Router();

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

// Get comments for an artwork (Public)
router.get('/:artworkId', async (req, res) => {
  try {
    const comments = await Comment.find({ artworkId: req.params.artworkId }).sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

// Post a comment (Only if user purchased this artwork)
router.post('/:artworkId', verifyToken, async (req, res) => {
  try {
    const { comment, userName, userAvatar } = req.body;
    const { artworkId } = req.params;

    // Check if user has bought this artwork
    const hasPurchased = await Transaction.findOne({
      userId: req.user.id,
      artworkId: artworkId,
      type: 'purchase'
    });

    if (!hasPurchased && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only comment on artworks you have purchased!' });
    }

    const newComment = new Comment({
      artworkId,
      userId: req.user.id,
      userName: userName || 'Anonymous',
      userAvatar: userAvatar || '',
      comment
    });

    await newComment.save();
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
});

module.exports = router;