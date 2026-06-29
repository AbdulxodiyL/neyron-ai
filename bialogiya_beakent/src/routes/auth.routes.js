const express = require('express');
const router = express.Router();
const { login, refresh, logout, getMe } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, getMe);

module.exports = router;
