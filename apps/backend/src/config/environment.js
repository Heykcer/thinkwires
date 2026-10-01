/**
 * Environment Configuration
 * Centralizes all environment variables with sensible defaults.
 */

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || '0.0.0.0',
  logLevel: process.env.LOG_LEVEL || 'info',

  // Database
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgres://postgres:postgres@localhost:5432/thinkwire_db',
  dbPoolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
  dbPoolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),

  // Redis & BullMQ
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // AI Microservice (FastAPI)
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  aiServiceTimeoutMs: parseInt(
    process.env.AI_SERVICE_TIMEOUT_MS || '10000',
    10
  ),

  // Security & Authentication
  jwtSecret:
    process.env.JWT_SECRET ||
    'supersecret_dev_jwt_key_replace_in_production_12345',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET ||
    'supersecret_refresh_jwt_key_replace_in_production_67890',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // CORS
  corsOrigins: (
    process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000'
  ).split(','),

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS || '100',
    10
  ),
};
