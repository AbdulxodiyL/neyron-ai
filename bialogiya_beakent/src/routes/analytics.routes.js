const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { getStudentAnalytics, getTeacherAnalytics, getLeaderboard } = require('../controllers/analytics.controller');
const { getNotifications, markNotifRead } = require('../controllers/ai.controller');

router.get('/teacher', verifyToken, requireRole('teacher', 'admin'), getTeacherAnalytics);
router.get('/student', verifyToken, requireRole('student'), getStudentAnalytics);
router.get('/student/:studentId', verifyToken, requireRole('teacher', 'admin'), getStudentAnalytics);
router.get('/leaderboard', verifyToken, getLeaderboard);
router.get('/notifications', verifyToken, getNotifications);
router.put('/notifications/read', verifyToken, markNotifRead);

module.exports = router;
