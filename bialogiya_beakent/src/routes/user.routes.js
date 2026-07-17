const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const {
  createStudent, createTeacher, getAllUsers, getStudentsByTeacher,
  updateUser, updateProfile, deleteUser, resetStudentPassword, freezeStudent, changePassword
} = require('../controllers/user.controller');

const adminOnly = [verifyToken, requireRole('admin')];
const receptionOnly = [verifyToken, requireRole('reception', 'admin')];

router.get('/', verifyToken, requireRole('admin'), getAllUsers);
router.get('/my-students', verifyToken, requireRole('teacher'), getStudentsByTeacher);
router.post('/create-student', ...receptionOnly, createStudent);
router.post('/create-teacher', ...adminOnly, createTeacher);
router.put('/profile', verifyToken, updateProfile);
router.post('/change-password', verifyToken, changePassword);
router.put('/:id', ...receptionOnly, updateUser);
router.delete('/:id', ...receptionOnly, deleteUser);
router.post('/:id/reset-password', ...receptionOnly, resetStudentPassword);
router.patch('/:id/freeze', ...receptionOnly, freezeStudent);

module.exports = router;
