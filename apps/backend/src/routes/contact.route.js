import express from 'express';
import mongoose from 'mongoose';
import Page from '../models/page.mongo.model.js';
import Activity from '../models/activity.mongo.model.js';
import { logger } from '../utils/logger.js';
import { loadSeedJson } from '../utils/seedLoader.js';
import rateLimit from 'express-rate-limit';
import requireAuth from '../middlewares/auth.middleware.js';
import { recordHelpDeskInquiry } from '../models/helpdesk.mongo.model.js';

const isMongoActive = () => mongoose.connection.readyState === 1;

const requireProductionDb = (res) => {
  if (!isMongoActive() && process.env.NODE_ENV === 'production') {
    res.status(503).json({
      success: false,
      error: 'Database connection temporarily unavailable. Please retry your request.',
      retryAfterSeconds: 5,
    });
    return false;
  }
  return true;
};

const mockData = loadSeedJson('mockData.json', {}) || {};
const { contactData = null, aboutData = null } = mockData;

const cmsGuard = requireAuth(['superadmin', 'cms_admin']);

const publicSubmissionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false,
  },
  message: {
    success: false,
    error: 'Too many requests from this network. Please wait a few minutes before submitting again.',
  },
});

const getPageDataBySlug = async (slug, fallback) => {
  if (isMongoActive()) {
    try {
      const page = await Page.findOne({ slug }).lean();
      if (page?.data && Object.keys(page.data).length > 0) {
        return page.data;
      }
    } catch (err) {
      console.warn(`Error reading page '${slug}' from MongoDB:`, err.message);
    }
  }
  return fallback;
};

const router = express.Router();

// --- Old Contact Form (kept for backward compat) ---
router.post('/contact', publicSubmissionRateLimiter, async (req, res) => {
  if (!requireProductionDb(res)) return;
  const { email, phone } = req.body;
  if (!email || !phone) {
    return res.status(400).json({ error: 'Email and Phone are required' });
  }

  logger.info('New Contact Request received:', { email, phone });

  let ticket = null;
  try {
    ticket = await recordHelpDeskInquiry({
      category: 'Talent Callback',
      fullName: req.body.name || 'Immediate Callback Requester',
      email,
      phone,
      company: req.body.company || 'Individual Inquiry',
      subject: 'Immediate Talent Callback Requested',
      message: `Client requested callback via website for phone: ${phone}, email: ${email}`,
      priority: 'High',
    });
  } catch (hdErr) {
    logger.warn('HelpDesk callback logging warning:', hdErr.message);
  }

  if (isMongoActive()) {
    try {
      await Activity.create({
        action: 'Callback Requested',
        entityType: 'Client',
        entityId: email,
        description: `Client requested callback for email: ${email}, phone: ${phone}`,
        user: { name: req.body.name || 'Public Visitor', role: 'user' },
        badgeColor: '#3478D4',
      });
    } catch (err) {
      logger.warn(
        'Could not persist contact activity to MongoDB:',
        err.message
      );
    }
  }

  res.json({
    success: true,
    ticketId: ticket?.ticketId,
    message: 'Callback requested successfully!',
  });
});


// --- Contact Page Data ---
let contactPageData = contactData ? { ...contactData } : {};

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
router.post('/contact/offices', cmsGuard, async (req, res) => {
  if (!requireProductionDb(res)) return;
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
router.post('/contact/channels', cmsGuard, async (req, res) => {
  if (!requireProductionDb(res)) return;
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
router.post('/contact/faq', cmsGuard, async (req, res) => {
  if (!requireProductionDb(res)) return;
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
router.post('/contact/message', publicSubmissionRateLimiter, async (req, res) => {
  if (!requireProductionDb(res)) return;
  const { fullName, workEmail, email, inquiryType, subject, message, phone, company } = req.body;
  const contactEmail = workEmail || email;
  const inquiryCategory = inquiryType || subject || 'General Inquiry';

  if (!fullName || !contactEmail) {
    return res
      .status(400)
      .json({ error: 'Full name and email are required' });
  }
  console.log('[Contact Us] New Submission:', req.body);

  let ticket = null;
  try {
    ticket = await recordHelpDeskInquiry({
      category: 'General Inquiry',
      fullName,
      email: contactEmail,
      phone: phone || null,
      company: company || 'General Inquiry Client',
      subject: `Contact Us: ${inquiryCategory}`,
      message: message || `Inquiry regarding ${inquiryCategory}`,
      metadata: { inquiryType: inquiryCategory },
      priority: 'Normal',
    });
  } catch (hdErr) {
    logger.warn('HelpDesk contact message logging warning:', hdErr.message);
  }

  res.json({
    success: true,
    ticketId: ticket?.ticketId,
    message:
      'Thank you for reaching out! A Thinkwires staffing director will respond within 5 business hours.',
  });
});


// Fallback dataset for company/contact
const aboutDataset = {
  contact: {
    headline: 'Ready to Build Your High-Velocity Engineering Squad?',
    description:
      'Book a 20-minute workforce strategy consultation with our staffing directors to audit your technical requirements and receive benchmark rates for India and North America.',
    headquarters: {
      title: 'Global Corporate Headquarters',
      address:
        'Plot No. 20, Block H-1/A, Sector 63, Noida, Uttar Pradesh 201301',
    },
    phones: [],
    email: 'info@thinkwires.com',
    hours: 'Monday - Friday: 9:00 AM - 7:00 PM IST (EST/PST Overlap Supported)',
  },
};

// GET /api/company/contact
router.get('/company/contact', async (req, res) => {
  const data = await getPageDataBySlug('about', aboutDataset);
  res.json(data.contact || aboutDataset.contact);
});

// In-memory consultations log
const consultationSubmissions = [];

const handleConsultationSubmission = async (req, res) => {
  if (!requireProductionDb(res)) return;
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
  logger.info('[Consultation] Strategy Scheduled:', submission);

  try {
    await recordHelpDeskInquiry({
      category: 'Workforce Consultation',
      fullName,
      email: workEmail,
      phone,
      company: req.body.company || 'Enterprise Consultation Client',
      subject: `Workforce Strategy Consultation: ${primaryNeed || 'Staff Augmentation'}`,
      message: `Consultation request for need: ${primaryNeed || 'Staff Augmentation'}. Target roles: ${techRoles || 'General'}. Booking Ref: ${bookingRef}`,
      metadata: { primaryNeed, techRoles, bookingRef },
      priority: 'High',
    });
  } catch (hdErr) {
    logger.warn('HelpDesk consultation logging warning:', hdErr.message);
  }

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

// POST /api/about/consultation and POST /api/consultations
router.post('/about/consultation', publicSubmissionRateLimiter, handleConsultationSubmission);
router.post('/consultations', publicSubmissionRateLimiter, handleConsultationSubmission);

export default router;
