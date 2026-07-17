const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const {
  createGroup, getMyGroups, getGroupById, updateGroup, deleteGroup,
  addStudentToGroup, removeStudentFromGroup, getAllGroups
} = require('../controllers/group.controller');

const adminOnly = [verifyToken, requireRole('admin')];
const receptionOnly = [verifyToken, requireRole('reception', 'admin')];

router.get('/all', verifyToken, requireRole('admin'), getAllGroups);
router.get('/', verifyToken, requireRole('teacher'), getMyGroups);
router.get('/:id', verifyToken, getGroupById);
router.post('/', ...receptionOnly, createGroup);
router.put('/:id', ...receptionOnly, updateGroup);
router.delete('/:id', ...receptionOnly, deleteGroup);
router.post('/:id/students', ...receptionOnly, addStudentToGroup);
router.delete('/:id/students/:studentId', ...receptionOnly, removeStudentFromGroup);

module.exports = router;
