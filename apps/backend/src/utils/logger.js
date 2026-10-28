import pino from 'pino';

const isServerless = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
);
const isDevelopment = process.env.NODE_ENV !== 'production' && !isServerless;

/**
 * High-performance Structured Pino Logger for Thinkwires Backend
 * - In local development: uses pino-pretty for clean, human-readable colorized console logs
 * - In production & Serverless (Vercel Lambda): uses high-speed structured JSON logs with ISO timestamps
 *   (avoids worker threads that can crash or hang serverless containers)
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  base: {
    service: 'thinkwires-backend',
    env: process.env.NODE_ENV || 'development',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss.l',
          ignore: 'pid,hostname,service,env',
        },
      }
    : undefined,
});

export default logger;
