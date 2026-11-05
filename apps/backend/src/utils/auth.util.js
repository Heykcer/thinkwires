import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../configs/dotenv.js';
import { getRedisClient } from '../configs/redis.js';

const INSECURE_DEFAULT_SECRETS = new Set([
  'your_jwt_secret_here',
  'super_secret_jwt_key_here',
  'your_secure_random_jwt_secret',
  'your_secure_random_jwt_secret_here',
  'default_secret',
  'secret',
  'changeme',
  'thinkwires_default_jwt_secret_change_in_production',
]);

export const getJwtSecret = () => {
  const secret = config.JWT_SECRET || process.env.JWT_SECRET;
  if (!secret || typeof secret !== 'string' || !secret.trim()) {
    throw new Error(
      'FATAL: JWT_SECRET environment variable is missing. Server cannot sign or verify tokens.'
    );
  }

  const cleanSecret = secret.trim();
  const isProduction =
    (config.NODE_ENV || process.env.NODE_ENV) === 'production';

  if (INSECURE_DEFAULT_SECRETS.has(cleanSecret.toLowerCase())) {
    throw new Error(
      'FATAL: Insecure default JWT_SECRET detected. You must set a unique, cryptographically strong JWT_SECRET in your environment.'
    );
  }

  // Enforce minimum 256-bit entropy in production
  if (isProduction && cleanSecret.length < 32) {
    throw new Error(
      'FATAL: JWT_SECRET in production must be at least 32 characters long.'
    );
  }

  return cleanSecret;
};

// Cryptographic domain separation for Admin tokens (Issue #199)
export const getAdminJwtSecret = () => {
  const secret =
    config.ADMIN_JWT_SECRET ||
    process.env.ADMIN_JWT_SECRET ||
    config.JWT_SECRET ||
    process.env.JWT_SECRET;

  if (!secret || typeof secret !== 'string' || !secret.trim()) {
    throw new Error(
      'FATAL: ADMIN_JWT_SECRET or JWT_SECRET environment variable is missing.'
    );
  }

  const cleanSecret = secret.trim();
  const isProduction =
    (config.NODE_ENV || process.env.NODE_ENV) === 'production';

  if (INSECURE_DEFAULT_SECRETS.has(cleanSecret.toLowerCase())) {
    throw new Error(
      'FATAL: Insecure default ADMIN_JWT_SECRET detected. You must set a unique, cryptographically strong secret.'
    );
  }

  if (isProduction && cleanSecret.length < 32) {
    throw new Error(
      'FATAL: ADMIN_JWT_SECRET in production must be at least 32 characters long.'
    );
  }

  return cleanSecret;
};

// Cryptographic domain separation for Candidate tokens (Issue #199)
export const getCandidateJwtSecret = () => {
  const secret =
    config.CANDIDATE_JWT_SECRET ||
    process.env.CANDIDATE_JWT_SECRET ||
    config.JWT_SECRET ||
    process.env.JWT_SECRET;

  if (!secret || typeof secret !== 'string' || !secret.trim()) {
    throw new Error(
      'FATAL: CANDIDATE_JWT_SECRET or JWT_SECRET environment variable is missing.'
    );
  }

  const cleanSecret = secret.trim();
  const isProduction =
    (config.NODE_ENV || process.env.NODE_ENV) === 'production';

  if (INSECURE_DEFAULT_SECRETS.has(cleanSecret.toLowerCase())) {
    throw new Error(
      'FATAL: Insecure default CANDIDATE_JWT_SECRET detected. You must set a unique, cryptographically strong secret.'
    );
  }

  if (isProduction && cleanSecret.length < 32) {
    throw new Error(
      'FATAL: CANDIDATE_JWT_SECRET in production must be at least 32 characters long.'
    );
  }

  return cleanSecret;
};

// 12 rounds provides optimal protection against GPU cracking while maintaining sub-100ms request times
export const hashPassword = async (plainPassword) => {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainPassword, salt);
};

export const comparePassword = async (plainPassword, hashedPassword) => {
  if (!plainPassword || !hashedPassword) return false;
  return bcrypt.compare(plainPassword, hashedPassword);
};

export const generateCandidateToken = (candidate) => {
  const secret = getCandidateJwtSecret();
  const payload = {
    id: candidate._id ? candidate._id.toString() : candidate.id,
    email: candidate.email,
    name: candidate.name,
    role: 'candidate',
    portal: 'candidate',
    tokenVersion: candidate.tokenVersion !== undefined ? candidate.tokenVersion : 0,
  };

  return jwt.sign(payload, secret, {
    expiresIn: '7d',
    algorithm: 'HS256',
  });
};

// Pin algorithm to HS256 to prevent algorithm-substitution attacks (e.g. 'none' or public key confusion)
export const verifyCandidateToken = (token) => {
  const secret = getCandidateJwtSecret();
  const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
  if (decoded && decoded.portal && decoded.portal !== 'candidate') {
    throw new Error('Invalid token scope for candidate portal.');
  }
  return decoded;
};

// Store SHA-256 hash in DB; raw token is only sent once to user email to prevent leakage from DB read replicas
export const generatePasswordResetToken = () => {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  return {
    rawToken,
    hashedToken,
    expiresAt,
  };
};

export const hashResetToken = (rawToken) => {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
};

export const setAuthCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite =
    process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax');
  const secure = isProduction || sameSite.toLowerCase() === 'none';
  res.cookie('thinkwires_candidate_jwt', token, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

export const clearAuthCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite =
    process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax');
  const secure = isProduction || sameSite.toLowerCase() === 'none';
  const opts = {
    httpOnly: true,
    secure,
    sameSite,
    expires: new Date(0),
  };
  ['/api/candidate', '/api/auth', '/api', '/'].forEach((p) => {
    res.clearCookie('thinkwires_candidate_jwt', { ...opts, path: p });
  });
};

export const generateAdminToken = (user) => {
  const secret = getAdminJwtSecret();
  const payload = {
    id: user._id ? user._id.toString() : user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    designation: user.designation || 'System Member',
    portal: 'admin',
    tokenVersion: user.tokenVersion !== undefined ? user.tokenVersion : 0,
  };

  return jwt.sign(payload, secret, {
    expiresIn: '7d',
    algorithm: 'HS256',
  });
};

const revokedTokens = new Set();

export const revokeToken = async (token) => {
  if (token && typeof token === 'string') {
    revokedTokens.add(token);
    try {
      const redis = await getRedisClient();
      if (redis) {
        await redis.set(`revoked:${token}`, '1', { EX: 7 * 24 * 60 * 60 });
      }
    } catch (err) {
      console.error('[Redis] Failed to persist revoked token:', err.message);
    }
  }
};

export const isTokenRevoked = async (token) => {
  if (!token || typeof token !== 'string') return false;
  if (revokedTokens.has(token)) return true;
  try {
    const redis = await getRedisClient();
    if (redis) {
      const isRevoked = Boolean(await redis.get(`revoked:${token}`));
      if (isRevoked) {
        revokedTokens.add(token);
        return true;
      }
    }
  } catch (err) {
    console.error('[Redis] Failed to query revoked token from Redis:', err.message);
  }
  return false;
};

// Non-blocking cursor iteration using redis.scan (Issue #198)
export const clearRevocationStore = async () => {
  revokedTokens.clear();
  try {
    const redis = await getRedisClient();
    if (!redis) return;

    if (typeof redis.scan === 'function') {
      let cursor = '0';
      do {
        const reply = await redis.scan(cursor, {
          MATCH: 'revoked:*',
          COUNT: 100,
        });
        cursor = String(reply.cursor ?? reply[0] ?? '0');
        const keys = reply.keys || (Array.isArray(reply[1]) ? reply[1] : []);
        if (keys && keys.length > 0) {
          await redis.del(keys);
        }
      } while (cursor !== '0');
    } else if (typeof redis.keys === 'function') {
      const keys = await redis.keys('revoked:*');
      if (keys && keys.length > 0) {
        await redis.del(keys);
      }
    }
  } catch (err) {
    console.error('[Redis] Failed to safely scan and clear revocation store:', err.message);
  }
};

export const verifyAdminToken = (token) => {
  const secret = getAdminJwtSecret();
  const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
  if (decoded && decoded.portal && decoded.portal !== 'admin') {
    throw new Error('Invalid token scope for admin portal.');
  }
  return decoded;
};

export const ADMIN_COOKIE_NAME = 'thinkwires_admin_jwt';
export const ADMIN_COOKIE_PATH = '/api/admin';
export const ADMIN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export const setAdminAuthCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const req = res?.req;
  const origin = req?.headers?.origin;
  const isCrossOrigin =
    origin &&
    !origin.includes('localhost') &&
    !origin.includes('127.0.0.1') &&
    (origin.includes('vercel.app') || origin.includes('thinkwires.com'));

  const sameSite =
    process.env.COOKIE_SAME_SITE ||
    (isCrossOrigin ? 'none' : isProduction ? 'strict' : 'lax');
  const secure = isProduction || sameSite.toLowerCase() === 'none';
  res.cookie(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: ADMIN_COOKIE_MAX_AGE,
    path: ADMIN_COOKIE_PATH,
  });
};

export const clearAdminAuthCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const req = res?.req;
  const origin = req?.headers?.origin;
  const isCrossOrigin =
    origin &&
    !origin.includes('localhost') &&
    !origin.includes('127.0.0.1') &&
    (origin.includes('vercel.app') || origin.includes('thinkwires.com'));

  const sameSite =
    process.env.COOKIE_SAME_SITE ||
    (isCrossOrigin ? 'none' : isProduction ? 'strict' : 'lax');
  const secure = isProduction || sameSite.toLowerCase() === 'none';
  const opts = {
    httpOnly: true,
    secure,
    sameSite,
    expires: new Date(0),
  };
  ['/api/admin', '/api', '/'].forEach((p) => {
    res.clearCookie(ADMIN_COOKIE_NAME, { ...opts, path: p });
  });
};
