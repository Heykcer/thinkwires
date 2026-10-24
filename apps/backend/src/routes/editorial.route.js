import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Article from '../models/article.mongo.model.js';
import {
  isMongoActive,
  getHomeSection,
  publicSubmissionRateLimiter,
} from '../utils/cms.util.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'seeds', 'mockData.json'), 'utf8')
);

const initialArticles = mockData.articlesData ? [...mockData.articlesData] : [];
const featuredArticle = mockData.featuredArticleData
  ? { ...mockData.featuredArticleData }
  : null;
const researchers = mockData.researchersData
  ? [...mockData.researchersData]
  : [];

const router = express.Router();

/**
 * GET /api/articles
 * List published articles with category and keyword search filtering.
 */
router.get('/', async (req, res) => {
  const { q, category } = req.query;
  let sourceArticles = initialArticles;

  if (isMongoActive()) {
    try {
      const dbArticles = await Article.find({ status: 'published' })
        .sort({ publishedAt: -1 })
        .lean();
      if (dbArticles && dbArticles.length > 0) {
        sourceArticles = dbArticles.map((a) => ({
          ...a,
          id: a.articleId || a.slug || a._id,
        }));
      }
    } catch (dbErr) {
      console.warn('Error reading articles from MongoDB:', dbErr.message);
    }
  }

  let filtered = [...sourceArticles];

  if (q && q.trim() !== '') {
    const query = q.trim().toLowerCase();
    filtered = filtered.filter(
      (art) =>
        (art.title && art.title.toLowerCase().includes(query)) ||
        (art.excerpt && art.excerpt.toLowerCase().includes(query)) ||
        (art.summary && art.summary.toLowerCase().includes(query)) ||
        (art.author &&
          (typeof art.author === 'string' ? art.author : art.author.name || '')
            .toLowerCase()
            .includes(query)) ||
        (art.badge && art.badge.toLowerCase().includes(query)) ||
        (art.subCategory && art.subCategory.toLowerCase().includes(query))
    );
  }

  if (category && category !== 'All' && category !== 'All Insights (15)') {
    filtered = filtered.filter(
      (art) =>
        art.category === category ||
        art.badge === category ||
        art.subCategory === category
    );
  }

  res.json(filtered);
});

/**
 * GET /api/articles/featured
 * Get flagship research and analysis article.
 */
router.get('/featured', async (req, res) => {
  if (isMongoActive()) {
    try {
      const feat = await Article.findOne({
        featured: true,
        status: 'published',
      }).lean();
      if (feat) {
        return res.json({
          ...feat,
          id: feat.articleId || feat.slug || feat._id,
        });
      }
    } catch (dbErr) {
      console.warn(
        'Error reading featured article from MongoDB:',
        dbErr.message
      );
    }
  }
  res.json(featuredArticle);
});

/**
 * GET /api/articles/researchers
 * Retrieve research and advisory editorial contributors.
 */
router.get('/researchers', async (req, res) => {
  const result = await getHomeSection('researchers', researchers);
  res.json(result);
});

/**
 * GET /api/articles/:id
 * Retrieve single article by ID or slug.
 */
router.get('/:id', async (req, res) => {
  const targetId = req.params.id;
  if (isMongoActive()) {
    try {
      const query = mongoose.isValidObjectId(targetId)
        ? {
            $or: [
              { _id: targetId },
              { slug: targetId },
              { articleId: targetId },
            ],
          }
        : { $or: [{ slug: targetId }, { articleId: targetId }] };
      const art = await Article.findOne(query).lean();
      if (art) {
        return res.json({ ...art, id: art.articleId || art.slug || art._id });
      }
    } catch (dbErr) {
      console.warn('Error loading article from MongoDB:', dbErr.message);
    }
  }

  const article = initialArticles.find(
    (art) => art.id === targetId || art.slug === targetId
  );
  if (article) {
    res.json(article);
  } else if (
    featuredArticle &&
    (featuredArticle.id === targetId || featuredArticle.slug === targetId)
  ) {
    res.json(featuredArticle);
  } else {
    res.status(404).json({ error: 'Article not found' });
  }
});

/**
 * POST /api/articles/newsletter
 * Subscribe to Benchmark Dispatch newsletter.
 */
router.post('/newsletter', publicSubmissionRateLimiter, (req, res) => {
  const { email, role } = req.body;
  if (email && email.includes('@')) {
    console.log('New Benchmark Dispatch Newsletter Subscription:', {
      email,
      role,
    });
    res.json({
      success: true,
      message: 'Subscribed to Benchmark Dispatch successfully!',
    });
  } else {
    res.status(400).json({ error: 'Valid email is required' });
  }
});

export default router;
