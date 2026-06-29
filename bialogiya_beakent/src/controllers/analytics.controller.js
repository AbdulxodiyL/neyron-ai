const { prisma } = require('../config/db');
const { success } = require('../utils/apiResponse');

const getStudentAnalytics = async (req, res, next) => {
  try {
    const studentId = req.params.studentId || req.user.userId;
    const [user, results, submissions, attendance] = await Promise.all([
      prisma.user.findUnique({ where: { id: studentId }, select: { id: true, name: true, xp: true, coins: true, level: true, streakCurrent: true, streakLongest: true, achievements: true } }),
      prisma.result.findMany({ where: { studentId }, orderBy: { completedAt: 'desc' }, take: 20, include: { test: { select: { id: true, title: true } } } }),
      prisma.submission.findMany({ where: { studentId }, include: { homework: { select: { id: true, title: true, maxScore: true } } } }),
      prisma.attendance.findMany({ where: { records: { path: ['$[*].studentId'], array_contains: studentId } }, take: 30 }),
    ]);

    const avgScore = results.length ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length) : 0;
    const passRate = results.length ? Math.round(results.filter(r => r.passed).length / results.length * 100) : 0;
    const submittedHW = submissions.filter(s => s.status !== 'pending').length;
    const gradedHW = submissions.filter(s => s.finalScore != null);
    const avgHWScore = gradedHW.length ? Math.round(gradedHW.reduce((s, sub) => s + (sub.finalScore || 0), 0) / gradedHW.length) : 0;

    return success(res, { user, results, submissions, avgScore, passRate, submittedHW, avgHWScore, totalTests: results.length });
  } catch (err) { next(err); }
};

const getTeacherAnalytics = async (req, res, next) => {
  try {
    const teacherId = req.user.userId;
    const [groups, lessons, tests] = await Promise.all([
      prisma.group.findMany({ where: { teacherId }, include: { _count: { select: { students: true } } } }),
      prisma.lesson.findMany({ where: { teacherId }, select: { id: true, views: true } }),
      prisma.test.findMany({ where: { teacherId }, include: { results: { select: { percentage: true, passed: true } } } }),
    ]);

    const totalStudents = groups.reduce((s, g) => s + g._count.students, 0);
    const totalViews = lessons.reduce((s, l) => s + l.views, 0);
    const allResults = tests.flatMap(t => t.results);
    const avgScore = allResults.length ? Math.round(allResults.reduce((s, r) => s + r.percentage, 0) / allResults.length) : 0;

    return success(res, { groups, totalStudents, totalLessons: lessons.length, totalViews, avgScore, totalTests: tests.length });
  } catch (err) { next(err); }
};

const getLeaderboard = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { groupId: true } });
    const where = { role: 'student', isActive: true };
    if (user?.groupId) where.groupId = user.groupId;

    const leaders = await prisma.user.findMany({
      where, orderBy: { xp: 'desc' }, take: 50,
      select: { id: true, name: true, username: true, xp: true, level: true, coins: true, streakCurrent: true, groupId: true },
    });

    return success(res, leaders.map((u, i) => ({ ...u, rank: i + 1 })));
  } catch (err) { next(err); }
};

module.exports = { getStudentAnalytics, getTeacherAnalytics, getLeaderboard };
