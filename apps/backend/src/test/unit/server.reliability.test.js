import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../app.js';
import { connectMongoDBWithRetry } from '../../server.js';
import * as mongoConfig from '../../configs/mongodb.js';

describe('P0 Backend Reliability & Startup Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('connectMongoDBWithRetry Bounded Retry Policy', () => {
    it('succeeds immediately on first attempt when MongoDB connects', async () => {
      const mockConn = { readyState: 1 };
      vi.spyOn(mongoConfig, 'connectMongoDB').mockResolvedValue(mockConn);

      const conn = await connectMongoDBWithRetry(3, 10);
      expect(conn).toBe(mockConn);
      expect(mongoConfig.connectMongoDB).toHaveBeenCalledTimes(1);
    });

    it('retries with bounded delay and succeeds after transient failures', async () => {
      const mockConn = { readyState: 1 };
      let attempts = 0;
      vi.spyOn(mongoConfig, 'connectMongoDB').mockImplementation(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Transient connection timeout');
        }
        return mockConn;
      });

      const conn = await connectMongoDBWithRetry(4, 10);
      expect(conn).toBe(mockConn);
      expect(attempts).toBe(3);
    });

    it('fails startup with clear error after max retries are exhausted', async () => {
      vi.spyOn(mongoConfig, 'connectMongoDB').mockRejectedValue(
        new Error('Could not reach primary replica set')
      );

      await expect(connectMongoDBWithRetry(3, 10)).rejects.toThrow(
        /Failed to establish canonical MongoDB connection after 3 attempts/
      );
      expect(mongoConfig.connectMongoDB).toHaveBeenCalledTimes(3);
    });
  });

  describe('SRE Liveness and Readiness Probes', () => {
    it('/healthz responds with HTTP 200 alive regardless of datastore status', async () => {
      const res = await request(app).get('/healthz');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('alive');
      expect(res.body.uptimeSeconds).toBeGreaterThanOrEqual(0);
    });

    it('/ready responds with HTTP 503 when primary MongoDB datastore is disconnected', async () => {
      const originalReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 0,
        configurable: true,
      });

      try {
        const res = await request(app).get('/ready');
        expect(res.status).toBe(503);
        expect(res.body.status).toBe('unready');
      } finally {
        Object.defineProperty(mongoose.connection, 'readyState', {
          value: originalReadyState,
          configurable: true,
        });
      }
    });

    it('/ready responds with HTTP 200 when primary MongoDB datastore is connected', async () => {
      const originalReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 1,
        configurable: true,
      });

      try {
        const res = await request(app).get('/ready');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ready');
      } finally {
        Object.defineProperty(mongoose.connection, 'readyState', {
          value: originalReadyState,
          configurable: true,
        });
      }
    });
  });

  describe('Durable Write Mutation Safety in Production', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('rejects contact inquiries with HTTP 503 in production when database is unavailable', async () => {
      process.env.NODE_ENV = 'production';
      const originalReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 0,
        configurable: true,
      });

      try {
        const res = await request(app)
          .post('/api/contact')
          .send({
            name: 'Production Inquirer',
            email: 'inquirer@enterprise.org',
            phone: '+1-555-123-4567',
          });

        expect(res.status).toBe(503);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('Database connection temporarily unavailable');
      } finally {
        Object.defineProperty(mongoose.connection, 'readyState', {
          value: originalReadyState,
          configurable: true,
        });
      }
    });

    it('rejects workforce strategy consultation with HTTP 503 in production when database is unavailable', async () => {
      process.env.NODE_ENV = 'production';
      const originalReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 0,
        configurable: true,
      });

      try {
        const res = await request(app)
          .post('/api/consultations')
          .send({
            fullName: 'Enterprise Client',
            workEmail: 'lead@enterprise.org',
            primaryNeed: 'Staff Augmentation',
          });

        expect(res.status).toBe(503);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('Database connection temporarily unavailable');
      } finally {
        Object.defineProperty(mongoose.connection, 'readyState', {
          value: originalReadyState,
          configurable: true,
        });
      }
    });
  });
});
