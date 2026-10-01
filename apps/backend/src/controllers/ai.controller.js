/**
 * AI Controller
 * Handles HTTP requests that interface with the Python FastAPI AI Microservice.
 */

import { AiProxyService } from '../services/aiProxy.service.js';

export class AiController {
  static async generateAssessment(req, res, next) {
    try {
      const assessment = await AiProxyService.generateAssessment(req.body);
      res.status(200).json({
        success: true,
        assessment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async scoreResume(req, res, next) {
    try {
      const score = await AiProxyService.scoreResume(req.body);
      res.status(200).json({
        success: true,
        score,
      });
    } catch (error) {
      next(error);
    }
  }
}
