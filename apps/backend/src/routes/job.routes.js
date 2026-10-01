import { Router } from 'express';
import { JobController } from '../controllers/job.controller.js';
import { verifyToken, authorizeRoles } from '../middlewares/auth.middleware.js';

export const jobRouter = Router();

jobRouter.get('/', JobController.list);
jobRouter.get('/:id', JobController.getById);
jobRouter.post(
  '/',
  verifyToken,
  authorizeRoles('admin', 'client'),
  JobController.create
);
