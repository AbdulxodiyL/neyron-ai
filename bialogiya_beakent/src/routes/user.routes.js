const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const {
  createStudent, createTeacher, getAllUsers, getStudentsByTeacher,
  updateUser, updateProfile, deleteUser, resetStudentPassword
} = require('../controllers/user.controller');

router.get('/', verifyToken, requireRole('admin'), getAllUsers);
router.get('/my-students', verifyToken, requireRole('teacher'), getStudentsByTeacher);
router.post('/create-student', verifyToken, requireRole('teacher', 'admin'), createStudent);
router.post('/create-teacher', verifyToken, requireRole('admin'), createTeacher);
router.put('/profile', verifyToken, updateProfile);
router.put('/:id', verifyToken, requireRole('admin'), updateUser);
router.delete('/:id', verifyToken, requireRole('admin'), deleteUser);
router.post('/:id/reset-password', verifyToken, requireRole('teacher', 'admin'), resetStudentPassword);

module.exports = router;
