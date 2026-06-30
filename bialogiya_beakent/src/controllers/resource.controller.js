const { prisma } = require('../config/db');
const { success, error } = require('../utils/apiResponse');
const path = require('path');

const uploadResource = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'File required', 400);
    const { title, description, groupId } = req.body;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const typeMap = { '.pdf': 'pdf', '.doc': 'word', '.docx': 'word', '.ppt': 'presentation', '.pptx': 'presentation', '.mp4': 'video', '.mp3': 'audio', '.jpg': 'image', '.png': 'image' };
    const type = typeMap[ext] || 'other';

    const resource = await prisma.resource.create({
      data: { title: title || req.file.originalname, description, filePath: req.file.path, type, groupId: groupId || null, teacherId: req.user.userId },
    });
    return success(res, resource, 'Uploaded', 201);
  } catch (err) { next(err); }
};

const getResources = async (req, res, next) => {
  try {
    const { groupId } = req.query;
    const where = { isActive: true };
    if (groupId) where.groupId = groupId;
    else if (req.user.role === 'teacher') where.teacherId = req.user.userId;
    const resources = await prisma.resource.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { teacher: { select: { id: true, name: true } }, group: { select: { id: true, name: true } } },
    });
    return success(res, resources);
  } catch (err) { next(err); }
};

const downloadResource = async (req, res, next) => {
  try {
    const resource = await prisma.resource.findUnique({ where: { id: req.params.id } });
    if (!resource) return error(res, 'Not found', 404);
    await prisma.resource.update({ where: { id: resource.id }, data: { downloads: { increment: 1 } } });
    res.download(resource.filePath);
  } catch (err) { next(err); }
};

const deleteResource = async (req, res, next) => {
  try {
    await prisma.resource.update({ where: { id: req.params.id }, data: { isActive: false } });
    return success(res, null, 'Deleted');
  } catch (err) { next(err); }
};

module.exports = { uploadResource, getResources, downloadResource, deleteResource };
