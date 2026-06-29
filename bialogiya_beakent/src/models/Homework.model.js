const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null },
  dueDate: { type: Date, required: true },
  attachments: [{ name: String, path: String, type: String }],
  maxScore: { type: Number, default: 100 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

homeworkSchema.index({ groupId: 1, dueDate: 1 });

module.exports = mongoose.model('Homework', homeworkSchema);
