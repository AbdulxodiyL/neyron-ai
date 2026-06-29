const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  homeworkId: { type: mongoose.Schema.Types.ObjectId, ref: 'Homework', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  answerText: { type: String, default: '' },
  filePaths: [{ name: String, path: String, type: String }],
  aiGrade: {
    score: { type: Number, default: null },
    feedback: { type: String, default: '' },
    suggestions: [String],
    gradedAt: { type: Date, default: null },
  },
  teacherGrade: {
    score: { type: Number, default: null },
    comment: { type: String, default: '' },
    gradedAt: { type: Date, default: null },
  },
  finalScore: { type: Number, default: null },
  status: {
    type: String,
    enum: ['submitted', 'ai_graded', 'teacher_reviewed'],
    default: 'submitted',
  },
  submittedAt: { type: Date, default: Date.now },
  isLate: { type: Boolean, default: false },
}, { timestamps: true });

submissionSchema.index({ homeworkId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
