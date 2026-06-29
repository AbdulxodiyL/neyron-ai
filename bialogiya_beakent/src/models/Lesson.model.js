const mongoose = require('mongoose');

const flashcardSchema = new mongoose.Schema({
  front: String,
  back: String,
}, { _id: false });

const mindMapNodeSchema = new mongoose.Schema({
  id: String,
  label: String,
  type: { type: String, default: 'default' },
  x: Number,
  y: Number,
}, { _id: false });

const mindMapEdgeSchema = new mongoose.Schema({
  source: String,
  target: String,
  label: { type: String, default: '' },
}, { _id: false });

const quizQuestionSchema = new mongoose.Schema({
  text: String,
  options: [{ text: String, isCorrect: Boolean }],
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  explanation: String,
}, { _id: false });

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, default: '' },
  subject: { type: String, enum: ['biology', 'chemistry', 'both'], default: 'biology' },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attachments: [{ name: String, path: String, type: String, size: Number }],
  order: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true },
  views: { type: Number, default: 0 },
  discussionEnabled: { type: Boolean, default: true },
  aiContent: {
    status: { type: String, enum: ['pending', 'generating', 'done', 'error'], default: 'pending' },
    errorMessage: { type: String, default: null },
    simpleExplanation: { type: String, default: '' },
    mnemonics: { type: String, default: '' },
    storyMode: { type: String, default: '' },
    realLifeExamples: { type: String, default: '' },
    summary: { type: String, default: '' },
    flashcards: [flashcardSchema],
    mindMapData: {
      nodes: [mindMapNodeSchema],
      edges: [mindMapEdgeSchema],
    },
    quizQuestions: [quizQuestionSchema],
    generatedAt: { type: Date, default: null },
  },
}, { timestamps: true });

lessonSchema.index({ groupId: 1, order: 1 });
lessonSchema.index({ teacherId: 1 });

module.exports = mongoose.model('Lesson', lessonSchema);
