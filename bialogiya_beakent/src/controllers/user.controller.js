const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { generateUsername, generatePassword } = require('../utils/generateCredentials');

const safeUser = (u) => {
  if (!u) return null;
  const { passwordHash, refreshTokenHash, ...rest } = u;
  return { ...rest, streak: { current: rest.streakCurrent, longest: rest.streakLongest, lastActiveDate: rest.streakLastDate } };
};

const createStudent = async (req, res, next) => {
  try {
    const { name, groupId, language, phone } = req.body;
    if (!name || !groupId) return error(res, 'Name and group required', 400);
    if (!phone) return error(res, 'Telefon raqami majburiy (login va parol uchun)', 400);

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return error(res, 'Group not found', 404);

    // Username: ism.familiya_last4digits — e.g. ali.karimov_1234
    // Password: last 4 digits of phone — easy for student to remember
    const last4 = phone.replace(/\D/g, '').slice(-4);
    if (last4.length < 4) return error(res, 'Telefon raqami noto\'g\'ri (kamida 4 ta raqam kerak)', 400);

    const baseName = name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
    const username = `${baseName}_${last4}`;
    const password = last4;
    const passwordHash = await bcrypt.hash(password, 10);

    // If username already taken, append random 2 digits
    let finalUsername = username;
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) finalUsername = `${username}${Math.floor(10 + Math.random() * 90)}`;

    const user = await prisma.user.create({
      data: { name, username: finalUsername, passwordHash, role: 'student', language: language || 'uz', groupId, teacherId: group.teacherId, phone: phone || null },
    });

    return success(res, { user: safeUser(user), credentials: { username: finalUsername, password } }, 'Student created', 201);
  } catch (err) { next(err); }
};

const createTeacher = async (req, res, next) => {
  try {
    const { name, email, language } = req.body;
    if (!name) return error(res, 'Name required', 400);

    const username = generateUsername(name);
    const password = generatePassword(8);
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, username, passwordHash, role: 'teacher', language: language || 'uz' },
    });

    return success(res, { user: safeUser(user), credentials: { username, password } }, 'Teacher created', 201);
  } catch (err) { next(err); }
};

const getStudentsByTeacher = async (req, res, next) => {
  try {
    const students = await prisma.user.findMany({
      where: { teacherId: req.user.userId, role: 'student', isActive: true },
      include: { group: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
    return success(res, students.map(safeUser));
  } catch (err) { next(err); }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return success(res, users.map(safeUser));
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, language, avatar, phone } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { name, language, avatar, phone },
    });
    return success(res, safeUser(user));
  } catch (err) { next(err); }
};

const updateUser = async (req, res, next) => {
  try {
    const { name, email, isActive, groupId, language, phone } = req.body;
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return error(res, 'User not found', 404);
    if (req.user.role === 'teacher' && target.teacherId !== req.user.userId) return error(res, 'Forbidden', 403);
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { name, email, isActive, groupId, language, phone } });
    return success(res, safeUser(user));
  } catch (err) { next(err); }
};

const deleteUser = async (req, res, next) => {
  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return error(res, 'User not found', 404);
    if (req.user.role === 'teacher' && target.teacherId !== req.user.userId) return error(res, 'Forbidden', 403);
    await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
    return success(res, null, 'User deactivated');
  } catch (err) { next(err); }
};

const resetStudentPassword = async (req, res, next) => {
  try {
    const student = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, phone: true, username: true, name: true } });
    if (!student) return error(res, 'Student not found', 404);

    // Default: reset to last 4 digits of phone (the student's memorable password)
    const last4 = (student.phone || '').replace(/\D/g, '').slice(-4);
    const newPassword = (last4.length === 4 ? last4 : null) || req.body.newPassword || generatePassword(8);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash } });
    return success(res, { password: newPassword, username: student.username, name: student.name });
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return error(res, 'currentPassword va newPassword talab qilinadi', 400);
    if (newPassword.length < 6) return error(res, 'Yangi parol kamida 6 ta belgidan iborat bo\'lishi kerak', 400);

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return error(res, 'Foydalanuvchi topilmadi', 404);

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) return error(res, 'Joriy parol noto\'g\'ri', 401);

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.userId }, data: { passwordHash } });

    return success(res, null, 'Parol muvaffaqiyatli o\'zgartirildi');
  } catch (err) { next(err); }
};

const freezeStudent = async (req, res, next) => {
  try {
    const student = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!student) return error(res, 'Student not found', 404);
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isFrozen: !student.isFrozen },
    });
    return success(res, { isFrozen: updated.isFrozen }, updated.isFrozen ? 'Student frozen' : 'Student unfrozen');
  } catch (err) { next(err); }
};

module.exports = { createStudent, createTeacher, getStudentsByTeacher, getAllUsers, updateProfile, updateUser, deleteUser, resetStudentPassword, freezeStudent, changePassword };
