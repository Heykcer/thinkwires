import { Router } from 'express';
import { AiController } from '../controllers/ai.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

export const aiRouter = Router();

aiRouter.post(
  '/generate-assessment',
  verifyToken,
  AiController.generateAssessment
);
aiRouter.post('/score-resume', verifyToken, AiController.scoreResume);
