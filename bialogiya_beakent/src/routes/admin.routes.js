const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const {
  getStats, getTeachers, createTeacher, updateTeacher, deleteTeacher,
  getStudents, getGroups, toggleUserStatus, getSettings, updateSettings,
  getReceptionUsers, createReceptionUser, deleteReceptionUser,
} = require('../controllers/admin.controller');

const adminOnly = [verifyToken, requireRole('admin')];

router.get('/stats', ...adminOnly, getStats);
router.get('/teachers', ...adminOnly, getTeachers);
router.post('/teachers', ...adminOnly, createTeacher);
router.put('/teachers/:id', ...adminOnly, updateTeacher);
router.delete('/teachers/:id', ...adminOnly, deleteTeacher);
router.get('/students', ...adminOnly, getStudents);
router.get('/groups', ...adminOnly, getGroups);
router.put('/users/:id/toggle', ...adminOnly, toggleUserStatus);
router.get('/settings', ...adminOnly, getSettings);
router.put('/settings', ...adminOnly, updateSettings);

// Reception accounts - only admin can create/deactivate them.
router.get('/reception', ...adminOnly, getReceptionUsers);
router.post('/reception', ...adminOnly, createReceptionUser);
router.delete('/reception/:id', ...adminOnly, deleteReceptionUser);

module.exports = router;
