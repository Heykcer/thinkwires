import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import Page from '../models/page.mongo.model.js';
import requireAuth from '../middlewares/auth.middleware.js';

export const isMongoActive = () => mongoose.connection.readyState === 1;

/**
 * Common rate limiter for public lead generation, consultation bookings, and newsletter signups.
 */
export const publicSubmissionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 submissions per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this network. Please wait a few minutes before submitting again.',
  },
});

/**
 * Strict RBAC guard for mutating operations on CMS/site collections.
 */
export const adminAuthGuard = requireAuth(['superadmin', 'admin', 'cms_admin']);

/**
 * Retrieves page content from MongoDB by slug with an in-memory fallback.
 */
export const getPageDataBySlug = async (slug, fallback) => {
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

/**
 * Retrieves a designated sub-section of the home page document with an in-memory fallback.
 */
export const getHomeSection = async (sectionKey, fallbackValue) => {
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
