const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { generateLessonAI, generateTestFromPDFText } = require('../services/ai/lessonAI.service');

const createLesson = async (req, res, next) => {
  try {
    const { title, content, groupId, subject } = req.body;
    if (!title || !groupId) return error(res, 'Title and group required', 400);

    const attachments = (req.files || []).map(f => ({ name: f.originalname, path: f.path, type: f.mimetype }));

    const lesson = await prisma.lesson.create({
      data: { title, content, subject: subject || 'biology', groupId, teacherId: req.user.userId, attachments },
      include: { group: { select: { id: true, name: true } }, teacher: { select: { id: true, name: true } } },
    });

    // Async AI generation
    setImmediate(() => generateLessonAI(lesson.id, title, content || '').catch(console.error));

    return success(res, lesson, 'Lesson created', 201);
  } catch (err) { next(err); }
};

const getLessons = async (req, res, next) => {
  try {
    const { groupId } = req.query;
    const where = { isActive: true };
    if (groupId) where.groupId = groupId;
    if (req.user.role === 'teacher') where.teacherId = req.user.userId;
    if (req.user.role === 'student') {
      const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
      if (user?.groupId) where.groupId = user.groupId;
    }
    const lessons = await prisma.lesson.findMany({
      where, orderBy: { order: 'asc' },
      include: { teacher: { select: { id: true, name: true } }, group: { select: { id: true, name: true } } },
    });
    return success(res, lessons);
  } catch (err) { next(err); }
};

const getLessonById = async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.id },
      include: { teacher: { select: { id: true, name: true } }, group: { select: { id: true, name: true } } },
    });
    if (!lesson) return error(res, 'Lesson not found', 404);

    if (req.user.role === 'student') {
      await prisma.lesson.update({ where: { id: lesson.id }, data: { views: { increment: 1 } } });
      // Award XP for viewing
      try {
        const { awardXP } = require('../services/gamification.service');
        await awardXP(req.user.userId, 5, 'lesson_view');
      } catch (_) {}
    }

    return success(res, lesson);
  } catch (err) { next(err); }
};

const updateLesson = async (req, res, next) => {
  try {
    const { title, content, subject, order } = req.body;
    const lesson = await prisma.lesson.update({
      where: { id: req.params.id },
      data: { title, content, subject, order },
    });
    return success(res, lesson);
  } catch (err) { next(err); }
};

const deleteLesson = async (req, res, next) => {
  try {
    await prisma.lesson.update({ where: { id: req.params.id }, data: { isActive: false } });
    return success(res, null, 'Lesson deleted');
  } catch (err) { next(err); }
};

const getAIContent = async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findUnique({ where: { id: req.params.id }, select: { aiContent: true } });
    if (!lesson) return error(res, 'Lesson not found', 404);
    return success(res, lesson.aiContent);
  } catch (err) { next(err); }
};

const regenerateAI = async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findUnique({ where: { id: req.params.id } });
    if (!lesson) return error(res, 'Not found', 404);
    await prisma.lesson.update({ where: { id: lesson.id }, data: { aiContent: { status: 'generating' } } });
    setImmediate(() => generateLessonAI(lesson.id, lesson.title, lesson.content || '').catch(console.error));
    return success(res, { status: 'generating' });
  } catch (err) { next(err); }
};

const extractTextFromFile = async (file) => {
  const mime = file.mimetype;

  // Plain text
  if (mime === 'text/plain') {
    return file.buffer.toString('utf8');
  }

  // PDF
  if (mime === 'application/pdf') {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(file.buffer);
    return data.text;
  }

  // DOCX / DOC
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mime === 'application/msword') {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  }

  // Images — use Gemini vision
  if (mime.startsWith('image/')) {
    const { getModel } = require('../config/gemini');
    const model = getModel(false);
    const imagePart = { inlineData: { data: file.buffer.toString('base64'), mimeType: mime } };
    const result = await model.generateContent([
      'Bu rasmning barcha matnini va ta\'lim mazmunini batafsil yoz. Mavzu, tushunchalar, jadvallar va diagrammalardagi ma\'lumotlarni ham yoz.',
      imagePart,
    ]);
    return result.response.text();
  }

  throw new Error('Qo\'llab-quvvatlanmaydigan fayl turi');
};

const generateTestFromPDF = async (req, res, next) => {
  try {
    const { groupId, title, timeLimit, passingScore } = req.body;
    if (!groupId) return error(res, 'groupId required', 400);
    if (!req.file) return error(res, 'Fayl yuborilmadi', 400);

    let extractedText;
    try {
      extractedText = await extractTextFromFile(req.file);
    } catch (e) {
      return error(res, `Fayldan matn chiqarib bo'lmadi: ${e.message}`, 400);
    }

    const pdfText = extractedText?.trim() || '';
    if (pdfText.length < 30) {
      return error(res, 'Faylda yetarli matn topilmadi', 400);
    }

    const testTitle = title || `Test - ${new Date().toLocaleDateString('uz-UZ')}`;
    const generated = await generateTestFromPDFText(pdfText, groupId, req.user.userId, testTitle);

    const questions = (generated.questions || []).map(q => ({
      text: q.text,
      type: 'mcq',
      options: q.options || [],
      difficulty: q.difficulty || 'medium',
      points: q.points || 1,
      explanation: q.explanation || '',
    }));

    if (questions.length === 0) {
      return error(res, 'AI could not generate questions from this PDF', 400);
    }

    const test = await prisma.test.create({
      data: {
        title: generated.title || testTitle,
        type: 'topic',
        groupId,
        teacherId: req.user.userId,
        timeLimit: parseInt(timeLimit) || 30,
        passingScore: parseInt(passingScore) || 60,
        questions: { create: questions },
      },
      include: { questions: true, group: { select: { id: true, name: true } } },
    });

    await prisma.test.update({ where: { id: test.id }, data: { totalPoints: test.questions.reduce((s, q) => s + q.points, 0) } });

    return success(res, test, 'Test generated from PDF', 201);
  } catch (err) { next(err); }
};

module.exports = { createLesson, getLessons, getLessonById, updateLesson, deleteLesson, getAIContent, regenerateAI, generateTestFromPDF };
