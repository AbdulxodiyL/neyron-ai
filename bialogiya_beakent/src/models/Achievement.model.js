const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String, default: '🏆' },
  description: { type: String, required: true },
  xpReward: { type: Number, default: 50 },
  coinReward: { type: Number, default: 10 },
  condition: { type: String, required: true },
  rarity: { type: String, enum: ['common', 'rare', 'epic', 'legendary'], default: 'common' },
}, { timestamps: true });

module.exports = mongoose.model('Achievement', achievementSchema);
