import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Page from '../models/page.mongo.model.js';
import Activity from '../models/activity.mongo.model.js';
import { logger } from '../utils/logger.js';
import {
  isMongoActive,
  getPageDataBySlug,
  adminAuthGuard,
  publicSubmissionRateLimiter,
} from '../utils/cms.util.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'seeds', 'mockData.json'), 'utf8')
);

let currentPayrollData = mockData.payrollData ? { ...mockData.payrollData } : null;
let currentEorData = mockData.eorData ? { ...mockData.eorData } : null;
let currentStaffAugmentationData = mockData.staffAugmentationData
  ? { ...mockData.staffAugmentationData }
  : null;
let currentPermanentStaffingData = mockData.permanentStaffingData
  ? { ...mockData.permanentStaffingData }
  : null;
let currentFindTalentData = mockData.findTalentData
  ? { ...mockData.findTalentData }
  : null;
let currentCandidatePortalData = mockData.candidatePortalData
  ? { ...mockData.candidatePortalData }
  : null;

const router = express.Router();

// --- Payroll Outsourcing Endpoints ---
router.get('/payroll', async (req, res) => {
  const result = await getPageDataBySlug(
    'services-payroll',
    currentPayrollData
  );
  res.json(result);
});

router.post('/payroll', adminAuthGuard, async (req, res) => {
  if (req.body.payrollData) {
    currentPayrollData = { ...currentPayrollData, ...req.body.payrollData };
    if (isMongoActive()) {
      try {
        await Page.findOneAndUpdate(
          { slug: 'services-payroll' },
          { $set: { data: currentPayrollData } },
          { upsert: true }
        );
      } catch (err) {
        console.warn('Could not persist payrollData to MongoDB:', err.message);
      }
    }
    res.json({
      message: 'Payroll data updated successfully',
      payrollData: currentPayrollData,
    });
  } else {
    res.status(400).json({ error: 'payrollData object is required in body' });
  }
});

router.post('/payroll/consultation', publicSubmissionRateLimiter, (req, res) => {
  const {
    companyName,
    fullName,
    employeeSize,
    serviceReq,
    phoneNumber,
    emailAddress,
  } = req.body;
  if (!companyName || !fullName || !emailAddress) {
    return res
      .status(400)
      .json({ error: 'Company name, full name, and email are required.' });
  }
  console.log('📋 New Payroll Outsourcing Consultation Request:', {
    companyName,
    fullName,
    employeeSize,
    serviceReq,
    phoneNumber,
    emailAddress,
  });
  res.json({
    success: true,
    message:
      'Thank you! Your payroll consultation request has been queued. Our compliance lead will call within 120 minutes.',
  });
});

// --- Employer of Record (EOR) Endpoints ---
router.get('/eor', async (req, res) => {
  const result = await getPageDataBySlug('services-eor', currentEorData);
  res.json(result);
});

router.post('/eor', adminAuthGuard, async (req, res) => {
  if (req.body.eorData) {
    currentEorData = { ...currentEorData, ...req.body.eorData };
    if (isMongoActive()) {
      try {
        await Page.findOneAndUpdate(
          { slug: 'services-eor' },
          { $set: { data: currentEorData } },
          { upsert: true }
        );
      } catch (err) {
        console.warn('Could not persist eorData to MongoDB:', err.message);
      }
    }
    res.json({
      message: 'EOR data updated successfully',
      eorData: currentEorData,
    });
  } else {
    res.status(400).json({ error: 'eorData object is required in body' });
  }
});

router.post('/eor/consultation', publicSubmissionRateLimiter, (req, res) => {
  const {
    fullName,
    workEmail,
    companyName,
    targetGeo,
    headcount,
    projectDetails,
  } = req.body;
  if (!fullName || !workEmail || !companyName) {
    return res
      .status(400)
      .json({ error: 'Full name, work email, and company name are required.' });
  }
  console.log('🌐 New EOR Consultation Request:', {
    fullName,
    workEmail,
    companyName,
    targetGeo,
    headcount,
    projectDetails,
  });
  res.json({
    success: true,
    message:
      'Thank you! Your EOR workforce consultation request has been received. Our Global Compliance Specialist will reach out within 4 hours.',
  });
});

// --- Staff Augmentation Endpoints ---
router.get('/staff-augmentation', async (req, res) => {
  const result = await getPageDataBySlug(
    'services-staff-augmentation',
    currentStaffAugmentationData
  );
  res.json(result);
});

router.post('/staff-augmentation', adminAuthGuard, async (req, res) => {
  if (req.body.staffAugmentationData) {
    currentStaffAugmentationData = {
      ...currentStaffAugmentationData,
      ...req.body.staffAugmentationData,
    };
    if (isMongoActive()) {
      try {
        await Page.findOneAndUpdate(
          { slug: 'services-staff-augmentation' },
          { $set: { data: currentStaffAugmentationData } },
          { upsert: true }
        );
      } catch (err) {
        console.warn(
          'Could not persist staffAugmentationData to MongoDB:',
          err.message
        );
      }
    }
    res.json({
      message: 'Staff augmentation data updated successfully',
      staffAugmentationData: currentStaffAugmentationData,
    });
  } else {
    res
      .status(400)
      .json({ error: 'staffAugmentationData object is required in body' });
  }
});

router.post('/staff-augmentation/consultation', publicSubmissionRateLimiter, (req, res) => {
  const { name, email, phone, company, roleNeeded, preferredTime, details } =
    req.body;
  if (!name || !email || !company) {
    return res
      .status(400)
      .json({ error: 'Name, email, and company name are required.' });
  }
  console.log('🚀 New Staff Augmentation Workforce Strategy Request:', {
    name,
    email,
    phone,
    company,
    roleNeeded,
    preferredTime,
    details,
  });
  res.json({
    success: true,
    message:
      'Thank you! Your workforce consultation request has been received. A Senior Talent Architect will reach out within 5 hours.',
  });
});

// --- Permanent Staffing & Executive Search Endpoints ---
router.get('/permanent-staffing', async (req, res) => {
  const result = await getPageDataBySlug(
    'services-permanent-staffing',
    currentPermanentStaffingData
  );
  res.json(result);
});

router.get('/executive-search', async (req, res) => {
  const result = await getPageDataBySlug(
    'services-permanent-staffing',
    currentPermanentStaffingData
  );
  res.json(result);
});

router.post('/permanent-staffing', adminAuthGuard, async (req, res) => {
  if (req.body.permanentStaffingData) {
    currentPermanentStaffingData = {
      ...currentPermanentStaffingData,
      ...req.body.permanentStaffingData,
    };
    if (isMongoActive()) {
      try {
        await Page.findOneAndUpdate(
          { slug: 'services-permanent-staffing' },
          { $set: { data: currentPermanentStaffingData } },
          { upsert: true }
        );
      } catch (err) {
        console.warn(
          'Could not persist permanentStaffingData to MongoDB:',
          err.message
        );
      }
    }
    res.json({
      message: 'Permanent staffing data updated successfully',
      permanentStaffingData: currentPermanentStaffingData,
    });
  } else {
    res
      .status(400)
      .json({ error: 'permanentStaffingData object is required in body' });
  }
});

const handleExecutiveSearchConsultation = (req, res) => {
  const {
    fullName,
    workEmail,
    companyName,
    directPhone,
    mandateHierarchy,
    targetTimeline,
    mandateScope,
    isConfidential,
  } = req.body;
  if (!fullName || !workEmail || !companyName) {
    return res
      .status(400)
      .json({ error: 'Full name, work email, and company name are required.' });
  }
  console.log('🏛️ New Executive Search Mandate Request:', {
    fullName,
    workEmail,
    companyName,
    directPhone,
    mandateHierarchy,
    targetTimeline,
    mandateScope,
    isConfidential,
  });
  res.json({
    success: true,
    message:
      'Thank you! Your confidential executive search mandate has been registered. A Managing Partner will connect within 2 hours.',
  });
};

router.post(
  '/permanent-staffing/consultation',
  publicSubmissionRateLimiter,
  handleExecutiveSearchConsultation
);
router.post(
  '/executive-search/consultation',
  publicSubmissionRateLimiter,
  handleExecutiveSearchConsultation
);

// --- Find Talent & Enterprise Requisition Endpoints ---
router.get('/find-talent', async (req, res) => {
  const result = await getPageDataBySlug('find-talent', currentFindTalentData);
  res.json(result);
});

router.post('/find-talent/requisition', publicSubmissionRateLimiter, async (req, res) => {
  const {
    engagementModel,
    targetRole,
    headcount,
    seniority,
    techStack,
    deploymentUrgency,
    workArrangement,
    budgetEnvelope,
    fullName,
    corporateEmail,
    company,
    phone,
    jobDescription,
  } = req.body;

  if (!fullName || !corporateEmail || !company || !targetRole) {
    return res.status(400).json({
      error:
        'Full name, corporate email, company, and target role are required.',
    });
  }

  logger.info('New Enterprise Talent Requisition Logged:', {
    engagementModel,
    targetRole,
    headcount,
    seniority,
    techStack,
    deploymentUrgency,
    workArrangement,
    budgetEnvelope,
    fullName,
    corporateEmail,
    company,
    phone,
    jobDescription,
  });

  if (isMongoActive()) {
    try {
      await Activity.create({
        action: 'Requisition Created',
        entityType: 'Job',
        entityId: company,
        description: `Enterprise talent requisition for ${headcount || 1}x ${targetRole} (${seniority || 'Senior'}) by ${company} (${fullName} - ${corporateEmail})`,
        user: { name: fullName, role: 'client' },
        badgeColor: '#8064D8',
      });
    } catch (err) {
      logger.warn(
        'Could not persist requisition activity to MongoDB:',
        err.message
      );
    }
  }

  res.json({
    success: true,
    message:
      'Requisition logged with Enterprise Queue. 3 candidate dossiers will be delivered within 5 hours.',
  });
});

// --- Candidate Portal Endpoints ---
router.get('/candidate-portal', async (req, res) => {
  const result = await getPageDataBySlug(
    'candidate-portal',
    currentCandidatePortalData
  );
  res.json(result);
});

router.post('/candidate-portal/timesheet', async (req, res) => {
  const { hours, weekEnding, comments } = req.body;
  logger.info('⏱️ Candidate Weekly Timesheet Submitted:', {
    hours,
    weekEnding,
    comments,
  });

  if (isMongoActive()) {
    try {
      await Activity.create({
        action: 'Timesheet Submitted',
        entityType: 'Placement',
        entityId: weekEnding || 'Current Week',
        description: `Weekly timesheet submitted: ${hours || 40} hours logged for week ending ${weekEnding || 'N/A'}. Comments: ${comments || 'None'}`,
        user: { name: 'Candidate Worker', role: 'candidate' },
        badgeColor: '#16A34A',
      });
    } catch (err) {
      logger.warn(
        'Could not persist timesheet activity to MongoDB:',
        err.message
      );
    }
  }

  res.json({
    success: true,
    message:
      'Weekly timesheet submitted successfully and forwarded to client approval desk.',
  });
});

export default router;
