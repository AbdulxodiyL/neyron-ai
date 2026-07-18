const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const {
  createStudent, createTeacher, getAllUsers, getStudentsByTeacher,
  updateUser, updateProfile, deleteUser, resetStudentPassword, freezeStudent, changePassword
} = require('../controllers/user.controller');

router.get('/', verifyToken, requireRole('admin'), getAllUsers);
router.get('/my-students', verifyToken, requireRole('teacher'), getStudentsByTeacher);
// Creating/editing/deleting student accounts is reception's (and admin's)
// job now - teachers can view their students and freeze them, but not
// create, edit, or delete accounts.
router.post('/create-student', verifyToken, requireRole('admin', 'reception'), createStudent);
router.post('/create-teacher', verifyToken, requireRole('admin'), createTeacher);
router.put('/profile', verifyToken, updateProfile);
router.post('/change-password', verifyToken, changePassword);
router.put('/:id', verifyToken, requireRole('admin', 'reception'), updateUser);
router.delete('/:id', verifyToken, requireRole('admin', 'reception'), deleteUser);
router.post('/:id/reset-password', verifyToken, requireRole('admin', 'reception'), resetStudentPassword);
router.patch('/:id/freeze', verifyToken, requireRole('teacher', 'admin', 'reception'), freezeStudent);

module.exports = router;
