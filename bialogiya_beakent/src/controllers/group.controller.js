const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');

const createGroup = async (req, res, next) => {
  try {
    const { name, description, subject, icon, color } = req.body;
    if (!name) return error(res, 'Group name required', 400);
    const group = await prisma.group.create({
      data: { name, description, subject: subject || 'biology', icon, color, teacherId: req.user.userId },
      include: { teacher: { select: { id: true, name: true } }, _count: { select: { students: true } } },
    });
    return success(res, group, 'Group created', 201);
  } catch (err) { next(err); }
};

const getMyGroups = async (req, res, next) => {
  try {
    const groups = await prisma.group.findMany({
      where: { teacherId: req.user.userId, isActive: true },
      include: { students: { select: { id: true, name: true, username: true } }, _count: { select: { students: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return success(res, groups);
  } catch (err) { next(err); }
};

const getAllGroups = async (req, res, next) => {
  try {
    const where = req.user.role === 'admin' ? {} : { teacherId: req.user.userId };
    const groups = await prisma.group.findMany({
      where: { ...where, isActive: true },
      include: { teacher: { select: { id: true, name: true } }, students: { select: { id: true, name: true } } },
    });
    return success(res, groups);
  } catch (err) { next(err); }
};

const getGroupById = async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: {
        teacher: { select: { id: true, name: true } },
        students: {
          where: { isActive: true },
          select: { id: true, name: true, username: true, xp: true, level: true, isFrozen: true, lastLogin: true },
          orderBy: { name: 'asc' },
        },
        _count: { select: { students: true } },
      },
    });
    if (!group) return error(res, 'Group not found', 404);
    return success(res, group);
  } catch (err) { next(err); }
};

const updateGroup = async (req, res, next) => {
  try {
    const { name, description, subject, icon, color, isActive } = req.body;
    const group = await prisma.group.update({ where: { id: req.params.id }, data: { name, description, subject, icon, color, isActive } });
    return success(res, group);
  } catch (err) { next(err); }
};

const deleteGroup = async (req, res, next) => {
  try {
    await prisma.group.update({ where: { id: req.params.id }, data: { isActive: false } });
    return success(res, null, 'Group deleted');
  } catch (err) { next(err); }
};

const addStudentToGroup = async (req, res, next) => {
  try {
    const { studentId } = req.body;
    if (!studentId) return error(res, 'studentId required', 400);
    await prisma.user.update({ where: { id: studentId }, data: { groupId: req.params.id } });
    return success(res, null, 'Student added');
  } catch (err) { next(err); }
};

const removeStudentFromGroup = async (req, res, next) => {
  try {
    await prisma.user.update({ where: { id: req.params.studentId }, data: { groupId: null } });
    return success(res, null, 'Student removed');
  } catch (err) { next(err); }
};

module.exports = { createGroup, getMyGroups, getAllGroups, getGroupById, updateGroup, deleteGroup, addStudentToGroup, removeStudentFromGroup };
