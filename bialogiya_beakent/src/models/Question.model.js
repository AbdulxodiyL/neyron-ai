const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  text: { type: String, required: true },
  type: { type: String, enum: ['multiple_choice', 'open_ended'], default: 'multiple_choice' },
  options: [{ text: String, isCorrect: Boolean }],
  correctAnswer: { type: String, default: '' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  topic: { type: String, default: '' },
  points: { type: Number, default: 10 },
  explanation: { type: String, default: '' },
}, { timestamps: true });

questionSchema.index({ testId: 1 });

module.exports = mongoose.model('Question', questionSchema);
