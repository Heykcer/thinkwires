import express from 'express';
import requireAuth, { requireRole } from '../middlewares/auth.middleware.js';
import {
  getDashboardOverview,
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getCandidates,
  getCandidateDossier,
  reEvaluateCandidate,
  createCandidate,
  updateCandidateStatus,
  updateCandidate,
  deleteCandidate,
  getClients,
  createClient,
  updateClient,
  deleteClient,
  getJobs,
  createJob,
  updateJob,
  deleteJob,
  getPlacements,
  createPlacement,
  updatePlacement,
  deletePlacement,
  getCmsPages,
  getCmsPageBySlug,
  createCmsPage,
  updateCmsPage,
  togglePublishCmsPage,
  deleteCmsPage,
  getCmsArticles,
  createCmsArticle,
  updateCmsArticle,
  togglePublishCmsArticle,
  deleteCmsArticle,
  getCmsMedia,
  createCmsMedia,
  deleteCmsMedia,
  getSeoSettings,
  updateSeoSettings,
  getAnnouncements,
  createAnnouncement,
  togglePublishAnnouncement,
  deleteAnnouncement,
  getCmsStats,
  getActivities,
  getCurrentUser,
  loginAdmin,
  logoutAdmin,
  getSystemMembers,
  createSystemMember,
  updateSystemMember,
  deleteSystemMember,
} from '../controllers/admin.controller.js';

import {
  adminCsrfProtection,
  getCsrfTokenHandler,
} from '../middlewares/csrf.middleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Throttle admin login attempts to mitigate brute-force
const adminLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error:
      'Too many administrative login attempts from this network. Access is temporarily throttled for 15 minutes to protect system security.',
  },
});

router.use(adminCsrfProtection);

router.get('/auth/csrf-token', getCsrfTokenHandler);
router.post('/auth/login', adminLoginRateLimiter, loginAdmin);
router.post('/auth/logout', logoutAdmin);

router.use(requireAuth());

router.get('/auth/me', getCurrentUser);

const superadminGuard = requireRole('superadmin');
const manpowerGuard = requireRole('superadmin', 'admin');
const cmsGuard = requireRole('superadmin', 'cms_admin');

router.get('/stats', manpowerGuard, getDashboardOverview);
router.get('/activities', getActivities);

// Superadmin
router.get('/system-members', superadminGuard, getSystemMembers);
router.post('/system-members', superadminGuard, createSystemMember);
router.put('/system-members/:id', superadminGuard, updateSystemMember);
router.delete('/system-members/:id', superadminGuard, deleteSystemMember);

// Manpower & ATS
router.get('/employees', manpowerGuard, getEmployees);
router.post('/employees', manpowerGuard, createEmployee);
router.put('/employees/:id', manpowerGuard, updateEmployee);
router.delete('/employees/:id', manpowerGuard, deleteEmployee);

router.get('/candidates', manpowerGuard, getCandidates);
router.get('/candidates/:id/dossier', manpowerGuard, getCandidateDossier);
router.post('/candidates/:id/re-evaluate', manpowerGuard, reEvaluateCandidate);
router.post('/candidates', manpowerGuard, createCandidate);
router.put('/candidates/:id', manpowerGuard, updateCandidate);
router.patch('/candidates/:id/status', manpowerGuard, updateCandidateStatus);
router.delete('/candidates/:id', manpowerGuard, deleteCandidate);

router.get('/clients', manpowerGuard, getClients);
router.post('/clients', manpowerGuard, createClient);
router.put('/clients/:id', manpowerGuard, updateClient);
router.delete('/clients/:id', manpowerGuard, deleteClient);

router.get('/jobs', manpowerGuard, getJobs);
router.post('/jobs', manpowerGuard, createJob);
router.put('/jobs/:id', manpowerGuard, updateJob);
router.delete('/jobs/:id', manpowerGuard, deleteJob);

router.get('/placements', manpowerGuard, getPlacements);
router.post('/placements', manpowerGuard, createPlacement);
router.put('/placements/:id', manpowerGuard, updatePlacement);
router.delete('/placements/:id', manpowerGuard, deletePlacement);

// CMS
router.get('/cms/stats', cmsGuard, getCmsStats);

router.get('/cms/pages', cmsGuard, getCmsPages);
router.get('/cms/pages/:slug', cmsGuard, getCmsPageBySlug);
router.post('/cms/pages', cmsGuard, createCmsPage);
router.put('/cms/pages/:id', cmsGuard, updateCmsPage);
router.patch('/cms/pages/:id/publish', cmsGuard, togglePublishCmsPage);
router.delete('/cms/pages/:id', cmsGuard, deleteCmsPage);

router.get('/cms/articles', cmsGuard, getCmsArticles);
router.post('/cms/articles', cmsGuard, createCmsArticle);
router.put('/cms/articles/:id', cmsGuard, updateCmsArticle);
router.patch('/cms/articles/:id/publish', cmsGuard, togglePublishCmsArticle);
router.delete('/cms/articles/:id', cmsGuard, deleteCmsArticle);

router.get('/cms/media', cmsGuard, getCmsMedia);
router.post('/cms/media', cmsGuard, createCmsMedia);
router.delete('/cms/media/:id', cmsGuard, deleteCmsMedia);

router.get('/cms/seo', cmsGuard, getSeoSettings);
router.put('/cms/seo', cmsGuard, updateSeoSettings);

router.get('/cms/announcements', cmsGuard, getAnnouncements);
router.post('/cms/announcements', cmsGuard, createAnnouncement);
router.patch(
  '/cms/announcements/:id/publish',
  cmsGuard,
  togglePublishAnnouncement
);
router.delete('/cms/announcements/:id', cmsGuard, deleteAnnouncement);

export default router;
