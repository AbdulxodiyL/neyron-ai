const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const {
  createHomework, getHomeworkByGroup, getMyHomework,
  submitHomework, getSubmissions, gradeSubmission, getTeacherHomework, getHomeworkById,
  updateHomework, deleteHomework
} = require('../controllers/homework.controller');

router.get('/my', verifyToken, requireRole('teacher'), getTeacherHomework);
router.get('/student', verifyToken, requireRole('student'), getMyHomework);
router.get('/group/:groupId', verifyToken, getHomeworkByGroup);
router.get('/submissions/:id/grade', verifyToken, requireRole('teacher', 'admin'), gradeSubmission); // keep old path
router.post('/', verifyToken, requireRole('teacher', 'admin'), upload.array('files', 3), createHomework);
router.post('/:homeworkId/submit', verifyToken, requireRole('student'), upload.array('files', 5), submitHomework);
router.get('/:homeworkId/submissions', verifyToken, requireRole('teacher', 'admin'), getSubmissions);
router.put('/submissions/:id/grade', verifyToken, requireRole('teacher', 'admin'), gradeSubmission);
router.get('/:id', verifyToken, getHomeworkById);
router.put('/:id', verifyToken, requireRole('teacher', 'admin'), updateHomework);
router.delete('/:id', verifyToken, requireRole('teacher', 'admin'), deleteHomework);

module.exports = router;
