const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { createTeacher, getTeachers, getGroups } = require('../controllers/reception.controller');

const receptionOnly = [verifyToken, requireRole('reception', 'admin')];

router.get('/teachers', ...receptionOnly, getTeachers);
router.post('/teachers', ...receptionOnly, createTeacher);
router.get('/groups', ...receptionOnly, getGroups);

module.exports = router;
