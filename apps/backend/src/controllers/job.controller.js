/**
 * Job Controller
 * Handles HTTP requests for job requisitions.
 */

import { JobService } from '../services/job.service.js';

export class JobController {
  static async list(req, res, next) {
    try {
      const { page, limit, search, engagementMode } = req.query;
      const result = await JobService.listJobs({
        page,
        limit,
        search,
        engagementMode,
      });
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const job = await JobService.getJobById(req.params.id);
      res.status(200).json({
        success: true,
        job,
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const job = await JobService.createJob(req.body);
      res.status(201).json({
        success: true,
        message: 'Job requisition created successfully',
        job,
      });
    } catch (error) {
      next(error);
    }
  }
}
