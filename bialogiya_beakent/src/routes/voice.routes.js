const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { voiceSampleUpload } = require('../middleware/upload.middleware');
const { uploadVoiceSample, getVoiceProfile, removeVoiceProfile } = require('../controllers/voice.controller');

router.post('/clone', verifyToken, voiceSampleUpload.single('sample'), uploadVoiceSample);
router.get('/profile', verifyToken, getVoiceProfile);
router.delete('/profile', verifyToken, removeVoiceProfile);

module.exports = router;
