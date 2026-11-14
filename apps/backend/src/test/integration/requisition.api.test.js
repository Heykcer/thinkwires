import { describe, it, expect } from 'vitest';
import { api, getAdminAuthCookie } from '../test-helper.js';
import {
  CSRF_COOKIE_NAME,
  generateCsrfToken,
} from '../../middlewares/csrf.middleware.js';

describe('Candidate Requisition Workflow (Integration Tests)', () => {
  const adminCookie = getAdminAuthCookie({
    id: 'usr_admin_req',
    email: 'admin@thinkwires.com',
    role: 'admin',
    name: 'Admin Lead',
  });

  const csrfToken = generateCsrfToken();
  const csrfCookie = `${CSRF_COOKIE_NAME}=${csrfToken}`;

  const sampleRequisition = {
    engagementModel: 'Staff Augmentation',
    targetRole: 'Principal Cloud & Kubernetes Architect',
    headcount: 2,
    seniority: 'principal',
    techStack: ['AWS', 'Kubernetes', 'Terraform', 'Go'],
    deploymentUrgency: 'immediate',
    workArrangement: 'remote_global',
    budgetEnvelope: 'bracket_3',
    fullName: 'Rajesh Varma',
    corporateEmail: 'r.varma@fintech-global.com',
    company: 'FinTech Global Scale Inc',
    phone: '+91 98765 43210',
    jobDescription:
      'Urgent requirement for multi-region EKS payment cluster migration.',
  };

  let createdRequisitionId = null;

  it('submits talent requisition via /api/find-talent/requisition and persists to admin queue', async () => {
    const res = await api
      .post('/api/find-talent/requisition')
      .send(sampleRequisition);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.requisition).toBeDefined();
    expect(res.body.requisition.title).toBe(sampleRequisition.targetRole);
    expect(res.body.requisition.client).toBe(sampleRequisition.company);
    expect(res.body.requisition.contactPerson).toBe(sampleRequisition.fullName);
    expect(res.body.requisition.contactEmail).toBe(
      sampleRequisition.corporateEmail
    );
    expect(res.body.requisition.status).toBe('Inbound Request');
    expect(res.body.requisition.isRequisition).toBe(true);

    createdRequisitionId = res.body.requisition.id;
  });

  it('exposes submitted requisition in Admin Dashboard /api/admin/stats with SLA metrics', async () => {
    const res = await api
      .get('/api/admin/stats?period=month')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.inboundRequisitions).toBeDefined();
    expect(Array.isArray(res.body.inboundRequisitions)).toBe(true);

    const found = res.body.inboundRequisitions.find(
      (r) => r.id === createdRequisitionId
    );
    expect(found).toBeDefined();
    expect(found.title).toBe(sampleRequisition.targetRole);
    expect(found.client).toBe(sampleRequisition.company);

    // Verify KPI counters reflect inbound requisitions
    expect(res.body.kpis.inboundRequisitionsCount).toBeGreaterThanOrEqual(1);
    expect(res.body.kpis.pendingRequisitionsSla).toBeGreaterThanOrEqual(1);
  });

  it('allows admin to query inbound requisitions on /api/admin/jobs?status=Inbound Request', async () => {
    const res = await api
      .get('/api/admin/jobs?status=Inbound Request')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.jobs)).toBe(true);

    const found = res.body.jobs.find((j) => j.id === createdRequisitionId);
    expect(found).toBeDefined();
    expect(found.contactEmail).toBe(sampleRequisition.corporateEmail);
    expect(found.status).toBe('Inbound Request');
  });

  it('allows admin to approve and convert inbound requisition to active job opening', async () => {
    const res = await api
      .put(`/api/admin/jobs/${createdRequisitionId}`)
      .set('Cookie', [adminCookie, csrfCookie])
      .set('X-CSRF-Token', csrfToken)
      .set('Origin', 'http://localhost:5173')
      .send({ status: 'Open' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Confirm updated status in jobs query
    const checkRes = await api
      .get(`/api/admin/jobs?search=${encodeURIComponent(sampleRequisition.company)}`)
      .set('Cookie', adminCookie);

    expect(checkRes.status).toBe(200);
    const updatedJob = checkRes.body.jobs.find(
      (j) => j.id === createdRequisitionId
    );
    expect(updatedJob).toBeDefined();
    expect(updatedJob.status).toBe('Open');
  });

  it('queries dedicated client requisitions desk via /api/admin/jobs?type=requisitions', async () => {
    const res = await api
      .get('/api/admin/jobs?type=requisitions')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.jobs)).toBe(true);

    // The approved requisition must still exist in requisitions desk
    const found = res.body.jobs.find((j) => j.id === createdRequisitionId);
    expect(found).toBeDefined();
    expect(found.isRequisition).toBe(true);
    expect(found.title).toBe(sampleRequisition.targetRole);
  });

  it('queries active recruitment jobs via /api/admin/jobs?type=jobs and verifies mandate link', async () => {
    const res = await api
      .get('/api/admin/jobs?type=jobs')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.jobs)).toBe(true);

    // Approved requisition is an active opening for recruitment
    const approvedJob = res.body.jobs.find((j) => j.id === createdRequisitionId);
    expect(approvedJob).toBeDefined();
    expect(approvedJob.status).toBe('Open');
  });

  it('allows admin to create a new client requisition directly with SLA and contact lead', async () => {
    const newReqPayload = {
      title: 'Principal DevOps Architect',
      client: 'Apex Scaler Systems',
      contactPerson: 'David Chen',
      contactEmail: 'd.chen@apexscaler.io',
      contactPhone: '+1 (415) 880-9911',
      engagementModel: 'Dedicated Pod',
      seniority: 'Principal / Lead (8+ yrs)',
      experienceRequired: 8,
      openingsCount: 2,
      requiredSkills: ['Terraform', 'Kubernetes', 'AWS', 'Go'],
      deploymentUrgency: 'immediate',
      budget: '$15,000 / mo',
      isRequisition: true,
      category: 'Client Requisition',
    };

    const res = await api
      .post('/api/admin/jobs')
      .set('Cookie', [adminCookie, csrfCookie])
      .set('X-CSRF-Token', csrfToken)
      .set('Origin', 'http://localhost:5173')
      .send(newReqPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.job).toBeDefined();
    expect(res.body.job.isRequisition).toBe(true);
    expect(res.body.job.contactEmail).toBe(newReqPayload.contactEmail);
    expect(res.body.job.jobId).toMatch(/^REQ-/);
  });

  it('submits technical scoping call, alerts HR email, and logs ticket under Enterprise Scoping in HelpDesk', async () => {
    const scopingPayload = {
      isScopingCall: true,
      requestType: 'scoping_call',
      domain: 'Cloud Architecture & Kubernetes',
      consultationDate: '2026-11-20',
      consultationTime: 'Morning (09:00 - 12:00 IST)',
      scopeNotes: 'Need 3 senior cloud architects for multi-region migration.',
      engagementModel: 'Enterprise Consultation: Cloud Architecture & Kubernetes',
      targetRole: 'Cloud Solutions Squad',
      headcount: '3-5 Engineers',
      deploymentUrgency: 'Immediate (Within 48h - Bench Pool)',
      workArrangement: 'Remote (Global / Borderless)',
      fullName: 'Marcus Vance',
      corporateEmail: 'm.vance@apex-fintech.com',
      company: 'Apex FinTech Global',
      phone: '+1 415 890 2345',
      jobDescription: '[Scoping Call Request] Domain: Cloud Architecture & Kubernetes. Consultation Slot: 2026-11-20 (Morning).',
    };

    const res = await api
      .post('/api/find-talent/requisition')
      .send(scopingPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/scoping call/i);
    expect(res.body.requisition).toBeDefined();
    expect(res.body.requisition.isScopingCall).toBe(true);
    expect(res.body.requisition.category).toBe('Enterprise Scoping');

    // Query HelpDesk tickets in admin dashboard
    const hdRes = await api
      .get('/api/admin/helpdesk?category=Enterprise Scoping')
      .set('Cookie', adminCookie);

    expect(hdRes.status).toBe(200);
    expect(hdRes.body.success).toBe(true);
    const scopingTicket = hdRes.body.tickets.find(
      (t) => t.email === scopingPayload.corporateEmail
    );
    expect(scopingTicket).toBeDefined();
    expect(scopingTicket.category).toBe('Enterprise Scoping');
    expect(scopingTicket.priority).toBe('Critical');
    expect(scopingTicket.destinationEmail).toBe('hr@thinkwires.com');
    expect(scopingTicket.subject).toContain('[Scoping Call]');
    expect(scopingTicket.message).toContain('2026-11-20');
  });
});
