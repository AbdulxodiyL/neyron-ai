const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { prisma } = require('../config/db');
const { success } = require('../utils/apiResponse');
const { createTeacher, getTeachers, getGroups, getAllGroups } = require('../controllers/reception.controller');
const {
  createStudent, getStudentsByTeacher, updateUser, deleteUser, resetStudentPassword, freezeStudent
} = require('../controllers/user.controller');
const {
  createGroup, getMyGroups, getGroupById, updateGroup, deleteGroup,
  addStudentToGroup, removeStudentFromGroup
} = require('../controllers/group.controller');

const receptionOnly = [verifyToken, requireRole('reception')];
const receptionOrAdmin = [verifyToken, requireRole('reception', 'admin')];

router.get('/teachers', ...receptionOnly, getTeachers);
router.post('/teachers', ...receptionOnly, createTeacher);
router.get('/groups', ...receptionOnly, getGroups);

router.get('/students', ...receptionOnly, async (req, res, next) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'student', isActive: true },
      include: { group: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
    return success(res, students);
  } catch (err) { next(err); }
});

router.post('/students', ...receptionOnly, createStudent);
router.put('/students/:id', ...receptionOnly, updateUser);
router.delete('/students/:id', ...receptionOnly, deleteUser);
router.patch('/students/:id/freeze', ...receptionOnly, freezeStudent);
router.post('/students/:id/reset-password', ...receptionOnly, resetStudentPassword);

router.get('/all-groups', ...receptionOnly, getAllGroups);
router.get('/groups/:id', ...receptionOnly, getGroupById);
router.post('/groups', ...receptionOnly, createGroup);
router.put('/groups/:id', ...receptionOnly, updateGroup);
router.delete('/groups/:id', ...receptionOnly, deleteGroup);
router.post('/groups/:id/students', ...receptionOnly, addStudentToGroup);
router.delete('/groups/:id/students/:studentId', ...receptionOnly, removeStudentFromGroup);

module.exports = router;
