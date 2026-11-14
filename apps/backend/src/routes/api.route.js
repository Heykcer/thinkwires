import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

import JobRequirement from '../models/job.mongo.model.js';
import Article from '../models/article.mongo.model.js';
import Page from '../models/page.mongo.model.js';
import Candidate from '../models/candidate.mongo.model.js';
import JobApplication from '../models/jobApplication.mongo.model.js';
import Activity from '../models/activity.mongo.model.js';
import aiService from '../services/ai.service.js';
import { logger } from '../utils/logger.js';
import { loadSeedJson } from '../utils/seedLoader.js';
import rateLimit from 'express-rate-limit';
import requireAuth, { requireCandidateAuth } from '../middlewares/auth.middleware.js';
import { recordInboundRequisition } from '../controllers/admin.controller.js';
import { sendRequisitionNotificationEmail } from '../utils/recruitmentEmail.util.js';
import { recordHelpDeskInquiry } from '../models/helpdesk.mongo.model.js';
import { calculateCandidatePricing, parseNoticeDays } from '../utils/pricing.utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isMongoActive = () => mongoose.connection.readyState === 1;

/**
 * Sanitize public job descriptions to strip intake metadata, personal contact info, and corporate emails
 */
const sanitizeJobDescription = (desc) => {
  if (!desc || typeof desc !== 'string') return '';
  return desc
    // Redact email addresses
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[redacted]')
    // Redact phone numbers
    .replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[redacted]')
    // Remove intake manager signature patterns like "(FullName - email@example.com)"
    .replace(/\([^)]*@[^)]*\)/g, '')
    .trim();
};

// Robustly load mockData across environments (local, tests, monorepo, Vercel Serverless)
const mockData = loadSeedJson('mockData.json', {}) || {};
const {
  initialTechStack = [],
  initialOpenings = [],
  industriesData = [],
  processData = [],
  capabilitiesData = [],
  reportsData = [],
  statsData = {},
  benefitsData = [],
  faqsData = [],
  articlesData = [],
  featuredArticleData = null,
  researchersData = [],
  industriesPageData = null,
  benchData = null,
  payrollData = null,
  eorData = null,
  staffAugmentationData = null,
  permanentStaffingData = null,
  findTalentData = null,
  candidatePortalData = null,
  aboutData = null,
  contactData = null,
  industriesDetails = null,
} = mockData;

let currentPayrollData = payrollData ? { ...payrollData } : null;
let currentEorData = eorData ? { ...eorData } : null;
let currentStaffAugmentationData = staffAugmentationData
  ? { ...staffAugmentationData }
  : null;
let currentPermanentStaffingData = permanentStaffingData
  ? { ...permanentStaffingData }
  : null;
let currentFindTalentData = findTalentData ? { ...findTalentData } : null;
let currentCandidatePortalData = candidatePortalData
  ? { ...candidatePortalData }
  : null;

const router = express.Router();

// Strict RBAC guards separating manpower recruitment operations from CMS content publishing
const manpowerGuard = requireAuth(['superadmin', 'admin']);
const cmsGuard = requireAuth(['superadmin', 'cms_admin']);

// Rate limiter for public lead generation / consultation submissions to prevent spam and DoS
const publicSubmissionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 submissions per 15 minutes
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

// Mutable in-memory state for fallback & instant local responses
let techStack = [...(initialTechStack || [])];
let openings = [...(initialOpenings || [])];
let stats = { ...(statsData || {}) };
let industries = [...(industriesData || [])];
let processSteps = [...(processData || [])];
let capabilities = [...(capabilitiesData || [])];
let reports = [...(reportsData || [])];
let benefits = benefitsData ? [...benefitsData] : [];
let faqs = faqsData ? [...faqsData] : [];
let articles = articlesData ? [...articlesData] : [];
let featuredArticle = featuredArticleData ? { ...featuredArticleData } : null;
let researchers = researchersData ? [...researchersData] : [];
let bench = benchData
  ? { ...benchData }
  : {
    statsBadges: [],
    specialtyFilters: [],
    talents: [],
    dossierFeatures: [],
    vettingGates: [],
  };

// --- Helper to get home page section from Mongo or fallback ---
const getHomeSection = async (sectionKey, fallbackValue) => {
  if (isMongoActive()) {
    try {
      const homePage = await Page.findOne({ slug: 'home' }).lean();
      if (homePage?.data && homePage.data[sectionKey] !== undefined) {
        return homePage.data[sectionKey];
      }
    } catch (err) {
      console.warn(
        `Error reading home section '${sectionKey}' from MongoDB:`,
        err.message
      );
    }
  }
  return fallbackValue;
};

// --- Public CMS Pages API ---
router.get('/pages', async (req, res) => {
  if (isMongoActive()) {
    try {
      const dbPages = await Page.find({ status: 'published' })
        .select('-__v')
        .sort({ title: 1 })
        .lean();
      if (dbPages.length > 0) return res.json(dbPages);
    } catch (err) {
      console.warn('Error reading pages from MongoDB:', err.message);
    }
  }
  res.json([]);
});

router.get('/pages/:slug', async (req, res) => {
  const { slug } = req.params;
  const cleanSlug = slug.toLowerCase().trim();
  if (isMongoActive()) {
    try {
      const page = await Page.findOne({
        slug: cleanSlug,
        status: 'published',
      }).lean();
      if (page) return res.json(page);
    } catch (err) {
      console.warn(
        `Error reading page '${cleanSlug}' from MongoDB:`,
        err.message
      );
    }
  }

  if (cleanSlug === 'industries' && industriesPageData) {
    return res.json({
      slug: 'industries',
      title: 'Industries We Serve',
      data: industriesPageData,
    });
  }
  if (cleanSlug === 'bench' && benchData) {
    return res.json({ slug: 'bench', title: 'Bench Talent', data: benchData });
  }
  if (cleanSlug === 'about' && aboutData) {
    return res.json({ slug: 'about', title: 'About Us', data: aboutData });
  }
  if (cleanSlug === 'contact' && contactData) {
    return res.json({
      slug: 'contact',
      title: 'Contact Us',
      data: contactData,
    });
  }

  res.status(404).json({ error: `Page '${cleanSlug}' not found` });
});

// --- Benefits ---
router.get('/benefits', async (req, res) => {
  const result = await getHomeSection('benefits', benefits);
  res.json(result);
});

// --- FAQs ---
router.get('/faqs', async (req, res) => {
  const result = await getHomeSection('faqs', faqs);
  res.json(result);
});

// --- Tech Stack (Static) ---
router.get('/tech-stack', (req, res) => {
  res.json(techStack);
});

// --- Openings ---
router.get('/openings', async (req, res) => {
  const {
    q,
    location,
    experience,
    workMode,
    jobMode,
    noticePeriod,
    department,
    sort,
  } = req.query;

  let sourceOpenings = openings;

  // Populate active postings from MongoDB if available
  if (isMongoActive()) {
    try {
      const dbJobs = await JobRequirement.find({
        status: { $in: ['Active', 'Approved', 'Published'] },
        isRequisition: { $ne: true },
      })
        .sort({ createdAt: -1 })
        .lean();
      sourceOpenings = (dbJobs || []).map((j) => ({
        id: j.jobId || j._id,
        _id: j._id,
        title: j.title,
        // STRICT CLIENT CONFIDENTIALITY ON PUBLIC WEBSITE
        company: 'Enterprise Client (Confidential)',
        client: 'Enterprise Client (Confidential)',
        category: j.category || 'Technology',
        badge: j.badge || '',
        badgeColor: j.badgeColor || 'blue',
        logo: j.logo || 'TW',
        location: j.location || 'Remote',
        officeLocation: j.officeLocation || '',
        experience: j.experience || `${j.experienceRequired || 3}+ Years`,
        experienceTier: j.experienceTier || 'Mid-Senior',
        experienceRequired: j.experienceRequired || 3,
        salary: j.salary || j.budget || 'Competitive CTC',
        budget: j.budget || j.salary || 'Competitive CTC',
        joining: j.joining || 'Immediate',
        jobMode: j.jobMode || 'Permanent',
        workMode: j.workMode || 'Remote',
        noticePeriod: j.noticePeriod || 'Immediate',
        description: sanitizeJobDescription(j.description),
        requirements: j.requirements || '',
        industry: j.industry || 'Information Technology & Cloud',
        skills:
          j.skills && j.skills.length > 0 ? j.skills : j.requiredSkills || [],
        department: j.department || 'Technology',
        postedDate:
          j.postedDate ||
          (j.createdAt
            ? new Date(j.createdAt).toISOString().split('T')[0]
            : '2026-10-15'),
        priority: j.priority || 1,
      }));
    } catch (dbErr) {
      console.warn(
        'Fallback to memory openings due to MongoDB error:',
        dbErr.message
      );
    }
  } else {
    // Fallback to fresh mockData.json read if Mongo not active
    try {
      const parsed = loadSeedJson('mockData.json', {});
      if (
        Array.isArray(parsed.initialOpenings) &&
        parsed.initialOpenings.length > 0
      ) {
        sourceOpenings = parsed.initialOpenings;
        openings = [...sourceOpenings];
      }
    } catch (readErr) {
      console.warn('Fallback to memory openings:', readErr.message);
    }
  }

  // Issue #202: Exclude unapproved inbound requisitions and closed jobs from public listings
  const activeJobs = sourceOpenings.filter((job) => {
    if (job.isRequisition === true) return false;
    if (job.status && !['Active', 'Approved', 'Published'].includes(job.status)) {
      return false;
    }
    return true;
  });

  // Ensure ALL public openings mask client details and sanitize descriptions
  let filtered = activeJobs.map((job) => ({
    ...job,
    company: 'Enterprise Client (Confidential)',
    client: 'Enterprise Client (Confidential)',
    description: sanitizeJobDescription(job.description),
    requirements: job.requirements || '',
    industry: job.industry || 'Information Technology & Cloud',
  }));

  // Search keyword (q) - search title, skills, description, requirements without exposing client names
  if (q && q.trim() !== '') {
    const search = q.trim().toLowerCase();
    filtered = filtered.filter((job) => {
      const matchTitle = job.title && job.title.toLowerCase().includes(search);
      const matchCategory =
        job.category && job.category.toLowerCase().includes(search);
      const matchDesc =
        job.description && job.description.toLowerCase().includes(search);
      const matchReq =
        job.requirements && job.requirements.toLowerCase().includes(search);
      const matchSkills =
        job.skills && job.skills.some((s) => s.toLowerCase().includes(search));
      const matchJobMode =
        job.jobMode && job.jobMode.toLowerCase().includes(search);
      const matchWorkMode =
        job.workMode && job.workMode.toLowerCase().includes(search);
      const matchNotice =
        job.noticePeriod && job.noticePeriod.toLowerCase().includes(search);
      return (
        matchTitle ||
        matchCategory ||
        matchDesc ||
        matchReq ||
        matchSkills ||
        matchJobMode ||
        matchWorkMode ||
        matchNotice
      );
    });
  }

  // Location filter
  if (location && location !== 'All') {
    const loc = location.toLowerCase();
    filtered = filtered.filter((job) => {
      if (!job.location) return false;
      if (loc === 'remote') {
        return (
          job.location.toLowerCase().includes('remote') ||
          job.workMode === 'Work From Home' ||
          job.workMode === 'Remote'
        );
      }
      return job.location.toLowerCase().includes(loc);
    });
  }

  // Experience filter
  if (experience && experience !== 'All') {
    filtered = filtered.filter((job) => {
      if (job.experienceTier && job.experienceTier === experience) return true;
      if (
        job.experience &&
        job.experience.toLowerCase().includes(experience.toLowerCase())
      )
        return true;
      return false;
    });
  }

  // Work Mode filter (supports Work From Home, Work From Office, Hybrid, and legacy Remote / On-site)
  if (workMode && workMode !== 'All Modes' && workMode !== 'All') {
    const targetMode = workMode.toLowerCase();
    filtered = filtered.filter((job) => {
      const jw = (job.workMode || '').toLowerCase();
      const jl = (job.location || '').toLowerCase();
      if (targetMode === 'work from home' || targetMode === 'remote') {
        return (
          jw === 'work from home' || jw === 'remote' || jl.includes('remote')
        );
      }
      if (targetMode === 'work from office' || targetMode === 'on-site') {
        return (
          jw === 'work from office' || jw === 'on-site' || jw.includes('office')
        );
      }
      if (targetMode === 'hybrid') {
        return jw === 'hybrid' || jl.includes('hybrid');
      }
      return jw === targetMode;
    });
  }

  // Job Mode filter (Permanent, Contract, Contract to Hire)
  if (
    jobMode &&
    jobMode !== 'All Modes' &&
    jobMode !== 'All Types' &&
    jobMode !== 'All'
  ) {
    const targetJobMode = jobMode.toLowerCase();
    filtered = filtered.filter((job) => {
      const jm = (job.jobMode || '').toLowerCase();
      return jm === targetJobMode;
    });
  }

  // Notice Period filter (Immediate, On Notice Period, < 30 Days, > 30 Days)
  if (noticePeriod && noticePeriod !== 'All Notice' && noticePeriod !== 'All') {
    const targetNotice = noticePeriod.toLowerCase();
    filtered = filtered.filter((job) => {
      const jn = (job.noticePeriod || '').toLowerCase();
      return jn === targetNotice;
    });
  }

  // Department / Category filter
  if (department && department !== 'All Roles' && department !== 'All') {
    filtered = filtered.filter(
      (job) =>
        job.department === department ||
        (job.category &&
          job.category.toLowerCase().includes(department.toLowerCase()))
    );
  }

  // Sort
  if (sort === 'Title A-Z') {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === 'Highest Salary') {
    filtered.sort((a, b) => (b.salary || '').localeCompare(a.salary || ''));
  } else {
    // Default priority/newest sort
    filtered.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return new Date(b.postedDate || 0) - new Date(a.postedDate || 0);
    });
  }

  res.json(filtered);
});

router.post('/openings', manpowerGuard, async (req, res) => {
  if (Array.isArray(req.body.openings)) {
    openings = req.body.openings;
    if (isMongoActive()) {
      try {
        for (const j of req.body.openings) {
          await JobRequirement.findOneAndUpdate(
            { title: j.title, client: j.company || 'Thinkwires Client' },
            { ...j, client: j.company || 'Thinkwires Client' },
            { upsert: true }
          );
        }
      } catch (err) {
        console.warn('Could not sync openings to MongoDB:', err.message);
      }
    }
    res.json({ message: 'Openings updated successfully', openings });
  } else {
    res.status(400).json({ error: 'openings must be an array of objects' });
  }
});

// --- Stats ---
router.get('/stats', async (req, res) => {
  const result = await getHomeSection('stats', stats);
  res.json(result);
});
router.post('/stats', cmsGuard, async (req, res) => {
  if (req.body.stats) {
    stats = { ...stats, ...req.body.stats };
    if (isMongoActive()) {
      try {
        await Page.findOneAndUpdate(
          { slug: 'home' },
          { $set: { 'data.stats': stats } },
          { upsert: true }
        );
      } catch (err) {
        console.warn('Could not persist stats to MongoDB:', err.message);
      }
    }
    res.json({ message: 'Stats updated successfully', stats });
  } else {
    res.status(400).json({ error: 'stats object is required in body' });
  }
});


// --- Process ---
router.get('/process', async (req, res) => {
  const result = await getHomeSection('process', processSteps);
  res.json(result);
});
router.post('/process', cmsGuard, async (req, res) => {
  if (Array.isArray(req.body.processSteps)) {
    processSteps = req.body.processSteps;
    if (isMongoActive()) {
      try {
        await Page.findOneAndUpdate(
          { slug: 'home' },
          { $set: { 'data.process': processSteps } },
          { upsert: true }
        );
      } catch (err) {
        console.warn(
          'Could not persist process steps to MongoDB:',
          err.message
        );
      }
    }
    res.json({ message: 'Process steps updated successfully', processSteps });
  } else {
    res.status(400).json({ error: 'processSteps must be an array of objects' });
  }
});

// --- Capabilities ---
router.get('/capabilities', async (req, res) => {
  const result = await getHomeSection('capabilities', capabilities);
  res.json(result);
});
router.post('/capabilities', cmsGuard, async (req, res) => {
  if (Array.isArray(req.body.capabilities)) {
    capabilities = req.body.capabilities;
    if (isMongoActive()) {
      try {
        await Page.findOneAndUpdate(
          { slug: 'home' },
          { $set: { 'data.capabilities': capabilities } },
          { upsert: true }
        );
      } catch (err) {
        console.warn('Could not persist capabilities to MongoDB:', err.message);
      }
    }
    res.json({ message: 'Capabilities updated successfully', capabilities });
  } else {
    res.status(400).json({ error: 'capabilities must be an array of objects' });
  }
});

// --- Reports ---
router.get('/reports', async (req, res) => {
  const result = await getHomeSection('reports', reports);
  res.json(result);
});
router.post('/reports', cmsGuard, async (req, res) => {
  if (Array.isArray(req.body.reports)) {
    reports = req.body.reports;
    if (isMongoActive()) {
      try {
        await Page.findOneAndUpdate(
          { slug: 'home' },
          { $set: { 'data.reports': reports } },
          { upsert: true }
        );
      } catch (err) {
        console.warn('Could not persist reports to MongoDB:', err.message);
      }
    }
    res.json({ message: 'Reports updated successfully', reports });
  } else {
    res.status(400).json({ error: 'reports must be an array of objects' });
  }
});


// --- Helper to get Page data by slug ---
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


// About Page & Corporate Advisory Endpoints
const aboutDataset = {
  company: {
    name: 'Thinkwires',
    founded: 2022,
    headquarters:
      'Plot No. 20, Block H-1/A, Sector 63, Noida, Uttar Pradesh 201301',
    locations: ['India', 'USA', 'Canada'],
    eyebrow: 'ABOUT THINKWIRES',
    headline: 'Connecting Global Ambition with Exceptional Tech Talent.',
    subheading:
      'Founded in 2022 as a premier workforce advisor and staffing aggregator, Thinkwires connects high-growth enterprises with specialized engineering talent and compliant Employer of Record (EOR) infrastructure across India, the US, and Canada.',
    heroImage: '/images/about-hero.jpg',
    heroImageAlt: 'Thinkwires Global Technology Talent Delivery Network',
    overview: {
      eyebrow: 'COMPANY OVERVIEW',
      title: 'Architecting High-Velocity Engineering Squads for Global Scale',
      summary:
        'Thinkwires was established in 2022 to dismantle the structural bottlenecks of traditional IT staffing. Operating across high-demand tech corridors in India, the United States, and Canada, we combine the domain depth of an executive search firm with the rapid scalability of an aggregator ecosystem.',
      mission:
        'To engineer frictionless, compliant, and hyper-targeted talent pipelines that enable technology leaders to build and scale world-class software teams without borders.',
      pillars: [
        {
          title: 'Architectural Vetting',
          description:
            'Every engineering profile is evaluated beyond the CV through deep system design benchmarks, code telemetry, and domain-specific delivery audits.',
        },
        {
          title: 'SLA-Driven Velocity',
          description:
            'Our aggregator engine delivers verified, interview-ready candidate dossiers within 5 business hours of intake, drastically reducing time-to-hire.',
        },
        {
          title: 'Zero-Risk Compliance',
          description:
            'Full Employer of Record (EOR) indemnification, cross-border payroll, IP assignments, and multi-jurisdictional labor law compliance from day one.',
        },
      ],
    },
  },
  stats: [
    {
      id: 'profile-delivery',
      value: '5h',
      numericValue: 5,
      unit: 'h',
      label: 'First Curated Profiles',
      subLabel: 'Proprietary intake & matching SLA',
      accent: 'blue',
    },
    {
      id: 'time-to-hire',
      value: '7d',
      numericValue: 7,
      unit: 'd',
      label: 'Time-to-Hire Target',
      subLabel: 'End-to-end interview to contract',
      accent: 'green',
    },
    {
      id: 'executive-experience',
      value: '100+',
      numericValue: 100,
      unit: 'Yrs',
      label: 'Combined Executive Experience',
      subLabel: 'Cross-border enterprise leadership depth',
      accent: 'blue',
    },
    {
      id: 'statutory-compliance',
      value: '100%',
      numericValue: 100,
      unit: '%',
      label: 'Statutory Compliance',
      subLabel: 'EOR & cross-border governance assurance',
      accent: 'green',
    },
  ],
  aggregatorModel: {
    eyebrow: 'STRATEGIC ADVANTAGE',
    heading: 'The Thinkwires Aggregator Model',
    description:
      'Traditional recruitment agencies bottleneck on internal databases. Thinkwires functions as an enterprise staffing aggregator orchestrating a high-velocity ecosystem of verified partner agencies, independent specialists, and automated compliance pipelines.',
    cards: [
      {
        id: 'agg-1',
        icon: 'clock',
        title: 'Rapid Profile Delivery (5 Hours)',
        description:
          'Proprietary matching algorithms search verified repositories to deliver pre-screened, job-fit candidate dossiers within 5 working hours of intake.',
        detail:
          'Guaranteed sub-5-hour SLA response with benchmarked technical scorecards.',
      },
      {
        id: 'agg-2',
        icon: 'layers',
        title: 'Full-Stack Tech & Enterprise ERP',
        description:
          'Specialized domain depth spanning SAP ABAP/HANA, Adobe Experience Manager (AEM), Teamcenter PLM, Kubernetes/DevOps, and Generative AI frameworks.',
        detail:
          'Pre-vetted engineering squads ready for immediate deployment into enterprise stacks.',
      },
      {
        id: 'agg-3',
        icon: 'shield',
        title: 'Compliance and EOR Infrastructure',
        description:
          'Complete Employer of Record (EOR) indemnification. We manage local statutory payroll, benefits, strict IP NDA assignments, and multi-jurisdiction tax withholding.',
        detail:
          'Bulletproof legal governance covering Indian statutory mandates, US W2/1099, and Canadian labor regulations.',
      },
      {
        id: 'agg-4',
        icon: 'network',
        title: 'Agile Subcontractor Network',
        description:
          'A curated network of certified boutique recruitment partners providing instant surge capacity without inflating fixed operational overhead.',
        detail:
          'Elastic scaling framework enabling enterprises to mobilize specialized benches on demand.',
      },
    ],
  },
  philosophy: {
    eyebrow: 'OUR PHILOSOPHY',
    heading: '"Recruitment is Not Transactional; It is Architectural."',
    description:
      'At Thinkwires, we reject the legacy headhunter pattern of resume-dumping. We treat every client intake as an engineering brief. From understanding the nuances of microservices architectures to navigating localized tax laws in Ontario or California, our teams engineer frictionless, compliant talent conduits.',
    image: '/images/about-philosophy.jpg',
    imageAlt: 'Thinkwires executive strategic advisory session',
    metrics: [
      {
        id: 'metric-1',
        value: '98.4%',
        label: 'Contract Retention Rate',
      },
      {
        id: 'metric-2',
        value: '< 48 hrs',
        label: 'Candidate Interview Turnaround',
      },
    ],
  },
  leadership: [
    {
      id: 'leader-001',
      name: 'Naziya Husain',
      designation: 'Founder Member',
      experience: '14+ Years',
      initials: 'NH',
      bio: 'With over 14 years in recruitment, headhunting, talent mapping, and end-to-end manpower solutions, Naziya has successfully steered complex mandates across KPOs, top-tier management consulting firms, and fast-scaling digital startups.',
      expertise: [
        'Talent Mapping',
        'Executive Headhunting',
        'Manpower Solutions',
        'KPO Mandates',
      ],
      image: null,
      linkedin: null,
    },
    {
      id: 'leader-002',
      name: 'Anju Balyan',
      designation: 'Co-Founder & Associate Executive Director',
      experience: '17+ Years',
      initials: 'AB',
      bio: 'Enthusiastic enterprise HR leader with 17 years aligning HR initiatives with tier-one business priorities. Specialist in shared services environments, transitions, legal frameworks, ERP rollouts, and HR automation systems.',
      expertise: [
        'Enterprise HR Architecture',
        'Shared Services',
        'ERP Transitions',
        'Labor Frameworks',
      ],
      image: null,
      linkedin: null,
    },
    {
      id: 'leader-003',
      name: 'Ananya Mehta',
      designation: 'Chief Executive Officer (CEO)',
      experience: '15+ Years',
      initials: 'AM',
      bio: 'Dedicated to building teams that drive real business velocity. Expert in strategic talent research, executive search, deep candidate evaluation beyond CVs, and structuring high-trust leadership placements for global scale.',
      expertise: [
        'Executive Search',
        'Organizational Scaling',
        'Strategic Sourcing',
        'Talent Evaluation',
      ],
      image: null,
      linkedin: null,
    },
    {
      id: 'leader-004',
      name: 'Arjun Verma',
      designation: 'Chief People & Marketing Officer (CPO & CMO)',
      experience: '20+ Years',
      initials: 'AV',
      bio: 'A 20+-year veteran at the intersection of talent acquisition, organizational culture, and brand positioning. Focused on solving why high-growth enterprises struggle to hire and how elite culture transforms product velocity.',
      expertise: [
        'People Strategy',
        'Employer Branding',
        'Talent Acquisition',
        'Culture Architecture',
      ],
      image: null,
      linkedin: null,
    },
    {
      id: 'leader-005',
      name: 'Meera Iyer',
      designation:
        'Senior Director - Global Head of TA Operations & HR Services',
      experience: '18+ Years',
      initials: 'MI',
      bio: 'Strategic Talent Acquisition and HR Operations executive who has built scalable, technology-driven recruitment frameworks across enterprise leaders including BlackRock, Microsoft, IBM, Ameriprise, and Infosys. Ensures institutional governance, risk mitigation, compliance, and flawless multi-region operations.',
      expertise: [
        'Global Delivery Operations',
        'Risk Mitigation',
        'EOR Compliance',
        'Operational Integrity',
      ],
      priorEnterprises: [
        'BlackRock',
        'Microsoft',
        'IBM',
        'Infosys',
        'Ameriprise',
      ],
      image: null,
      linkedin: null,
    },
  ],
  milestones: [
    {
      id: 'milestone-2022',
      year: '2022',
      tag: 'Foundation',
      title: 'Foundation',
      description:
        'Founded in Noida with a core team dedicated to borderless recruitment, pioneering an agency aggregator network that delivers verified profiles in under 5 hours.',
      status: 'completed',
    },
    {
      id: 'milestone-2023',
      year: '2023',
      tag: 'Practice Alignment',
      title: 'Growth and Practice Alignment',
      description:
        'Unit economics break-even achieved. Launched specialized talent practices across SAP ABAP/HANA, Cloud/DevOps, and Enterprise Salesforce consulting.',
      status: 'completed',
    },
    {
      id: 'milestone-2024',
      year: '2024',
      tag: 'Cross-Border Expansion',
      title: 'Cross-Border Expansion',
      description:
        'Inaugurated dedicated talent corridors into the United States and Canada. Rolled out comprehensive Employer of Record (EOR) and global payroll management.',
      status: 'completed',
    },
  ],
  roadmap: [
    {
      id: 'roadmap-2026',
      timeframe: '2026+',
      tag: 'Planned Roadmap',
      title: 'AI-Powered Delivery & Telemetry Vetting',
      description:
        'Automated code telemetry vetting, generative talent search matching, and sub-48-hour global deployment pipelines across AI and PLM systems.',
      status: 'planned',
    },
  ],
  methodology: [
    {
      step: '01',
      title: 'Discovery & Technical Scoping',
      description:
        'We initiate with an executive discovery session. We evaluate tech stack nuances, project deadlines, budgetary constraints, and candidate seniority to draft exact success metrics.',
      deliverable: 'Technical Requirement Specification & Delivery Scope',
    },
    {
      step: '02',
      title: 'Precision Pre-Vetted Matching (<5 Hours)',
      description:
        'Our aggregator engine coordinates across our specialized subcontractor network to deliver tested, pre-interviewed candidate dossiers within five working hours.',
      deliverable: 'Pre-Screened Candidate Dossiers & Technical Rubrics',
    },
    {
      step: '03',
      title: 'Onboarding & Governance',
      description:
        'Seamless offer negotiation, local statutory contract issuance via EOR, compliant equipment provisioning, and ongoing governance tracking ensure long-term retention.',
      deliverable: 'Full EOR Indemnification & Ongoing Performance Governance',
    },
  ],
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

// GET /api/about
router.get('/about', async (req, res) => {
  const data = await getPageDataBySlug('about', aboutDataset);
  res.json(data);
});

// GET /api/about/stats
router.get('/about/stats', async (req, res) => {
  const data = await getPageDataBySlug('about', aboutDataset);
  res.json(data.statsStrip || data.stats || aboutDataset.stats);
});

// GET /api/leadership
router.get('/leadership', async (req, res) => {
  const data = await getPageDataBySlug('about', aboutDataset);
  res.json(data.leadershipTeam || data.leadership || aboutDataset.leadership);
});

// GET /api/milestones
router.get('/milestones', async (req, res) => {
  const data = await getPageDataBySlug('about', aboutDataset);
  res.json({
    milestones: data.growthTimeline?.milestones || aboutDataset.milestones,
    roadmap: data.growthTimeline?.roadmap || aboutDataset.roadmap,
  });
});


// --- Find Talent & Enterprise Requisition Endpoints ---
router.get('/find-talent', async (req, res) => {
  const result = await getPageDataBySlug('find-talent', currentFindTalentData);
  res.json(result);
});

router.post('/find-talent/requisition', publicSubmissionRateLimiter, async (req, res) => {
  if (!isMongoActive() && process.env.NODE_ENV === 'production') {
    return res.status(503).json({
      success: false,
      error: 'Database connection temporarily unavailable. Please retry your request.',
      retryAfterSeconds: 5,
    });
  }

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
    isScopingCall,
    requestType,
    domain,
    consultationDate,
    consultationTime,
    scopeNotes,
  } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!fullName || !corporateEmail || !emailRegex.test(corporateEmail.trim()) || !targetRole) {
    return res
      .status(400)
      .json({
        error:
          'Valid full name, corporate email address, and required target role or skill demand are required.',
      });
  }

  const effectiveCompany = company && company.trim() ? company.trim() : 'Independent Client Inquiry';

  const isScoping = Boolean(
    isScopingCall ||
    requestType === 'scoping_call' ||
    (jobDescription && jobDescription.includes('[Scoping Call Request]')) ||
    (engagementModel && engagementModel.includes('Enterprise Consultation')) ||
    consultationDate
  );

  logger.info(
    isScoping
      ? 'New Technical Scoping Call Logged:'
      : 'New Enterprise Talent Requisition Logged:',
    {
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
      company: effectiveCompany,
      phone,
      jobDescription,
      isScopingCall: isScoping,
      consultationDate,
      consultationTime,
      domain,
    }
  );

  const resolvedDomain =
    domain ||
    (engagementModel && engagementModel.replace('Enterprise Consultation:', '').trim()) ||
    targetRole ||
    'Engineering Architecture';

  const requisitionPayload = {
    ...req.body,
    company: effectiveCompany,
    isScopingCall: isScoping,
    domain: resolvedDomain,
    consultationDate: consultationDate || null,
    consultationTime: consultationTime || null,
    scopeNotes: scopeNotes || null,
  };

  let createdRequisition = null;
  try {
    createdRequisition = await recordInboundRequisition(requisitionPayload);
  } catch (recErr) {
    logger.warn('Failed to record inbound requisition in admin store:', recErr.message);
  }

  // Trigger HR notification email to hr@thinkwires.com gracefully
  try {
    await sendRequisitionNotificationEmail(requisitionPayload);
  } catch (emailErr) {
    logger.warn('Requisition email notification trigger failure (non-blocking):', emailErr.message);
  }

  // Log to centralized HelpDesk
  try {
    const techStackDisplay = Array.isArray(techStack)
      ? techStack.join(', ')
      : (techStack || 'General');

    const helpDeskMessage = isScoping
      ? `Technical Scoping Call Request:
- Company / Enterprise: ${effectiveCompany}
- Contact Name: ${fullName}
- Corporate Email: ${corporateEmail}
- Phone / Contact: ${phone || 'Not Specified'}
- Primary Domain: ${resolvedDomain}
- Requested Consultation Slot: ${consultationDate || 'Immediate'} (${consultationTime || 'TBD'})
- Headcount / Volume: ${headcount || 'Core Squad'}
- Deployment Timeline: ${deploymentUrgency || 'Immediate'}
- Required Tech Stack: ${techStackDisplay}
- Work Arrangement: ${workArrangement || 'Remote'}
- Project Scope & Constraints: ${scopeNotes || jobDescription || 'Direct consultation requested during call.'}`
      : (jobDescription || `Requisition for ${headcount || 1} x ${targetRole || 'Engineer'} (${techStackDisplay})`);

    await recordHelpDeskInquiry({
      category: isScoping ? 'Enterprise Scoping' : 'Enterprise Requisition',
      fullName,
      email: corporateEmail,
      phone,
      company: effectiveCompany,
      subject: isScoping
        ? `[Scoping Call] ${resolvedDomain} - ${effectiveCompany}`
        : `Enterprise Requisition: ${targetRole || 'Engineering Squad'}`,
      message: helpDeskMessage,
      metadata: {
        isScopingCall: isScoping,
        consultationDate: consultationDate || null,
        consultationTime: consultationTime || null,
        domain: resolvedDomain,
        scopeNotes: scopeNotes || null,
        targetRole,
        headcount,
        seniority,
        techStack,
        deploymentUrgency,
        workArrangement,
        requisitionId: createdRequisition?.requisitionId || null,
      },
      priority: isScoping ? 'Critical' : 'Urgent',
    });
  } catch (hdErr) {
    logger.warn('HelpDesk requisition logging warning:', hdErr.message);
  }

  res.json({
    success: true,
    message: isScoping
      ? 'Technical scoping call scheduled. An invitation and calendar invite will be delivered to your corporate email.'
      : 'Requisition logged with Enterprise Queue. 3 candidate dossiers will be delivered within 5 hours.',
    requisition: createdRequisition,
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

// Issue #204: Require candidate authentication and enforce hour bounds (1 - 168)
router.post(
  '/candidate-portal/timesheet',
  requireCandidateAuth,
  async (req, res) => {
    if (!isMongoActive() && process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        success: false,
        error: 'Database connection temporarily unavailable. Please retry your request.',
        retryAfterSeconds: 5,
      });
    }

    const candidateId = req.candidate?._id || req.candidate?.id;
    const candidateName = req.candidate?.name || 'Authenticated Candidate';
    const { hours, weekEnding, comments } = req.body;

    const parsedHours = Number(hours);
    if (!hours || isNaN(parsedHours) || parsedHours <= 0 || parsedHours > 168) {
      return res.status(400).json({
        success: false,
        error: 'Valid logged hours (between 1 and 168) are required.',
      });
    }

    logger.info('⏱️ Candidate Weekly Timesheet Submitted:', {
      candidateId,
      candidateName,
      hours: parsedHours,
      weekEnding,
      comments,
    });

    if (isMongoActive()) {
      try {
        await Activity.create({
          action: 'Timesheet Submitted',
          entityType: 'Placement',
          entityId: weekEnding || 'Current Week',
          description: `Weekly timesheet submitted by ${candidateName}: ${parsedHours} hours logged for week ending ${weekEnding || 'N/A'}.${comments ? ` Comments: ${comments}` : ''}`,
          user: { name: candidateName, role: 'candidate', id: candidateId },
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
  }
);

export default router;
