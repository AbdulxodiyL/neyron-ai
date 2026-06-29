const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', default: null },
  date: { type: Date, required: true },
  records: [{
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['present', 'absent', 'late'], default: 'absent' },
    note: { type: String, default: '' },
  }],
}, { timestamps: true });

attendanceSchema.index({ groupId: 1, date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
