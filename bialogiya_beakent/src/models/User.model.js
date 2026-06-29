const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true, sparse: true },
  username: { type: String, unique: true, required: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'teacher', 'student'], required: true },
  avatar: { type: String, default: null },
  phone: { type: String, default: null },
  language: { type: String, enum: ['uz', 'ru', 'en'], default: 'uz' },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  xp: { type: Number, default: 0 },
  coins: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActiveDate: { type: Date, default: null },
  },
  achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Achievement' }],
  refreshTokenHash: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
}, { timestamps: true });

userSchema.methods.matchPassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = async (password) => {
  return bcrypt.hash(password, 12);
};

userSchema.virtual('levelInfo').get(function () {
  return {
    level: this.level,
    xp: this.xp,
    xpForNextLevel: Math.pow(this.level + 1, 2) * 100,
    xpForCurrentLevel: Math.pow(this.level, 2) * 100,
  };
});

userSchema.index({ username: 1 });
userSchema.index({ groupId: 1 });
userSchema.index({ teacherId: 1 });

module.exports = mongoose.model('User', userSchema);
