import { describe, it, expect } from 'vitest';
import { api } from '../test-helper.js';

describe('Modular Public Routes API (Integration Tests)', () => {
  describe('Pages & CMS (/api/pages, /api/benefits, etc.)', () => {
    it('GET /api/benefits returns array of benefits', async () => {
      const res = await api.get('/api/benefits');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/faqs returns array of FAQs', async () => {
      const res = await api.get('/api/faqs');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/tech-stack returns technology stack catalog', async () => {
      const res = await api.get('/api/tech-stack');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Openings (/api/openings)', () => {
    it('GET /api/openings returns jobs list with confidential company masking', async () => {
      const res = await api.get('/api/openings');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0].company).toContain('Confidential');
      }
    });
  });

  describe('Articles & Editorial (/api/articles)', () => {
    it('GET /api/articles returns published articles', async () => {
      const res = await api.get('/api/articles');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /api/articles/featured returns flagship article', async () => {
      const res = await api.get('/api/articles/featured');
      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });
  });

  describe('Corporate & Advisory (/api/about, /api/leadership)', () => {
    it('GET /api/about returns company overview and stats', async () => {
      const res = await api.get('/api/about');
      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
      expect(res.body.company || res.body.stats).toBeDefined();
    });

    it('GET /api/leadership returns executive leadership team', async () => {
      const res = await api.get('/api/leadership');
      expect(res.status).toBe(200);
      const members = Array.isArray(res.body) ? res.body : res.body.members;
      expect(Array.isArray(members)).toBe(true);
      expect(members.length).toBeGreaterThan(0);
    });
  });

  describe('Contact (/api/contact)', () => {
    it('GET /api/contact returns contact page metadata', async () => {
      const res = await api.get('/api/contact');
      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });
  });

  describe('Workforce Services (/api/find-talent, /api/payroll, /api/eor)', () => {
    it('GET /api/find-talent returns find talent page data', async () => {
      const res = await api.get('/api/find-talent');
      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });

    it('GET /api/payroll returns payroll services data', async () => {
      const res = await api.get('/api/payroll');
      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });
  });
});
