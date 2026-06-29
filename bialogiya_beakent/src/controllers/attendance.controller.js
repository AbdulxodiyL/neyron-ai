const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');

const markAttendance = async (req, res, next) => {
  try {
    const { groupId, date, records } = req.body;
    if (!groupId || !date || !records) return error(res, 'groupId, date and records required', 400);

    const dateObj = new Date(date);
    dateObj.setUTCHours(0, 0, 0, 0);

    const att = await prisma.attendance.upsert({
      where: { groupId_date: { groupId, date: dateObj } },
      update: { records, teacherId: req.user.userId },
      create: { groupId, date: dateObj, records, teacherId: req.user.userId },
    });
    return success(res, att, 'Attendance saved');
  } catch (err) { next(err); }
};

const getAttendanceByGroup = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { from, to } = req.query;
    const where = { groupId };
    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }
    const att = await prisma.attendance.findMany({ where, orderBy: { date: 'desc' } });
    return success(res, att);
  } catch (err) { next(err); }
};

const getMyAttendance = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { groupId: true } });
    if (!user?.groupId) return success(res, []);
    const att = await prisma.attendance.findMany({
      where: { groupId: user.groupId },
      orderBy: { date: 'desc' },
      take: 30,
    });
    const personal = att.map(a => {
      const recs = Array.isArray(a.records) ? a.records : [];
      const rec = recs.find(r => r.studentId === req.user.userId);
      return { date: a.date, status: rec?.status || 'absent' };
    });
    return success(res, personal);
  } catch (err) { next(err); }
};

module.exports = { markAttendance, getAttendanceByGroup, getMyAttendance };
