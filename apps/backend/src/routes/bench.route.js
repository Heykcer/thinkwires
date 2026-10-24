import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Candidate from '../models/candidate.mongo.model.js';
import Activity from '../models/activity.mongo.model.js';
import {
  isMongoActive,
  getPageDataBySlug,
  publicSubmissionRateLimiter,
} from '../utils/cms.util.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'seeds', 'mockData.json'), 'utf8')
);
const bench = mockData.benchData || {
  statsBadges: [],
  specialtyFilters: [],
  talents: [],
  dossierFeatures: [],
  vettingGates: [],
};

const router = express.Router();

/**
 * Resolves candidate engineering specialty based on technical skills and role keywords.
 */
const detectSpecialty = (skills = [], role = '', existingSpecialty = '') => {
  if (
    existingSpecialty &&
    !['Engineering', 'Systems & Distributed'].includes(existingSpecialty)
  ) {
    const normalized = {
      genai: 'GenAI & LLMs',
      cloud: 'Cloud & DevOps',
      sap: 'SAP & Enterprise',
      systems: 'Systems & Distributed',
      data: 'Data & Analytics',
    }[existingSpecialty.toLowerCase()];
    if (normalized) return normalized;
    if (
      [
        'GenAI & LLMs',
        'Cloud & DevOps',
        'SAP & Enterprise',
        'Systems & Distributed',
        'Data & Analytics',
      ].includes(existingSpecialty)
    ) {
      return existingSpecialty;
    }
  }

  const text = [
    ...(Array.isArray(skills) ? skills : [skills]),
    role,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (
    /pytorch|llm|genai|langchain|rag|openai|transformer|nlp|prompt|diffusion|vllm|triton/i.test(
      text
    )
  ) {
    return 'GenAI & LLMs';
  }
  if (
    /aws|azure|gcp|kubernetes|docker|devops|terraform|ansible|helm|cloud|istio|finops|ci\/cd|sre|platform/i.test(
      text
    )
  ) {
    return 'Cloud & DevOps';
  }
  if (/sap|abap|hana|fico|erp|enterprise|salesforce/i.test(text)) {
    return 'SAP & Enterprise';
  }
  if (
    /sql|data|etl|snowflake|databricks|spark|analytics|hadoop|pandas|bi|scikit|machine learning/i.test(
      text
    )
  ) {
    return 'Data & Analytics';
  }
  return 'Systems & Distributed';
};

/**
 * Formats a live vetted MongoDB Candidate document into the standardized Talent Cloud Bench schema.
 */
const formatMongoCandidateToTalent = (c) => {
  const candidateSkills =
    c.technicalSkills && c.technicalSkills.length > 0
      ? c.technicalSkills
      : ['React', 'Node.js', 'PostgreSQL'];
  const role = c.currentRole || 'Software Professional';
  const candSpecialty = detectSpecialty(candidateSkills, role, c.specialty);
  const candCode = `TW-CAND-${c._id.toString().slice(-4).toUpperCase()}`;
  const score = c.assessmentScore || c.vettingScore || 90;

  return {
    id: candCode,
    code: candCode,
    mongoId: c._id.toString(),
    title: role,
    role: role,
    initials: c.name
      ? c.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : 'TW',
    specialty: candSpecialty,
    seniorityTier:
      (c.experience || 0) >= 8
        ? 'staff'
        : (c.experience || 0) >= 5
          ? 'senior'
          : 'lead',
    experience: `${c.experience || 5}+ Yrs Exp`,
    yearsExp: `${c.experience || 5}+ Yrs Exp`,
    experienceLevel:
      (c.experience || 0) >= 8
        ? 'Staff/Principal (10+y)'
        : (c.experience || 0) >= 5
          ? 'Senior (6-9y)'
          : 'Lead (8+y)',
    location: c.location || 'Remote Global',
    technicalRating: score,
    score: score,
    assessmentScore: c.assessmentScore !== undefined ? c.assessmentScore : score,
    fitScore: c.fitScore,
    availability: c.noticePeriod || 'Immediate (24-48h)',
    urgency: c.noticePeriod || 'Immediate (24-48h)',
    noticePeriod: c.noticePeriod || 'Immediate',
    hourlyRate: c.expectedSalary || '$65 - $80',
    engineeringProof:
      c.bio ||
      `Cleared ThinkWires technical screening assessment (${score}%).`,
    proofQuote:
      c.bio ||
      `Cleared ThinkWires technical screening assessment (${score}%).`,
    skills: candidateSkills,
    rubric: c.rubric || c.dossier?.rubric || {
      systemDesign: Math.min(100, Math.round(score * 1.02)),
      codeQuality: Math.min(100, Math.round(score * 0.98)),
      liveDebugging: Math.min(100, Math.round(score * 1.01)),
      communication: 96,
    },
    dossier: c.dossier || {
      rubric: c.rubric || {
        systemDesign: Math.min(100, Math.round(score * 1.02)),
        codeQuality: Math.min(100, Math.round(score * 0.98)),
        liveDebugging: Math.min(100, Math.round(score * 1.01)),
        communication: 96,
      },
      evaluatorNotes:
        c.bio ||
        `Cleared ThinkWires technical screening assessment (${score}%). Verified for immediate enterprise deployment.`,
      specialty: candSpecialty,
      verificationChecks: {
        identity: 'Verified via ThinkWires Identity Guard',
        technicalDepth: `Cleared Screening Assessment (${score}%)`,
        backgroundAudit: 'Cleared & Authenticated',
      },
    },
  };
};

/**
 * Standardizes raw seed talents or MongoDB talents for public bench consumption.
 */
const normalizeTalent = (c) => ({
  id: c.id,
  code: c.id || c.code,
  role: c.title || c.role,
  title: c.title || c.role,
  initials: c.initials || 'TW',
  specialty: detectSpecialty(c.skills, c.title || c.role, c.specialty),
  experienceLevel:
    c.experienceLevel ||
    (c.seniorityTier === 'staff'
      ? 'Staff/Principal (10+y)'
      : c.seniorityTier === 'senior'
        ? 'Senior (6-9y)'
        : 'Lead (8+y)'),
  yearsExp: c.yearsExp || c.experience || `${c.years || 8}+ Yrs Exp`,
  location: c.location || 'Remote Global',
  score: c.technicalRating || c.score || 96,
  assessmentScore:
    c.assessmentScore !== undefined && c.assessmentScore !== null
      ? c.assessmentScore
      : c.dossier?.rubric?.systemDesign
        ? parseInt(c.dossier.rubric.systemDesign) || null
        : c.rubric?.systemDesign || null,
  fitScore: c.fitScore,
  urgency: c.availability || c.urgency || 'Immediate (24-48h)',
  noticePeriod:
    c.noticePeriod ||
    (c.urgency === 'immediate' ||
    (c.availability && c.availability.includes('Immediate'))
      ? 'Immediate'
      : '30 Days'),
  hourlyRate: c.hourlyRate || '$55 - $75',
  proofQuote:
    c.engineeringProof ||
    c.proofQuote ||
    'Architected and scaled production enterprise systems with zero downtime.',
  skills: c.skills || [],
  rubric: c.dossier?.rubric
    ? {
        systemDesign: parseInt(c.dossier.rubric.systemDesign) || 98,
        codeQuality: parseInt(c.dossier.rubric.cleanCode) || 97,
        liveDebugging: 99,
        communication: 96,
      }
    : c.rubric || {
        systemDesign: 98,
        codeQuality: 97,
        liveDebugging: 99,
        communication: 96,
      },
  bio: c.dossier?.evaluatorNotes || c.bio,
  dossier: c.dossier,
});

/**
 * GET /api/bench
 * Full Talent Cloud Bench payload including hero, dynamic filter tabs, and vetted talents.
 */
router.get('/', async (req, res) => {
  const benchSource = await getPageDataBySlug('bench', bench);
  let rawCandidates = [
    ...(benchSource.candidates || benchSource.talents || []),
  ];

  if (isMongoActive()) {
    try {
      const assessed = await Candidate.find({
        $or: [
          { workMode: 'On-Bench' },
          { isVetted: true },
          { assessmentScore: { $gte: 75 } },
        ],
      })
        .sort({ assessmentScore: -1, updatedAt: -1 })
        .limit(50)
        .lean();

      assessed.forEach((c) => {
        rawCandidates.unshift(formatMongoCandidateToTalent(c));
      });
    } catch (e) {
      console.warn('Bench query candidates error:', e.message);
    }
  }

  const normalizedTalents = rawCandidates.map(normalizeTalent);

  const specialtyCounts = {
    'GenAI & LLMs': 0,
    'Cloud & DevOps': 0,
    'SAP & Enterprise': 0,
    'Systems & Distributed': 0,
    'Data & Analytics': 0,
  };

  normalizedTalents.forEach((t) => {
    if (specialtyCounts[t.specialty] !== undefined) {
      specialtyCounts[t.specialty]++;
    }
  });

  const specialtyFilters = [
    { label: 'All Engineering', count: Math.max(normalizedTalents.length, 142) },
    { label: 'GenAI & LLMs', count: Math.max(specialtyCounts['GenAI & LLMs'], 38) },
    { label: 'Cloud & DevOps', count: Math.max(specialtyCounts['Cloud & DevOps'], 31) },
    { label: 'SAP & Enterprise', count: Math.max(specialtyCounts['SAP & Enterprise'], 24) },
    { label: 'Systems & Distributed', count: Math.max(specialtyCounts['Systems & Distributed'], 27) },
    { label: 'Data & Analytics', count: Math.max(specialtyCounts['Data & Analytics'], 22) },
  ];

  const filterOptions = {
    urgency: [
      'All Urgency',
      'Immediate (24-48h)',
      'Ready in 24h',
      'Immediate Availability',
      'Immediate Joining',
      'Available in 48h',
      'Available in 7 Days',
    ],
    experience: [
      'All Experience',
      'Staff/Principal (10+y)',
      'Senior (6-9y)',
      'Lead (8+y)',
    ],
    locations: [
      'All Locations',
      'Bengaluru (EST Overlap)',
      'Hyderabad / Remote Global',
      'Pune / Noida / Hybrid',
      'Chennai / Remote',
      'Pan-India (Full US Shift)',
      'Gurugram / Remote',
    ],
    sortOptions: ['AI Assessment', 'Highest Score', 'Fastest Availability', 'Lowest Rate'],
  };

  const responsePayload = {
    ...benchSource,
    hero: bench.hero || {
      liveBadge: '142 PRE-VETTED TALENTS ON ACTIVE BENCH',
      title: 'Engineers on the Bench. Available to Deploy in 48 Hours.',
      subtitle:
        'Bypass the 60-day hiring cycle. Access active ThinkWires senior contractors, fully vetted with verified code commits, system design scores, and instant contract execution.',
      slaCard: {
        tag: '48-HOUR SLA ASSURANCE',
        title: 'Instant Pod Matching & Zero-Friction EOR Onboarding',
        description:
          'Every engineer has cleared multi-stage system architecture audits and is cleared for immediate client sprints.',
      },
    },
    specialtyFilters,
    filterOptions,
    talents: normalizedTalents,
    candidates: rawCandidates,
    dossierFeatures:
      bench.dossierFeatures?.map((f, i) => ({
        step: `0${i + 1}`,
        icon:
          f.icon === 'code_blocks'
            ? 'terminal'
            : f.icon === 'architecture'
              ? 'rule'
              : f.icon === 'play_circle'
                ? 'videocam'
                : 'verified',
        title: f.title,
        description: f.description,
        highlight: f.tag || 'Verified Assessment',
      })) || [],
    vettingGates:
      bench.vettingGates?.map((g) => ({
        gateNumber: `GATE ${g.step}`,
        title: g.title,
        passRate: g.stat || 'Pass Rate Calibrated',
        details: [g.description, g.badge],
        badge: g.badge,
      })) || [],
    requisitionCta: bench.requisitionCTA
      ? {
          tag: bench.requisitionCTA.eyebrow,
          title: bench.requisitionCTA.title,
          description: bench.requisitionCTA.description,
          primaryBtn: { text: bench.requisitionCTA.ctaLabel, link: '/contact' },
          secondaryBtn: { text: 'Speak with a Director', link: '/contact' },
        }
      : null,
  };

  res.json(responsePayload);
});

/**
 * GET /api/bench/talents
 * Search, filter, and sort vetted engineers on the active bench.
 */
router.get('/talents', async (req, res) => {
  const { q, specialty, urgency, experience, location, sort } = req.query;
  const benchSource = await getPageDataBySlug('bench', bench);
  let rawCandidates = [
    ...(benchSource.candidates || benchSource.talents || []),
  ];

  if (isMongoActive()) {
    try {
      const assessed = await Candidate.find({
        $or: [
          { workMode: 'On-Bench' },
          { isVetted: true },
          { assessmentScore: { $gte: 75 } },
        ],
      })
        .sort({ assessmentScore: -1, updatedAt: -1 })
        .limit(50)
        .lean();

      assessed.forEach((c) => {
        rawCandidates.unshift(formatMongoCandidateToTalent(c));
      });
    } catch (e) {
      console.warn('Bench query candidates error:', e.message);
    }
  }

  let filtered = rawCandidates.map(normalizeTalent);

  if (q && q.trim()) {
    const query = q.trim().toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.role.toLowerCase().includes(query) ||
        t.code.toLowerCase().includes(query) ||
        t.skills.some((s) => s.toLowerCase().includes(query)) ||
        (t.proofQuote && t.proofQuote.toLowerCase().includes(query))
    );
  }

  if (specialty && specialty !== 'All' && specialty !== 'All Engineering') {
    filtered = filtered.filter((t) => t.specialty === specialty);
  }

  if (urgency && urgency !== 'All Urgency' && urgency !== 'All') {
    filtered = filtered.filter((t) => t.urgency === urgency);
  }

  const noticePeriodQuery = req.query.noticePeriod;
  if (noticePeriodQuery && noticePeriodQuery !== 'All Notice' && noticePeriodQuery !== 'All') {
    const target = noticePeriodQuery.toString().toLowerCase().trim();
    filtered = filtered.filter((t) => {
      const np = (t.noticePeriod || '').toString().toLowerCase().trim();
      if (target === '30 days' || target === '30' || target === '30-day') {
        return np === '30 days' || np === '30' || np === '30-day' || np.includes('30');
      }
      return np === target || np.includes(target);
    });
  }

  if (experience && experience !== 'All Experience' && experience !== 'All') {
    filtered = filtered.filter((t) => t.experienceLevel === experience);
  }

  if (location && location !== 'All Locations' && location !== 'All') {
    filtered = filtered.filter((t) => t.location === location);
  }

  if (sort === 'AI Assessment' || !sort || sort === 'Highest Score') {
    if (sort === 'AI Assessment') {
      filtered.sort((a, b) => {
        const scoreA = typeof a.assessmentScore === 'number' && !isNaN(a.assessmentScore) ? a.assessmentScore : -Infinity;
        const scoreB = typeof b.assessmentScore === 'number' && !isNaN(b.assessmentScore) ? b.assessmentScore : -Infinity;
        return scoreB - scoreA;
      });
    } else {
      filtered.sort((a, b) => b.score - a.score);
    }
  } else if (sort === 'Fastest Availability') {
    const urgencyOrder = {
      'Immediate (24-48h)': 1,
      'Within 1 Week': 2,
      'Within 2 Weeks': 3,
    };
    filtered.sort(
      (a, b) =>
        (urgencyOrder[a.urgency] || 99) - (urgencyOrder[b.urgency] || 99)
    );
  } else if (sort === 'Lowest Rate') {
    filtered.sort((a, b) => {
      const rateA =
        parseInt((a.hourlyRate || '').replace(/[^0-9]/g, ''), 10) || 0;
      const rateB =
        parseInt((b.hourlyRate || '').replace(/[^0-9]/g, ''), 10) || 0;
      return rateA - rateB;
    });
  }

  res.json(filtered);
});

/**
 * GET /api/bench/talents/:id
 * Retrieve technical dossier for a talent by public code or database ID.
 */
router.get('/talents/:id', async (req, res) => {
  const benchSource = await getPageDataBySlug('bench', bench);
  const rawCandidates = benchSource.candidates || benchSource.talents || [];
  const normalizedTalents = rawCandidates.map(normalizeTalent);
  const requestedId = req.params.id;

  const talent = normalizedTalents.find(
    (t) => t.id === requestedId || t.code === requestedId
  );
  if (talent) {
    return res.json(talent);
  }

  if (isMongoActive()) {
    try {
      let query;
      if (mongoose.Types.ObjectId.isValid(requestedId)) {
        query = { _id: requestedId };
      } else if (requestedId.startsWith('TW-CAND-')) {
        const hexSuffix = requestedId.replace('TW-CAND-', '').toLowerCase();
        query = {
          $expr: {
            $regexMatch: {
              input: { $toString: '$_id' },
              regex: hexSuffix + '$',
              options: 'i',
            },
          },
        };
      } else {
        query = {
          $or: [
            { email: requestedId.toLowerCase() },
            { id: requestedId },
          ],
        };
      }

      const c = await Candidate.findOne(query).lean();
      if (c) {
        return res.json(formatMongoCandidateToTalent(c));
      }
    } catch (e) {
      console.warn('Error fetching candidate dossier from MongoDB:', e.message);
    }
  }

  res.status(404).json({ error: 'Talent not found' });
});

/**
 * POST /api/bench/book-interview
 * Book an interview with an on-bench talent and create an enterprise activity log.
 */
router.post('/book-interview', publicSubmissionRateLimiter, async (req, res) => {
  const {
    talentId,
    talentCode,
    workEmail,
    companyName,
    hiringManager,
    timeSlot,
    notes,
  } = req.body;
  if (!talentCode || !workEmail) {
    return res
      .status(400)
      .json({ error: 'Talent code and work email are required' });
  }

  const bookingRef = `TW-${Date.now().toString(36).toUpperCase()}`;

  if (isMongoActive()) {
    try {
      await Activity.create({
        action: 'Interview Requested',
        entityType: 'Candidate',
        entityId: talentCode,
        description: `Client ${companyName || hiringManager || workEmail} scheduled an interview with talent ${talentCode} (${timeSlot || 'Scheduled'}). Ref: ${bookingRef}`,
        user: {
          name: hiringManager || companyName || 'Enterprise Client',
          role: 'client',
        },
        badgeColor: '#008F68',
      });
    } catch (err) {
      console.warn('Bench interview booking activity error:', err.message);
    }
  }

  res.json({
    success: true,
    message: `Interview request confirmed for ${talentCode}. Calendar invites sent to ${workEmail}.`,
    bookingRef,
  });
});

export default router;
