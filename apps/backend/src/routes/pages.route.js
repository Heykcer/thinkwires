import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Page from '../models/page.mongo.model.js';
import {
  isMongoActive,
  getHomeSection,
  adminAuthGuard,
} from '../utils/cms.util.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'seeds', 'mockData.json'), 'utf8')
);

const {
  initialTechStack = [],
  industriesData = [],
  processData = [],
  capabilitiesData = [],
  reportsData = [],
  statsData = {},
  benefitsData = [],
  faqsData = [],
  industriesPageData = null,
  benchData = null,
  aboutData = null,
  contactData = null,
} = mockData;

let techStack = [...initialTechStack];
let stats = { ...statsData };
let industries = [...industriesData];
let processSteps = [...processData];
let capabilities = [...capabilitiesData];
let reports = [...reportsData];
let benefits = benefitsData ? [...benefitsData] : [];
let faqs = faqsData ? [...faqsData] : [];
let currentIndustriesPageData = industriesPageData
  ? { ...industriesPageData }
  : {};

const router = express.Router();

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

// --- Stats ---
router.get('/stats', async (req, res) => {
  const result = await getHomeSection('stats', stats);
  res.json(result);
});

router.post('/stats', adminAuthGuard, async (req, res) => {
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

// --- Industries (Home summary) ---
router.get('/industries', async (req, res) => {
  const result = await getHomeSection('industries', industries);
  res.json(result);
});

router.post('/industries', adminAuthGuard, async (req, res) => {
  if (Array.isArray(req.body.industries)) {
    industries = req.body.industries;
    if (isMongoActive()) {
      try {
        await Page.findOneAndUpdate(
          { slug: 'home' },
          { $set: { 'data.industries': industries } },
          { upsert: true }
        );
      } catch (err) {
        console.warn('Could not persist industries to MongoDB:', err.message);
      }
    }
    res.json({ message: 'Industries updated successfully', industries });
  } else {
    res.status(400).json({ error: 'industries must be an array of objects' });
  }
});

// --- Industries Page Full Dynamic Data ---
router.get('/industries-page', async (req, res) => {
  if (isMongoActive()) {
    try {
      const page = await Page.findOne({ slug: 'industries' }).lean();
      if (page?.data && Object.keys(page.data).length > 0) {
        return res.json(page.data);
      }
    } catch (err) {
      console.warn('Error fetching industries page from MongoDB:', err.message);
    }
  }
  res.json(currentIndustriesPageData);
});

router.get('/sector-catalog', async (req, res) => {
  let data = currentIndustriesPageData;
  if (isMongoActive()) {
    try {
      const page = await Page.findOne({ slug: 'industries' }).lean();
      if (page?.data?.sectors) data = page.data;
    } catch (err) {
      console.warn('Error querying sector-catalog from MongoDB:', err.message);
    }
  }
  res.json(data.sectors || []);
});

router.post('/industries-page', adminAuthGuard, async (req, res) => {
  if (req.body.industriesPageData) {
    currentIndustriesPageData = {
      ...currentIndustriesPageData,
      ...req.body.industriesPageData,
    };
    if (isMongoActive()) {
      try {
        await Page.findOneAndUpdate(
          { slug: 'industries' },
          { $set: { data: currentIndustriesPageData } },
          { upsert: true }
        );
      } catch (err) {
        console.warn(
          'Could not persist industries page to MongoDB:',
          err.message
        );
      }
    }
    res.json({
      message: 'Industries page data updated successfully',
      industriesPageData: currentIndustriesPageData,
    });
  } else {
    res
      .status(400)
      .json({ error: 'industriesPageData object is required in body' });
  }
});

// --- Process ---
router.get('/process', async (req, res) => {
  const result = await getHomeSection('process', processSteps);
  res.json(result);
});

router.post('/process', adminAuthGuard, async (req, res) => {
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

router.post('/capabilities', adminAuthGuard, async (req, res) => {
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

router.post('/reports', adminAuthGuard, async (req, res) => {
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

export default router;
