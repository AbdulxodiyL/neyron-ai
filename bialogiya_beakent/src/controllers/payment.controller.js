const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const ExcelJS = require('exceljs');

// GET /payments/group/:groupId?month=2026-07
const getGroupPayments = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const month = req.query.month || new Date().toISOString().slice(0, 7); // "2026-07"

    const group = await prisma.group.findUnique({ where: { id: groupId }, select: { monthlyFee: true, name: true } });
    if (!group) return error(res, 'Group not found', 404);

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

    return success(res, { students: result, monthlyFee: group.monthlyFee || 0, groupName: group.name });
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

const exportGroupPayments = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const group = await prisma.group.findUnique({ where: { id: groupId }, select: { monthlyFee: true, name: true } });
    if (!group) return error(res, 'Group not found', 404);

    const students = await prisma.user.findMany({
      where: { groupId, role: 'student', isActive: true },
      select: { id: true, name: true, username: true, phone: true },
      orderBy: { name: 'asc' },
    });

    const payments = await prisma.payment.findMany({
      where: { studentId: { in: students.map(s => s.id) } },
      orderBy: [{ month: 'desc' }, { paidAt: 'desc' }],
    });

    const studentMap = {};
    students.forEach(s => { studentMap[s.id] = s; });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Abdora AI';
    const ws = wb.addWorksheet("To'lovlar tarixi");

    ws.columns = [
      { header: "O'quvchi", key: 'name', width: 26 },
      { header: 'Login', key: 'username', width: 18 },
      { header: 'Telefon', key: 'phone', width: 16 },
      { header: 'Oy', key: 'month', width: 12 },
      { header: 'Holati', key: 'status', width: 14 },
      { header: 'Summa (so\'m)', key: 'amount', width: 14 },
      { header: "To'langan sana", key: 'paidAt', width: 18 },
      { header: 'Izoh', key: 'note', width: 24 },
    ];
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EEFF' } };

    payments.forEach(p => {
      const s = studentMap[p.studentId];
      ws.addRow({
        name: s?.name || '—',
        username: s?.username || '—',
        phone: s?.phone || '—',
        month: p.month,
        status: p.isPaid ? "To'langan" : "To'lanmagan",
        amount: p.isPaid ? (group.monthlyFee || 0) : 0,
        paidAt: p.paidAt ? new Date(p.paidAt).toLocaleDateString('uz-UZ') : '—',
        note: p.note || '',
      });
    });

    if (payments.length === 0) {
      ws.addRow({ name: "Hozircha to'lov yozuvlari yo'q" });
    }

    // Summary row
    const totalPaid = payments.filter(p => p.isPaid).length * (group.monthlyFee || 0);
    ws.addRow({});
    const summaryRow = ws.addRow({ name: 'Jami yig\'ilgan', amount: totalPaid });
    summaryRow.font = { bold: true };

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(group.name)}-tolovlar.xlsx"`,
    });
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
};

module.exports = { getGroupPayments, markPayment, removePayment, exportGroupPayments };
