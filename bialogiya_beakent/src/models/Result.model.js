const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    selectedOption: { type: Number, default: null },
    answerText: { type: String, default: '' },
    isCorrect: { type: Boolean, default: false },
    points: { type: Number, default: 0 },
  }],
  score: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  timeTaken: { type: Number, default: 0 },
  passed: { type: Boolean, default: false },
  aiAnalysis: {
    strongTopics: [String],
    weakTopics: [String],
    studyRecommendations: [String],
    analyzedAt: { type: Date, default: null },
  },
  completedAt: { type: Date, default: Date.now },
}, { timestamps: true });

resultSchema.index({ testId: 1, studentId: 1 });
resultSchema.index({ studentId: 1, completedAt: -1 });

module.exports = mongoose.model('Result', resultSchema);
