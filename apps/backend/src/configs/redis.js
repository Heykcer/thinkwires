import { createClient } from 'redis';
import config from './dotenv.js';

let redisClient = null;
let isRedisConnecting = false;
let isRedisReady = false;

const isTest = config.NODE_ENV === 'test' || process.env.NODE_ENV === 'test';

export const isRedisConnected = () => isRedisReady;

export const setMockRedisClient = (client) => {
  redisClient = client;
  isRedisReady = Boolean(client);
  isRedisConnecting = false;
};

/**
 * Initializes and retrieves the singleton Redis client.
 * Supports Upstash Redis (rediss:// TLS), cloud Redis, and local Redis.
 * Includes graceful connection handling and automatic in-memory fallback.
 */
export const getRedisClient = async () => {
  if (redisClient && isRedisReady) {
    return redisClient;
  }

  // In test environment without explicit REDIS_URL, bypass live socket connection
  if (isTest && !process.env.TEST_REDIS_URL) {
    return null;
  }

  if (!redisClient && !isRedisConnecting) {
    isRedisConnecting = true;
    const redisUrl =
      process.env.REDIS_URL || config.REDIS_URL || 'redis://localhost:6379';

    const isTls = redisUrl.startsWith('rediss://');
    const isUpstash = redisUrl.includes('upstash.io');

    try {
      redisClient = createClient({
        url: redisUrl,
        socket: {
          tls: isTls,
          reconnectStrategy: (retries) => {
            if (retries > 5) {
              return false; // Cease retrying if Redis is not running
            }
            return Math.min(retries * 100, 1000);
          },
          connectTimeout: 10000,
        },
      });

      redisClient.on('error', (err) => {
        isRedisReady = false;
      });

      redisClient.on('ready', () => {
        isRedisReady = true;
        isRedisConnecting = false;
        const provider = isUpstash ? 'Upstash Cloud' : isTls ? 'Cloud TLS' : 'Local';
        console.log(`[Redis] Connected: token revocation cache active (${provider}).`);
      });

      redisClient.on('end', () => {
        isRedisReady = false;
        isRedisConnecting = false;
      });

      await redisClient.connect();
      isRedisReady = true;
      isRedisConnecting = false;
    } catch (err) {
      isRedisReady = false;
      isRedisConnecting = false;
      if (!isTest) {
        console.warn(
          '[Redis] Connection optional/bypassed:',
          err.message || err
        );
        console.log(
          '[Redis] Operating with in-memory revocation store fallback.'
        );
      }
      return null;
    }
  }

  return isRedisReady ? redisClient : null;
};

/**
 * Closes the Redis client connection gracefully on server shutdown.
 */
export const closeRedis = async () => {
  if (redisClient) {
    try {
      if (isRedisReady) {
        await redisClient.quit();
      }
    } catch {
      // Ignore cleanup error
    } finally {
      redisClient = null;
      isRedisReady = false;
      isRedisConnecting = false;
    }
  }
};

export default { getRedisClient, closeRedis, setMockRedisClient, isRedisConnected };
