const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { chatWithAI } = require('../services/ai/chatAI.service');
const { generateQuiz } = require('../services/ai/lessonAI.service');
const { synthesizeSpeech, MIME_TYPE: TTS_MIME_TYPE } = require('../services/ai/geminiTts.service');
const { synthesizeWithClonedVoice } = require('../services/ai/voiceClone.service');
const { generateExplainerScript } = require('../services/ai/explainerVideoAI.service');
const { generateImage } = require('../services/ai/geminiImage.service');

// Students can only reach lessons in their own group (see lesson.controller
// getLessons for the same rule); this helper re-checks that on every AI-media
// endpoint since they're fetched directly by lesson id.
const assertLessonAccess = async (lesson, user) => {
  if (user.role === 'admin' || user.role === 'teacher') return true;
  const student = await prisma.user.findUnique({ where: { id: user.userId }, select: { groupId: true } });
  return !!student?.groupId && student.groupId === lesson.groupId;
};

const streamAudioBuffer = (res, buffer, mimeType) => {
  res.set({
    'Content-Type': mimeType,
    'Content-Length': buffer.length,
    'Cache-Control': 'private, max-age=86400',
  });
  res.send(buffer);
};

// Prefer the lesson's teacher's cloned voice (uploaded via /api/voice/clone)
// when one exists, otherwise fall back to the default OpenAI TTS voice.
const synthesizeForLesson = async (teacherId, text) => {
  const teacher = await prisma.user.findUnique({ where: { id: teacherId }, select: { clonedVoiceId: true } });
  if (teacher?.clonedVoiceId) {
    try {
      const buffer = await synthesizeWithClonedVoice(text, teacher.clonedVoiceId);
      return { buffer, mimeType: 'audio/mpeg' }; // ElevenLabs returns mp3
    } catch (err) {
      console.error('Cloned-voice synthesis failed, falling back to default Gemini voice:', err.message);
    }
  }
  const buffer = await synthesizeSpeech(text);
  return { buffer, mimeType: TTS_MIME_TYPE }; // Gemini returns wav
};

// GET /api/lessons/:id/ai/story-audio - TTS narration of the AI-generated
// "storyMode" text, generated once and cached in LessonMedia after that.
const getStoryAudio = async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findUnique({ where: { id: req.params.id } });
    if (!lesson) return error(res, 'Lesson not found', 404);
    if (!(await assertLessonAccess(lesson, req.user))) return error(res, 'Forbidden', 403);

    const storyText = lesson.aiContent?.storyMode;
    if (!storyText) return error(res, 'Story not generated yet for this lesson', 404);

    const cached = await prisma.lessonMedia.findUnique({
      where: { lessonId_kind_slideIndex: { lessonId: lesson.id, kind: 'story', slideIndex: -1 } },
    });
    if (cached) return streamAudioBuffer(res, cached.data, cached.mimeType);

    const { buffer: audio, mimeType } = await synthesizeForLesson(lesson.teacherId, storyText);
    const saved = await prisma.lessonMedia.create({
      data: { lessonId: lesson.id, kind: 'story', slideIndex: -1, data: audio, mimeType },
    });
    return streamAudioBuffer(res, saved.data, saved.mimeType);
  } catch (err) { next(err); }
};

// GET /api/lessons/:id/ai/voice-audio - TTS narration of the AI-generated
// "simpleExplanation" text, used by the "AI Voice Teacher" tab. Always uses
// the fixed Gemini voice (no browser speechSynthesis, no voice picker) so
// the Uzbek pronunciation is consistent and good quality.
const getVoiceAudio = async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findUnique({ where: { id: req.params.id } });
    if (!lesson) return error(res, 'Lesson not found', 404);
    if (!(await assertLessonAccess(lesson, req.user))) return error(res, 'Forbidden', 403);

    const explanationText = lesson.aiContent?.simpleExplanation || lesson.title;
    if (!explanationText) return error(res, 'No explanation available for this lesson', 404);

    const cached = await prisma.lessonMedia.findUnique({
      where: { lessonId_kind_slideIndex: { lessonId: lesson.id, kind: 'voice', slideIndex: -1 } },
    });
    if (cached) return streamAudioBuffer(res, cached.data, cached.mimeType);

    const { buffer: audio, mimeType } = await synthesizeForLesson(lesson.teacherId, explanationText);
    const saved = await prisma.lessonMedia.create({
      data: { lessonId: lesson.id, kind: 'voice', slideIndex: -1, data: audio, mimeType },
    });
    return streamAudioBuffer(res, saved.data, saved.mimeType);
  } catch (err) { next(err); }
};

// POST /api/lessons/:id/ai/explainer-video - generate (or regenerate) the
// slide script for the concept/grammar explainer. Slide audio is generated
// lazily per-slide the first time it's played (see getExplainerSlideAudio).
const generateExplainerVideo = async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findUnique({ where: { id: req.params.id } });
    if (!lesson) return error(res, 'Lesson not found', 404);
    if (!(await assertLessonAccess(lesson, req.user))) return error(res, 'Forbidden', 403);

    const { language } = req.body || {};
    const script = await generateExplainerScript(lesson.title, lesson.content || '', language || 'uz');

    const aiContent = { ...(lesson.aiContent || {}), explainerVideo: script };
    await prisma.lesson.update({ where: { id: lesson.id }, data: { aiContent } });
    // Clear any stale cached slide audio from a previous script version
    await prisma.lessonMedia.deleteMany({ where: { lessonId: lesson.id, kind: 'explainer_slide' } });

    return success(res, script, 'Explainer video generated', 201);
  } catch (err) { next(err); }
};

// GET /api/lessons/:id/ai/explainer-video - returns the cached slide script
const getExplainerVideo = async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findUnique({ where: { id: req.params.id }, select: { groupId: true, aiContent: true } });
    if (!lesson) return error(res, 'Lesson not found', 404);
    if (!(await assertLessonAccess(lesson, req.user))) return error(res, 'Forbidden', 403);

    const script = lesson.aiContent?.explainerVideo || null;
    return success(res, script);
  } catch (err) { next(err); }
};

// GET /api/lessons/:id/ai/explainer-video/audio/:slideIndex - lazy per-slide TTS
const getExplainerSlideAudio = async (req, res, next) => {
  try {
    const slideIndex = parseInt(req.params.slideIndex, 10);
    if (Number.isNaN(slideIndex)) return error(res, 'Invalid slide index', 400);

    const lesson = await prisma.lesson.findUnique({ where: { id: req.params.id } });
    if (!lesson) return error(res, 'Lesson not found', 404);
    if (!(await assertLessonAccess(lesson, req.user))) return error(res, 'Forbidden', 403);

    const script = lesson.aiContent?.explainerVideo;
    const slide = script?.slides?.[slideIndex];
    if (!slide) return error(res, 'Slide not found', 404);

    const cached = await prisma.lessonMedia.findUnique({
      where: { lessonId_kind_slideIndex: { lessonId: lesson.id, kind: 'explainer_slide', slideIndex } },
    });
    if (cached) return streamAudioBuffer(res, cached.data, cached.mimeType);

    const { buffer: audio, mimeType } = await synthesizeForLesson(lesson.teacherId, slide.narration);
    const saved = await prisma.lessonMedia.create({
      data: { lessonId: lesson.id, kind: 'explainer_slide', slideIndex, data: audio, mimeType },
    });
    return streamAudioBuffer(res, saved.data, saved.mimeType);
  } catch (err) { next(err); }
};

// GET /api/lessons/:id/ai/explainer-video/image/:slideIndex - lazy per-slide
// illustration, generated once and cached in LessonMedia after that.
const getExplainerSlideImage = async (req, res, next) => {
  try {
    const slideIndex = parseInt(req.params.slideIndex, 10);
    if (Number.isNaN(slideIndex)) return error(res, 'Invalid slide index', 400);

    const lesson = await prisma.lesson.findUnique({ where: { id: req.params.id } });
    if (!lesson) return error(res, 'Lesson not found', 404);
    if (!(await assertLessonAccess(lesson, req.user))) return error(res, 'Forbidden', 403);

    const script = lesson.aiContent?.explainerVideo;
    const slide = script?.slides?.[slideIndex];
    if (!slide) return error(res, 'Slide not found', 404);

    const cached = await prisma.lessonMedia.findUnique({
      where: { lessonId_kind_slideIndex: { lessonId: lesson.id, kind: 'explainer_slide_image', slideIndex } },
    });
    if (cached) return streamAudioBuffer(res, cached.data, cached.mimeType);

    const { buffer: image, mimeType } = await generateImage(slide.imagePrompt);
    const saved = await prisma.lessonMedia.create({
      data: { lessonId: lesson.id, kind: 'explainer_slide_image', slideIndex, data: image, mimeType },
    });
    return streamAudioBuffer(res, saved.data, saved.mimeType);
  } catch (err) { next(err); }
};

const chatMessage = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const { message, style, language } = req.body;
    if (!message) return error(res, 'Message required', 400);

    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true, title: true, content: true } });
    if (!lesson) return error(res, 'Lesson not found', 404);

    let chat = await prisma.aIChat.findUnique({
      where: { lessonId_studentId: { lessonId, studentId: req.user.userId } },
    });

    const messages = chat ? (Array.isArray(chat.messages) ? chat.messages : []) : [];
    messages.push({ role: 'user', content: message, timestamp: new Date() });

    const aiReply = await chatWithAI(lesson, messages, message, style || 'normal', language || 'uz');
    messages.push({ role: 'assistant', content: aiReply, timestamp: new Date() });

    if (chat) {
      chat = await prisma.aIChat.update({ where: { id: chat.id }, data: { messages, style: style || chat.style, language: language || chat.language } });
    } else {
      chat = await prisma.aIChat.create({ data: { lessonId, studentId: req.user.userId, messages, style: style || 'normal', language: language || 'uz' } });
    }

    return success(res, { reply: aiReply, chatId: chat.id });
  } catch (err) { next(err); }
};

const getChatHistory = async (req, res, next) => {
  try {
    const { lessonId } = req.params;
    const chat = await prisma.aIChat.findUnique({
      where: { lessonId_studentId: { lessonId, studentId: req.user.userId } },
    });
    return success(res, chat || { messages: [] });
  } catch (err) { next(err); }
};

const generateQuizForLesson = async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId } });
    if (!lesson) return error(res, 'Lesson not found', 404);
    const { difficulty } = req.query;
    const quiz = await generateQuiz(lesson.title, lesson.content || '', difficulty || 'medium');
    return success(res, quiz);
  } catch (err) { next(err); }
};

const getNotifications = async (req, res, next) => {
  try {
    const notifs = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return success(res, notifs);
  } catch (err) { next(err); }
};

const markNotifRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user.userId }, data: { isRead: true, readAt: new Date() } });
    return success(res, null, 'Marked as read');
  } catch (err) { next(err); }
};

module.exports = {
  chatMessage, getChatHistory, generateQuizForLesson, getNotifications, markNotifRead,
  getStoryAudio, getVoiceAudio, generateExplainerVideo, getExplainerVideo, getExplainerSlideAudio, getExplainerSlideImage,
};
