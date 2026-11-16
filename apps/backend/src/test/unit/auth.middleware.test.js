import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import UserMongo from '../../models/user.mongo.model.js';
import requireAuth, {
  requireCandidateAuth,
  requireRole,
} from '../../middlewares/auth.middleware.js';
import {
  generateAdminToken,
  generateCandidateToken,
  revokeToken,
  clearRevocationStore,
} from '../../utils/auth.util.js';

describe('Auth Middleware (Unit Tests)', () => {
  const createMockReqRes = (options = {}) => {
    const req = {
      cookies: options.cookies || {},
      headers: options.headers || {},
      ...options.reqOverrides,
    };
    const res = {
      statusCode: 200,
      jsonData: null,
      status: vi.fn().mockImplementation(function (code) {
        this.statusCode = code;
        return this;
      }),
      json: vi.fn().mockImplementation(function (data) {
        this.jsonData = data;
        return this;
      }),
    };
    const next = vi.fn();
    return { req, res, next };
  };

  beforeEach(async () => {
    await clearRevocationStore();
  });

  describe('requireCandidateAuth', () => {
    it('returns 401 when no cookie or authorization header is present', async () => {
      const { req, res, next } = createMockReqRes();

      await requireCandidateAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.jsonData.authenticated).toBe(false);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when token is invalid or corrupted', async () => {
      const { req, res, next } = createMockReqRes({
        cookies: { thinkwires_candidate_jwt: 'invalid.corrupted.token' },
      });

      await requireCandidateAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.jsonData.error).toMatch(/invalid or forged/i);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when candidate token has been revoked', async () => {
      const validToken = generateCandidateToken({
        id: 'candidate-unit-revoked',
        email: 'revoked@thinkwires.com',
        name: 'Revoked User',
      });
      await revokeToken(validToken);

      const { req, res, next } = createMockReqRes({
        cookies: { thinkwires_candidate_jwt: validToken },
      });

      await requireCandidateAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.jsonData.error).toMatch(/revoked/i);
      expect(next).not.toHaveBeenCalled();
    });

    it('extracts candidate from valid cookie and invokes next()', async () => {
      const validToken = generateCandidateToken({
        id: 'candidate-unit-1',
        email: 'alex@thinkwires.com',
        name: 'Alex Unit',
      });

      const { req, res, next } = createMockReqRes({
        cookies: { thinkwires_candidate_jwt: validToken },
      });

      await requireCandidateAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.candidate).toBeDefined();
      expect(req.candidate.email).toBe('alex@thinkwires.com');
      expect(req.candidate.role).toBe('candidate');
    });

    it('extracts candidate from Bearer authorization header and invokes next()', async () => {
      const validToken = generateCandidateToken({
        id: 'candidate-unit-2',
        email: 'bearer@thinkwires.com',
        name: 'Bearer User',
      });

      const { req, res, next } = createMockReqRes({
        headers: { authorization: `Bearer ${validToken}` },
      });

      await requireCandidateAuth(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.candidate.email).toBe('bearer@thinkwires.com');
    });
  });

  describe('requireRole', () => {
    it('fails closed with 401 Unauthorized when req.user is undefined', () => {
      const middleware = requireRole(['admin']);
      const { req, res, next } = createMockReqRes({
        reqOverrides: { user: undefined },
      });

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toMatch(/authentication required/i);
      expect(next).not.toHaveBeenCalled();
    });

    it('fails closed with 401 Unauthorized when req.user is null', () => {
      const middleware = requireRole(['admin']);
      const { req, res, next } = createMockReqRes({
        reqOverrides: { user: null },
      });

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toMatch(/authentication required/i);
      expect(next).not.toHaveBeenCalled();
    });

    it('fails closed with 401 Unauthorized when req.user is a non-object primitive', () => {
      const middleware = requireRole(['admin']);
      const { req, res, next } = createMockReqRes({
        reqOverrides: { user: 'malformed_user_string' },
      });

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toMatch(/authentication required/i);
      expect(next).not.toHaveBeenCalled();
    });

    it('fails closed with 401 Unauthorized when req.user.role is missing/undefined', () => {
      const middleware = requireRole(['admin']);
      const { req, res, next } = createMockReqRes({
        reqOverrides: { user: { id: 'user-1' } },
      });

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toMatch(/user role is missing, null, or malformed/i);
      expect(next).not.toHaveBeenCalled();
    });

    it('fails closed with 401 Unauthorized when req.user.role is null', () => {
      const middleware = requireRole(['admin']);
      const { req, res, next } = createMockReqRes({
        reqOverrides: { user: { id: 'user-1', role: null } },
      });

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toMatch(/user role is missing, null, or malformed/i);
      expect(next).not.toHaveBeenCalled();
    });

    it('fails closed with 401 Unauthorized when req.user.role is empty string', () => {
      const middleware = requireRole(['admin']);
      const { req, res, next } = createMockReqRes({
        reqOverrides: { user: { id: 'user-1', role: '   ' } },
      });

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toMatch(/user role is missing, null, or malformed/i);
      expect(next).not.toHaveBeenCalled();
    });

    it('fails closed with 401 Unauthorized when req.user.role is not a string (e.g. number/boolean/array)', () => {
      const middleware = requireRole(['admin']);
      const { req, res, next } = createMockReqRes({
        reqOverrides: { user: { id: 'user-1', role: 12345 } },
      });

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toMatch(/user role is missing, null, or malformed/i);
      expect(next).not.toHaveBeenCalled();
    });

    it('rejects unrecognized or invalid roles with 403 Forbidden', () => {
      const middleware = requireRole(['admin']);
      const { req, res, next } = createMockReqRes({
        reqOverrides: { user: { role: 'recruiter' } },
      });

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toMatch(/invalid or unrecognized by security policy/i);
      expect(next).not.toHaveBeenCalled();
    });

    it('blocks candidate role trying to access admin endpoints with 403 Forbidden', () => {
      const middleware = requireRole(['admin']);
      const { req, res, next } = createMockReqRes({
        reqOverrides: { user: { role: 'candidate' } },
      });

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.jsonData.success).toBe(false);
      expect(next).not.toHaveBeenCalled();
    });

    it('allows access when user role matches allowed roles', () => {
      const middleware = requireRole(['admin', 'superadmin']);
      const { req, res, next } = createMockReqRes({
        reqOverrides: { user: { role: 'admin' } },
      });

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('allows explicitly verified superadmin full bypass across all module role requirements', () => {
      const middleware = requireRole(['cms_admin']);
      const { req, res, next } = createMockReqRes({
        reqOverrides: { user: { role: 'superadmin' } },
      });

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('blocks admin role when route specifically requires cms_admin with 403', () => {
      const middleware = requireRole(['cms_admin']);
      const { req, res, next } = createMockReqRes({
        reqOverrides: { user: { role: 'admin' } },
      });

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.jsonData.error).toMatch(/access denied|content management system/i);
      expect(next).not.toHaveBeenCalled();
    });

    it('blocks cms_admin role when route specifically requires admin with 403', () => {
      const middleware = requireRole(['admin']);
      const { req, res, next } = createMockReqRes({
        reqOverrides: { user: { role: 'cms_admin' } },
      });

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.jsonData.error).toMatch(/access denied|cms admins have access restricted/i);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('P0 Security Requirement C: Admin Authentication Fail-Open Defense & DB Canonical Verification', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
      process.env = { ...originalEnv };
      process.env.JWT_ADMIN_SECRET = 'test_admin_jwt_secret_min_32_characters_long';
    });

    afterEach(() => {
      process.env = { ...originalEnv };
      vi.restoreAllMocks();
    });

    it('fails closed with HTTP 503 in production when MongoDB connection is disconnected (readyState !== 1)', async () => {
      process.env.NODE_ENV = 'production';
      vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(0); // Disconnected

      const validToken = generateAdminToken({
        id: '64b1f234567890abcdef1234',
        email: 'ops@thinkwires.com',
        role: 'admin',
      });

      const { req, res, next } = createMockReqRes({
        cookies: { thinkwires_admin_jwt: validToken },
      });

      const middleware = requireAuth();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.error).toMatch(/canonical user database is disconnected/i);
      expect(next).not.toHaveBeenCalled();
    });

    it('fails closed with HTTP 503 in production when MongoDB is still connecting (readyState === 2)', async () => {
      process.env.NODE_ENV = 'production';
      vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(2); // Connecting

      const validToken = generateAdminToken({
        id: '64b1f234567890abcdef1234',
        email: 'ops@thinkwires.com',
        role: 'superadmin',
      });

      const { req, res, next } = createMockReqRes({
        cookies: { thinkwires_admin_jwt: validToken },
      });

      const middleware = requireAuth();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(503);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns HTTP 403 when administrative account is deactivated in canonical DB (isActive === false)', async () => {
      vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1); // Connected
      vi.spyOn(UserMongo, 'findById').mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({
            _id: '64b1f234567890abcdef1234',
            email: 'deactivated@thinkwires.com',
            role: 'admin',
            isActive: false, // Account disabled
            tokenVersion: 1,
          }),
        }),
      });

      const validToken = generateAdminToken({
        id: '64b1f234567890abcdef1234',
        email: 'deactivated@thinkwires.com',
        role: 'admin',
        tokenVersion: 1,
      });

      const { req, res, next } = createMockReqRes({
        cookies: { thinkwires_admin_jwt: validToken },
      });

      const middleware = requireAuth();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.jsonData.error).toMatch(/account has been deactivated/i);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns HTTP 401 when token has been revoked in the revocation store', async () => {
      const validToken = generateAdminToken({
        id: '64b1f234567890abcdef1234',
        email: 'revoked@thinkwires.com',
        role: 'admin',
      });

      await revokeToken(validToken, 3600);

      const { req, res, next } = createMockReqRes({
        cookies: { thinkwires_admin_jwt: validToken },
      });

      const middleware = requireAuth();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.jsonData.error).toMatch(/session has been revoked/i);
      expect(next).not.toHaveBeenCalled();
    });

    it('enforces role downgrade from database: stale JWT claim cannot retain superadmin privileges', async () => {
      vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1);
      // User was downgraded in DB to cms_admin
      vi.spyOn(UserMongo, 'findById').mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({
            _id: '64b1f234567890abcdef1234',
            email: 'downgraded@thinkwires.com',
            role: 'cms_admin', // Downgraded in DB
            isActive: true,
            tokenVersion: 1,
          }),
        }),
      });

      // Token still says 'superadmin'
      const staleToken = generateAdminToken({
        id: '64b1f234567890abcdef1234',
        email: 'downgraded@thinkwires.com',
        role: 'superadmin',
        tokenVersion: 1,
      });

      const { req, res, next } = createMockReqRes({
        cookies: { thinkwires_admin_jwt: staleToken },
      });

      // Endpoint requires 'admin' (which cms_admin is not allowed to access)
      const middleware = requireAuth(['admin']);
      await middleware(req, res, next);

      // Verify req.user.role was updated to the DB role cms_admin
      expect(req.user.role).toBe('cms_admin');
      // And therefore blocked from the admin endpoint with HTTP 403
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns HTTP 401 when tokenVersion mismatches the canonical database record', async () => {
      vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1);
      vi.spyOn(UserMongo, 'findById').mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({
            _id: '64b1f234567890abcdef1234',
            email: 'versiontest@thinkwires.com',
            role: 'admin',
            isActive: true,
            tokenVersion: 5, // DB tokenVersion bumped to 5
          }),
        }),
      });

      const oldToken = generateAdminToken({
        id: '64b1f234567890abcdef1234',
        email: 'versiontest@thinkwires.com',
        role: 'admin',
        tokenVersion: 4, // Old token version 4
      });

      const { req, res, next } = createMockReqRes({
        cookies: { thinkwires_admin_jwt: oldToken },
      });

      const middleware = requireAuth();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.jsonData.error).toMatch(/session has been invalidated/i);
      expect(next).not.toHaveBeenCalled();
    });

    it('allows valid active administrator when authenticated and verified against canonical DB', async () => {
      vi.spyOn(mongoose.connection, 'readyState', 'get').mockReturnValue(1);
      vi.spyOn(UserMongo, 'findById').mockReturnValue({
        select: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({
            _id: '64b1f234567890abcdef1234',
            name: 'Valid Admin',
            email: 'valid@thinkwires.com',
            role: 'admin',
            isActive: true,
            tokenVersion: 1,
          }),
        }),
      });

      const validToken = generateAdminToken({
        id: '64b1f234567890abcdef1234',
        email: 'valid@thinkwires.com',
        role: 'admin',
        tokenVersion: 1,
      });

      const { req, res, next } = createMockReqRes({
        cookies: { thinkwires_admin_jwt: validToken },
      });

      const middleware = requireAuth(['admin']);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.role).toBe('admin');
      expect(req.user.isActive).toBe(true);
    });
  });
});
