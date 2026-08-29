const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'artist', 'admin'], default: 'user' },
  avatar: { type: String, default: 'https://i.ibb.co/default-avatar.png' },
  subscriptionTier: { type: String, enum: ['free', 'pro', 'premium'], default: 'free' },
  purchaseCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);