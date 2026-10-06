import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust path since this is now in src/routes
const mockData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'seeds', 'mockData.json'), 'utf8'));
const { initialTechStack, initialOpenings, industriesData, processData, capabilitiesData, reportsData, statsData, benefitsData, faqsData } = mockData;

const router = express.Router();

// Mutable in-memory state for mock admin updates
let techStack = [...initialTechStack];
let openings = [...initialOpenings];
let stats = { ...statsData };
let industries = [...industriesData];
let processSteps = [...processData];
let capabilities = [...capabilitiesData];
let reports = [...reportsData];
let benefits = benefitsData ? [...benefitsData] : [];
let faqs = faqsData ? [...faqsData] : [];

// --- Benefits ---
router.get('/benefits', (req, res) => {
  res.json(benefits);
});

// --- FAQs ---
router.get('/faqs', (req, res) => {
  res.json(faqs);
});

// --- Tech Stack ---
router.get('/tech-stack', (req, res) => {
  res.json(techStack);
});
router.post('/tech-stack', (req, res) => {
  if (Array.isArray(req.body.newStacks)) {
    techStack = req.body.newStacks;
    res.json({ message: 'Tech stack updated successfully', techStack });
  } else {
    res.status(400).json({ error: 'newStacks must be an array of strings' });
  }
});

// Helper to extract a representative numeric salary metric for sorting
const parseSalaryNumericValue = (salary) => {
  if (!salary || typeof salary !== 'string') return 0;

  // Look for numeric values in string (e.g. "₹30 - 40 LPA", "₹20+ LPA")
  const matches = salary.match(/\d+(\.\d+)?/g);
  if (matches && matches.length > 0) {
    const nums = matches.map(Number);
    const maxVal = Math.max(...nums);

    if (/usd|\$|\bk\b/i.test(salary) && maxVal < 1000) {
      return maxVal * 8.3;
    }
    return maxVal;
  }

  // Qualitative fallback rankings
  const lower = salary.toLowerCase();
  if (lower.includes('premium')) return 35;
  if (lower.includes('open')) return 25;
  if (lower.includes('market')) return 20;

  return 0;
};

// --- Openings ---
router.get('/openings', (req, res) => {
  const { q, location, experience, workMode, department, sort } = req.query;
  let filtered = [...openings];

  // Search keyword (q)
  if (q && q.trim() !== '') {
    const search = q.trim().toLowerCase();
    filtered = filtered.filter((job) => {
      const matchTitle = job.title && job.title.toLowerCase().includes(search);
      const matchCompany = job.company && job.company.toLowerCase().includes(search);
      const matchCategory = job.category && job.category.toLowerCase().includes(search);
      const matchDesc = job.description && job.description.toLowerCase().includes(search);
      const matchSkills = job.skills && job.skills.some((s) => s.toLowerCase().includes(search));
      return matchTitle || matchCompany || matchCategory || matchDesc || matchSkills;
    });
  }

  // Location filter
  if (location && location !== 'All') {
    const loc = location.toLowerCase();
    filtered = filtered.filter((job) => {
      if (!job.location) return false;
      if (loc === 'remote') return job.location.toLowerCase().includes('remote') || job.workMode === 'Remote';
      return job.location.toLowerCase().includes(loc);
    });
  }

  // Experience filter
  if (experience && experience !== 'All') {
    filtered = filtered.filter((job) => {
      if (job.experienceTier && job.experienceTier === experience) return true;
      if (job.experience && job.experience.toLowerCase().includes(experience.toLowerCase())) return true;
      return false;
    });
  }

  // Work Mode filter
  if (workMode && workMode !== 'All Modes') {
    filtered = filtered.filter((job) => job.workMode === workMode || (job.location && job.location.toLowerCase().includes(workMode.toLowerCase())));
  }

  // Department / Category filter
  if (department && department !== 'All Roles' && department !== 'All') {
    filtered = filtered.filter((job) => job.department === department || (job.category && job.category.toLowerCase().includes(department.toLowerCase())));
  }

  // Sort
  if (sort === 'Title A-Z') {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === 'Highest Salary') {
    filtered.sort((a, b) => {
      const valA = parseSalaryNumericValue(a.salary);
      const valB = parseSalaryNumericValue(b.salary);
      if (valB !== valA) {
        return valB - valA;
      }
      return (b.salary || '').localeCompare(a.salary || '');
    });
  } else {
    // Default priority/newest sort
    filtered.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return new Date(b.postedDate) - new Date(a.postedDate);
    });
  }

  res.json(filtered);
});
router.post('/openings', (req, res) => {
  if (Array.isArray(req.body.openings)) {
    openings = req.body.openings;
    res.json({ message: 'Openings updated successfully', openings });
  } else {
    res.status(400).json({ error: 'openings must be an array of objects' });
  }
});

// --- Stats ---
router.get('/stats', (req, res) => {
  res.json(stats);
});
router.post('/stats', (req, res) => {
  if (req.body.stats) {
    stats = { ...stats, ...req.body.stats };
    res.json({ message: 'Stats updated successfully', stats });
  } else {
    res.status(400).json({ error: 'stats object is required in body' });
  }
});

// --- Industries ---
router.get('/industries', (req, res) => {
  res.json(industries);
});
router.post('/industries', (req, res) => {
  if (Array.isArray(req.body.industries)) {
    industries = req.body.industries;
    res.json({ message: 'Industries updated successfully', industries });
  } else {
    res.status(400).json({ error: 'industries must be an array of objects' });
  }
});

// --- Process ---
router.get('/process', (req, res) => {
  res.json(processSteps);
});
router.post('/process', (req, res) => {
  if (Array.isArray(req.body.processSteps)) {
    processSteps = req.body.processSteps;
    res.json({ message: 'Process steps updated successfully', processSteps });
  } else {
    res.status(400).json({ error: 'processSteps must be an array of objects' });
  }
});

// --- Capabilities ---
router.get('/capabilities', (req, res) => {
  res.json(capabilities);
});
router.post('/capabilities', (req, res) => {
  if (Array.isArray(req.body.capabilities)) {
    capabilities = req.body.capabilities;
    res.json({ message: 'Capabilities updated successfully', capabilities });
  } else {
    res.status(400).json({ error: 'capabilities must be an array of objects' });
  }
});

// --- Reports ---
router.get('/reports', (req, res) => {
  res.json(reports);
});
router.post('/reports', (req, res) => {
  if (Array.isArray(req.body.reports)) {
    reports = req.body.reports;
    res.json({ message: 'Reports updated successfully', reports });
  } else {
    res.status(400).json({ error: 'reports must be an array of objects' });
  }
});

// --- Contact Form ---
router.post('/contact', (req, res) => {
  const { email, phone } = req.body;
  if (email && phone) {
    console.log('New Contact Request:', { email, phone });
    res.json({ message: 'Callback requested successfully!' });
  } else {
    res.status(400).json({ error: 'Email and Phone are required' });
  }
});

export default router;
