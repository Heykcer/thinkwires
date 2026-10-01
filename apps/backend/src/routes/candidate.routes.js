import { Router } from 'express';
import { CandidateController } from '../controllers/candidate.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

export const candidateRouter = Router();

candidateRouter.get(
  '/',
  verifyToken,
  authorizeRoles('admin', 'client', 'recruiter'),
  CandidateController.list
);
candidateRouter.get('/:id', CandidateController.getById);
