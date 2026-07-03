const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const { uploadResource, getResources, previewResource, downloadResource, deleteResource } = require('../controllers/resource.controller');

router.get('/', verifyToken, getResources);
router.get('/:id/preview', verifyToken, previewResource);
router.post('/', verifyToken, requireRole('teacher', 'admin'), upload.resourceUpload.single('file'), uploadResource);
router.post('/:id/download', verifyToken, downloadResource);
router.delete('/:id', verifyToken, requireRole('teacher', 'admin'), deleteResource);

module.exports = router;
