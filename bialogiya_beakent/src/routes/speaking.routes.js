const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { createSpeakingSession } = require('../controllers/speaking.controller');

router.post('/session', verifyToken, createSpeakingSession);

module.exports = router;
