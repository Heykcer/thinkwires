import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import JobRequirement from '../models/job.mongo.model.js';
import { isMongoActive, adminAuthGuard } from '../utils/cms.util.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'seeds', 'mockData.json'), 'utf8')
);
let openings = [...(mockData.initialOpenings || [])];

const router = express.Router();

/**
 * GET /api/openings
 * Search, filter, and list active enterprise job openings with confidentiality masking.
 */
router.get('/', async (req, res) => {
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

  if (isMongoActive()) {
    try {
      const dbJobs = await JobRequirement.find({ status: { $ne: 'Closed' } })
        .sort({ createdAt: -1 })
        .lean();
      if (dbJobs && dbJobs.length > 0) {
        sourceOpenings = dbJobs.map((j) => ({
          id: j.jobId || j._id,
          _id: j._id,
          title: j.title,
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
          description: j.description || '',
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
      }
    } catch (dbErr) {
      console.warn(
        'Fallback to memory openings due to MongoDB error:',
        dbErr.message
      );
    }
  } else {
    try {
      const rawData = fs.readFileSync(
        path.join(__dirname, '..', 'seeds', 'mockData.json'),
        'utf8'
      );
      const parsed = JSON.parse(rawData);
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

  let filtered = sourceOpenings.map((job) => ({
    ...job,
    company: 'Enterprise Client (Confidential)',
    client: 'Enterprise Client (Confidential)',
    requirements: job.requirements || '',
    industry: job.industry || 'Information Technology & Cloud',
  }));

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

  if (noticePeriod && noticePeriod !== 'All Notice' && noticePeriod !== 'All') {
    const targetNotice = noticePeriod.toLowerCase();
    filtered = filtered.filter((job) => {
      const jn = (job.noticePeriod || '').toLowerCase();
      return jn === targetNotice;
    });
  }

  if (department && department !== 'All Roles' && department !== 'All') {
    filtered = filtered.filter(
      (job) =>
        job.department === department ||
        (job.category &&
          job.category.toLowerCase().includes(department.toLowerCase()))
    );
  }

  if (sort === 'Title A-Z') {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === 'Highest Salary') {
    filtered.sort((a, b) => (b.salary || '').localeCompare(a.salary || ''));
  } else {
    filtered.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return new Date(b.postedDate || 0) - new Date(a.postedDate || 0);
    });
  }

  res.json(filtered);
});

/**
 * POST /api/openings
 * Admin sync for openings collection.
 */
router.post('/', adminAuthGuard, async (req, res) => {
  if (Array.isArray(req.body.openings)) {
    openings = req.body.openings;
    if (isMongoActive()) {
      try {
        for (const j of req.body.openings) {
          await JobRequirement.findOneAndUpdate(
            { title: j.title, client: j.company || 'ThinkWires Client' },
            { ...j, client: j.company || 'ThinkWires Client' },
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

export default router;
