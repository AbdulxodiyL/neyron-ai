const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['topic', 'weekly', 'monthly', 'mock'],
    default: 'topic',
  },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  timeLimit: { type: Number, default: 30 },
  totalPoints: { type: Number, default: 100 },
  passingScore: { type: Number, default: 60 },
  isAIGenerated: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  availableFrom: { type: Date, default: Date.now },
  availableUntil: { type: Date, default: null },
}, { timestamps: true });

testSchema.index({ groupId: 1 });

module.exports = mongoose.model('Test', testSchema);
