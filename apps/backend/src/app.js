import helmet from 'helmet';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.route.js';
import adminRoutes from './routes/admin.route.js';
import authRoutes from './routes/auth.route.js';
import candidateRoutes from './routes/candidate.route.js';
import userRoutes from './routes/user.route.js';
import benchRoutes from './routes/bench.route.js';
import contactRoutes from './routes/contact.route.js';
import articlesRoutes from './routes/articles.route.js';
import industriesRoutes from './routes/industries.route.js';
import servicesRoutes from './routes/services.route.js';
import { downloadResume, downloadAvatar } from './controllers/candidatePortal.controller.js';
import { isAllowedOrigin } from './middlewares/csrf.middleware.js';
import sanitizeInputs from './middlewares/sanitize.middleware.js';
import { isAuthorizedDiagnosticRequest } from './middlewares/auth.middleware.js';
import { sequelize } from './configs/db.js';
import { isRedisConnected } from './configs/redis.js';
import healthRoutes from './routes/health.route.js';
import compression from 'compression';
import { publicContentCache, privateNoStore } from './middlewares/cache.middleware.js';
import { getTrustProxyFunction } from './configs/proxy.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Active connection draining state for graceful termination (DEP-06)
let isShuttingDown = false;

export const setShuttingDown = (value) => {
  isShuttingDown = Boolean(value);
};

export const getShuttingDown = () => isShuttingDown;

const app = express();

// Active connection draining middleware
app.use((req, res, next) => {
  if (isShuttingDown) {
    res.setHeader('Connection', 'close');
    return res.status(503).json({
      error: 'Server is currently shutting down. Please retry on an active replica.',
    });
  }
  next();
});

// SEC-05: Configure trusted reverse proxy ranges matching actual network topology
// (Render internal router, AWS ALB, Docker/K8s overlays, Cloudflare, loopback)
app.set('trust proxy', getTrustProxyFunction());

app.disable('x-powered-by');

// Response compression for low-bandwidth networks (70-80% payload size reduction)
app.use(
  compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

// Per-request cryptographic CSP Nonce generator (SEC-CSP-01)
app.use((req, res, next) => {
  res.locals.cspNonce = crypto.randomBytes(16).toString('base64');
  next();
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: [
          "'self'",
          (req, res) => `'nonce-${res.locals.cspNonce}'`,
          'https://fonts.googleapis.com',
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

app.use((req, res, next) => {
  // SEC-06: Explicitly disable obsolete legacy X-XSS-Protection in favor of modern CSP
  res.setHeader('X-XSS-Protection', '0');
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, isAllowedOrigin(origin));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(sanitizeInputs);
app.use(cookieParser());

const uploadsDir = process.env.VERCEL
  ? path.resolve('/tmp', 'uploads')
  : path.resolve(process.cwd(), 'uploads');
const avatarsDir = path.resolve(uploadsDir, 'avatars');
const resumesDir = path.resolve(uploadsDir, 'resumes');

[uploadsDir, avatarsDir, resumesDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (err) {
      console.warn('[Server] Could not create uploads directory:', err.message);
    }
  }
});

// Issue #178: Public static access is restricted strictly to avatar images. Resumes require authentication.
app.get('/uploads/avatars/:filename', downloadAvatar);
app.use('/uploads/avatars', express.static(avatarsDir));
app.get('/uploads/resumes/:filename', downloadResume);

// Standard SRE Liveness (/healthz) and Readiness (/ready) probes (DEP-05)
app.use(healthRoutes);
app.use('/api', healthRoutes);

app.get('/api', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const payload = {
    status: 'healthy',
    service: 'Thinkwires Enterprise Core Backend',
    version: '1.0.0',
  };
  if (!isProduction) {
    payload.environment = process.env.NODE_ENV || 'development';
  }
  res.status(200).json(payload);
});

app.get(['/health', '/api/health'], (req, res) => {
  const isMongoReady = mongoose.connection.readyState === 1;
  const isPostgresReady = Boolean(sequelize);
  const isProduction = process.env.NODE_ENV === 'production';

  // Liveness / Health check: process is alive and responsive; datastore readiness is reflected in payload and on /ready
  const isHealthy = isProduction ? isMongoReady : true;
  const statusCode = 200;

  const mongoStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const response = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    service: 'Thinkwires Enterprise Core Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  };

  // Issue 4: Restrict detailed diagnostic telemetry (databases, memory, architecture, uptime, environment)
  // to authenticated internal operators or development/test environments
  if (isAuthorizedDiagnosticRequest(req)) {
    response.uptime = Math.floor(process.uptime());
    response.environment = process.env.NODE_ENV || 'development';
    response.databases = {
      mongodb: mongoStatusMap[mongoose.connection.readyState] || 'unknown',
      postgresql: isPostgresReady ? 'connected' : 'optional/fallback',
      redis: isRedisConnected() ? 'connected' : 'in-memory fallback',
    };
    response.architecture = {
      primaryStore: 'MongoDB (Mongoose / ATS & Admin Core)',
      secondaryRelationalStore: 'PostgreSQL (Sequelize / Dual Sync)',
      dualSyncStatus: 'active',
    };
    response.memoryUsage = {
      rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    };
  }

  res.status(statusCode).json(response);
});

app.use('/api/auth', privateNoStore, authRoutes);
app.use('/api/candidate', privateNoStore, candidateRoutes);
app.use('/api/user', privateNoStore, userRoutes);
app.use('/api/admin', privateNoStore, adminRoutes);
app.use('/api', benchRoutes);
app.use('/api', contactRoutes);
app.use('/api', publicContentCache(60, 300), articlesRoutes);
app.use('/api', publicContentCache(60, 300), industriesRoutes);
app.use('/api', publicContentCache(60, 300), servicesRoutes);
app.use('/api', apiRoutes);

// Root entrypoint status for pure API service
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'Thinkwires Enterprise Core Backend',
    message: 'API is running...',
    endpoints: {
      api: '/api',
      health: '/api/health',
      openings: '/api/openings',
    },
  });
});

// Mute browser automatic favicon probing
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Central 404 JSON responder for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `API endpoint not found: ${req.method} ${req.originalUrl || req.url}`,
  });
});

// Global central error handler for API (SEC-EXP-04: production information leakage defense)
app.use((err, req, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = err.status || err.statusCode || 500;

  console.error(`[Unhandled API Error ${statusCode}]:`, err);
  if (res.headersSent) {
    return next(err);
  }

  let userFacingMessage = err.message || 'Internal Server Error';
  if (isProduction && statusCode >= 500) {
    userFacingMessage =
      'An unexpected server error occurred. Please contact Thinkwires support.';
  }

  res.status(statusCode).json({
    success: false,
    error: userFacingMessage,
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

export default app;
