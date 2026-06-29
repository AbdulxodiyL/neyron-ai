const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/groups', require('./group.routes'));
router.use('/lessons', require('./lesson.routes'));
router.use('/homework', require('./homework.routes'));
router.use('/tests', require('./test.routes'));
router.use('/attendance', require('./attendance.routes'));
router.use('/resources', require('./resource.routes'));
router.use('/analytics', require('./analytics.routes'));
router.use('/admin', require('./admin.routes'));

module.exports = router;
