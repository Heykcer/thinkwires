import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadSeedJson } from '../utils/seedLoader.js';
import mongoose from 'mongoose';

import Employee from '../models/employee.mongo.model.js';
import Candidate from '../models/candidate.mongo.model.js';
import JobApplication from '../models/jobApplication.mongo.model.js';
import Client from '../models/client.mongo.model.js';
import JobRequirement from '../models/job.mongo.model.js';
import Placement from '../models/placement.mongo.model.js';
import Page from '../models/page.mongo.model.js';
import Article from '../models/article.mongo.model.js';
import Media from '../models/media.mongo.model.js';
import Announcement from '../models/announcement.mongo.model.js';
import Activity from '../models/activity.mongo.model.js';
import UserMongo from '../models/user.mongo.model.js';
import aiService from '../services/ai.service.js';
import {
  hashPassword,
  comparePassword,
  generateAdminToken,
  setAdminAuthCookie,
  clearAdminAuthCookie,
  revokeToken,
} from '../utils/auth.util.js';
import {
  generateCsrfToken,
  setCsrfCookie,
  clearCsrfCookie,
  CSRF_COOKIE_NAME,
} from '../middlewares/csrf.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-Memory store initialized from adminSeedData.json for seamless offline demo resilience
let inMemoryData = loadSeedJson('adminSeedData.json', {
  users: [],
  employees: [],
  candidates: [],
  clients: [],
  jobs: [],
  placements: [],
  pages: [],
  articles: [],
  media: [],
  announcements: [],
  activities: [],
});

const isMongoActive = () => mongoose.connection.readyState === 1;

const VALID_ENTITY_TYPES = new Set([
  'Employee',
  'Candidate',
  'Client',
  'Job',
  'Placement',
  'CMS',
  'Security',
  'Security RBAC',
  'System',
]);

// Helper to log activities
const logActivity = async (
  action,
  entityType,
  entityId,
  description,
  user = { name: 'Admin User', role: 'admin' },
  badgeColor = '#008F68'
) => {
  const resolvedEntityType = VALID_ENTITY_TYPES.has(entityType)
    ? entityType
    : entityType && typeof entityType === 'string' && entityType.toLowerCase().includes('security')
      ? 'Security RBAC'
      : 'Employee';

  const newAct = {
    id: `act_${Date.now()}`,
    action,
    entityType: resolvedEntityType,
    entityId: String(entityId),
    description,
    user,
    badgeColor,
    createdAt: new Date().toISOString(),
  };

  inMemoryData.activities.unshift(newAct);
  if (inMemoryData.activities.length > 50) inMemoryData.activities.pop();

  if (isMongoActive()) {
    try {
      await Activity.create({
        action,
        entityType: resolvedEntityType,
        entityId: String(entityId),
        description,
        user,
        badgeColor,
      });
    } catch (err) {
      console.warn('Failed to persist activity to MongoDB:', err.message);
    }
  }
};

// ============================================================================
// 1. DASHBOARD OVERVIEW & ANALYTICS
// ============================================================================
export const getDashboardOverview = async (req, res) => {
  try {
    const period = (req.query.period || 'month').toLowerCase(); // 'month' | 'quarter' | 'year'

    let employees = [];
    let candidates = [];
    let clients = [];
    let jobs = [];
    let placements = [];
    let announcements = [];
    let activities = [];

    if (isMongoActive()) {
      employees = await Employee.find().lean();
      candidates = await Candidate.find().lean();
      clients = await Client.find().lean();
      jobs = await JobRequirement.find().lean();
      placements = await Placement.find().lean();
      announcements = await Announcement.find({ status: 'published' })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();
      activities = await Activity.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      if (clients.length === 0) clients = inMemoryData.clients;
      if (placements.length === 0) placements = inMemoryData.placements;
      if (announcements.length === 0)
        announcements = inMemoryData.announcements.filter(
          (a) => a.status === 'published'
        );
      if (activities.length === 0) activities = inMemoryData.activities;
    } else {
      employees = inMemoryData.employees;
      candidates = inMemoryData.candidates;
      clients = inMemoryData.clients;
      jobs = inMemoryData.jobs;
      placements = inMemoryData.placements;
      announcements = inMemoryData.announcements.filter(
        (a) => a.status === 'published'
      );
      activities = inMemoryData.activities;
    }

    const totalEmployees = employees.length;
    const activePlacements = placements.filter(
      (p) => p.assignmentStatus === 'Active'
    ).length;
    const totalClients = clients.length;
    const openRequirements = jobs.filter(
      (j) => j.status === 'Open' || j.status === 'In Progress'
    ).length;
    const inboundRequisitions = jobs.filter(
      (j) =>
        j.isRequisition === true ||
        j.status === 'Inbound Request' ||
        j.status === 'Inbound Requisition' ||
        j.source === 'Client Inbound Requisition'
    );
    const candidatePipelineCount = candidates.length;

    // Calculate revenue metrics based on period
    const totalBillingMonthly = placements
      .filter((p) => p.assignmentStatus === 'Active')
      .reduce((sum, p) => sum + (Number(p.billingRate) || 5000), 0);

    const periodMultiplier =
      period === 'year' ? 12 : period === 'quarter' ? 3 : 1;
    const totalRevenue = totalBillingMonthly * periodMultiplier;
    const estimatedCost = totalRevenue * 0.68;
    const grossMargin = totalRevenue - estimatedCost;

    // Period chart datasets
    let revenueVsCosts = [];
    let placementsVsTargets = [];
    let performanceTrends = [];

    if (period === 'month') {
      revenueVsCosts = [
        {
          name: 'Week 1',
          revenue: Math.round(totalRevenue * 0.22),
          costs: Math.round(estimatedCost * 0.21),
        },
        {
          name: 'Week 2',
          revenue: Math.round(totalRevenue * 0.24),
          costs: Math.round(estimatedCost * 0.23),
        },
        {
          name: 'Week 3',
          revenue: Math.round(totalRevenue * 0.26),
          costs: Math.round(estimatedCost * 0.25),
        },
        {
          name: 'Week 4',
          revenue: Math.round(totalRevenue * 0.28),
          costs: Math.round(estimatedCost * 0.27),
        },
      ];
      placementsVsTargets = [
        { name: 'Week 1', actual: 3, target: 4 },
        { name: 'Week 2', actual: 5, target: 5 },
        { name: 'Week 3', actual: 4, target: 5 },
        { name: 'Week 4', actual: 6, target: 5 },
      ];
      performanceTrends = [
        { name: 'Week 1', velocity: 84, satisfaction: 96 },
        { name: 'Week 2', velocity: 89, satisfaction: 95 },
        { name: 'Week 3', velocity: 92, satisfaction: 98 },
        { name: 'Week 4', velocity: 96, satisfaction: 99 },
      ];
    } else if (period === 'quarter') {
      revenueVsCosts = [
        {
          name: 'Month 1',
          revenue: Math.round(totalRevenue * 0.31),
          costs: Math.round(estimatedCost * 0.3),
        },
        {
          name: 'Month 2',
          revenue: Math.round(totalRevenue * 0.33),
          costs: Math.round(estimatedCost * 0.33),
        },
        {
          name: 'Month 3',
          revenue: Math.round(totalRevenue * 0.36),
          costs: Math.round(estimatedCost * 0.35),
        },
      ];
      placementsVsTargets = [
        { name: 'Month 1', actual: 12, target: 14 },
        { name: 'Month 2', actual: 16, target: 15 },
        { name: 'Month 3', actual: 18, target: 16 },
      ];
      performanceTrends = [
        { name: 'Month 1', velocity: 86, satisfaction: 95 },
        { name: 'Month 2', velocity: 91, satisfaction: 97 },
        { name: 'Month 3', velocity: 95, satisfaction: 98 },
      ];
    } else {
      revenueVsCosts = [
        {
          name: 'Q1',
          revenue: Math.round(totalRevenue * 0.21),
          costs: Math.round(estimatedCost * 0.22),
        },
        {
          name: 'Q2',
          revenue: Math.round(totalRevenue * 0.24),
          costs: Math.round(estimatedCost * 0.24),
        },
        {
          name: 'Q3',
          revenue: Math.round(totalRevenue * 0.26),
          costs: Math.round(estimatedCost * 0.26),
        },
        {
          name: 'Q4 (Proj)',
          revenue: Math.round(totalRevenue * 0.29),
          costs: Math.round(estimatedCost * 0.28),
        },
      ];
      placementsVsTargets = [
        { name: 'Q1', actual: 38, target: 45 },
        { name: 'Q2', actual: 48, target: 50 },
        { name: 'Q3', actual: 56, target: 55 },
        { name: 'Q4 (Proj)', actual: 64, target: 60 },
      ];
      performanceTrends = [
        { name: 'Q1', velocity: 82, satisfaction: 94 },
        { name: 'Q2', velocity: 88, satisfaction: 96 },
        { name: 'Q3', velocity: 93, satisfaction: 97 },
        { name: 'Q4 (Proj)', velocity: 97, satisfaction: 99 },
      ];
    }

    res.json({
      success: true,
      period,
      databaseMode: isMongoActive()
        ? 'MongoDB Connected'
        : 'In-Memory Resilient Demo Mode',
      isMongoActive: isMongoActive(),
      demoNotice:
        'DEMO DATA — Numbers and metrics represent simulated enterprise operations for demonstration purposes.',
      kpis: {
        totalEmployees,
        activePlacements,
        totalClients,
        openRequirements,
        inboundRequisitionsCount: inboundRequisitions.length,
        pendingRequisitionsSla: inboundRequisitions.filter(
          (r) => r.status === 'Inbound Request' || r.status === 'Inbound Requisition'
        ).length,
        totalRevenue,
        estimatedCost,
        grossMargin,
        candidatePipelineCount,
        recruitmentPerformance: 94.6,
        fulfillmentRate: 88.2,
      },
      charts: {
        revenueVsCosts,
        placementsVsTargets,
        performanceTrends,
      },
      inboundRequisitions: inboundRequisitions.slice(0, 8),
      recentPlacements: placements.slice(0, 5),
      recentActivity: activities.slice(0, 8),
      announcements: announcements.slice(0, 3),
    });
  } catch (err) {
    console.error('Error fetching dashboard overview:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============================================================================
// 2. EMPLOYEES CRUD
// ============================================================================
export const getEmployees = async (req, res) => {
  try {
    const { search, availability, status, page = 1, limit = 20 } = req.query;

    let items = [];
    if (isMongoActive()) {
      let query = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { designation: { $regex: search, $options: 'i' } },
          { technicalSkills: { $in: [new RegExp(search, 'i')] } },
        ];
      }
      if (availability && availability !== 'All')
        query.availability = availability;
      if (status && status !== 'All') query.deploymentStatus = status;

      items = await Employee.find(query).sort({ createdAt: -1 }).lean();
    } else {
      items = (inMemoryData.employees || []).filter((emp) => {
        let match = true;
        if (search) {
          const s = search.toLowerCase();
          match =
            emp.name?.toLowerCase().includes(s) ||
            emp.email?.toLowerCase().includes(s) ||
            emp.designation?.toLowerCase().includes(s) ||
            emp.role?.toLowerCase().includes(s) ||
            (emp.technicalSkills &&
              emp.technicalSkills.some((sk) => sk.toLowerCase().includes(s)));
        }
        if (match && availability && availability !== 'All') {
          match = emp.availability === availability;
        }
        if (match && status && status !== 'All') {
          match = emp.deploymentStatus === status;
        }
        return match;
      });
    }

    const total = items.length;
    const startIndex = (page - 1) * limit;
    const paginated = items.slice(startIndex, startIndex + Number(limit));

    res.json({
      success: true,
      employees: paginated,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      designation,
      role = 'employee',
      portalAccess = false,
      technicalSkills,
      experience,
      availability,
      deploymentStatus,
      billingRate,
      location,
      notes,
    } = req.body;

    if (!name || !email || !designation) {
      return res
        .status(400)
        .json({
          success: false,
          error: 'Name, email, and designation are required.',
        });
    }

    const isPortalRole = role && role !== 'employee';
    if (isPortalRole && req.user?.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error:
          'Access denied: Only a Superadmin can add or assign roles to System Members.',
      });
    }

    const skillsArray = Array.isArray(technicalSkills)
      ? technicalSkills
      : typeof technicalSkills === 'string'
        ? technicalSkills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    const hasPortalAccess = Boolean(
      portalAccess || (role && role !== 'employee')
    );

    const newEmp = {
      id: `emp_${Date.now()}`,
      name,
      email: email.toLowerCase().trim(),
      phone: phone || '',
      designation,
      role: role || 'employee',
      portalAccess: hasPortalAccess,
      technicalSkills: skillsArray,
      experience: Number(experience) || 0,
      availability: availability || 'Immediate',
      deploymentStatus: deploymentStatus || 'Available',
      billingRate: Number(billingRate) || 0,
      location: location || 'Remote',
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };

    inMemoryData.employees = inMemoryData.employees || [];
    inMemoryData.employees.unshift(newEmp);

    if (isMongoActive()) {
      await Employee.create(newEmp);

      // If assigned an administrative portal role, provision a User account in MongoDB
      if (
        hasPortalAccess &&
        ['superadmin', 'admin', 'cms_admin'].includes(role)
      ) {
        const rawPassword =
          req.body.password && req.body.password.length >= 6
            ? req.body.password
            : 'demo_password_secure';
        const hashedPassword = await hashPassword(rawPassword);
        await UserMongo.findOneAndUpdate(
          { email: newEmp.email },
          {
            name: newEmp.name,
            email: newEmp.email,
            role: newEmp.role,
            designation: newEmp.designation,
            phone: newEmp.phone,
            password: hashedPassword,
            isActive: true,
          },
          { upsert: true, new: true }
        );
      }
    }

    await logActivity(
      'Created Employee / Team Member',
      'Employee',
      newEmp.id,
      `Superadmin onboarded ${name} (${designation}) with role ${role.toUpperCase()}.`,
      req.user,
      '#10B981'
    );

    res
      .status(201)
      .json({
        success: true,
        message: 'Employee added successfully',
        employee: newEmp,
      });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (
      updates.role &&
      updates.role !== 'employee' &&
      req.user?.role !== 'superadmin'
    ) {
      return res.status(403).json({
        success: false,
        error:
          'Access denied: Only a Superadmin can edit System Member roles or credentials.',
      });
    }

    if (
      updates.technicalSkills &&
      typeof updates.technicalSkills === 'string'
    ) {
      updates.technicalSkills = updates.technicalSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (updates.email) {
      updates.email = updates.email.toLowerCase().trim();
    }
    if (updates.role && updates.role !== 'employee') {
      updates.portalAccess = true;
    }

    let found = false;
    inMemoryData.employees = inMemoryData.employees || [];
    const idx = inMemoryData.employees.findIndex(
      (e) => e.id === id || String(e._id) === id
    );
    if (idx !== -1) {
      inMemoryData.employees[idx] = {
        ...inMemoryData.employees[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      found = true;
    }

    if (isMongoActive()) {
      const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
      const updated = await Employee.findOneAndUpdate(query, updates, {
        new: true,
      });

      if (
        updated &&
        updated.email &&
        (updates.role || updates.portalAccess !== undefined || updates.password)
      ) {
        if (['superadmin', 'admin', 'cms_admin'].includes(updated.role)) {
          const userPayload = {
            name: updated.name,
            email: updated.email,
            role: updated.role,
            designation: updated.designation,
            phone: updated.phone || '',
            isActive: true,
          };
          if (updates.password && updates.password.trim().length >= 6) {
            userPayload.password = await hashPassword(updates.password.trim());
          }
          await UserMongo.findOneAndUpdate(
            { email: updated.email },
            userPayload,
            { upsert: true }
          );
        }
      }
    }

    await logActivity(
      'Updated Employee',
      'Employee',
      id,
      `Updated record for ${updates.name || 'employee'}.`,
      req.user
    );

    res.json({
      success: true,
      message: 'Employee updated successfully',
      employee: inMemoryData.employees[idx],
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    inMemoryData.employees = (inMemoryData.employees || []).filter(
      (e) => e.id !== id && String(e._id) !== id
    );

    if (isMongoActive()) {
      const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
      const emp = await Employee.findOne(query);
      if (emp && emp.email) {
        await UserMongo.deleteOne({ email: emp.email.toLowerCase() });
      }
      await Employee.findOneAndDelete(query);
    }

    await logActivity(
      'Deleted Employee',
      'Employee',
      id,
      `Removed employee ID ${id} from directory.`,
      req.user,
      '#DC2626'
    );

    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============================================================================
// 3. CANDIDATES & RECRUITMENT PIPELINE
// ============================================================================
export const getCandidates = async (req, res) => {
  try {
    const { search, status } = req.query;

    let items = [];
    if (isMongoActive()) {
      // 1. Fetch all job applications with their candidate reference
      const applications = await JobApplication.find()
        .populate('candidate')
        .sort({ createdAt: -1 })
        .lean();

      // 2. Fetch all registered candidates
      const allCandidates = await Candidate.find()
        .sort({ createdAt: -1 })
        .lean();

      // Track candidate IDs that have applications
      const candidatesWithApps = new Set();

      // Transform applications into ATS candidate pipeline items
      const appItems = applications.map((app) => {
        const cand =
          app.candidate && typeof app.candidate === 'object'
            ? app.candidate
            : null;
        if (cand && cand._id) {
          candidatesWithApps.add(String(cand._id));
        } else if (app.candidate) {
          candidatesWithApps.add(String(app.candidate));
        }

        const candidateName =
          (
            app.candidateName || `${app.firstName || ''} ${app.lastName || ''}`
          ).trim() ||
          (cand && cand.name) ||
          'Applicant Candidate';

        const email = app.email || (cand && cand.email) || '';
        const phone = app.mobileNumber || (cand && cand.phone) || '';
        const currentRole =
          app.currentEmployer ||
          (cand && cand.currentRole) ||
          'Software Engineer';
        const jobTitle = app.jobTitle || 'General Technical Position';
        const skills =
          app.skills && app.skills.length > 0
            ? app.skills
            : cand && cand.technicalSkills
              ? cand.technicalSkills
              : [];
        const experience = app.totalExperienceYears
          ? Number(app.totalExperienceYears) || app.totalExperienceYears
          : cand && cand.experience
            ? cand.experience
            : 0;
        const expectedSalary =
          app.expectedCTC || (cand && cand.expectedSalary) || 'Market Standard';
        const pipelineStatus = app.status || (cand && cand.status) || 'Applied';

        return {
          id: String(app._id),
          _id: app._id,
          applicationId: app._id,
          candidateId: cand ? cand._id : app.candidate,
          name: candidateName,
          email,
          phone,
          currentRole,
          jobTitle,
          department: app.department || 'Engineering',
          location:
            app.location ||
            (app.city && app.state
              ? `${app.city}, ${app.state}`
              : (cand && cand.location) || 'Remote'),
          technicalSkills: skills,
          experience,
          expectedSalary,
          status: pipelineStatus,
          assessmentStatus: app.assessmentStatus || 'Not Started',
          assessmentScore:
            app.assessmentScore !== undefined && app.assessmentScore !== null
              ? app.assessmentScore
              : cand && cand.assessmentScore,
          screeningPassed: app.screeningPassed ?? false,
          fitScore: app.fitScore || (cand && cand.fitScore) || 85,
          fitBadge: app.fitBadge || 'Top Match',
          avatarUrl: app.avatarUrl || (cand && cand.avatarUrl) || '',
          avatarType: (cand && cand.avatarType) || 'initials',
          anonymousCode: app.anonymousCode || (cand && cand.benchAvatarCode) || 'TW-ENG-01',
          evaluationReport: app.evaluationReport || null,
          resumeUrl: app.resumeUrl || (cand && cand.resumeUrl) || '',
          resumeOriginalName: app.resumeOriginalName || '',
          notes: app.candidateNote || app.notes || (cand && cand.bio) || '',
          createdAt: app.createdAt || new Date().toISOString(),
          updatedAt: app.updatedAt || app.createdAt,
        };
      });

      // 3. Include registered candidates who have not yet submitted a specific job application
      const registeredOnly = allCandidates
        .filter((cand) => !candidatesWithApps.has(String(cand._id)))
        .map((cand) => ({
          id: String(cand._id),
          _id: cand._id,
          candidateId: cand._id,
          name: cand.name,
          email: cand.email,
          phone: cand.phone || '',
          currentRole: cand.currentRole || 'Software Engineer',
          jobTitle: cand.jobTitle || 'General Talent Pool',
          department: 'Engineering',
          location: cand.location || 'Remote',
          technicalSkills: cand.technicalSkills || [],
          experience: cand.experience || 0,
          expectedSalary: cand.expectedSalary || 'Market Standard',
          status: cand.status || 'Applied',
          assessmentStatus: cand.assessmentStatus || 'Not Started',
          assessmentScore: cand.assessmentScore || null,
          fitScore: cand.fitScore || 85,
          fitBadge: 'Top Match',
          avatarUrl: cand.avatarUrl || '',
          avatarType: cand.avatarType || 'initials',
          anonymousCode: cand.benchAvatarCode || 'TW-CAND-01',
          evaluationReport: null,
          resumeUrl: cand.resumeUrl || '',
          notes: cand.notes || cand.bio || '',
          createdAt: cand.createdAt || new Date().toISOString(),
          updatedAt: cand.updatedAt || cand.createdAt,
        }));

      items = [...appItems, ...registeredOnly];

      // In-memory sync for offline fallback
      if (inMemoryData.candidates.length === 0) {
        inMemoryData.candidates = items;
      }
    } else {
      items = inMemoryData.candidates;
    }

    // Filter by search query if provided
    if (search && search.trim()) {
      const s = search.trim().toLowerCase();
      items = items.filter((cand) => {
        const nameMatch = (cand.name || '').toLowerCase().includes(s);
        const emailMatch = (cand.email || '').toLowerCase().includes(s);
        const roleMatch = (cand.currentRole || '').toLowerCase().includes(s);
        const jobMatch = (cand.jobTitle || '').toLowerCase().includes(s);
        const skillsMatch =
          cand.technicalSkills &&
          cand.technicalSkills.some((sk) =>
            (sk || '').toLowerCase().includes(s)
          );
        return nameMatch || emailMatch || roleMatch || jobMatch || skillsMatch;
      });
    }

    // Filter by pipeline stage if specified
    if (status && status !== 'All') {
      items = items.filter((cand) => cand.status === status);
    }

    res.json({ success: true, candidates: items });
  } catch (err) {
    console.error('getCandidates error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Retrieve Full Unredacted Candidate Evaluation Dossier for Admins
 * GET /api/admin/candidates/:id/dossier
 */
export const getCandidateDossier = async (req, res) => {
  try {
    const { id } = req.params;

    let candidate = null;
    let application = null;

    if (isMongoActive()) {
      application = await JobApplication.findById(id).populate('candidate').lean();
      if (!application) {
        candidate = await Candidate.findById(id).lean();
        if (candidate) {
          application = await JobApplication.findOne({ candidate: id }).sort({ createdAt: -1 }).lean();
        }
      } else {
        candidate = application.candidate;
      }
    } else {
      application = inMemoryData.candidates.find(
        (c) => String(c.id) === String(id) || String(c._id) === String(id)
      );
    }

    if (!application && !candidate) {
      return res.status(404).json({ success: false, error: 'Candidate or Application record not found.' });
    }

    let dossier = application?.evaluationReport;
    if (!dossier || !dossier.overallMatchScore) {
      const candName = (application?.candidateName || candidate?.name || 'Applicant Candidate').trim();
      const skills = (application?.skills && application.skills.length > 0)
        ? application.skills
        : (candidate?.technicalSkills || []);
      const resumeText = application?.candidateNote || application?.coverLetter || candidate?.bio || '';
      const exp = application?.totalExperienceYears || candidate?.experience || 4;
      const targetRole = application?.jobTitle || candidate?.currentRole || 'Software Professional';
      const dept = application?.department || 'Engineering';

      dossier = await aiService.evaluateCandidate(
        {
          candidateName: candName,
          skills,
          resumeText,
          experience: exp,
          noticePeriod: application?.noticePeriod || candidate?.noticePeriod || '30 Days',
          expectedSalary: application?.expectedCTC || candidate?.expectedSalary || 'Market Standard',
        },
        {
          jobTitle: targetRole,
          department: dept,
          company: 'Thinkwires Client Mandate',
          requiredSkills: skills.length > 0 ? skills : ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
          experienceRequired: Math.max(3, Number(exp) - 1),
        }
      );

      if (isMongoActive() && application?._id) {
        await JobApplication.findByIdAndUpdate(application._id, {
          evaluationReport: dossier,
          fitScore: dossier.overallMatchScore,
        });
      }
    }

    const candidateSummary = {
      id: String(application?._id || candidate?._id || id),
      name: (application?.candidateName || candidate?.name || 'Applicant Candidate').trim(),
      email: application?.email || candidate?.email || '',
      phone: application?.mobileNumber || candidate?.phone || '',
      avatarUrl: application?.avatarUrl || candidate?.avatarUrl || '',
      avatarType: candidate?.avatarType || 'initials',
      anonymousCode: application?.anonymousCode || candidate?.benchAvatarCode || 'TW-DE-01',
      jobTitle: application?.jobTitle || candidate?.currentRole || 'Software Professional',
      department: application?.department || 'Engineering',
      currentEmployer: application?.currentEmployer || 'Private Global Enterprise',
      expectedSalary: application?.expectedCTC || candidate?.expectedSalary || 'Market Standard',
      noticePeriod: application?.noticePeriod || candidate?.noticePeriod || '30 Days',
      resumeUrl: application?.resumeUrl || candidate?.resumeUrl || '',
    };

    return res.json({
      success: true,
      candidate: candidateSummary,
      dossier,
    });
  } catch (err) {
    console.error('getCandidateDossier error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Re-Evaluate Candidate Dossier Incorporating Recruiter Notes
 * POST /api/admin/candidates/:id/re-evaluate
 */
export const reEvaluateCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const { recruiterNotes } = req.body;

    let application = null;
    let candidate = null;

    if (isMongoActive()) {
      application = await JobApplication.findById(id).populate('candidate');
      if (!application) {
        candidate = await Candidate.findById(id);
        if (candidate) {
          application = await JobApplication.findOne({ candidate: id }).sort({ createdAt: -1 });
        }
      } else {
        candidate = application.candidate;
      }
    }

    const candName = (application?.candidateName || candidate?.name || 'Applicant Candidate').trim();
    const skills = (application?.skills && application.skills.length > 0)
      ? application.skills
      : (candidate?.technicalSkills || []);
    const resumeText = `${application?.candidateNote || application?.coverLetter || candidate?.bio || ''} ${recruiterNotes || ''}`;
    const exp = application?.totalExperienceYears || candidate?.experience || 4;
    const targetRole = application?.jobTitle || candidate?.currentRole || 'Software Professional';
    const dept = application?.department || 'Engineering';

    const updatedDossier = await aiService.evaluateCandidate(
      {
        candidateName: candName,
        skills,
        resumeText,
        experience: exp,
        noticePeriod: application?.noticePeriod || candidate?.noticePeriod || '30 Days',
        expectedSalary: application?.expectedCTC || candidate?.expectedSalary || 'Market Standard',
      },
      {
        jobTitle: targetRole,
        department: dept,
        company: 'Thinkwires Client Mandate',
        requiredSkills: skills.length > 0 ? skills : ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
        experienceRequired: Math.max(3, Number(exp) - 1),
      },
      recruiterNotes || ''
    );

    if (isMongoActive() && application?._id) {
      await JobApplication.findByIdAndUpdate(
        application._id,
        {
          $set: {
            evaluationReport: updatedDossier,
            fitScore: updatedDossier.overallMatchScore,
          },
        },
        { runValidators: false, new: true }
      );
      if (candidate?._id) {
        await Candidate.findByIdAndUpdate(
          candidate._id,
          { $set: { fitScore: updatedDossier.overallMatchScore } },
          { runValidators: false }
        );
      }
    } else {
      const inMemTalent = inMemoryData.candidates?.find(
        (c) => c.id === id || c.code === id
      );
      if (inMemTalent) {
        inMemTalent.dossier = updatedDossier;
        inMemTalent.fitScore = updatedDossier.overallMatchScore;
      }
    }

    const candidateSummary = {
      id: String(application?._id || candidate?._id || id),
      name: candName,
      email: application?.email || candidate?.email || '',
      phone: application?.mobileNumber || candidate?.phone || '',
      avatarUrl: application?.avatarUrl || candidate?.avatarUrl || '',
      avatarType: candidate?.avatarType || 'initials',
      anonymousCode: application?.anonymousCode || candidate?.benchAvatarCode || 'TW-CAND',
      jobTitle: targetRole,
      department: dept,
      currentEmployer: application?.currentEmployer || 'Private Global Enterprise',
      expectedSalary: application?.expectedCTC || candidate?.expectedSalary || 'Market Standard',
      noticePeriod: application?.noticePeriod || candidate?.noticePeriod || '30 Days',
      resumeUrl: application?.resumeUrl || candidate?.resumeUrl || '',
    };

    return res.json({
      success: true,
      message: 'Candidate dossier re-evaluated successfully incorporating recruiter notes.',
      candidate: candidateSummary,
      dossier: updatedDossier,
    });
  } catch (err) {
    console.error('reEvaluateCandidate error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createCandidate = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      currentRole,
      technicalSkills,
      experience,
      expectedSalary,
      status,
      jobTitle,
      resumeUrl,
      notes,
    } = req.body;

    if (!name || !email || !phone) {
      return res
        .status(400)
        .json({
          success: false,
          error: 'Candidate name, email, and phone are required.',
        });
    }

    const skillsArray = Array.isArray(technicalSkills)
      ? technicalSkills
      : typeof technicalSkills === 'string'
        ? technicalSkills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    const newCand = {
      id: `cand_${Date.now()}`,
      name,
      email,
      phone,
      currentRole: currentRole || 'Software Engineer',
      technicalSkills: skillsArray,
      experience: Number(experience) || 0,
      expectedSalary: expectedSalary || 'Market Standard',
      status: status || 'Applied',
      jobTitle: jobTitle || 'General Technical Talent',
      resumeUrl: resumeUrl || '',
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };

    inMemoryData.candidates.unshift(newCand);

    if (isMongoActive()) {
      const createdCandidate = await Candidate.create(newCand);
      if (jobTitle) {
        await JobApplication.create({
          candidate: createdCandidate._id,
          jobId: 'direct-admin-intake',
          jobTitle,
          candidateName: name,
          email,
          mobileNumber: phone,
          lastName: name.split(' ').slice(1).join(' ') || name,
          firstName: name.split(' ')[0],
          status: status || 'Applied',
          skills: skillsArray,
          totalExperienceYears: String(experience || 0),
          expectedCTC: expectedSalary || 'Market Standard',
          resumeUrl: resumeUrl || '',
          candidateNote: notes || '',
        });
      }
    }

    await logActivity(
      'New Candidate Application',
      'Candidate',
      newCand.id,
      `Candidate ${name} applied for ${newCand.jobTitle}.`,
      req.user,
      '#3478D4'
    );

    res
      .status(201)
      .json({
        success: true,
        message: 'Candidate added successfully',
        candidate: newCand,
      });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateCandidateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStages = [
      'Applied',
      'Screening',
      'Interview',
      'Offered',
      'Hired',
      'Rejected',
    ];
    if (!validStages.includes(status)) {
      return res
        .status(400)
        .json({
          success: false,
          error: `Invalid status. Must be one of: ${validStages.join(', ')}`,
        });
    }

    const idx = inMemoryData.candidates.findIndex(
      (c) => c.id === id || String(c._id) === id
    );
    let candidateName = 'Candidate';
    if (idx !== -1) {
      candidateName = inMemoryData.candidates[idx].name;
      inMemoryData.candidates[idx].status = status;
      inMemoryData.candidates[idx].updatedAt = new Date().toISOString();
    }

    if (isMongoActive()) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        // Try updating JobApplication first
        const app = await JobApplication.findByIdAndUpdate(
          id,
          { status },
          { new: true }
        );
        if (app) {
          candidateName =
            app.candidateName ||
            `${app.firstName || ''} ${app.lastName || ''}`.trim() ||
            candidateName;
          if (app.candidate) {
            await Candidate.findByIdAndUpdate(app.candidate, { status });
          }
        } else {
          // If not an application, update Candidate and any linked applications
          const cand = await Candidate.findByIdAndUpdate(
            id,
            { status },
            { new: true }
          );
          if (cand) {
            candidateName = cand.name || candidateName;
            await JobApplication.updateMany(
              { candidate: cand._id },
              { status }
            );
          }
        }
      } else {
        await Candidate.findOneAndUpdate({ id }, { status });
      }
    }

    await logActivity(
      'Candidate Stage Updated',
      'Candidate',
      id,
      `${candidateName} moved to stage '${status}'.`,
      req.user,
      '#3478D4'
    );

    res.json({
      success: true,
      message: `Candidate stage updated to ${status}`,
      status,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (
      updates.technicalSkills &&
      typeof updates.technicalSkills === 'string'
    ) {
      updates.technicalSkills = updates.technicalSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const idx = inMemoryData.candidates.findIndex(
      (c) => c.id === id || String(c._id) === id
    );
    if (idx !== -1) {
      inMemoryData.candidates[idx] = {
        ...inMemoryData.candidates[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    }

    if (isMongoActive()) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const app = await JobApplication.findByIdAndUpdate(id, updates, {
          new: true,
        });
        if (app && app.candidate) {
          await Candidate.findByIdAndUpdate(app.candidate, updates, {
            new: true,
          });
        } else {
          await Candidate.findByIdAndUpdate(id, updates, { new: true });
        }
      } else {
        await Candidate.findOneAndUpdate({ id }, updates, { new: true });
      }
    }

    res.json({
      success: true,
      message: 'Candidate updated successfully',
      candidate: inMemoryData.candidates[idx],
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;

    inMemoryData.candidates = inMemoryData.candidates.filter(
      (c) => c.id !== id && String(c._id) !== id
    );

    if (isMongoActive()) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const app = await JobApplication.findByIdAndDelete(id);
        if (!app) {
          await Candidate.findByIdAndDelete(id);
        }
      } else {
        await Candidate.findOneAndDelete({ id });
      }
    }

    await logActivity(
      'Candidate Deleted',
      'Candidate',
      id,
      `Candidate ID ${id} removed from ATS pipeline.`,
      req.user,
      '#DC2626'
    );

    res.json({ success: true, message: 'Candidate deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============================================================================
// 4. CLIENTS CRUD
// ============================================================================
export const getClients = async (req, res) => {
  try {
    const { search, industry, status } = req.query;

    let items = [];
    if (isMongoActive()) {
      let query = {};
      if (search) {
        query.$or = [
          { companyName: { $regex: search, $options: 'i' } },
          { contactPerson: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }
      if (industry && industry !== 'All') query.industry = industry;
      if (status && status !== 'All') query.status = status;

      items = await Client.find(query).sort({ createdAt: -1 }).lean();
      if (
        items.length === 0 &&
        !search &&
        (!industry || industry === 'All') &&
        (!status || status === 'All')
      ) {
        items = inMemoryData.clients;
      }
    } else {
      items = inMemoryData.clients.filter((cli) => {
        let match = true;
        if (search) {
          const s = search.toLowerCase();
          match =
            cli.companyName.toLowerCase().includes(s) ||
            cli.contactPerson.toLowerCase().includes(s) ||
            cli.email.toLowerCase().includes(s);
        }
        if (match && industry && industry !== 'All')
          match = cli.industry === industry;
        if (match && status && status !== 'All') match = cli.status === status;
        return match;
      });
    }

    res.json({ success: true, clients: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createClient = async (req, res) => {
  try {
    const {
      companyName,
      contactPerson,
      email,
      phone,
      industry,
      status,
      location,
      contractType,
    } = req.body;

    if (!companyName || !contactPerson || !email) {
      return res
        .status(400)
        .json({
          success: false,
          error: 'Company name, contact person, and email are required.',
        });
    }

    const newCli = {
      id: `cli_${Date.now()}`,
      companyName,
      contactPerson,
      email,
      phone: phone || '+1 (800) 555-0199',
      industry: industry || 'Technology & Software',
      status: status || 'Active',
      location: location || 'Remote / India',
      contractType: contractType || 'Staff Augmentation',
      activeRequirementsCount: 0,
      createdAt: new Date().toISOString(),
    };

    inMemoryData.clients.unshift(newCli);

    if (isMongoActive()) {
      await Client.create(newCli);
    }

    await logActivity(
      'Client Account Added',
      'Client',
      newCli.id,
      `Created corporate profile for ${companyName}.`,
      req.user
    );

    res
      .status(201)
      .json({
        success: true,
        message: 'Client created successfully',
        client: newCli,
      });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const idx = inMemoryData.clients.findIndex(
      (c) => c.id === id || String(c._id) === id
    );
    if (idx !== -1) {
      inMemoryData.clients[idx] = {
        ...inMemoryData.clients[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    }

    if (isMongoActive()) {
      const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
      await Client.findOneAndUpdate(query, updates, { new: true });
    }

    await logActivity(
      'Client Updated',
      'Client',
      id,
      `Updated information for ${updates.companyName || 'client'}.`,
      req.user
    );

    res.json({
      success: true,
      message: 'Client updated successfully',
      client: inMemoryData.clients[idx],
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;

    inMemoryData.clients = inMemoryData.clients.filter(
      (c) => c.id !== id && String(c._id) !== id
    );

    if (isMongoActive()) {
      const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
      await Client.findOneAndDelete(query);
    }

    await logActivity(
      'Client Removed',
      'Client',
      id,
      `Archived client account ID ${id}.`,
      req.user,
      '#DC2626'
    );

    res.json({ success: true, message: 'Client deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============================================================================
// 5. JOB REQUIREMENTS CRUD
// ============================================================================
export const getJobs = async (req, res) => {
  try {
    const { search, priority, status, industry, jobMode, type, category } =
      req.query;

    let items = [];
    if (isMongoActive()) {
      let query = {};
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { client: { $regex: search, $options: 'i' } },
          { contactPerson: { $regex: search, $options: 'i' } },
          { contactEmail: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { requirements: { $regex: search, $options: 'i' } },
          { requiredSkills: { $in: [new RegExp(search, 'i')] } },
          { industry: { $regex: search, $options: 'i' } },
          { jobMode: { $regex: search, $options: 'i' } },
          { workMode: { $regex: search, $options: 'i' } },
          { officeLocation: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } },
        ];
      }

      const reqCriteria = [
        { isRequisition: true },
        { category: 'Client Requisition' },
        { source: 'Client Inbound Requisition' },
        { status: 'Inbound Request' },
        { status: 'Inbound Requisition' },
        { jobId: { $regex: '^REQ-', $options: 'i' } },
      ];

      if (type === 'requisitions') {
        if (status && status !== 'All') {
          if (status === 'Inbound Request' || status === 'inbound') {
            query.status = { $in: ['Inbound Request', 'Inbound Requisition'] };
          } else if (status === 'Approved') {
            query.status = { $in: ['Approved', 'Open', 'In Progress'] };
          } else {
            query.status = status;
          }
        }
        query.$or = reqCriteria;
      } else if (type === 'jobs') {
        if (!status || status === 'All') {
          query.status = { $nin: ['Inbound Request', 'Inbound Requisition'] };
        } else if (status === 'Open') {
          query.status = { $in: ['Open', 'Approved'] };
        } else {
          query.status = status;
        }
      } else {
        // Standard legacy / general query
        if (status && status !== 'All') {
          if (status === 'Inbound Request' || status === 'inbound') {
            query.$or = reqCriteria;
          } else if (status === 'Open') {
            query.status = { $in: ['Open', 'Approved'] };
          } else {
            query.status = status;
          }
        }
      }

      if (category && category !== 'All') {
        if (category === 'Client Requisition') {
          query.$or = reqCriteria;
        } else if (category === 'Internal') {
          query.isRequisition = { $ne: true };
          query.category = { $ne: 'Client Requisition' };
        }
      }

      if (priority && priority !== 'All') query.priority = priority;
      if (industry && industry !== 'All') query.industry = industry;
      if (jobMode && jobMode !== 'All') query.jobMode = jobMode;

      items = await JobRequirement.find(query).sort({ createdAt: -1 }).lean();
    } else {
      items = inMemoryData.jobs.filter((j) => {
        let match = true;
        if (search) {
          const s = search.toLowerCase();
          match =
            j.title?.toLowerCase().includes(s) ||
            j.client?.toLowerCase().includes(s) ||
            (j.contactPerson && j.contactPerson.toLowerCase().includes(s)) ||
            (j.contactEmail && j.contactEmail.toLowerCase().includes(s)) ||
            (j.jobId && String(j.jobId).toLowerCase().includes(s)) ||
            (j.description && j.description.toLowerCase().includes(s)) ||
            (j.requirements && j.requirements.toLowerCase().includes(s)) ||
            (j.industry && j.industry.toLowerCase().includes(s)) ||
            (j.jobMode && j.jobMode.toLowerCase().includes(s)) ||
            (j.workMode && j.workMode.toLowerCase().includes(s)) ||
            (j.location && j.location.toLowerCase().includes(s)) ||
            (j.requiredSkills &&
              j.requiredSkills.some((sk) => sk.toLowerCase().includes(s)));
        }

        const isReqRecord =
          j.isRequisition === true ||
          j.category === 'Client Requisition' ||
          j.source === 'Client Inbound Requisition' ||
          j.status === 'Inbound Request' ||
          j.status === 'Inbound Requisition' ||
          (j.jobId && String(j.jobId).startsWith('REQ-'));

        if (match && type === 'requisitions') {
          match = isReqRecord;
          if (match && status && status !== 'All') {
            if (status === 'Inbound Request' || status === 'inbound') {
              match =
                j.status === 'Inbound Request' ||
                j.status === 'Inbound Requisition';
            } else if (status === 'Approved') {
              match =
                j.status === 'Approved' ||
                j.status === 'Open' ||
                j.status === 'In Progress';
            } else {
              match = j.status === status;
            }
          }
        } else if (match && type === 'jobs') {
          if (!status || status === 'All') {
            match =
              j.status !== 'Inbound Request' &&
              j.status !== 'Inbound Requisition';
          } else if (status === 'Open') {
            match = j.status === 'Open' || j.status === 'Approved';
          } else {
            match = j.status === status;
          }
        } else if (match && status && status !== 'All') {
          if (status === 'Inbound Request' || status === 'inbound') {
            match = isReqRecord;
          } else if (status === 'Open') {
            match = j.status === 'Open' || j.status === 'Approved';
          } else {
            match = j.status === status;
          }
        }

        if (match && category && category !== 'All') {
          if (category === 'Client Requisition') {
            match = isReqRecord;
          } else if (category === 'Internal') {
            match = !isReqRecord;
          }
        }

        if (match && priority && priority !== 'All')
          match = j.priority === priority;
        if (match && industry && industry !== 'All')
          match = j.industry === industry;
        if (match && jobMode && jobMode !== 'All')
          match = j.jobMode === jobMode;
        return match;
      });
    }

    res.json({ success: true, jobs: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createJob = async (req, res) => {
  try {
    const {
      title,
      client,
      industry,
      jobMode,
      workMode,
      officeLocation,
      location,
      noticePeriod,
      noticePeriodOther,
      requiredSkills,
      experienceRequired,
      openingsCount,
      priority,
      status,
      budget,
      description,
      requirements,
      isRequisition,
      type,
      contactPerson,
      contactEmail,
      contactPhone,
      engagementModel,
      seniority,
      deploymentUrgency,
      budgetEnvelope,
    } = req.body;

    if (!title || !client) {
      return res.status(400).json({
        success: false,
        error: 'Job title and client name are required.',
      });
    }

    const skillsArray = Array.isArray(requiredSkills)
      ? requiredSkills
      : typeof requiredSkills === 'string'
        ? requiredSkills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    const finalLocation =
      workMode === 'Work From Office' && officeLocation
        ? officeLocation
        : location ||
          (workMode === 'Work From Home' ? 'Remote (India/US)' : 'Hybrid');

    const isClientReq =
      Boolean(isRequisition) ||
      type === 'requisition' ||
      status === 'Inbound Request' ||
      status === 'Inbound Requisition';

    const newJob = {
      id: isClientReq ? `job_req_${Date.now()}` : `job_${Date.now()}`,
      jobId: isClientReq
        ? req.body.jobId || `REQ-${Date.now().toString().slice(-6)}`
        : `JOB-${Date.now().toString().slice(-5)}`,
      title,
      client,
      industry: industry || 'Information Technology & Cloud',
      jobMode: jobMode || 'Permanent',
      workMode: workMode || 'Work From Home',
      officeLocation: officeLocation || '',
      location: finalLocation,
      noticePeriod: noticePeriod || 'Immediate',
      noticePeriodOther: noticePeriodOther || '',
      requiredSkills: skillsArray,
      skills: skillsArray,
      experienceRequired: Number(experienceRequired) || 3,
      openingsCount: Number(openingsCount) || 1,
      fulfilledCount: 0,
      priority: priority || 'Medium',
      status: status || (isClientReq ? 'Inbound Request' : 'Open'),
      budget: budget || 'Competitive Market Rate',
      description: description || '',
      requirements: requirements || '',
      isRequisition: isClientReq,
      category: isClientReq ? 'Client Requisition' : 'Internal Opening',
      source: isClientReq ? 'Client Mandate' : 'Internal ATS',
      contactPerson: contactPerson || '',
      contactEmail: contactEmail || '',
      contactPhone: contactPhone || '',
      engagementModel: engagementModel || 'Staff Augmentation',
      seniority: seniority || 'Senior',
      deploymentUrgency: deploymentUrgency || 'immediate',
      budgetEnvelope: budgetEnvelope || '',
      createdAt: new Date().toISOString(),
    };

    inMemoryData.jobs.unshift(newJob);

    if (isMongoActive()) {
      const doc = await JobRequirement.create(newJob);
      newJob._id = doc._id;
      newJob.id = String(doc._id);
    }

    // Auto-register client if new
    if (client) {
      const existingClient = (inMemoryData.clients || []).find(
        (c) => c.companyName?.toLowerCase() === client.toLowerCase()
      );
      if (!existingClient) {
        const newClientRecord = {
          id: `cli_${Date.now()}`,
          companyName: client,
          industry: newJob.industry,
          tier: 'Enterprise Partner',
          contactPerson: contactPerson || 'Hiring Lead',
          email: contactEmail || '',
          phone: contactPhone || '',
          activeDeployments: 0,
          status: 'Active',
        };
        inMemoryData.clients = inMemoryData.clients || [];
        inMemoryData.clients.unshift(newClientRecord);
      }
    }

    await logActivity(
      isClientReq
        ? 'Staffing Requisition Created'
        : 'Job Requirement Posted',
      'Job',
      newJob.id,
      `${isClientReq ? 'Client Requisition' : 'Job requirement'} created: ${title} for ${client} (${newJob.industry}).`,
      req.user,
      isClientReq ? '#7C3AED' : '#D97706'
    );

    res
      .status(201)
      .json({
        success: true,
        message: 'Job requirement posted successfully',
        job: newJob,
      });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.requiredSkills && typeof updates.requiredSkills === 'string') {
      updates.requiredSkills = updates.requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (updates.workMode === 'Work From Office' && updates.officeLocation) {
      updates.location = updates.officeLocation;
    }

    inMemoryData.jobs = inMemoryData.jobs || [];
    const idx = inMemoryData.jobs.findIndex(
      (j) => j.id === id || String(j._id) === id || j.jobId === id
    );
    if (idx !== -1) {
      const prevStatus = inMemoryData.jobs[idx].status;
      inMemoryData.jobs[idx] = {
        ...inMemoryData.jobs[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      if (
        (prevStatus === 'Inbound Request' ||
          prevStatus === 'Inbound Requisition') &&
        (updates.status === 'Open' || updates.status === 'Approved')
      ) {
        logActivity(
          'Staffing Requisition Approved',
          'Job',
          id,
          `Client requisition "${inMemoryData.jobs[idx].title}" for ${inMemoryData.jobs[idx].client} approved and opened for active recruitment.`,
          req.user,
          '#008F68'
        ).catch(() => {});
      }
    }

    let updatedJob = null;
    if (isMongoActive()) {
      const query = mongoose.Types.ObjectId.isValid(id)
        ? { $or: [{ _id: id }, { id }, { jobId: id }] }
        : { $or: [{ id }, { jobId: id }] };
      const {
        id: _ignoreId,
        _id: _ignoreUnderscoreId,
        ...cleanUpdates
      } = updates;
      updatedJob = await JobRequirement.findOneAndUpdate(query, cleanUpdates, {
        new: true,
      }).lean();

      if (
        updatedJob &&
        (updates.status === 'Open' || updates.status === 'Approved')
      ) {
        logActivity(
          'Staffing Requisition Approved',
          'Job',
          id,
          `Client requisition "${updatedJob.title}" for ${updatedJob.client} approved and opened for active recruitment.`,
          req.user,
          '#008F68'
        ).catch(() => {});
      }
    }

    res.json({
      success: true,
      message: 'Job requirement updated successfully',
      job: updatedJob || (idx !== -1 ? inMemoryData.jobs[idx] : updates),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    inMemoryData.jobs = (inMemoryData.jobs || []).filter(
      (j) => j.id !== id && String(j._id) !== id && j.jobId !== id
    );

    if (isMongoActive()) {
      const query = mongoose.Types.ObjectId.isValid(id)
        ? { $or: [{ _id: id }, { id }, { jobId: id }] }
        : { $or: [{ id }, { jobId: id }] };
      await JobRequirement.findOneAndDelete(query);
    }

    await logActivity(
      'Job Requirement Closed',
      'Job',
      id,
      `Closed staffing requisition ID ${id}.`,
      req.user,
      '#DC2626'
    );

    res.json({
      success: true,
      message: 'Job requirement deleted successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Persist incoming enterprise requisition from Find Talent intake portal
 * Seamlessly stores in both MongoDB and in-memory demo data with activity logging
 */
export const recordInboundRequisition = async (reqData = {}) => {
  const {
    engagementModel,
    targetRole,
    headcount,
    seniority,
    techStack,
    deploymentUrgency,
    workArrangement,
    budgetEnvelope,
    fullName,
    corporateEmail,
    company,
    phone,
    jobDescription,
  } = reqData;

  const reqId = `job_req_${Date.now()}`;
  const displayJobId = `REQ-${Date.now().toString().slice(-6)}`;

  const budgetMap = {
    bracket_1: '$5,000 - $8,000 / mo',
    bracket_2: '$8,000 - $12,000 / mo',
    bracket_3: '$12,000 - $18,000 / mo',
    bracket_4: '$18,000+ / mo',
  };
  const resolvedBudget =
    budgetMap[budgetEnvelope] || budgetEnvelope || 'Competitive Envelope';

  const priorityMap = {
    immediate: 'Urgent',
    within_14_days: 'High',
    flexible: 'Medium',
  };
  const resolvedPriority =
    priorityMap[deploymentUrgency] ||
    (deploymentUrgency === 'Immediate' ? 'Urgent' : 'High');

  const workModeMap = {
    remote_global: 'Remote',
    hybrid: 'Hybrid',
    onsite: 'Onsite',
  };
  const resolvedWorkMode =
    workModeMap[workArrangement] || workArrangement || 'Remote';

  const skillsArray = Array.isArray(techStack)
    ? techStack
    : typeof techStack === 'string'
      ? techStack
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const newRequisition = {
    id: reqId,
    jobId: displayJobId,
    title: targetRole || 'Senior Specialized Engineer',
    client: company || 'Enterprise Partner',
    contactPerson: fullName || 'Enterprise Hiring Manager',
    contactEmail: corporateEmail || '',
    contactPhone: phone || '',
    engagementModel: engagementModel || 'Staff Augmentation',
    seniority: seniority || 'Senior',
    requiredSkills: skillsArray,
    skills: skillsArray,
    experienceRequired:
      seniority === 'principal' ? 8 : seniority === 'senior' ? 5 : 3,
    openingsCount: Number(headcount) || 1,
    fulfilledCount: 0,
    location:
      resolvedWorkMode === 'Remote' ? 'Remote (Global)' : 'Hybrid / Onsite',
    workMode: resolvedWorkMode,
    priority: resolvedPriority,
    deploymentUrgency: deploymentUrgency || 'immediate',
    status: 'Inbound Request',
    budget: resolvedBudget,
    budgetEnvelope: budgetEnvelope || 'bracket_2',
    description:
      jobDescription ||
      `Enterprise talent mandate for ${headcount || 1}x ${targetRole} (${seniority || 'Senior'}) by ${company} (${fullName} - ${corporateEmail}). 5-Hour Candidate Dossier SLA active.`,
    requirements: `Required Technologies: ${skillsArray.join(', ')}. Deployment model: ${engagementModel}.`,
    category: 'Client Requisition',
    source: 'Client Inbound Requisition',
    isRequisition: true,
    postedDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  };

  inMemoryData.jobs = inMemoryData.jobs || [];
  inMemoryData.jobs.unshift(newRequisition);

  if (isMongoActive()) {
    try {
      const doc = await JobRequirement.create(newRequisition);
      newRequisition._id = doc._id;
    } catch (err) {
      console.warn(
        'Could not persist inbound requisition to Mongo:',
        err.message
      );
    }
  }

  // Ensure client exists in clients list
  if (company) {
    const existingClient = (inMemoryData.clients || []).find(
      (c) => c.companyName?.toLowerCase() === company.toLowerCase()
    );
    if (!existingClient) {
      const newClientRecord = {
        id: `cli_${Date.now()}`,
        companyName: company,
        industry: 'Enterprise Software & Technology',
        tier: 'Tier 1 Enterprise Lead',
        contactPerson: fullName || 'Hiring Lead',
        email: corporateEmail || '',
        phone: phone || '',
        activeDeployments: 0,
        status: 'Active',
      };
      inMemoryData.clients = inMemoryData.clients || [];
      inMemoryData.clients.unshift(newClientRecord);
    }
  }

  await logActivity(
    'Staffing Requisition Inbound Request',
    'Job',
    newRequisition.id,
    `Inbound candidate requisition received from ${company} (${fullName}) for ${newRequisition.openingsCount}x ${newRequisition.title}. Urgency: ${newRequisition.priority}.`,
    { name: fullName || 'Enterprise Client', role: 'client' },
    '#7C3AED'
  );

  return newRequisition;
};

// ============================================================================
// 6. PLACEMENTS CRUD
// ============================================================================
export const getPlacements = async (req, res) => {
  try {
    let items = [];
    if (isMongoActive()) {
      items = await Placement.find().sort({ createdAt: -1 }).lean();
      if (items.length === 0) items = inMemoryData.placements;
    } else {
      items = inMemoryData.placements;
    }
    res.json({ success: true, placements: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createPlacement = async (req, res) => {
  try {
    const {
      candidateOrEmployeeName,
      personType,
      clientName,
      jobTitle,
      deploymentDate,
      billingRate,
      durationMonths,
      assignmentStatus,
      notes,
    } = req.body;

    if (!candidateOrEmployeeName || !clientName || !jobTitle) {
      return res
        .status(400)
        .json({
          success: false,
          error: 'Talent name, client name, and job title are required.',
        });
    }

    // Validation: prevent duplicate active placement for same candidate at same client
    const exists = inMemoryData.placements.some(
      (p) =>
        p.candidateOrEmployeeName.toLowerCase() ===
          candidateOrEmployeeName.toLowerCase() &&
        p.clientName.toLowerCase() === clientName.toLowerCase() &&
        p.assignmentStatus === 'Active'
    );
    if (exists) {
      return res
        .status(400)
        .json({
          success: false,
          error: `An active placement already exists for ${candidateOrEmployeeName} at ${clientName}.`,
        });
    }

    const newPlc = {
      id: `plc_${Date.now()}`,
      candidateOrEmployeeName,
      personType: personType || 'Employee',
      clientName,
      jobTitle,
      deploymentDate: deploymentDate || new Date().toISOString(),
      billingRate: Number(billingRate) || 6000,
      durationMonths: Number(durationMonths) || 6,
      assignmentStatus: assignmentStatus || 'Active',
      notes: notes || '',
      createdAt: new Date().toISOString(),
    };

    inMemoryData.placements.unshift(newPlc);

    // Update corresponding employee status to 'Deployed' if matches
    const empIdx = inMemoryData.employees.findIndex(
      (e) => e.name.toLowerCase() === candidateOrEmployeeName.toLowerCase()
    );
    if (empIdx !== -1) {
      inMemoryData.employees[empIdx].deploymentStatus = 'Deployed';
    }

    if (isMongoActive()) {
      await Placement.create(newPlc);
      await Employee.findOneAndUpdate(
        { name: candidateOrEmployeeName },
        { deploymentStatus: 'Deployed' }
      );
    }

    await logActivity(
      'Talent Placed',
      'Placement',
      newPlc.id,
      `Deployed ${candidateOrEmployeeName} to ${clientName} (${jobTitle}).`,
      req.user,
      '#008F68'
    );

    res
      .status(201)
      .json({
        success: true,
        message: 'Placement created successfully',
        placement: newPlc,
      });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updatePlacement = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const idx = inMemoryData.placements.findIndex(
      (p) => p.id === id || String(p._id) === id
    );
    if (idx !== -1) {
      inMemoryData.placements[idx] = {
        ...inMemoryData.placements[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    }

    if (isMongoActive()) {
      const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
      await Placement.findOneAndUpdate(query, updates, { new: true });
    }

    res.json({
      success: true,
      message: 'Placement updated successfully',
      placement: inMemoryData.placements[idx],
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deletePlacement = async (req, res) => {
  try {
    const { id } = req.params;

    inMemoryData.placements = inMemoryData.placements.filter(
      (p) => p.id !== id && String(p._id) !== id
    );

    if (isMongoActive()) {
      const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
      await Placement.findOneAndDelete(query);
    }

    await logActivity(
      'Placement Ended',
      'Placement',
      id,
      `Terminated deployment ID ${id}.`,
      req.user,
      '#DC2626'
    );

    res.json({ success: true, message: 'Placement removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============================================================================
// 7. CMS - WEBSITE PAGES MANAGEMENT
// ============================================================================
export const getCmsPages = async (req, res) => {
  try {
    let items = [];
    if (isMongoActive()) {
      items = await Page.find().sort({ updatedAt: -1 }).lean();
      if (items.length === 0) items = inMemoryData.pages;
    } else {
      items = inMemoryData.pages;
    }
    res.json({ success: true, pages: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getCmsPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    let page = null;
    if (isMongoActive()) {
      page = await Page.findOne({ slug }).lean();
    }
    if (!page) {
      page = inMemoryData.pages.find((p) => p.slug === slug);
    }
    if (!page)
      return res.status(404).json({ success: false, error: 'Page not found' });
    res.json({ success: true, page });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createCmsPage = async (req, res) => {
  try {
    const {
      title,
      slug,
      category,
      content,
      metaTitle,
      metaDescription,
      ogImage,
      isIndexed,
      status,
    } = req.body;

    if (!title || !slug || !content) {
      return res
        .status(400)
        .json({
          success: false,
          error: 'Page title, slug, and content are required.',
        });
    }

    const cleanSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-_]/g, '-');

    const duplicate = inMemoryData.pages.some((p) => p.slug === cleanSlug);
    if (duplicate) {
      return res
        .status(400)
        .json({
          success: false,
          error: `A page with URL slug '${cleanSlug}' already exists.`,
        });
    }

    const newPg = {
      id: `pg_${Date.now()}`,
      title,
      slug: cleanSlug,
      category: category || 'Website Page',
      content,
      metaTitle: metaTitle || `${title} — Thinkwires`,
      metaDescription: metaDescription || '',
      ogImage: ogImage || '/images/about-hero.jpg',
      data: req.body.data || {},
      isIndexed: isIndexed !== undefined ? Boolean(isIndexed) : true,
      status: status || 'draft',
      lastUpdatedBy: req.user?.name || 'Admin',
      publishedAt: status === 'published' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryData.pages.push(newPg);

    if (isMongoActive()) {
      await Page.create(newPg);
    }

    await logActivity(
      'Created CMS Page',
      'CMS',
      newPg.id,
      `Created page '${title}' (${cleanSlug}).`,
      req.user,
      '#8064D8'
    );

    res
      .status(201)
      .json({
        success: true,
        message: 'Page created successfully',
        page: newPg,
      });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateCmsPage = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const idx = inMemoryData.pages.findIndex(
      (p) => p.id === id || String(p._id) === id || p.slug === id
    );
    if (idx === -1) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }

    if (updates.slug) {
      updates.slug = updates.slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-_]/g, '-');
      const conflict = inMemoryData.pages.some(
        (p) => p.slug === updates.slug && p.id !== inMemoryData.pages[idx].id
      );
      if (conflict) {
        return res
          .status(400)
          .json({
            success: false,
            error: `Slug '${updates.slug}' is already taken by another page.`,
          });
      }
    }

    updates.lastUpdatedBy = req.user?.name || 'Admin';
    updates.updatedAt = new Date().toISOString();
    if (
      updates.status === 'published' &&
      !inMemoryData.pages[idx].publishedAt
    ) {
      updates.publishedAt = new Date().toISOString();
    }

    inMemoryData.pages[idx] = { ...inMemoryData.pages[idx], ...updates };

    if (isMongoActive()) {
      const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
      await Page.findOneAndUpdate(query, updates, { new: true });
    }

    await logActivity(
      'Updated CMS Page',
      'CMS',
      id,
      `Saved edits for page '${inMemoryData.pages[idx].title}'.`,
      req.user,
      '#8064D8'
    );

    res.json({
      success: true,
      message: 'Page updated successfully',
      page: inMemoryData.pages[idx],
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const togglePublishCmsPage = async (req, res) => {
  try {
    const { id } = req.params;
    const idx = inMemoryData.pages.findIndex(
      (p) => p.id === id || String(p._id) === id || p.slug === id
    );
    if (idx === -1)
      return res.status(404).json({ success: false, error: 'Page not found' });

    const newStatus =
      inMemoryData.pages[idx].status === 'published' ? 'draft' : 'published';
    inMemoryData.pages[idx].status = newStatus;
    inMemoryData.pages[idx].updatedAt = new Date().toISOString();
    if (newStatus === 'published') {
      inMemoryData.pages[idx].publishedAt = new Date().toISOString();
    }

    if (isMongoActive()) {
      const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
      await Page.findOneAndUpdate(query, {
        status: newStatus,
        publishedAt: inMemoryData.pages[idx].publishedAt,
      });
    }

    await logActivity(
      'Page Status Changed',
      'CMS',
      id,
      `Set page '${inMemoryData.pages[idx].title}' to ${newStatus}.`,
      req.user,
      '#8064D8'
    );

    res.json({
      success: true,
      message: `Page is now ${newStatus}`,
      status: newStatus,
      page: inMemoryData.pages[idx],
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteCmsPage = async (req, res) => {
  try {
    const { id } = req.params;
    const idx = inMemoryData.pages.findIndex(
      (p) => p.id === id || String(p._id) === id || p.slug === id
    );
    if (idx === -1)
      return res.status(404).json({ success: false, error: 'Page not found' });

    const title = inMemoryData.pages[idx].title;
    inMemoryData.pages.splice(idx, 1);

    if (isMongoActive()) {
      const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
      await Page.findOneAndDelete(query);
    }

    await logActivity(
      'Deleted CMS Page',
      'CMS',
      id,
      `Deleted website page '${title}'.`,
      req.user,
      '#DC2626'
    );

    res.json({ success: true, message: 'Page deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============================================================================
// 8. CMS - BLOG & ARTICLES MANAGEMENT
// ============================================================================
export const getCmsArticles = async (req, res) => {
  try {
    const { search, category, status } = req.query;

    let items = [];
    if (isMongoActive()) {
      let query = {};
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { summary: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } },
        ];
      }
      if (category && category !== 'All') query.category = category;
      if (status && status !== 'All') query.status = status;

      items = await Article.find(query).sort({ createdAt: -1 }).lean();
      if (
        items.length === 0 &&
        !search &&
        (!category || category === 'All') &&
        (!status || status === 'All')
      ) {
        items = inMemoryData.articles;
      }
    } else {
      items = inMemoryData.articles.filter((art) => {
        let match = true;
        if (search) {
          const s = search.toLowerCase();
          match =
            art.title.toLowerCase().includes(s) ||
            art.summary.toLowerCase().includes(s) ||
            (art.tags && art.tags.some((t) => t.toLowerCase().includes(s)));
        }
        if (match && category && category !== 'All')
          match = art.category === category;
        if (match && status && status !== 'All') match = art.status === status;
        return match;
      });
    }

    res.json({ success: true, articles: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createCmsArticle = async (req, res) => {
  try {
    const {
      title,
      slug,
      summary,
      body,
      author,
      category,
      featuredImageUrl,
      tags,
      status,
    } = req.body;

    if (!title || !summary || !body) {
      return res
        .status(400)
        .json({
          success: false,
          error: 'Article title, summary, and body content are required.',
        });
    }

    const cleanSlug = (slug || title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-_]/g, '-');

    const duplicate = inMemoryData.articles.some((a) => a.slug === cleanSlug);
    if (duplicate) {
      return res
        .status(400)
        .json({
          success: false,
          error: `An article with slug '${cleanSlug}' already exists.`,
        });
    }

    const tagsArray = Array.isArray(tags)
      ? tags
      : typeof tags === 'string'
        ? tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : ['Staffing', 'Tech Insights'];

    const newArt = {
      id: `art_${Date.now()}`,
      title,
      slug: cleanSlug,
      summary,
      body,
      author:
        typeof author === 'object'
          ? author
          : {
              name: author || req.user?.name || 'Thinkwires Editorial',
              role: 'Staff Contributor',
            },
      category: category || 'Industry Insights',
      featuredImageUrl: featuredImageUrl || '/images/about-philosophy.jpg',
      tags: tagsArray,
      readTime: `${Math.max(2, Math.ceil(body.split(' ').length / 150))} min read`,
      viewsCount: 0,
      status: status || 'draft',
      publishedAt: status === 'published' ? new Date().toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryData.articles.unshift(newArt);

    if (isMongoActive()) {
      await Article.create(newArt);
    }

    await logActivity(
      'Created Blog Article',
      'CMS',
      newArt.id,
      `Authored article '${title}'.`,
      req.user,
      '#8064D8'
    );

    res
      .status(201)
      .json({
        success: true,
        message: 'Article created successfully',
        article: newArt,
      });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateCmsArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const idx = inMemoryData.articles.findIndex(
      (a) => a.id === id || String(a._id) === id || a.slug === id
    );
    if (idx === -1)
      return res
        .status(404)
        .json({ success: false, error: 'Article not found' });

    if (updates.tags && typeof updates.tags === 'string') {
      updates.tags = updates.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }

    updates.updatedAt = new Date().toISOString();
    if (
      updates.status === 'published' &&
      !inMemoryData.articles[idx].publishedAt
    ) {
      updates.publishedAt = new Date().toISOString();
    }

    inMemoryData.articles[idx] = { ...inMemoryData.articles[idx], ...updates };

    if (isMongoActive()) {
      const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
      await Article.findOneAndUpdate(query, updates, { new: true });
    }

    await logActivity(
      'Updated Article',
      'CMS',
      id,
      `Updated blog post '${inMemoryData.articles[idx].title}'.`,
      req.user,
      '#8064D8'
    );

    res.json({
      success: true,
      message: 'Article updated successfully',
      article: inMemoryData.articles[idx],
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const togglePublishCmsArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const idx = inMemoryData.articles.findIndex(
      (a) => a.id === id || String(a._id) === id || a.slug === id
    );
    if (idx === -1)
      return res
        .status(404)
        .json({ success: false, error: 'Article not found' });

    const newStatus =
      inMemoryData.articles[idx].status === 'published' ? 'draft' : 'published';
    inMemoryData.articles[idx].status = newStatus;
    inMemoryData.articles[idx].updatedAt = new Date().toISOString();
    if (newStatus === 'published') {
      inMemoryData.articles[idx].publishedAt = new Date().toISOString();
    }

    if (isMongoActive()) {
      const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
      await Article.findOneAndUpdate(query, {
        status: newStatus,
        publishedAt: inMemoryData.articles[idx].publishedAt,
      });
    }

    await logActivity(
      'Article Status Toggled',
      'CMS',
      id,
      `Article '${inMemoryData.articles[idx].title}' marked as ${newStatus}.`,
      req.user,
      '#8064D8'
    );

    res.json({
      success: true,
      message: `Article status changed to ${newStatus}`,
      status: newStatus,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteCmsArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const idx = inMemoryData.articles.findIndex(
      (a) => a.id === id || String(a._id) === id || a.slug === id
    );
    if (idx === -1)
      return res
        .status(404)
        .json({ success: false, error: 'Article not found' });

    const title = inMemoryData.articles[idx].title;
    inMemoryData.articles.splice(idx, 1);

    if (isMongoActive()) {
      const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
      await Article.findOneAndDelete(query);
    }

    await logActivity(
      'Deleted Article',
      'CMS',
      id,
      `Removed blog post '${title}'.`,
      req.user,
      '#DC2626'
    );

    res.json({ success: true, message: 'Article deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============================================================================
// 9. CMS - MEDIA LIBRARY
// ============================================================================
export const getCmsMedia = async (req, res) => {
  try {
    let items = [];
    if (isMongoActive()) {
      items = await Media.find().sort({ createdAt: -1 }).lean();
      if (items.length === 0) items = inMemoryData.media;
    } else {
      items = inMemoryData.media;
    }
    res.json({ success: true, media: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createCmsMedia = async (req, res) => {
  try {
    const { title, fileUrl, fileType, fileSizeKb, dimensions, altText } =
      req.body;

    if (!title || !fileUrl) {
      return res
        .status(400)
        .json({ success: false, error: 'Title and file URL are required.' });
    }

    // Modular validation: file type & size sanity check
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
    ];
    const resolvedType = fileType || 'image/jpeg';
    if (!allowedTypes.includes(resolvedType)) {
      return res
        .status(400)
        .json({
          success: false,
          error: 'Unsupported file type. Must be JPEG, PNG, WEBP, SVG, or PDF.',
        });
    }

    const newMed = {
      id: `med_${Date.now()}`,
      title,
      fileUrl,
      fileType: resolvedType,
      fileSizeKb: Number(fileSizeKb) || 150,
      dimensions: dimensions || '1200x800',
      altText: altText || title,
      uploadedBy: req.user?.name || 'Admin',
      isDemo: true,
      createdAt: new Date().toISOString(),
    };

    inMemoryData.media.unshift(newMed);

    if (isMongoActive()) {
      await Media.create(newMed);
    }

    await logActivity(
      'Uploaded Media Asset',
      'CMS',
      newMed.id,
      `Added media asset: '${title}'.`,
      req.user,
      '#3478D4'
    );

    res
      .status(201)
      .json({
        success: true,
        message: 'Media registered successfully (Demo storage workflow)',
        media: newMed,
      });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteCmsMedia = async (req, res) => {
  try {
    const { id } = req.params;

    inMemoryData.media = inMemoryData.media.filter(
      (m) => m.id !== id && String(m._id) !== id
    );

    if (isMongoActive()) {
      const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
      await Media.findOneAndDelete(query);
    }

    res.json({ success: true, message: 'Media asset deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============================================================================
// 10. CMS - SEO SETTINGS
// ============================================================================
export const getSeoSettings = async (req, res) => {
  try {
    const pages = isMongoActive()
      ? await Page.find().lean()
      : inMemoryData.pages;

    const seoList = (pages.length ? pages : inMemoryData.pages).map((p) => ({
      pageId: p.id || p._id,
      title: p.title,
      slug: p.slug,
      metaTitle: p.metaTitle || p.title,
      metaDescription: p.metaDescription || '',
      ogImage: p.ogImage || '/images/about-hero.jpg',
      isIndexed: p.isIndexed !== undefined ? p.isIndexed : true,
    }));

    res.json({
      success: true,
      globalSeo: {
        siteName:
          'Thinkwires — Tech Manpower Supply & Global Staffing Aggregator',
        defaultMetaDescription:
          'Enterprise IT manpower supply, specialized tech staffing, and compliant cross-border Employer of Record (EOR) infrastructure.',
        canonicalBaseUrl: 'https://thinkwires.com',
        indexingGlobal: true,
      },
      pageSeo: seoList,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateSeoSettings = async (req, res) => {
  try {
    const { pageId, metaTitle, metaDescription, ogImage, isIndexed } = req.body;

    const idx = inMemoryData.pages.findIndex(
      (p) => p.id === pageId || String(p._id) === pageId
    );
    if (idx !== -1) {
      if (metaTitle !== undefined)
        inMemoryData.pages[idx].metaTitle = metaTitle;
      if (metaDescription !== undefined)
        inMemoryData.pages[idx].metaDescription = metaDescription;
      if (ogImage !== undefined) inMemoryData.pages[idx].ogImage = ogImage;
      if (isIndexed !== undefined)
        inMemoryData.pages[idx].isIndexed = Boolean(isIndexed);
      inMemoryData.pages[idx].updatedAt = new Date().toISOString();
    }

    if (isMongoActive()) {
      const query = mongoose.Types.ObjectId.isValid(pageId)
        ? { _id: pageId }
        : { id: pageId };
      await Page.findOneAndUpdate(query, {
        metaTitle,
        metaDescription,
        ogImage,
        isIndexed,
      });
    }

    await logActivity(
      'Updated SEO Metadata',
      'CMS',
      pageId,
      `Saved SEO preferences for page ID ${pageId}.`,
      req.user,
      '#8064D8'
    );

    res.json({
      success: true,
      message: 'SEO configuration persisted successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============================================================================
// 11. CMS - ANNOUNCEMENTS
// ============================================================================
export const getAnnouncements = async (req, res) => {
  try {
    let items = [];
    if (isMongoActive()) {
      items = await Announcement.find().sort({ createdAt: -1 }).lean();
      if (items.length === 0) items = inMemoryData.announcements;
    } else {
      items = inMemoryData.announcements;
    }
    res.json({ success: true, announcements: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const { title, message, audience, priority, status, activeUntil } =
      req.body;

    if (!title || !message) {
      return res
        .status(400)
        .json({
          success: false,
          error: 'Announcement title and message are required.',
        });
    }

    const newAnn = {
      id: `ann_${Date.now()}`,
      title,
      message,
      audience: audience || 'All',
      priority: priority || 'Normal',
      status: status || 'published',
      activeUntil:
        activeUntil ||
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      author: req.user?.name || 'Operations Lead',
      createdAt: new Date().toISOString(),
    };

    inMemoryData.announcements.unshift(newAnn);

    if (isMongoActive()) {
      await Announcement.create(newAnn);
    }

    await logActivity(
      'Created Announcement',
      'CMS',
      newAnn.id,
      `Broadcasted: '${title}'.`,
      req.user,
      '#D97706'
    );

    res
      .status(201)
      .json({
        success: true,
        message: 'Announcement created successfully',
        announcement: newAnn,
      });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const togglePublishAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const idx = inMemoryData.announcements.findIndex(
      (a) => a.id === id || String(a._id) === id
    );
    if (idx === -1)
      return res
        .status(404)
        .json({ success: false, error: 'Announcement not found' });

    const newStatus =
      inMemoryData.announcements[idx].status === 'published'
        ? 'draft'
        : 'published';
    inMemoryData.announcements[idx].status = newStatus;

    if (isMongoActive()) {
      const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
      await Announcement.findOneAndUpdate(query, { status: newStatus });
    }

    res.json({
      success: true,
      message: `Announcement set to ${newStatus}`,
      status: newStatus,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    inMemoryData.announcements = inMemoryData.announcements.filter(
      (a) => a.id !== id && String(a._id) !== id
    );

    if (isMongoActive()) {
      const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
      await Announcement.findOneAndDelete(query);
    }

    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============================================================================
// 12. CMS DASHBOARD STATS
// ============================================================================
export const getCmsStats = async (req, res) => {
  try {
    let pages = isMongoActive() ? await Page.find().lean() : inMemoryData.pages;
    let articles = isMongoActive()
      ? await Article.find().lean()
      : inMemoryData.articles;
    let media = isMongoActive()
      ? await Media.find().lean()
      : inMemoryData.media;
    let announcements = isMongoActive()
      ? await Announcement.find().lean()
      : inMemoryData.announcements;

    if (!pages.length) pages = inMemoryData.pages;
    if (!articles.length) articles = inMemoryData.articles;
    if (!media.length) media = inMemoryData.media;
    if (!announcements.length) announcements = inMemoryData.announcements;

    const totalPages = pages.length;
    const publishedPages = pages.filter((p) => p.status === 'published').length;
    const draftPages = pages.filter((p) => p.status === 'draft').length;

    const totalArticles = articles.length;
    const publishedArticles = articles.filter(
      (a) => a.status === 'published'
    ).length;
    const draftArticles = articles.filter((a) => a.status === 'draft').length;

    const recentUpdates = [...pages, ...articles]
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt)
      )
      .slice(0, 6)
      .map((item) => ({
        id: item.id || item._id,
        title: item.title,
        type: item.slug && item.body ? 'Blog Article' : 'Website Page',
        slug: item.slug,
        status: item.status,
        lastUpdatedBy:
          item.lastUpdatedBy || (item.author && item.author.name) || 'Admin',
        updatedAt: item.updatedAt || item.createdAt,
      }));

    res.json({
      success: true,
      databaseMode: isMongoActive()
        ? 'MongoDB Connected'
        : 'In-Memory Resilient Demo Mode',
      isMongoActive: isMongoActive(),
      announcements: announcements
        .filter((a) => a.status === 'published')
        .slice(0, 5),
      stats: {
        totalPages,
        publishedPages,
        draftPages,
        totalArticles,
        publishedArticles,
        draftArticles,
        totalMedia: media.length,
        totalAnnouncements: announcements.length,
      },
      recentUpdates,
      publishingActivity: inMemoryData.activities
        .filter((a) => a.entityType === 'CMS')
        .slice(0, 5),
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============================================================================
// 13. ACTIVITIES & USER AUTH CONTEXT
// ============================================================================
export const getActivities = async (req, res) => {
  try {
    let items = [];
    if (isMongoActive()) {
      items = await Activity.find().sort({ createdAt: -1 }).limit(30).lean();
      if (items.length === 0) items = inMemoryData.activities;
    } else {
      items = inMemoryData.activities;
    }
    res.json({ success: true, activities: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============================================================================
// ADMIN PORTAL AUTHENTICATION (Login, Logout, Session)
// ============================================================================
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Official email and password are required.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = null;

    if (isMongoActive()) {
      user = await UserMongo.findOne({ email: cleanEmail }).select('+password');
    }

    // Fallback to in-memory seeded users if MongoDB is unavailable or user was not in DB
    if (!user) {
      const inMem = (inMemoryData.users || []).find(
        (u) => (u.email || '').toLowerCase().trim() === cleanEmail
      );
      if (inMem) {
        user = { ...inMem };
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error:
          'Invalid official credentials. Respective persons should use the password and email created by superadmin.',
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        error:
          'Your administrative account has been deactivated. Please contact your Superadmin.',
      });
    }

    // Verify Password using cryptographically secure bcrypt
    let isMatch = false;
    const userPassword =
      user.password ||
      (!isMongoActive() && process.env.NODE_ENV !== 'production'
        ? 'Thinkwires@2026'
        : null);

    if (userPassword) {
      if (userPassword.startsWith('$2a$') || userPassword.startsWith('$2b$')) {
        isMatch = await comparePassword(password, userPassword);
      } else if (process.env.NODE_ENV !== 'production' && !isMongoActive()) {
        // Safe equality comparison only for offline local development demo seed
        isMatch = password === userPassword;
      }
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error:
          'Invalid password. Please enter the password assigned to your account by the Superadmin.',
      });
    }

    // Record last login
    if (isMongoActive() && user._id) {
      await UserMongo.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    }

    // Generate secure Admin JWT and set in HttpOnly cookie
    const token = generateAdminToken(user);
    setAdminAuthCookie(res, token);

    // Issue anti-CSRF token
    const csrfToken = generateCsrfToken();
    setCsrfCookie(res, csrfToken);

    await logActivity(
      'Admin Logged In',
      'Security RBAC',
      user.email,
      `${user.name} logged into Thinkwires Administrative Portal as ${user.role.toUpperCase()}.`,
      { name: user.name, role: user.role },
      '#10B981'
    );

    return res.json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      csrfToken,
      user: {
        id: user._id ? user._id.toString() : user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation || 'System Member',
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred during authentication.',
    });
  }
};

export const logoutAdmin = async (req, res) => {
  try {
    let token = null;
    if (req.cookies && req.cookies.thinkwires_admin_jwt) {
      token = req.cookies.thinkwires_admin_jwt;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.headers['x-admin-token']) {
      token = req.headers['x-admin-token'];
    }

    if (token) {
      await revokeToken(token);
    }

    clearAdminAuthCookie(res);
    clearCsrfCookie(res);

    return res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred during logout.',
    });
  }
};

export const getCurrentUser = async (req, res) => {
  let csrfToken = req.cookies?.[CSRF_COOKIE_NAME];
  if (!csrfToken) {
    csrfToken = generateCsrfToken();
    setCsrfCookie(res, csrfToken);
  }

  res.json({
    success: true,
    user: req.user,
    csrfToken,
    availableRoles: [
      {
        role: 'superadmin',
        label: 'Superadmin (Full Control Across All Modules & Portals)',
      },
      {
        role: 'cms_admin',
        label: 'CMS Admin (Content Management System Only)',
      },
      { role: 'admin', label: 'Admin (System & Manpower Management)' },
    ],
    databaseStatus: isMongoActive()
      ? 'Connected (MongoDB Atlas / Local)'
      : 'In-Memory Resilient Storage (Fallback)',
  });
};

// ============================================================================
// 12. SYSTEM MEMBERS MANAGEMENT (SUPERADMIN EXCLUSIVE)
// ============================================================================
export const getSystemMembers = async (req, res) => {
  try {
    if (req.user?.role !== 'superadmin') {
      return res
        .status(403)
        .json({
          success: false,
          error:
            'Access denied: Only a Superadmin can view or manage System Members.',
        });
    }

    let members = [];
    if (isMongoActive()) {
      members = await UserMongo.find()
        .select('-password -__v')
        .sort({ createdAt: -1 })
        .lean();
    }

    if (!isMongoActive() && (!members || members.length === 0)) {
      members = (inMemoryData.users || []).map((u) => {
        const { password, ...rest } = u;
        return rest;
      });
    }

    res.json({ success: true, members });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createSystemMember = async (req, res) => {
  try {
    if (req.user?.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error:
          'Access denied: Only a Superadmin can provision System Members, assign roles, and set credentials.',
      });
    }

    const { name, email, role, password, designation, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error:
          'Full Name, Official Email, Role, and Initial Password are required.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Initial Password must be at least 6 characters long.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Prevent duplicate emails
    if (isMongoActive()) {
      const existing = await UserMongo.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(400).json({
          success: false,
          error: `A user account with email '${cleanEmail}' already exists in the system directory.`,
        });
      }
    }

    const hashedPassword = await hashPassword(password.trim());

    const newMember = {
      name: name.trim(),
      email: cleanEmail,
      role: role.trim(),
      password: hashedPassword,
      designation: designation?.trim() || 'System Member',
      phone: phone?.trim() || '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    let createdRecord = null;
    if (isMongoActive()) {
      createdRecord = await UserMongo.create(newMember);

      // Also ensure corresponding Employee profile exists for seamless directory tracking
      const existingEmp = await Employee.findOne({ email: cleanEmail });
      if (!existingEmp) {
        await Employee.create({
          id: `emp_${Date.now()}`,
          name: newMember.name,
          email: newMember.email,
          phone: newMember.phone,
          designation: newMember.designation,
          role: newMember.role,
          portalAccess: true,
          technicalSkills: ['System Administration', 'Security Operations'],
          experience: 5,
          availability: 'Immediate',
          deploymentStatus: 'Available',
          billingRate: 0,
          location: 'Headquarters / Remote',
          notes: 'Provisioned as corporate system member by Superadmin.',
        });
      } else {
        existingEmp.role = newMember.role;
        existingEmp.portalAccess = true;
        await existingEmp.save();
      }
    }

    inMemoryData.users = inMemoryData.users || [];
    inMemoryData.users.unshift({
      id: createdRecord?._id ? String(createdRecord._id) : `usr_${Date.now()}`,
      ...newMember,
    });

    // Also sync inMemoryData.employees for seamless dual-mode directory tracking
    inMemoryData.employees = inMemoryData.employees || [];
    const empIdx = inMemoryData.employees.findIndex(
      (e) => e.email === cleanEmail
    );
    if (empIdx === -1) {
      inMemoryData.employees.unshift({
        id: `emp_${Date.now()}`,
        name: newMember.name,
        email: newMember.email,
        phone: newMember.phone,
        designation: newMember.designation,
        role: newMember.role,
        portalAccess: true,
        technicalSkills: ['System Administration', 'Security Operations'],
        experience: 5,
        availability: 'Immediate',
        deploymentStatus: 'Available',
        billingRate: 0,
        location: 'Headquarters / Remote',
        notes: 'Provisioned as corporate system member by Superadmin.',
        createdAt: new Date().toISOString(),
      });
    } else {
      inMemoryData.employees[empIdx].role = newMember.role;
      inMemoryData.employees[empIdx].portalAccess = true;
      inMemoryData.employees[empIdx].designation = newMember.designation;
      inMemoryData.employees[empIdx].phone = newMember.phone;
    }

    await logActivity(
      'Provisioned System Member',
      'Security RBAC',
      cleanEmail,
      `Superadmin created new account for ${name} (${cleanEmail}) with role ${role.toUpperCase()}.`,
      req.user,
      '#008F68'
    );

    const sanitizedMember = createdRecord
      ? createdRecord.toObject
        ? createdRecord.toObject()
        : { ...createdRecord }
      : { ...newMember };
    delete sanitizedMember.password;

    res.status(201).json({
      success: true,
      message: `System Member '${name}' created successfully with role '${role}'.`,
      member: sanitizedMember,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateSystemMember = async (req, res) => {
  try {
    if (req.user?.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error:
          'Access denied: Only a Superadmin can edit System Members or update access credentials.',
      });
    }

    const { id } = req.params;
    const { name, email, role, password, designation, phone, isActive } =
      req.body;

    const updates = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.toLowerCase().trim();
    if (role) updates.role = role.trim();
    if (designation !== undefined) updates.designation = designation.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (isActive !== undefined) updates.isActive = Boolean(isActive);
    if (password && password.trim().length >= 6) {
      updates.password = await hashPassword(password.trim());
    } else if (
      password &&
      password.trim().length > 0 &&
      password.trim().length < 6
    ) {
      return res
        .status(400)
        .json({
          success: false,
          error: 'Password must be at least 6 characters long.',
        });
    }
    updates.updatedAt = new Date();

    let updatedRecord = null;
    if (isMongoActive()) {
      const query = mongoose.Types.ObjectId.isValid(id)
        ? { _id: id }
        : { email: id };
      updatedRecord = await UserMongo.findOneAndUpdate(query, updates, {
        new: true,
      })
        .select('-password -__v')
        .lean();

      // Keep employee profile synced
      if (updatedRecord && updatedRecord.email) {
        await Employee.findOneAndUpdate(
          { email: updatedRecord.email },
          {
            name: updatedRecord.name,
            role: updatedRecord.role,
            designation: updatedRecord.designation,
            phone: updatedRecord.phone || '',
            portalAccess: true,
          }
        );
      }
    }

    inMemoryData.users = inMemoryData.users || [];
    const idx = inMemoryData.users.findIndex(
      (u) => u.id === id || String(u._id) === id || u.email === id
    );
    if (idx !== -1) {
      inMemoryData.users[idx] = { ...inMemoryData.users[idx], ...updates };
      if (!updatedRecord) updatedRecord = inMemoryData.users[idx];
    }

    // Also sync inMemoryData.employees
    inMemoryData.employees = inMemoryData.employees || [];
    const empTargetEmail = updates.email || id;
    const empIdx = inMemoryData.employees.findIndex(
      (e) => e.email === empTargetEmail || e.id === id
    );
    if (empIdx !== -1) {
      inMemoryData.employees[empIdx] = {
        ...inMemoryData.employees[empIdx],
        ...(updates.name && { name: updates.name }),
        ...(updates.role && { role: updates.role }),
        ...(updates.designation && { designation: updates.designation }),
        ...(updates.phone && { phone: updates.phone }),
        portalAccess: true,
      };
    }

    await logActivity(
      'Updated System Member',
      'Security RBAC',
      id,
      `Superadmin updated profile/credentials for ${updates.name || id}.`,
      req.user,
      '#2563EB'
    );

    const sanitizedRecord = updatedRecord ? { ...updatedRecord } : null;
    if (sanitizedRecord) delete sanitizedRecord.password;

    res.json({
      success: true,
      message: 'System Member updated successfully.',
      member: sanitizedRecord,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteSystemMember = async (req, res) => {
  try {
    if (req.user?.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        error:
          'Access denied: Only a Superadmin can delete or revoke System Members.',
      });
    }

    const { id } = req.params;

    if (isMongoActive()) {
      const query = mongoose.Types.ObjectId.isValid(id)
        ? { _id: id }
        : { email: id };
      const member = await UserMongo.findOne(query);
      if (
        member &&
        (member.email === 'superadmin@thinkwires.com' ||
          member.email === req.user?.email ||
          String(member._id) === String(req.user?.id))
      ) {
        return res.status(400).json({
          success: false,
          error:
            'Protection violation: You cannot delete your own active administrative account or the root Superadmin account.',
        });
      }
      if (member) {
        await Employee.findOneAndUpdate(
          { email: member.email },
          { role: 'employee', portalAccess: false }
        );
        await UserMongo.findOneAndDelete(query);
      }
    }

    inMemoryData.users = (inMemoryData.users || []).filter(
      (u) => u.id !== id && String(u._id) !== id && u.email !== id
    );

    // Also update inMemoryData.employees to revoke portal role
    inMemoryData.employees = inMemoryData.employees || [];
    const delEmpIdx = inMemoryData.employees.findIndex(
      (e) => e.email === id || e.id === id
    );
    if (delEmpIdx !== -1) {
      inMemoryData.employees[delEmpIdx].role = 'employee';
      inMemoryData.employees[delEmpIdx].portalAccess = false;
    }

    await logActivity(
      'Revoked System Member',
      'Security RBAC',
      id,
      `Superadmin revoked account credentials for ${id}.`,
      req.user,
      '#DC2626'
    );

    res.json({
      success: true,
      message: 'System Member access revoked successfully.',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
