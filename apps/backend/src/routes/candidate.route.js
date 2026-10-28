import express from 'express';
import {
  getCandidateDashboard,
  updateCandidateProfile,
  getMyApplications,
  applyForJob,
  parseResumeForAutoFill,
  getApplicationAssessment,
  submitApplicationAssessment,
  withdrawApplication,
  getApplicationDossier,
  uploadAvatar,
  setAvatarPreset,
  removeAvatar,
} from '../controllers/candidatePortal.controller.js';
import {
  requireCandidateAuth,
  optionalCandidateAuth,
} from '../middlewares/auth.middleware.js';
import { resumeUpload, avatarUpload } from '../middlewares/upload.middleware.js';
import { isAllowedOrigin } from '../middlewares/csrf.middleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Throttle PDF parsing to prevent resource exhaustion
const parseResumeRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error:
      'Too many resume parse requests from this network. Please wait 10 minutes before uploading again.',
  },
});

const candidateOriginProtection = (req, res, next) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method.toUpperCase())) {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  let effectiveOrigin = origin;
  if (!effectiveOrigin && referer) {
    try {
      effectiveOrigin = new URL(referer).origin;
    } catch {
      effectiveOrigin = null;
    }
  }

  if (effectiveOrigin && !isAllowedOrigin(effectiveOrigin)) {
    return res.status(403).json({
      success: false,
      error: 'Cross-origin request blocked: Untrusted origin or referer.',
      origin: effectiveOrigin,
    });
  }

  next();
};

router.post(
  '/parse-resume',
  parseResumeRateLimiter,
  candidateOriginProtection,
  resumeUpload.single('resume'),
  parseResumeForAutoFill
);

router.use(candidateOriginProtection);
router.use(requireCandidateAuth);

router.get('/dashboard', getCandidateDashboard);
router.put('/profile', updateCandidateProfile);

router.post('/apply', resumeUpload.single('resume'), applyForJob);
router.get('/applications', getMyApplications);
router.post('/applications/:applicationId/withdraw', withdrawApplication);

router.get('/applications/:applicationId/assessment', getApplicationAssessment);
router.post(
  '/applications/:applicationId/assessment/submit',
  submitApplicationAssessment
);

// Evaluation Dossier & Avatar Routes
router.get('/applications/:applicationId/dossier', getApplicationDossier);
router.post('/avatar/upload', avatarUpload.single('avatar'), uploadAvatar);
router.put('/avatar/preset', setAvatarPreset);
router.delete('/avatar', removeAvatar);

export default router;
