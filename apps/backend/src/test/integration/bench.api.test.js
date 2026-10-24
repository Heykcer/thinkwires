import { describe, it, expect } from 'vitest';
import { api } from '../test-helper.js';

describe('Talent Cloud Bench API (Integration Tests)', () => {
  describe('GET /api/bench', () => {
    it('returns public bench hero, specialty filters, and normalized talents', async () => {
      const res = await api.get('/api/bench');

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
      expect(Array.isArray(res.body.specialtyFilters)).toBe(true);
      expect(Array.isArray(res.body.talents)).toBe(true);
      expect(res.body.talents.length).toBeGreaterThan(0);

      const firstTalent = res.body.talents[0];
      expect(firstTalent.id).toBeDefined();
      expect(firstTalent.role).toBeDefined();
      expect(firstTalent.specialty).toBeDefined();
      expect(firstTalent.rubric).toBeDefined();
      expect(firstTalent.rubric.systemDesign).toBeTypeOf('number');
    });

    it('provides all 5 core engineering specialty categories in filters', async () => {
      const res = await api.get('/api/bench');

      const labels = res.body.specialtyFilters.map((f) => f.label);
      expect(labels).toContain('All Engineering');
      expect(labels).toContain('GenAI & LLMs');
      expect(labels).toContain('Cloud & DevOps');
      expect(labels).toContain('SAP & Enterprise');
      expect(labels).toContain('Systems & Distributed');
      expect(labels).toContain('Data & Analytics');
    });
  });

  describe('GET /api/bench/talents', () => {
    it('supports specialty filtering for Cloud & DevOps', async () => {
      const res = await api.get('/api/bench/talents?specialty=Cloud%20%26%20DevOps');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((talent) => {
        expect(talent.specialty).toBe('Cloud & DevOps');
      });
    });

    it('supports search query matching role, skills, or code', async () => {
      const res = await api.get('/api/bench/talents?q=Kubernetes');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        const matches = res.body.some(
          (t) =>
            t.role.toLowerCase().includes('kubernetes') ||
            t.skills.some((s) => s.toLowerCase().includes('kubernetes'))
        );
        expect(matches).toBe(true);
      }
    });

    it('sorts by AI Assessment score descending', async () => {
      const res = await api.get('/api/bench/talents?sort=AI%20Assessment');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      for (let i = 1; i < res.body.length; i++) {
        const prev = typeof res.body[i - 1].assessmentScore === 'number' ? res.body[i - 1].assessmentScore : 0;
        const curr = typeof res.body[i].assessmentScore === 'number' ? res.body[i].assessmentScore : 0;
        expect(prev).toBeGreaterThanOrEqual(curr);
      }
    });
  });

  describe('GET /api/bench/talents/:id', () => {
    it('returns dossier details for a valid talent code', async () => {
      const listRes = await api.get('/api/bench');
      const sampleTalent = listRes.body.talents[0];

      const res = await api.get(`/api/bench/talents/${sampleTalent.id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(sampleTalent.id);
      expect(res.body.rubric).toBeDefined();
    });

    it('returns 404 for non-existent talent code', async () => {
      const res = await api.get('/api/bench/talents/TW-NONEXISTENT-9999');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Talent not found');
    });
  });

  describe('POST /api/bench/book-interview', () => {
    it('rejects booking when required fields are missing', async () => {
      const res = await api.post('/api/bench/book-interview').send({
        companyName: 'Acme Global',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('successfully books an interview and returns a confirmation ref', async () => {
      const res = await api.post('/api/bench/book-interview').send({
        talentId: 'TW-BENCH-902',
        talentCode: 'TW-BENCH-902',
        workEmail: 'hiring@enterprise-client.io',
        companyName: 'Enterprise Client Corp',
        hiringManager: 'Director of Platform',
        timeSlot: 'Next Monday 10:00 AM EST',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.bookingRef).toMatch(/^TW-/);
    });
  });
});
