import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check apps/backend/.env first, then monorepo root .env
const localEnvPath = path.resolve(__dirname, '../../.env');
const rootEnvPath = path.resolve(__dirname, '../../../../.env');

if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
}
if (fs.existsSync(rootEnvPath)) {
  // Does not overwrite already set variables
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

// Ensure cryptographic domain separation keys are available in cloud platforms (Render, Railway, AWS)
// If only JWT_SECRET is configured in the cloud dashboard, deterministically derive distinct 256-bit secrets
if (process.env.JWT_SECRET && String(process.env.JWT_SECRET).trim()) {
  const masterSecret = String(process.env.JWT_SECRET).trim();
  if (!process.env.JWT_ADMIN_SECRET && !process.env.ADMIN_JWT_SECRET) {
    const derivedAdmin = crypto
      .createHmac('sha256', masterSecret)
      .update('thinkwires-admin-jwt-domain-v1')
      .digest('hex');
    process.env.JWT_ADMIN_SECRET = derivedAdmin;
    process.env.ADMIN_JWT_SECRET = derivedAdmin;
  }
  if (!process.env.JWT_CANDIDATE_SECRET && !process.env.CANDIDATE_JWT_SECRET) {
    const derivedCandidate = crypto
      .createHmac('sha256', masterSecret)
      .update('thinkwires-candidate-jwt-domain-v1')
      .digest('hex');
    process.env.JWT_CANDIDATE_SECRET = derivedCandidate;
    process.env.CANDIDATE_JWT_SECRET = derivedCandidate;
  }
}

/**
 * Resolves PostgreSQL connection URI from DATABASE_URL or individual environment variables
 * Supports Neon, Supabase, AWS RDS, Render, Docker, or Local PostgreSQL
 */
const resolvePostgresUri = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  if (process.env.POSTGRES_URL) {
    return process.env.POSTGRES_URL;
  }
  const user = process.env.POSTGRES_USER || process.env.PGUSER;
  const password = process.env.POSTGRES_PASSWORD || process.env.PGPASSWORD;
  const host = process.env.POSTGRES_HOST || process.env.PGHOST || 'localhost';
  const port = process.env.POSTGRES_PORT || process.env.PGPORT || '5432';
  const db = process.env.POSTGRES_DB || process.env.PGDATABASE || 'thinkwire_db';

  if (user && password) {
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${db}`;
  }
  return 'postgresql://postgres:postgres@localhost:5432/thinkwire_db';
};

/**
 * Resolves MongoDB connection URI from MONGODB_URI or individual environment variables
 * Supports MongoDB Atlas, Compass, Docker, or Local MongoDB
 */
const resolveMongoUri = () => {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }
  const host = process.env.MONGO_HOST || 'localhost';
  const port = process.env.MONGO_PORT || '27017';
  const db = process.env.MONGO_DB || 'thinkwire_db';
  const user = process.env.MONGO_USER;
  const pass = process.env.MONGO_PASSWORD;

  if (user && pass) {
    return `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${db}?authSource=admin`;
  }
  return 'mongodb://localhost:27017/thinkwire_db';
};

export default {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: resolvePostgresUri(),
  MONGODB_URI: resolveMongoUri(),
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  AI_SERVICE_URL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_ADMIN_SECRET: process.env.JWT_ADMIN_SECRET || process.env.ADMIN_JWT_SECRET,
  ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET || process.env.JWT_ADMIN_SECRET,
  JWT_CANDIDATE_SECRET: process.env.JWT_CANDIDATE_SECRET || process.env.CANDIDATE_JWT_SECRET,
  CANDIDATE_JWT_SECRET: process.env.CANDIDATE_JWT_SECRET || process.env.JWT_CANDIDATE_SECRET,
  COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
};

