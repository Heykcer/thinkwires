import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { api, getAdminAuthCookie } from '../test-helper.js';
import {
  getJwtSecret,
  revokeToken,
  clearRevocationStore,
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_PATH,
  setAdminAuthCookie,
} from '../../utils/auth.util.js';
import {
  CSRF_COOKIE_NAME,
  generateCsrfToken,
} from '../../middlewares/csrf.middleware.js';

describe('Admin Authentication & Cookie Security (Integration Tests)', () => {
  const adminCredentials = {
    email: 'admin@thinkwires.com',
    password: 'Thinkwires@2026',
  };

  const superadminCredentials = {
    email: 'superadmin@thinkwires.com',
    password: 'Thinkwires@2026',
  };

  beforeEach(async () => {
    await clearRevocationStore();
  });

  describe('POST /api/admin/auth/login', () => {
    it('successfully logs in admin, sets HttpOnly cookie with Path=/api/admin, and omits token from body', async () => {
      const res = await api
        .post('/api/admin/auth/login')
        .send(adminCredentials);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(adminCredentials.email);

      // CRITICAL: Token MUST NOT be present in JSON response body
      expect(res.body.token).toBeUndefined();

      // Anti-CSRF token should be provided
      expect(res.body.csrfToken).toBeDefined();
      expect(typeof res.body.csrfToken).toBe('string');

      // Verify Set-Cookie headers
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();

      // 1. Verify HttpOnly Admin JWT Cookie
      const authCookie = cookies.find((c) =>
        c.startsWith(`${ADMIN_COOKIE_NAME}=`)
      );
      expect(authCookie).toBeDefined();
      expect(authCookie).toContain('HttpOnly');
      expect(authCookie).toContain(`Path=${ADMIN_COOKIE_PATH}`);
      expect(authCookie).toMatch(/SameSite=(Lax|Strict)/i);

      // 2. Verify CSRF Cookie
      const csrfCookie = cookies.find((c) =>
        c.startsWith(`${CSRF_COOKIE_NAME}=`)
      );
      expect(csrfCookie).toBeDefined();
      expect(csrfCookie).not.toContain('HttpOnly'); // Must be accessible to JS
      expect(csrfCookie).toContain('Path=/');
    });

    it('rejects invalid admin password with 401 Unauthorized', async () => {
      const res = await api.post('/api/admin/auth/login').send({
        email: 'admin@thinkwires.com',
        password: 'CompletelyWrongPassword!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/invalid password/i);
      expect(res.headers['set-cookie']).toBeUndefined();
    });

    it('rejects unprovisioned admin email with 401 Unauthorized', async () => {
      const res = await api.post('/api/admin/auth/login').send({
        email: 'nonexistent.admin@thinkwires.com',
        password: 'Thinkwires@2026',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/invalid official credentials/i);
    });
  });

  describe('Cookie Security Attributes (Production Environment Simulation)', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalSameSite = process.env.COOKIE_SAME_SITE;

    beforeEach(() => {
      delete process.env.COOKIE_SAME_SITE;
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
      if (originalSameSite !== undefined) {
        process.env.COOKIE_SAME_SITE = originalSameSite;
      } else {
        delete process.env.COOKIE_SAME_SITE;
      }
    });

    it('sets Secure and SameSite=Strict attributes in production environment', () => {
      process.env.NODE_ENV = 'production';

      const mockRes = {
        cookies: {},
        cookie(name, val, opts) {
          this.cookies[name] = { val, opts };
        },
      };

      setAdminAuthCookie(mockRes, 'dummy-test-token');

      const cookieEntry = mockRes.cookies[ADMIN_COOKIE_NAME];
      expect(cookieEntry).toBeDefined();
      expect(cookieEntry.opts.httpOnly).toBe(true);
      expect(cookieEntry.opts.secure).toBe(true);
      expect(cookieEntry.opts.sameSite).toBe('strict');
      expect(cookieEntry.opts.path).toBe('/api/admin');
      expect(cookieEntry.opts.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });

  describe('GET /api/admin/auth/me (Session Restoration)', () => {
    it('restores authenticated session using HttpOnly cookie', async () => {
      const authCookie = getAdminAuthCookie({
        id: 'admin-restore-001',
        email: 'restored@thinkwires.com',
        name: 'Restored Admin',
        role: 'admin',
      });

      const res = await api
        .get('/api/admin/auth/me')
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('restored@thinkwires.com');
      expect(res.body.user.role).toBe('admin');
      expect(res.body.csrfToken).toBeDefined();
    });

    it('rejects requests missing the authentication cookie with 401', async () => {
      const res = await api.get('/api/admin/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.authenticated).toBe(false);
      expect(res.body.error).toMatch(/authentication required/i);
    });

    it('rejects tampered or forged authentication cookie with 401', async () => {
      const res = await api
        .get('/api/admin/auth/me')
        .set('Cookie', [`${ADMIN_COOKIE_NAME}=malformed.forged.jwt.token`]);

      expect(res.status).toBe(401);
      expect(res.body.authenticated).toBe(false);
      expect(res.body.error).toMatch(/invalid or forged/i);
    });

    it('rejects expired authentication cookie with 401', async () => {
      const secret = getJwtSecret();
      const expiredToken = jwt.sign(
        {
          id: 'admin-expired',
          email: 'expired@thinkwires.com',
          role: 'admin',
          portal: 'admin',
        },
        secret,
        { expiresIn: '-1s' }
      );

      const res = await api
        .get('/api/admin/auth/me')
        .set('Cookie', [`${ADMIN_COOKIE_NAME}=${expiredToken}`]);

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/session expired/i);
    });

    it('rejects revoked authentication cookie with 401', async () => {
      const secret = getJwtSecret();
      const validToken = jwt.sign(
        {
          id: 'admin-revoked',
          email: 'revoked@thinkwires.com',
          role: 'admin',
          portal: 'admin',
        },
        secret,
        { expiresIn: '1h' }
      );

      // Revoke the token
      await revokeToken(validToken);

      const res = await api
        .get('/api/admin/auth/me')
        .set('Cookie', [`${ADMIN_COOKIE_NAME}=${validToken}`]);

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/revoked/i);
    });
  });

  describe('POST /api/admin/auth/logout', () => {
    it('revokes token, clears cookie with matching Path, and clears CSRF cookie', async () => {
      // 1. Log in to acquire live session
      const loginRes = await api
        .post('/api/admin/auth/login')
        .send(adminCredentials);

      const cookies = loginRes.headers['set-cookie'];
      const rawAuth = cookies.find((c) => c.startsWith(`${ADMIN_COOKIE_NAME}=`));
      const authVal = rawAuth.split(';')[0];
      const rawCsrf = cookies.find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`));
      const csrfVal = rawCsrf.split(';')[0];
      const csrfToken = csrfVal.split('=')[1];

      // 2. Perform logout with credentials and CSRF token
      const logoutRes = await api
        .post('/api/admin/auth/logout')
        .set('Cookie', [authVal, csrfVal])
        .set('X-CSRF-Token', csrfToken);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Verify cookies are expired/cleared
      const logoutCookies = logoutRes.headers['set-cookie'];
      expect(logoutCookies).toBeDefined();

      const clearedAuth = logoutCookies.find((c) =>
        c.startsWith(`${ADMIN_COOKIE_NAME}=`)
      );
      expect(clearedAuth).toBeDefined();
      expect(clearedAuth).toContain(`Path=${ADMIN_COOKIE_PATH}`);
      expect(clearedAuth).toMatch(/Expires=Thu, 01 Jan 1970/);

      // 3. Verify that the revoked token can no longer access protected endpoints
      const retryRes = await api
        .get('/api/admin/auth/me')
        .set('Cookie', [authVal]);

      expect(retryRes.status).toBe(401);
      expect(retryRes.body.error).toMatch(/revoked/i);
    });
  });

  describe('CSRF Defense on State-Changing Admin Endpoints', () => {
    it('rejects POST request with cookie but missing X-CSRF-Token header with 403', async () => {
      const authCookie = getAdminAuthCookie();
      const csrfToken = generateCsrfToken();
      const csrfCookie = `${CSRF_COOKIE_NAME}=${csrfToken}`;

      const res = await api
        .post('/api/admin/employees')
        .set('Cookie', [authCookie, csrfCookie])
        .send({
          name: 'Jane Attacker',
          email: 'jane@attacker.com',
          role: 'Recruiter',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/CSRF validation failed/i);
    });

    it('rejects POST request with mismatched X-CSRF-Token header with 403', async () => {
      const authCookie = getAdminAuthCookie();
      const legitimateCsrf = generateCsrfToken();
      const csrfCookie = `${CSRF_COOKIE_NAME}=${legitimateCsrf}`;

      const res = await api
        .post('/api/admin/employees')
        .set('Cookie', [authCookie, csrfCookie])
        .set('X-CSRF-Token', 'tampered-csrf-token-xyz')
        .send({
          name: 'Jane Attacker',
          email: 'jane@attacker.com',
          role: 'Recruiter',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Invalid or mismatched CSRF token/i);
    });

    it('rejects state-changing request from untrusted origin with 403', async () => {
      const authCookie = getAdminAuthCookie();
      const csrfToken = generateCsrfToken();
      const csrfCookie = `${CSRF_COOKIE_NAME}=${csrfToken}`;

      const res = await api
        .post('/api/admin/employees')
        .set('Cookie', [authCookie, csrfCookie])
        .set('X-CSRF-Token', csrfToken)
        .set('Origin', 'http://malicious-attacker.com')
        .send({
          name: 'CSRF Attack',
          email: 'evil@malicious.com',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/Untrusted origin/i);
    });

    it('allows state-changing request with valid cookie, valid matching CSRF token, and trusted origin', async () => {
      const authCookie = getAdminAuthCookie({
        id: 'admin-csrf-pass',
        email: 'admin@thinkwires.com',
        name: 'Authorized Admin',
        role: 'admin',
      });
      const csrfToken = generateCsrfToken();
      const csrfCookie = `${CSRF_COOKIE_NAME}=${csrfToken}`;

      const res = await api
        .post('/api/admin/employees')
        .set('Cookie', [authCookie, csrfCookie])
        .set('X-CSRF-Token', csrfToken)
        .set('Origin', 'http://localhost:5173')
        .send({
          name: 'Legitimate Employee',
          email: `emp.${Date.now()}@thinkwires.com`,
          department: 'Engineering',
          designation: 'Staff Engineer',
          status: 'Active',
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });
  });

  describe('CORS and Origin Security', () => {
    it('sets Access-Control-Allow-Origin for trusted dev origin with credentials', async () => {
      const res = await api
        .get('/api/admin/auth/csrf-token')
        .set('Origin', 'http://localhost:5173');

      expect(res.headers['access-control-allow-origin']).toBe(
        'http://localhost:5173'
      );
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('omits Access-Control-Allow-Origin for untrusted attacker origin', async () => {
      const res = await api
        .get('/api/admin/auth/csrf-token')
        .set('Origin', 'http://malicious-site.com');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('Admin RBAC Authorization Checks', () => {
    it('allows admin role to access manpower endpoints (/api/admin/employees)', async () => {
      const authCookie = getAdminAuthCookie({
        id: 'admin-rbac-1',
        email: 'admin@thinkwires.com',
        name: 'Regular Admin',
        role: 'admin',
      });

      const res = await api
        .get('/api/admin/employees')
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('denies admin role from accessing CMS exclusive endpoints (/api/admin/cms/pages) with 403', async () => {
      const authCookie = getAdminAuthCookie({
        id: 'admin-rbac-2',
        email: 'admin@thinkwires.com',
        name: 'Regular Admin',
        role: 'admin',
      });

      const res = await api
        .get('/api/admin/cms/pages')
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('RBAC_ADMIN_CMS_RESTRICTED');
    });

    it('denies non-superadmin from accessing System Members (/api/admin/system-members) with 403', async () => {
      const authCookie = getAdminAuthCookie({
        id: 'admin-rbac-3',
        email: 'admin@thinkwires.com',
        name: 'Regular Admin',
        role: 'admin',
      });

      const res = await api
        .get('/api/admin/system-members')
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/access denied|not authorized/i);
    });
  });
});
