const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');

// POST /api/applications - public, no auth. Anyone visiting the landing
// page can submit an inquiry without needing a CRM/login account.
const createApplication = async (req, res, next) => {
  try {
    const { name, phone, message } = req.body;
    if (!name || !phone) return error(res, 'Ism va telefon raqami shart', 400);
    if (String(name).length > 100 || String(phone).length > 30) return error(res, 'Invalid input', 400);

    const application = await prisma.application.create({
      data: { name: String(name).trim(), phone: String(phone).trim(), message: message ? String(message).trim().slice(0, 1000) : null },
    });
    return success(res, { id: application.id }, "Arizangiz qabul qilindi. Tez orada siz bilan bog'lanamiz.", 201);
  } catch (err) { next(err); }
};

// GET /api/admin/applications - admin only
const getApplications = async (req, res, next) => {
  try {
    const { status } = req.query;
    const applications = await prisma.application.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
    });
    return success(res, applications);
  } catch (err) { next(err); }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['new', 'contacted', 'converted', 'rejected'].includes(status)) return error(res, 'Invalid status', 400);
    const application = await prisma.application.update({ where: { id: req.params.id }, data: { status } });
    return success(res, application, 'Updated');
  } catch (err) { next(err); }
};

const deleteApplication = async (req, res, next) => {
  try {
    await prisma.application.delete({ where: { id: req.params.id } });
    return success(res, null, 'Deleted');
  } catch (err) { next(err); }
};

module.exports = { createApplication, getApplications, updateApplicationStatus, deleteApplication };
