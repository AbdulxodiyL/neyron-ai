const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');

const createTest = async (req, res, next) => {
  try {
    const { title, type, groupId, lessonId, timeLimit, passingScore, availableFrom, availableUntil, questions } = req.body;
    if (!title || !groupId) return error(res, 'Title and group required', 400);

    const test = await prisma.test.create({
      data: {
        title, type: type || 'topic', groupId, lessonId: lessonId || null,
        teacherId: req.user.userId, timeLimit: timeLimit || 30, passingScore: passingScore || 60,
        availableFrom: availableFrom ? new Date(availableFrom) : null,
        availableUntil: availableUntil ? new Date(availableUntil) : null,
        questions: {
          create: (questions || []).map(q => ({
            text: q.text, type: q.type || 'mcq', options: q.options || [], difficulty: q.difficulty || 'medium', points: q.points || 1, explanation: q.explanation,
          })),
        },
      },
      include: { questions: true, group: { select: { id: true, name: true } } },
    });

    await prisma.test.update({ where: { id: test.id }, data: { totalPoints: test.questions.reduce((s, q) => s + q.points, 0) } });

    return success(res, test, 'Test created', 201);
  } catch (err) { next(err); }
};

const getTests = async (req, res, next) => {
  try {
    const { groupId } = req.query;
    const where = { isActive: true };
    if (groupId) where.groupId = groupId;
    if (req.user.role === 'teacher') where.teacherId = req.user.userId;
    if (req.user.role === 'student') {
      const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { groupId: true } });
      if (user?.groupId) where.groupId = user.groupId;
    }
    const tests = await prisma.test.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { group: { select: { id: true, name: true } }, _count: { select: { questions: true, results: true } } },
    });
    return success(res, tests);
  } catch (err) { next(err); }
};

const getTestById = async (req, res, next) => {
  try {
    const test = await prisma.test.findUnique({
      where: { id: req.params.id },
      include: { questions: req.user.role !== 'student', group: { select: { id: true, name: true } } },
    });
    if (!test) return error(res, 'Test not found', 404);
    if (req.user.role === 'student') {
      // Shuffle and hide correct answers
      const q = await prisma.question.findMany({ where: { testId: test.id }, select: { id: true, text: true, type: true, options: true, points: true } });
      return success(res, { ...test, questions: q });
    }
    return success(res, test);
  } catch (err) { next(err); }
};

const submitTest = async (req, res, next) => {
  try {
    const { answers, timeTaken } = req.body;
    const test = await prisma.test.findUnique({ where: { id: req.params.id }, include: { questions: true } });
    if (!test) return error(res, 'Test not found', 404);

    // Grade answers
    let score = 0;
    const gradedAnswers = (answers || []).map(a => {
      const q = test.questions.find(q => q.id === a.questionId);
      if (!q) return a;
      const opts = Array.isArray(q.options) ? q.options : [];
      const correct = opts.find(o => o.isCorrect);
      const isCorrect = correct && a.answer === correct.text;
      if (isCorrect) score += q.points;
      return { ...a, isCorrect, correctAnswer: correct?.text };
    });

    const totalPoints = test.totalPoints || test.questions.reduce((s, q) => s + q.points, 0) || 1;
    const percentage = Math.round((score / totalPoints) * 100);
    const passed = percentage >= test.passingScore;

    const result = await prisma.result.create({
      data: { testId: test.id, studentId: req.user.userId, answers: gradedAnswers, score, percentage, passed, timeTaken: timeTaken || 0 },
    });

    // Award XP
    try {
      const { awardXP } = require('../services/gamification.service');
      await awardXP(req.user.userId, passed ? 50 : 20, 'test_complete');
    } catch (_) {}

    // Async AI analysis
    setImmediate(async () => {
      try {
        const { analyzeTestResults } = require('../services/ai/gradingAI.service');
        const aiAnalysis = await analyzeTestResults(test.questions, gradedAnswers);
        await prisma.result.update({ where: { id: result.id }, data: { aiAnalysis } });
      } catch (_) {}
    });

    return success(res, { result, score, percentage, passed });
  } catch (err) { next(err); }
};

const getTestResults = async (req, res, next) => {
  try {
    const where = { testId: req.params.id };
    if (req.user.role === 'student') where.studentId = req.user.userId;
    const results = await prisma.result.findMany({
      where, orderBy: { completedAt: 'desc' },
      include: { student: { select: { id: true, name: true } } },
    });
    return success(res, results);
  } catch (err) { next(err); }
};

const getMyResults = async (req, res, next) => {
  try {
    const results = await prisma.result.findMany({
      where: { studentId: req.user.userId },
      orderBy: { completedAt: 'desc' },
      include: { test: { select: { id: true, title: true, type: true, totalPoints: true, passingScore: true } } },
    });
    return success(res, results);
  } catch (err) { next(err); }
};

const deleteTest = async (req, res, next) => {
  try {
    const test = await prisma.test.findFirst({ where: { id: req.params.id, teacherId: req.user.userId } });
    if (!test) return error(res, 'Test not found or unauthorized', 404);
    await prisma.question.deleteMany({ where: { testId: req.params.id } });
    await prisma.test.update({ where: { id: req.params.id }, data: { isActive: false } });
    return success(res, null, 'Test deleted');
  } catch (err) { next(err); }
};

module.exports = { createTest, getTests, getTestById, submitTest, getTestResults, getMyResults, deleteTest };
