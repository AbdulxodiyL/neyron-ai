const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  subject: { type: String, enum: ['biology', 'chemistry', 'both'], default: 'biology' },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  color: { type: String, default: '#00BFA6' },
  icon: { type: String, default: '🧬' },
}, { timestamps: true });

groupSchema.index({ teacherId: 1 });

module.exports = mongoose.model('Group', groupSchema);
