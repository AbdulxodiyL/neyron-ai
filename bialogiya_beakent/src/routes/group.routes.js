const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const {
  createGroup, getMyGroups, getGroupById, updateGroup, deleteGroup,
  addStudentToGroup, removeStudentFromGroup, getAllGroups
} = require('../controllers/group.controller');

router.get('/all', verifyToken, requireRole('admin'), getAllGroups);
router.get('/', verifyToken, requireRole('teacher'), getMyGroups);
router.get('/:id', verifyToken, getGroupById);
router.post('/', verifyToken, requireRole('teacher', 'admin'), createGroup);
router.put('/:id', verifyToken, requireRole('teacher', 'admin'), updateGroup);
router.delete('/:id', verifyToken, requireRole('teacher', 'admin'), deleteGroup);
router.post('/:id/students', verifyToken, requireRole('teacher', 'admin'), addStudentToGroup);
router.delete('/:id/students/:studentId', verifyToken, requireRole('teacher', 'admin'), removeStudentFromGroup);

module.exports = router;
