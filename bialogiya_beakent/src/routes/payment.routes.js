const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { getGroupPayments, markPayment, removePayment } = require('../controllers/payment.controller');

router.get('/group/:groupId', verifyToken, requireRole('teacher', 'admin'), getGroupPayments);
router.post('/', verifyToken, requireRole('teacher', 'admin'), markPayment);
router.delete('/:studentId/:month', verifyToken, requireRole('teacher', 'admin'), removePayment);

module.exports = router;
