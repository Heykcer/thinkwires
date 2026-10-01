import { Router } from 'express';
import { BenchController } from '../controllers/bench.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

export const benchRouter = Router();

benchRouter.get(
  '/',
  verifyToken,
  authorizeRoles('admin', 'recruiter'),
  BenchController.getSummary
);
benchRouter.post(
  '/assign',
  verifyToken,
  authorizeRoles('admin', 'recruiter'),
  BenchController.assignTalent
);
