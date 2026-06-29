const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  type: {
    type: String,
    enum: ['pdf', 'ppt', 'word', 'image', 'video', 'link', 'other'],
    default: 'pdf',
  },
  filePath: { type: String, default: null },
  fileUrl: { type: String, default: null },
  subject: { type: String, enum: ['biology', 'chemistry', 'both'], default: 'biology' },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null },
  downloads: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: true },
}, { timestamps: true });

resourceSchema.index({ groupId: 1, subject: 1 });

module.exports = mongoose.model('Resource', resourceSchema);
