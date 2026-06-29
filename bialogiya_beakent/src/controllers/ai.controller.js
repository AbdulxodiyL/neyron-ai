const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { chatWithAI } = require('../services/ai/chatAI.service');
const { generateQuiz } = require('../services/ai/lessonAI.service');

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

module.exports = { chatMessage, getChatHistory, generateQuizForLesson, getNotifications, markNotifRead };
