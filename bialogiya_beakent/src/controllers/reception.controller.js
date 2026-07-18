const bcrypt = require('bcryptjs');
const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const { generateUsername, generatePassword } = require('../utils/generateCredentials');

// Reception's ONLY user-management capability: creating teacher accounts.
// They cannot create students, admins, or other reception accounts.
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
      where: { role: 'teacher' },
      select: { id: true, name: true, username: true, phone: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, teachers);
  } catch (err) { next(err); }
};

// So reception can pick a group to view/mark payments for.
const getGroups = async (req, res, next) => {
  try {
    const where = req.user.role === 'reception' ? { branch: { receptionId: req.user.userId } } : {};
    const groups = await prisma.group.findMany({
      where: { ...where, isActive: true },
      select: {
        id: true, name: true, subject: true, monthlyFee: true,
        teacher: { select: { name: true } }, branch: { select: { id: true, name: true } },
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    });
    return success(res, groups);
  } catch (err) { next(err); }
};

const MAX_BRANCHES_PER_RECEPTION = 3;

// GET /reception/branches - the requesting reception user's own branches
// (admin sees all, for oversight).
const getMyBranches = async (req, res, next) => {
  try {
    const where = req.user.role === 'reception' ? { receptionId: req.user.userId } : {};
    const branches = await prisma.branch.findMany({
      where: { ...where, isActive: true },
      include: { reception: { select: { id: true, name: true } }, _count: { select: { groups: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return success(res, branches);
  } catch (err) { next(err); }
};

// POST /reception/branches - reception-only (not admin): each reception
// account may open at most 3 branches.
const createBranch = async (req, res, next) => {
  try {
    const { name, address } = req.body;
    if (!name) return error(res, 'Branch name required', 400);

    const count = await prisma.branch.count({ where: { receptionId: req.user.userId, isActive: true } });
    if (count >= MAX_BRANCHES_PER_RECEPTION) {
      return error(res, `Bitta qabulxona hisobi ko'pi bilan ${MAX_BRANCHES_PER_RECEPTION} ta filial ochishi mumkin`, 400);
    }

    const branch = await prisma.branch.create({ data: { name, address, receptionId: req.user.userId } });
    return success(res, branch, 'Branch created', 201);
  } catch (err) { next(err); }
};

module.exports = { createTeacher, getTeachers, getGroups, getMyBranches, createBranch };
