const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { createTeacher, getTeachers, getGroups, getMyBranches, createBranch } = require('../controllers/reception.controller');

const receptionOnly = [verifyToken, requireRole('reception', 'admin')];

router.get('/teachers', ...receptionOnly, getTeachers);
router.post('/teachers', ...receptionOnly, createTeacher);
router.get('/groups', ...receptionOnly, getGroups);

// Branches: admin can view (oversight) but only reception can create them.
router.get('/branches', ...receptionOnly, getMyBranches);
router.post('/branches', verifyToken, requireRole('reception'), createBranch);

module.exports = router;
