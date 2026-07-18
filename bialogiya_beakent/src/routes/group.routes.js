const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const {
  createGroup, getMyGroups, getGroupById, updateGroup, deleteGroup,
  addStudentToGroup, removeStudentFromGroup, getAllGroups
} = require('../controllers/group.controller');

// Teachers can only VIEW their groups - creating/editing/deleting groups
// and adding/removing students is reception's (and admin's) job now.
router.get('/all', verifyToken, requireRole('admin', 'reception'), getAllGroups);
router.get('/', verifyToken, requireRole('teacher'), getMyGroups);
router.get('/:id', verifyToken, getGroupById);
router.post('/', verifyToken, requireRole('admin', 'reception'), createGroup);
router.put('/:id', verifyToken, requireRole('admin', 'reception'), updateGroup);
router.delete('/:id', verifyToken, requireRole('admin', 'reception'), deleteGroup);
router.post('/:id/students', verifyToken, requireRole('admin', 'reception'), addStudentToGroup);
router.delete('/:id/students/:studentId', verifyToken, requireRole('admin', 'reception'), removeStudentFromGroup);

module.exports = router;
