import mongoose from 'mongoose';
import app from '../apps/backend/src/app.js';
import { connectMongoDB } from '../apps/backend/src/configs/mongodb.js';
import { connectDB } from '../apps/backend/src/configs/db.js';

let isDbConnecting = false;

const ensureDbConnected = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (isDbConnecting) return;

  isDbConnecting = true;
  try {
    const connectPromise = Promise.allSettled([connectMongoDB(), connectDB()]);
    const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 3000));
    await Promise.race([connectPromise, timeoutPromise]);
  } catch (err) {
    console.warn('[Vercel Serverless] DB connection notice:', err.message);
  } finally {
    isDbConnecting = false;
  }
};

/**
 * Vercel Serverless Function entrypoint.
 * Automatically wraps the Express app and handles incoming requests to /api/*.
 * Persists database connections across warm lambda executions.
 * Explicitly awaits the Express response completion via a Promise to prevent
 * premature lambda execution termination in serverless environments.
 */
export default async function handler(req, res) {
  try {
    await ensureDbConnected();
  } catch (err) {
    console.warn('[Vercel Serverless] DB connection setup notice:', err.message);
  }

  return new Promise((resolve, reject) => {
    res.on('finish', resolve);
    res.on('close', resolve);
    res.on('error', reject);
    app(req, res);
  });
}
