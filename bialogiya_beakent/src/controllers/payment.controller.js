const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');

// GET /payments/group/:groupId?month=2026-07
const getGroupPayments = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const month = req.query.month || new Date().toISOString().slice(0, 7); // "2026-07"

    const students = await prisma.user.findMany({
      where: { groupId, role: 'student', isActive: true },
      select: { id: true, name: true, username: true, isFrozen: true },
      orderBy: { name: 'asc' },
    });

    const payments = await prisma.payment.findMany({
      where: {
        studentId: { in: students.map(s => s.id) },
        month,
      },
    });

    const paymentMap = {};
    payments.forEach(p => { paymentMap[p.studentId] = p; });

    const result = students.map(s => ({
      ...s,
      payment: paymentMap[s.id] || null,
      isPaid: !!paymentMap[s.id]?.isPaid,
    }));

    return success(res, result);
  } catch (err) { next(err); }
};

// POST /payments — upsert payment for student+month
const markPayment = async (req, res, next) => {
  try {
    const { studentId, month, isPaid, note } = req.body;
    if (!studentId || !month) return error(res, 'studentId and month required', 400);

    const student = await prisma.user.findUnique({ where: { id: studentId }, select: { id: true, isActive: true, groupId: true, role: true } });
    if (!student || student.role !== 'student' || !student.isActive) return error(res, 'Student not found or inactive', 404);

    const payment = await prisma.payment.upsert({
      where: { studentId_month: { studentId, month } },
      create: { studentId, month, isPaid: isPaid !== false, note, teacherId: req.user.userId, paidAt: new Date() },
      update: { isPaid: isPaid !== false, note, paidAt: new Date() },
    });

    return success(res, payment);
  } catch (err) { next(err); }
};

// DELETE /payments/:studentId/:month — remove payment record
const removePayment = async (req, res, next) => {
  try {
    const { studentId, month } = req.params;
    await prisma.payment.deleteMany({ where: { studentId, month } });
    return success(res, null, 'Payment record removed');
  } catch (err) { next(err); }
};

module.exports = { getGroupPayments, markPayment, removePayment };
