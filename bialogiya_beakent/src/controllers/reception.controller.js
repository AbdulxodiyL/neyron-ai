const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { generateUsername, generatePassword } = require('../utils/generateCredentials');

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

const getTeachers = async (req, res, next) => {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: 'teacher', isActive: true },
      select: { id: true, name: true, username: true, phone: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, teachers);
  } catch (err) { next(err); }
};

const getGroups = async (req, res, next) => {
  try {
    const groups = await prisma.group.findMany({
      where: { isActive: true },
      select: { id: true, name: true, subject: true, teacher: { select: { id: true, name: true } }, _count: { select: { students: true } } },
      orderBy: { name: 'asc' },
    });
    return success(res, groups);
  } catch (err) { next(err); }
};

const getAllGroups = async (req, res, next) => {
  try {
    const groups = await prisma.group.findMany({
      where: { isActive: true },
      include: {
        teacher: { select: { id: true, name: true } },
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    });
    return success(res, groups);
  } catch (err) { next(err); }
};

module.exports = { createTeacher, getTeachers, getGroups, getAllGroups };
