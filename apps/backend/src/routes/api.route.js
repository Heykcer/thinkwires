import express from 'express';
import benchRoutes from './bench.route.js';
import openingsRoutes from './openings.route.js';
import editorialRoutes from './editorial.route.js';
import corporateRoutes from './corporate.route.js';
import servicesRoutes from './services.route.js';
import contactRoutes from './contact.route.js';
import pagesRoutes from './pages.route.js';

const router = express.Router();

/**
 * Enterprise Public API Hub
 * Mounts modular sub-routers covering dedicated domain boundaries.
 */
router.use('/bench', benchRoutes);
router.use('/openings', openingsRoutes);
router.use('/articles', editorialRoutes);
router.use(corporateRoutes);
router.use(servicesRoutes);
router.use(contactRoutes);
router.use(pagesRoutes);

export default router;
