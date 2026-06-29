const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { markAttendance, getAttendanceByGroup, getMyAttendance } = require('../controllers/attendance.controller');

router.post('/', verifyToken, requireRole('teacher', 'admin'), markAttendance);
router.get('/my', verifyToken, requireRole('student'), getMyAttendance);
router.get('/group/:groupId', verifyToken, requireRole('teacher', 'admin'), getAttendanceByGroup);

module.exports = router;
