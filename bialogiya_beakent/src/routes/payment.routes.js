const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { getGroupPayments, markPayment, removePayment, exportGroupPayments } = require('../controllers/payment.controller');

router.get('/group/:groupId', verifyToken, requireRole('teacher', 'admin', 'reception'), getGroupPayments);
router.get('/group/:groupId/export', verifyToken, requireRole('teacher', 'admin', 'reception'), exportGroupPayments);
router.post('/', verifyToken, requireRole('teacher', 'admin', 'reception'), markPayment);
router.delete('/:studentId/:month', verifyToken, requireRole('teacher', 'admin', 'reception'), removePayment);

module.exports = router;
