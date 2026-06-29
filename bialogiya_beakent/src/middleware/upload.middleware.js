const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const allowedMimes = [
  'application/pdf',
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'video/mp4', 'video/webm',
  'text/plain',
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const url = req.baseUrl + req.path;
    let folder = 'uploads/resources';
    if (url.includes('lesson')) folder = 'uploads/lessons';
    else if (url.includes('homework') && url.includes('submit')) folder = 'uploads/submissions';
    else if (url.includes('homework')) folder = 'uploads/homework';
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed: ${file.mimetype}`), false);
  }
};

const maxSize = parseInt(process.env.MAX_FILE_SIZE_MB || '50') * 1024 * 1024;

const upload = multer({ storage, fileFilter, limits: { fileSize: maxSize } });

module.exports = upload;
