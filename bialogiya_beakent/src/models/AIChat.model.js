const mongoose = require('mongoose');

const aiChatSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  }],
  style: {
    type: String,
    enum: ['normal', 'like_im_10', 'emoji', 'step_by_step', 'with_examples'],
    default: 'normal',
  },
  language: { type: String, enum: ['uz', 'ru', 'en'], default: 'uz' },
}, { timestamps: true });

aiChatSchema.index({ studentId: 1, lessonId: 1 });

module.exports = mongoose.model('AIChat', aiChatSchema);
