import express from 'express';
import Activity from '../models/activity.mongo.model.js';
import { logger } from '../utils/logger.js';
import { aboutDataset } from '../data/aboutData.js';
import {
  isMongoActive,
  getPageDataBySlug,
  publicSubmissionRateLimiter,
} from '../utils/cms.util.js';

const router = express.Router();
const consultationSubmissions = [];

const handleConsultationSubmission = async (req, res) => {
  const { fullName, workEmail, phone, primaryNeed, techRoles } = req.body;

  if (!fullName || !fullName.trim()) {
    return res.status(400).json({ error: 'Full Name is required.' });
  }

  if (!workEmail || !workEmail.trim()) {
    return res.status(400).json({ error: 'Work Email is required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(workEmail.trim())) {
    return res
      .status(400)
      .json({ error: 'Please provide a valid work email address.' });
  }

  const bookingRef = `TW-${Date.now().toString(36).toUpperCase()}`;
  const submission = {
    id: consultationSubmissions.length + 1,
    bookingRef,
    fullName: fullName.trim(),
    workEmail: workEmail.trim(),
    phone: phone ? phone.trim() : null,
    primaryNeed: primaryNeed || 'Staff Augmentation',
    techRoles: techRoles ? techRoles.trim() : null,
    createdAt: new Date().toISOString(),
  };

  consultationSubmissions.push(submission);
  logger.info('⚡ Strategy Consultation Scheduled:', submission);

  if (isMongoActive()) {
    try {
      await Activity.create({
        action: 'Consultation Scheduled',
        entityType: 'Client',
        entityId: bookingRef,
        description: `Strategy consultation booked by ${fullName.trim()} (${workEmail.trim()}) for need: ${primaryNeed || 'Staff Augmentation'}. Roles: ${techRoles || 'General'}`,
        user: { name: fullName.trim(), role: 'user' },
        badgeColor: '#008F68',
      });
    } catch (err) {
      logger.warn(
        'Could not persist consultation activity to MongoDB:',
        err.message
      );
    }
  }

  res.status(201).json({
    success: true,
    message:
      'Workforce strategy consultation scheduled successfully! Our staffing directors will review your brief and connect within 5 hours.',
    bookingRef,
    submission,
  });
};

router.get('/about', async (req, res) => {
  const data = await getPageDataBySlug('about', aboutDataset);
  res.json(data);
});

router.get('/about/stats', async (req, res) => {
  const data = await getPageDataBySlug('about', aboutDataset);
  res.json(data.statsStrip || data.stats || aboutDataset.stats);
});

router.get('/leadership', async (req, res) => {
  const data = await getPageDataBySlug('about', aboutDataset);
  res.json(data.leadershipTeam || data.leadership || aboutDataset.leadership);
});

router.get('/milestones', async (req, res) => {
  const data = await getPageDataBySlug('about', aboutDataset);
  res.json({
    milestones: data.growthTimeline?.milestones || aboutDataset.milestones,
    roadmap: data.growthTimeline?.roadmap || aboutDataset.roadmap,
  });
});

router.get('/company/contact', async (req, res) => {
  const data = await getPageDataBySlug('about', aboutDataset);
  res.json(data.contact || aboutDataset.contact);
});

router.post(
  '/about/consultation',
  publicSubmissionRateLimiter,
  handleConsultationSubmission
);
router.post(
  '/consultations',
  publicSubmissionRateLimiter,
  handleConsultationSubmission
);

export default router;
