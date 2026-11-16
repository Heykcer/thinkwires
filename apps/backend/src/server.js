import app, { setShuttingDown } from './app.js';
import { connectDB, sequelize } from './configs/db.js';
import {
  connectMongoDB,
  disconnectMongoDB,
  synchronizeIndexes,
} from './configs/mongodb.js';
import config from './configs/dotenv.js';
import { getRedisClient, closeRedis } from './configs/redis.js';
import { getJwtSecret } from './utils/auth.util.js';
import { validateBootEnvironment } from './configs/env.validator.js';

const PORT = config.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

/**
 * Bounded retry policy for canonical MongoDB connection (P0 Backend Reliability)
 */
export const connectMongoDBWithRetry = async (maxRetries = 5, retryDelayMs = 2000) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    try {
      console.log(`[MongoDB] Connecting to canonical database (attempt ${attempt}/${maxRetries})...`);
      const conn = await connectMongoDB();
      console.log('[MongoDB] Connected: canonical primary datastore active.');
      return conn;
    } catch (err) {
      console.error(`[MongoDB] Connection attempt ${attempt} failed: ${err.message}`);
      if (attempt < maxRetries) {
        console.log(`[MongoDB] Retrying in ${retryDelayMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      } else {
        throw new Error(`Failed to establish canonical MongoDB connection after ${maxRetries} attempts: ${err.message}`);
      }
    }
  }
};

const startServer = async () => {
  // Fail fast on startup if environment schema or secrets are missing/invalid in production (DEP-02)
  if (!process.env.VITEST) {
    validateBootEnvironment();
  }

  // Fail fast on startup if JWT_SECRET is missing, insecure, or weak
  getJwtSecret();

  const isProduction = process.env.NODE_ENV === 'production';

  // In production, await canonical MongoDB connection before accepting traffic
  if (isProduction) {
    try {
      await connectMongoDBWithRetry(5, 2000);
    } catch (err) {
      console.error('💥 [Server] Critical Startup Failure: Unable to establish canonical MongoDB connection in production.');
      console.error(err.message);
      if (!process.env.VITEST) {
        process.exit(1);
      }
      throw err;
    }
  } else {
    // Development / test mode: non-blocking connection attempt allows UI development without local MongoDB
    connectMongoDB()
      .then(() => {
        console.log('[MongoDB] Connected in development mode.');
      })
      .catch((error) => {
        console.warn(
          '⚠️ [MongoDB] Local connection bypassed/failed in development:',
          error.message || error
        );
        console.log(
          '[MongoDB] Operating with in-memory fallback store for local development.'
        );
      });
  }

  // Preserve migration-created indexes: do not execute destructive automatic syncIndexes() on startup.
  // Schema index creation is opt-in via RUN_AUTO_INDEX_SYNC to protect versioned migrations.
  if (process.env.RUN_AUTO_INDEX_SYNC === 'true') {
    synchronizeIndexes().catch((err) => {
      console.warn('[MongoDB] Index synchronization notice:', err.message);
    });
  }

  // Start HTTP server (in production, only after primary database connection is verified)
  const server = app.listen(PORT, HOST, () => {
    console.log(
      `[Server] Thinkwires API server running on http://${HOST}:${PORT}`
    );
  });

  // PostgreSQL (Sequelize) - Graceful non-blocking connection
  connectDB()
    .then(async () => {
      const isDevelopment = process.env.NODE_ENV !== 'production';
      if (isDevelopment) {
        await sequelize.sync({ alter: true });
        console.log(
          '[PostgreSQL] Models synced with schema auto-alter enabled (development)'
        );
      } else {
        console.log(
          '[PostgreSQL] Connected in production mode. Schema synchronization is managed via deterministic migrations (postgresRunner.js).'
        );
      }
    })
    .catch((error) => {
      console.warn(
        '[PostgreSQL] Connection optional/bypassed:',
        error.message || error
      );
      console.log(
        '[PostgreSQL] Operating with in-memory seed dataset for API routes.'
      );
    });

  // Redis (Upstash / Local) - Graceful non-blocking connection
  getRedisClient()
    .catch((error) => {
      console.warn(
        '[Redis] Startup connection notice:',
        error.message || error
      );
    });

  // Graceful shutdown handling for container orchestrators (Docker, Kubernetes, Render) with active connection draining (DEP-06)
  const gracefulShutdown = (signal, exitCode = 0) => {
    console.log(`[Server] Received ${signal}. Starting graceful shutdown...`);
    setShuttingDown(true);

    if (typeof server.closeIdleConnections === 'function') {
      server.closeIdleConnections();
    }

    server.close(async () => {
      console.log('[Server] HTTP connections closed.');
      try {
        await disconnectMongoDB();
        console.log('[MongoDB] Connection closed.');
        if (sequelize) {
          await sequelize.close();
          console.log('[PostgreSQL] Connection closed.');
        }
        await closeRedis();
        console.log('[Redis] Connection closed.');
      } catch (err) {
        console.error('[Server] Error during database shutdown:', err.message);
      }
      process.exit(exitCode);
    });

    // Force exit if connections do not close in 10s
    setTimeout(() => {
      console.error('[Server] Forcing shutdown after timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  // Process-level monitors for unhandled promise rejections and uncaught exceptions (SEC-EXP-05)
  process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 [Process] Unhandled Promise Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('💥 [Process] Critical Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION', 1);
  });

  // Use process.once to prevent EventEmitter memory leaks across restarts/workers (Issue #179)
  process.once('SIGTERM', () => gracefulShutdown('SIGTERM', 0));
  process.once('SIGINT', () => gracefulShutdown('SIGINT', 0));

  return server;
};

export { startServer };

if (!process.env.VITEST) {
  startServer();
}
