import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Vercel serverless runtime has a read-only filesystem; only /tmp is writable
const uploadDir = process.env.VERCEL
  ? path.resolve('/tmp', 'uploads', 'resumes')
  : path.resolve(process.cwd(), 'uploads/resumes');

if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    console.warn('[Upload] Directory init notice:', err.message);
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const rawExt = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ['.pdf', '.doc', '.docx'].includes(rawExt)
      ? rawExt
      : '.pdf';
    const rawBase = path.basename(file.originalname || 'resume', rawExt);
    const sanitizedBase = rawBase.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
    cb(null, `${sanitizedBase}-${uniqueSuffix}${safeExt}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname || '').toLowerCase();

  if (!allowedExtensions.includes(ext)) {
    return cb(
      new Error(
        'Invalid file type. Only PDF, DOC, and DOCX files are allowed.'
      ),
      false
    );
  }

  // Guard against double-extensions (e.g. payload.php.pdf)
  const lowerName = (file.originalname || '').toLowerCase();
  const dangerousPatterns = [
    '.html',
    '.htm',
    '.svg',
    '.js',
    '.exe',
    '.sh',
    '.php',
    '.bat',
    '.py',
  ];
  if (dangerousPatterns.some((pattern) => lowerName.includes(pattern))) {
    return cb(new Error('Potentially unsafe file format detected.'), false);
  }

  const extensionMimeMap = {
    '.pdf': ['application/pdf'],
    '.doc': ['application/msword', 'application/octet-stream'],
    '.docx': [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/octet-stream',
      'application/zip',
    ],
  };

  const validMimes = extensionMimeMap[ext] || [];
  if (
    validMimes.includes(file.mimetype) ||
    file.mimetype === 'application/octet-stream'
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file content. Uploaded file MIME type does not match the permitted document format.'
      ),
      false
    );
  }
};

export const resumeUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter,
});

// Avatar image upload setup
const avatarDir = process.env.VERCEL
  ? path.resolve('/tmp', 'uploads', 'avatars')
  : path.resolve(process.cwd(), 'uploads/avatars');

if (!fs.existsSync(avatarDir)) {
  try {
    fs.mkdirSync(avatarDir, { recursive: true });
  } catch (err) {
    console.warn('[AvatarUpload] Directory init notice:', err.message);
  }
}

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const rawExt = path.extname(file.originalname || '').toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(rawExt)
      ? rawExt
      : '.jpg';
    cb(null, `avatar-${uniqueSuffix}${safeExt}`);
  },
});

const avatarFileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!allowed.includes(ext)) {
    return cb(
      new Error('Invalid image format. Only JPG, JPEG, PNG, and WebP are permitted.'),
      false
    );
  }
  cb(null, true);
};

export const avatarUpload = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: avatarFileFilter,
});

