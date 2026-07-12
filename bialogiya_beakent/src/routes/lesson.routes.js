const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const { pdfUpload } = require('../middleware/upload.middleware');
const { createLesson, getLessons, getLessonById, updateLesson, deleteLesson, regenerateAI, getAIContent, generateTestFromPDF } = require('../controllers/lesson.controller');
const {
  chatMessage, getChatHistory, generateQuizForLesson,
  getStoryAudio, generateExplainerVideo, getExplainerVideo, getExplainerSlideAudio,
} = require('../controllers/ai.controller');

router.get('/', verifyToken, getLessons);
router.get('/:id', verifyToken, getLessonById);
router.get('/:id/ai', verifyToken, getAIContent);
router.post('/', verifyToken, requireRole('teacher', 'admin'), upload.array('files', 5), createLesson);
router.put('/:id', verifyToken, requireRole('teacher', 'admin'), upload.array('files', 5), updateLesson);
router.delete('/:id', verifyToken, requireRole('teacher', 'admin'), deleteLesson);
router.post('/:id/regenerate-ai', verifyToken, requireRole('teacher', 'admin'), regenerateAI);
router.post('/generate-test-from-pdf', verifyToken, requireRole('teacher', 'admin'), pdfUpload.single('pdf'), generateTestFromPDF);
router.post('/:lessonId/ai-chat', verifyToken, chatMessage);
router.get('/:lessonId/ai-chat/history', verifyToken, getChatHistory);
router.get('/:lessonId/quiz/generate', verifyToken, generateQuizForLesson);

// Story narration (audio) and concept/grammar explainer video (slides + audio)
router.get('/:id/ai/story-audio', verifyToken, getStoryAudio);
router.post('/:id/ai/explainer-video', verifyToken, generateExplainerVideo);
router.get('/:id/ai/explainer-video', verifyToken, getExplainerVideo);
router.get('/:id/ai/explainer-video/audio/:slideIndex', verifyToken, getExplainerSlideAudio);

module.exports = router;
