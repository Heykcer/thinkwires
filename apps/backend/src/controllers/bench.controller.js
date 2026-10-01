/**
 * Bench Controller
 * Handles HTTP requests for monitoring bench talent pool and assigning bench engineers.
 */

import { BenchService } from '../services/bench.service.js';

export class BenchController {
  static async getSummary(req, res, next) {
    try {
      const summary = await BenchService.getBenchSummary();
      res.status(200).json({
        success: true,
        ...summary,
      });
    } catch (error) {
      next(error);
    }
  }

  static async assignTalent(req, res, next) {
    try {
      const { candidateId, jobId, startDate, billingRate } = req.body;
      const assignment = await BenchService.assignBenchTalent({
        candidateId,
        jobId,
        startDate,
        billingRate,
      });
      res.status(200).json({
        success: true,
        message: 'Bench talent assigned to requisition successfully.',
        assignment,
      });
    } catch (error) {
      next(error);
    }
  }
}
