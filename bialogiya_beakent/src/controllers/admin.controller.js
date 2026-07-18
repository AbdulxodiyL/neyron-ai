const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { generateUsername, generatePassword } = require('../utils/generateCredentials');

const getStats = async (req, res, next) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [totalTeachers, totalStudents, totalGroups, aiLessons, activeToday, newThisWeek, recentUsers] = await Promise.all([
      prisma.user.count({ where: { role: 'teacher', isActive: true } }),
      prisma.user.count({ where: { role: 'student', isActive: true } }),
      prisma.group.count({ where: { isActive: true } }),
      prisma.lesson.count({ where: { isActive: true } }),
      prisma.user.count({ where: { lastLogin: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, name: true, role: true, createdAt: true, isActive: true } }),
    ]);

    return success(res, { totalTeachers, totalStudents, totalGroups, aiLessons, activeToday, newThisWeek, recentUsers });
  } catch (err) { next(err); }
};

const getTeachers = async (req, res, next) => {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: 'teacher' },
      select: {
        id: true, name: true, username: true, email: true, phone: true,
        isActive: true, createdAt: true, lastLogin: true,
        _count: { select: { taughtGroups: true, students: true, lessons: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, teachers);
  } catch (err) { next(err); }
};

const createTeacher = async (req, res, next) => {
  try {
    const { name, email, phone, language } = req.body;
    if (!name) return error(res, 'Name required', 400);

    const username = generateUsername(name);
    const password = generatePassword(8);
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, phone: phone || null, username, passwordHash, role: 'teacher', language: language || 'uz' },
      select: { id: true, name: true, username: true, email: true, phone: true, role: true, createdAt: true },
    });

    return success(res, { user, credentials: { username, password } }, 'Teacher created', 201);
  } catch (err) { next(err); }
};

const updateTeacher = async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;
    const teacher = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!teacher || teacher.role !== 'teacher') return error(res, 'Teacher not found', 404);
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { ...(name && { name }), phone: phone ?? teacher.phone, ...(email !== undefined && { email }) },
      select: { id: true, name: true, username: true, email: true, phone: true, isActive: true },
    });
    return success(res, updated, 'Teacher updated');
  } catch (err) { next(err); }
};

const deleteTeacher = async (req, res, next) => {
  try {
    const teacher = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!teacher || teacher.role !== 'teacher') return error(res, 'Teacher not found', 404);
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    return success(res, null, 'Teacher deactivated');
  } catch (err) { next(err); }
};

// Reception accounts can only be created by admin - there is no self-registration
// and reception users cannot create other reception users.
const getReceptionUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'reception' },
      select: { id: true, name: true, username: true, email: true, phone: true, isActive: true, createdAt: true, lastLogin: true },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, users);
  } catch (err) { next(err); }
};

const createReceptionUser = async (req, res, next) => {
  try {
    const { name, email, phone, language } = req.body;
    if (!name) return error(res, 'Name required', 400);

    const username = generateUsername(name);
    const password = generatePassword(8);
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, phone: phone || null, username, passwordHash, role: 'reception', language: language || 'uz' },
      select: { id: true, name: true, username: true, email: true, phone: true, role: true, createdAt: true },
    });

    return success(res, { user, credentials: { username, password } }, 'Reception user created', 201);
  } catch (err) { next(err); }
};

const deleteReceptionUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user || user.role !== 'reception') return error(res, 'Reception user not found', 404);
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    return success(res, null, 'Reception user deactivated');
  } catch (err) { next(err); }
};

const getStudents = async (req, res, next) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'student', isActive: true },
      select: { id: true, name: true, username: true, xp: true, level: true, isActive: true, createdAt: true,
        group: { select: { id: true, name: true } }, teacher: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
    return success(res, students);
  } catch (err) { next(err); }
};

const getGroups = async (req, res, next) => {
  try {
    const groups = await prisma.group.findMany({
      include: { teacher: { select: { id: true, name: true } }, _count: { select: { students: true, lessons: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, groups);
  } catch (err) { next(err); }
};

const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id }, select: { isActive: true } });
    if (!user) return error(res, 'User not found', 404);
    const updated = await prisma.user.update({ where: { id: req.params.id }, data: { isActive: !user.isActive } });
    return success(res, { isActive: updated.isActive });
  } catch (err) { next(err); }
};

const getSettings = async (_req, res, next) => {
  try {
    return success(res, { maxFileSize: 50, aiModel: 'gpt-4o', language: 'uz', maintenance: false, registrationOpen: false });
  } catch (err) { next(err); }
};

const updateSettings = async (req, res, next) => {
  try { return success(res, req.body, 'Settings updated'); }
  catch (err) { next(err); }
};

module.exports = {
  getStats, getTeachers, createTeacher, updateTeacher, deleteTeacher, getStudents, getGroups, toggleUserStatus, getSettings, updateSettings,
  getReceptionUsers, createReceptionUser, deleteReceptionUser,
};
