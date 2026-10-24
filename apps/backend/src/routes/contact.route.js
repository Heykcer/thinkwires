import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Page from '../models/page.mongo.model.js';
import Activity from '../models/activity.mongo.model.js';
import { logger } from '../utils/logger.js';
import {
  isMongoActive,
  adminAuthGuard,
  publicSubmissionRateLimiter,
} from '../utils/cms.util.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'seeds', 'mockData.json'), 'utf8')
);

let contactPageData = mockData.contactData ? { ...mockData.contactData } : {};

const router = express.Router();

// Backward-compatible callback request
router.post('/contact', async (req, res) => {
  const { email, phone } = req.body;
  if (!email || !phone) {
    return res.status(400).json({ error: 'Email and Phone are required' });
  }

  logger.info('New Contact Request received:', { email, phone });

  if (isMongoActive()) {
    try {
      await Activity.create({
        action: 'Callback Requested',
        entityType: 'Client',
        entityId: email,
        description: `Client requested callback for email: ${email}, phone: ${phone}`,
        user: { name: 'Public Visitor', role: 'user' },
        badgeColor: '#3478D4',
      });
    } catch (err) {
      logger.warn(
        'Could not persist contact activity to MongoDB:',
        err.message
      );
    }
  }

  res.json({ message: 'Callback requested successfully!' });
});

// Full Contact page metadata & offices
router.get('/contact', async (req, res) => {
  if (isMongoActive()) {
    try {
      const page = await Page.findOne({ slug: 'contact' }).lean();
      if (page?.data && Object.keys(page.data).length > 0) {
        return res.json(page.data);
      }
    } catch (dbErr) {
      console.warn('Error reading contact page from MongoDB:', dbErr.message);
    }
  }
  res.json(contactPageData);
});

// Update office locations dynamically (Admin Only)
router.post('/contact/offices', adminAuthGuard, async (req, res) => {
  if (Array.isArray(req.body.officeLocations)) {
    contactPageData.officeLocations = req.body.officeLocations;
    if (isMongoActive()) {
      try {
        await Page.findOneAndUpdate(
          { slug: 'contact' },
          { $set: { 'data.officeLocations': contactPageData.officeLocations } },
          { upsert: true }
        );
      } catch (err) {
        console.warn(
          'Could not persist officeLocations to MongoDB:',
          err.message
        );
      }
    }
    res.json({
      message: 'Office locations updated successfully',
      officeLocations: contactPageData.officeLocations,
    });
  } else {
    res
      .status(400)
      .json({ error: 'officeLocations must be an array of objects' });
  }
});

// Update contact channels dynamically (Admin Only)
router.post('/contact/channels', adminAuthGuard, async (req, res) => {
  if (Array.isArray(req.body.channels)) {
    contactPageData.channels = req.body.channels;
    if (isMongoActive()) {
      try {
        await Page.findOneAndUpdate(
          { slug: 'contact' },
          { $set: { 'data.channels': contactPageData.channels } },
          { upsert: true }
        );
      } catch (err) {
        console.warn('Could not persist channels to MongoDB:', err.message);
      }
    }
    res.json({
      message: 'Contact channels updated successfully',
      channels: contactPageData.channels,
    });
  } else {
    res.status(400).json({ error: 'channels must be an array of objects' });
  }
});

// Update FAQ dynamically (Admin Only)
router.post('/contact/faq', adminAuthGuard, async (req, res) => {
  if (Array.isArray(req.body.faq)) {
    contactPageData.faq = req.body.faq;
    if (isMongoActive()) {
      try {
        await Page.findOneAndUpdate(
          { slug: 'contact' },
          { $set: { 'data.faq': contactPageData.faq } },
          { upsert: true }
        );
      } catch (err) {
        console.warn('Could not persist FAQ to MongoDB:', err.message);
      }
    }
    res.json({ message: 'FAQ updated successfully', faq: contactPageData.faq });
  } else {
    res.status(400).json({ error: 'faq must be an array of objects' });
  }
});

// Handle contact form submission
router.post('/contact/message', publicSubmissionRateLimiter, (req, res) => {
  const { fullName, workEmail, inquiryType } = req.body;
  if (!fullName || !workEmail || !inquiryType) {
    return res
      .status(400)
      .json({ error: 'Full name, work email, and inquiry type are required' });
  }
  console.log('📨 New Contact Us Submission:', req.body);
  res.json({
    success: true,
    message:
      'Thank you for reaching out! A ThinkWires staffing director will respond within 5 business hours.',
  });
});

export default router;
