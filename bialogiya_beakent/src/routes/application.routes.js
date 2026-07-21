const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { createApplication, getApplications, updateApplicationStatus, deleteApplication } = require('../controllers/application.controller');

// Public - anyone can submit, no login required
router.post('/', createApplication);

// Admin only - review submitted applications
router.get('/', verifyToken, requireRole('admin'), getApplications);
router.put('/:id', verifyToken, requireRole('admin'), updateApplicationStatus);
router.delete('/:id', verifyToken, requireRole('admin'), deleteApplication);

module.exports = router;
