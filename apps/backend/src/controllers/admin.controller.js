import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadSeedJson } from '../utils/seedLoader.js';
import { parsePagination, parseCursorPagination, buildCursorQuery, encodeCursor } from '../utils/pagination.util.js';
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
import {
  HelpDeskTicket,
  memoryHelpDeskStore,
  queryHelpDeskTickets,
  getHelpDeskStats,
  updateHelpDeskTicket,
} from '../models/helpdesk.mongo.model.js';
import articlesStore, { inMemoryArticles } from '../utils/articlesStore.js';
import { getTransporter } from '../utils/notificationDispatcher.util.js';
import aiService from '../services/ai.service.js';
import { buildDualScoreReport } from '../utils/dualScore.util.js';
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
export let inMemoryData = loadSeedJson('adminSeedData.json', {
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
inMemoryData.articles = inMemoryArticles;

const isMongoActive = () => mongoose.connection.readyState === 1;

/**
 * Fail closed in production when MongoDB is disconnected (Issue #196)
 */
const requireProductionDb = (res) => {
  if (!isMongoActive() && process.env.NODE_ENV === 'production') {
    res.status(503).json({
      success: false,
      error: 'Database connection temporarily unavailable. Please retry your request.',
      retryAfterSeconds: 5,
    });
    return false;
  }
  return true;
};

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
    let totalEmployees = 0;
    let activePlacements = 0;
    let totalClients = 0;
    let openRequirements = 0;
    let inboundRequisitions = [];
    let candidatePipelineCount = 0;
    let totalBillingMonthly = 0;
    let announcements = [];
    let activities = [];
    let placements = [];

    if (isMongoActive()) {
      const [
        empCount,
        candCount,
        cliCount,
        openJobsCount,
        inboundReqs,
        activePlcs,
        allPlcsPreview,
        announcementList,
        activityList,
      ] = await Promise.all([
        Employee.countDocuments({ isDeleted: { $ne: true } }),
        Candidate.countDocuments({ isDeleted: { $ne: true } }),
        Client.countDocuments({ isDeleted: { $ne: true } }),
        JobRequirement.countDocuments({
          isDeleted: { $ne: true },
          status: { $in: ['Open', 'In Progress'] },
        }),
        JobRequirement.find({
          isDeleted: { $ne: true },
          $or: [
            { isRequisition: true },
            { status: { $in: ['Inbound Request', 'Inbound Requisition'] } },
            { source: 'Client Inbound Requisition' },
          ],
        })
          .sort({ createdAt: -1 })
          .limit(20)
          .lean(),
        Placement.find({ isDeleted: { $ne: true }, assignmentStatus: 'Active' })
          .select('billingRate assignmentStatus candidateOrEmployeeName clientName role startDate')
          .limit(100)
          .lean(),
        Placement.find({ isDeleted: { $ne: true } })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
        Announcement.find({ status: 'published' })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
        Activity.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .lean(),
      ]);

      const isDbEmpty = empCount === 0 && candCount === 0 && cliCount === 0;

      if (isDbEmpty) {
        totalEmployees = inMemoryData.employees.length;
        candidatePipelineCount = inMemoryData.candidates.length;
        totalClients = inMemoryData.clients.length;
        openRequirements = inMemoryData.jobs.filter(
          (j) => j.status === 'Open' || j.status === 'In Progress'
        ).length;
        inboundRequisitions = inMemoryData.jobs.filter(
          (j) =>
            j.isRequisition === true ||
            j.status === 'Inbound Request' ||
            j.status === 'Inbound Requisition' ||
            j.source === 'Client Inbound Requisition'
        );
        placements = inMemoryData.placements;
        activePlacements = inMemoryData.placements.filter(
          (p) => p.assignmentStatus === 'Active'
        ).length;
        totalBillingMonthly = inMemoryData.placements
          .filter((p) => p.assignmentStatus === 'Active')
          .reduce((sum, p) => sum + (Number(p.billingRate) || 5000), 0);
        announcements = inMemoryData.announcements.filter(
          (a) => a.status === 'published'
        );
        activities = inMemoryData.activities;
      } else {
        totalEmployees = empCount;
        candidatePipelineCount = candCount;
        totalClients = cliCount;
        openRequirements = openJobsCount;
        inboundRequisitions = inboundReqs;
        activePlacements = activePlcs.length;
        placements = allPlcsPreview;
        totalBillingMonthly = activePlcs.reduce(
          (sum, p) => sum + (Number(p.billingRate) || 5000),
          0
        );
        announcements =
          announcementList.length > 0
            ? announcementList
            : inMemoryData.announcements.filter((a) => a.status === 'published');
        activities =
          activityList.length > 0 ? activityList : inMemoryData.activities;
      }
    } else {
      totalEmployees = inMemoryData.employees.length;
      candidatePipelineCount = inMemoryData.candidates.length;
      totalClients = inMemoryData.clients.length;
      openRequirements = inMemoryData.jobs.filter(
        (j) => j.status === 'Open' || j.status === 'In Progress'
      ).length;
      inboundRequisitions = inMemoryData.jobs.filter(
        (j) =>
          j.isRequisition === true ||
          j.status === 'Inbound Request' ||
          j.status === 'Inbound Requisition' ||
          j.source === 'Client Inbound Requisition'
      );
      placements = inMemoryData.placements;
      activePlacements = inMemoryData.placements.filter(
        (p) => p.assignmentStatus === 'Active'
      ).length;
      totalBillingMonthly = inMemoryData.placements
        .filter((p) => p.assignmentStatus === 'Active')
        .reduce((sum, p) => sum + (Number(p.billingRate) || 5000), 0);
      announcements = inMemoryData.announcements.filter(
        (a) => a.status === 'published'
      );
      activities = inMemoryData.activities;
    }

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
    const { availability, status } = req.query;
    const { page, limit, skip } = parsePagination(req.query, 50, 100);
    const search =
      typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let items = [];
    let total = 0;
    if (isMongoActive()) {
      let query = { isDeleted: { $ne: true } };
      if (safeSearch) {
        query.$or = [
          { name: { $regex: safeSearch, $options: 'i' } },
          { email: { $regex: safeSearch, $options: 'i' } },
          { designation: { $regex: safeSearch, $options: 'i' } },
          { technicalSkills: { $in: [new RegExp(safeSearch, 'i')] } },
        ];
      }
      if (availability && availability !== 'All')
        query.availability = availability;
      if (status && status !== 'All') query.deploymentStatus = status;

      total = await Employee.countDocuments(query);
      items = await Employee.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      if (
        total === 0 &&
        !safeSearch &&
        (!availability || availability === 'All') &&
        (!status || status === 'All')
      ) {
        const fallbackList = inMemoryData.employees || [];
        total = fallbackList.length;
        items = fallbackList.slice(skip, skip + limit);
      }
    } else {
      const filtered = (inMemoryData.employees || []).filter((emp) => {
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
      total = filtered.length;
      items = filtered.slice(skip, skip + limit);
    }

    res.json({
      success: true,
      employees: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createEmployee = async (req, res) => {
  try {
    if (!requireProductionDb(res)) return;
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
    if (!requireProductionDb(res)) return;
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
    if (!requireProductionDb(res)) return;
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
      // Soft-delete employee record (SEC-DB-04)
      await Employee.findOneAndUpdate(query, {
        $set: { isDeleted: true, deletedAt: new Date() },
      });
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
    const cursorPagination = parseCursorPagination(req.query, 50, 100);
    const { page, skip } = parsePagination(req.query, 50, 100);
    const { limit, cursor, isCursorMode } = cursorPagination;
    const view =
      typeof req.query.view === 'string' ? req.query.view.trim() : '';
    const search =
      typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const status =
      typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const workMode =
      typeof req.query.workMode === 'string' ? req.query.workMode.trim() : '';
    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let items = [];
    let total = 0;
    let hasNextPage = false;
    let nextCursor = null;

    // Dedicated Master Candidate Directory mode (Candidates Data tab)
    if (view === 'directory') {
      if (isMongoActive()) {
        let candQuery = { isDeleted: { $ne: true } };
        if (workMode && workMode !== 'All') {
          candQuery.workMode = workMode;
        }
        if (status && status !== 'All') {
          candQuery.status = status;
        }
        if (safeSearch) {
          candQuery.$or = [
            { name: { $regex: safeSearch, $options: 'i' } },
            { email: { $regex: safeSearch, $options: 'i' } },
            { currentRole: { $regex: safeSearch, $options: 'i' } },
            { technicalSkills: { $in: [new RegExp(safeSearch, 'i')] } },
          ];
        }

        total = await Candidate.countDocuments(candQuery);

        if (isCursorMode && cursor) {
          candQuery = buildCursorQuery(candQuery, cursor, 'createdAt', -1);
        }

        const fetchLimit = isCursorMode ? limit + 1 : limit;
        const registeredCandidates = await Candidate.find(candQuery)
          .select(
            'name email phone currentRole jobId jobTitle client rateCard currentCTC ' +
            'relevantExperience currentCompany preferredLocation applicationDate month ' +
            'noticePeriod location technicalSkills experience expectedSalary status workMode ' +
            'assessmentStatus assessmentScore vettingScore fitScore avatarUrl avatarType ' +
            'benchAvatarCode resumeUrl linkedinUrl githubUrl portfolioUrl notes bio createdAt updatedAt'
          )
          .sort({ createdAt: -1, _id: -1 })
          .skip(isCursorMode ? 0 : skip)
          .limit(fetchLimit)
          .lean();

        if (isCursorMode && registeredCandidates.length > limit) {
          hasNextPage = true;
          registeredCandidates.pop();
        }

        const candIds = registeredCandidates.map((c) => c._id);
        const appStatsMap = new Map();
        if (candIds.length > 0) {
          const stats = await JobApplication.aggregate([
            {
              $match: {
                candidate: { $in: candIds },
                isDeleted: { $ne: true },
              },
            },
            {
              $group: {
                _id: '$candidate',
                totalApps: { $sum: 1 },
                activeApps: {
                  $sum: {
                    $cond: [
                      { $in: ['$status', ['Rejected', 'Withdrawn']] },
                      0,
                      1,
                    ],
                  },
                },
              },
            },
          ]);
          stats.forEach((s) => appStatsMap.set(String(s._id), s));
        }

        items = registeredCandidates.map((cand) => {
          const st = appStatsMap.get(String(cand._id)) || {
            totalApps: 0,
            activeApps: 0,
          };
          return {
            id: String(cand._id),
            _id: cand._id,
            candidateId: cand._id,
            name: cand.name,
            email: cand.email,
            phone: cand.phone || '',
            currentRole: cand.currentRole || 'Software Engineer',
            jobId: cand.jobId || '',
            positionApplied:
              cand.positionApplied || cand.jobTitle || 'General Talent Pool',
            jobTitle: cand.jobTitle || 'General Talent Pool',
            client: cand.client || 'Enterprise Partner',
            rateCard: cand.rateCard || '',
            currentCTC: cand.currentCTC || '',
            relevantExperience: cand.relevantExperience || 0,
            currentCompany: cand.currentCompany || '',
            preferredLocation: cand.preferredLocation || '',
            noticePeriod: cand.noticePeriod || 'Immediate',
            workMode: cand.workMode || 'Open to Opportunities',
            location: cand.location || 'Remote',
            technicalSkills: cand.technicalSkills || [],
            experience: cand.experience || 0,
            expectedSalary: cand.expectedSalary || 'Market Standard',
            status: cand.status || 'Applied',
            assessmentStatus: cand.assessmentStatus || 'Not Started',
            assessmentScore: cand.assessmentScore ?? null,
            vettingScore: cand.vettingScore ?? null,
            fitScore: cand.fitScore ?? null,
            avatarUrl: cand.avatarUrl || '',
            avatarType: cand.avatarType || 'initials',
            anonymousCode: cand.benchAvatarCode || 'TW-CAND-01',
            resumeUrl: cand.resumeUrl || '',
            linkedinUrl: cand.linkedinUrl || '',
            githubUrl: cand.githubUrl || '',
            portfolioUrl: cand.portfolioUrl || '',
            notes: cand.notes || cand.bio || '',
            applicationCount: st.totalApps,
            activeApplicationCount: st.activeApps,
            createdAt: cand.createdAt || new Date().toISOString(),
            updatedAt: cand.updatedAt || cand.createdAt,
          };
        });
      } else {
        let filtered = inMemoryData.candidates || [];
        if (workMode && workMode !== 'All') {
          filtered = filtered.filter((c) => c.workMode === workMode);
        }
        if (safeSearch) {
          const s = search.toLowerCase();
          filtered = filtered.filter(
            (cand) =>
              (cand.name || '').toLowerCase().includes(s) ||
              (cand.email || '').toLowerCase().includes(s) ||
              (cand.currentRole || '').toLowerCase().includes(s) ||
              (cand.technicalSkills || []).some((sk) =>
                (sk || '').toLowerCase().includes(s)
              )
          );
        }
        total = filtered.length;
        items = filtered.slice(skip, skip + limit);
      }

      if (isCursorMode) {
        const lastItem = items[items.length - 1];
        if (lastItem) {
          nextCursor = hasNextPage
            ? encodeCursor({
                id: lastItem.id || lastItem._id,
                sortValue: lastItem.createdAt,
              })
            : null;
        }
      } else {
        hasNextPage = page * limit < total;
        if (hasNextPage && items.length > 0) {
          const lastItem = items[items.length - 1];
          nextCursor = encodeCursor({
            id: lastItem.id || lastItem._id,
            sortValue: lastItem.createdAt,
          });
        }
      }

      return res.json({
        success: true,
        candidates: items,
        pagination: {
          total,
          page: isCursorMode ? undefined : page,
          limit,
          totalPages: isCursorMode
            ? undefined
            : Math.ceil(total / limit) || 1,
          cursor: req.query.cursor || null,
          nextCursor,
          hasNextPage,
        },
      });
    }

    if (isMongoActive()) {
      let appQuery = { isDeleted: { $ne: true } };
      if (status && status !== 'All') {
        appQuery.status = status;
      }
      if (safeSearch) {
        appQuery.$or = [
          { candidateName: { $regex: safeSearch, $options: 'i' } },
          { firstName: { $regex: safeSearch, $options: 'i' } },
          { lastName: { $regex: safeSearch, $options: 'i' } },
          { email: { $regex: safeSearch, $options: 'i' } },
          { jobTitle: { $regex: safeSearch, $options: 'i' } },
          { currentEmployer: { $regex: safeSearch, $options: 'i' } },
          { skills: { $in: [new RegExp(safeSearch, 'i')] } },
        ];
      }

      total = await JobApplication.countDocuments(appQuery);

      if (isCursorMode && cursor) {
        appQuery = buildCursorQuery(appQuery, cursor, 'createdAt', -1);
      }

      const fetchLimit = isCursorMode ? limit + 1 : limit;

      // 1. Fetch bounded job applications with lightweight projection (excluding heavy evaluation dossiers)
      let applications = await JobApplication.find(appQuery)
        .select(
          'candidate candidateName firstName lastName email mobileNumber currentEmployer ' +
          'totalExperienceYears relevantExperienceYears expectedCTC status assessmentStatus ' +
          'assessmentScore screeningPassed fitScore fitBadge avatarUrl anonymousCode ' +
          'resumeUrl resumeOriginalName candidateNote notes createdAt updatedAt jobId jobTitle ' +
          'client rateCard currentCTC preferredLocation applicationDate month noticePeriod department location'
        )
        .populate({
          path: 'candidate',
          select:
            'name email phone currentRole status experience avatarUrl avatarType ' +
            'technicalSkills location benchAvatarCode',
        })
        .sort({ createdAt: -1, _id: -1 })
        .skip(isCursorMode ? 0 : skip)
        .limit(fetchLimit)
        .lean();

      if (isCursorMode && applications.length > limit) {
        hasNextPage = true;
        applications.pop();
      }

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
          jobId: app.jobId || (cand && cand.jobId) || '',
          positionApplied:
            app.jobTitle ||
            (cand && cand.positionApplied) ||
            (cand && cand.jobTitle) ||
            'General Technical Position',
          jobTitle,
          client: app.client || (cand && cand.client) || 'Enterprise Partner',
          rateCard: app.rateCard || (cand && cand.rateCard) || '',
          currentCTC: app.currentCTC || (cand && cand.currentCTC) || '',
          relevantExperience: app.relevantExperienceYears
            ? Number(app.relevantExperienceYears) || 0
            : (cand && cand.relevantExperience) || 0,
          currentCompany:
            app.currentEmployer || (cand && cand.currentCompany) || '',
          preferredLocation:
            app.preferredLocation || (cand && cand.preferredLocation) || '',
          applicationDate:
            app.applicationDate || (cand && cand.applicationDate) || '',
          month: app.month || (cand && cand.month) || '',
          noticePeriod:
            app.noticePeriod || (cand && cand.noticePeriod) || 'Immediate',
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
          anonymousCode:
            app.anonymousCode || (cand && cand.benchAvatarCode) || 'TW-ENG-01',
          evaluationReport: null,
          resumeUrl: app.resumeUrl || (cand && cand.resumeUrl) || '',
          resumeOriginalName: app.resumeOriginalName || '',
          notes: app.candidateNote || app.notes || (cand && cand.bio) || '',
          createdAt: app.createdAt || new Date().toISOString(),
          updatedAt: app.updatedAt || app.createdAt,
        };
      });

      items = appItems;

      // If more space in limit and not enough applications, include registered candidates
      if (items.length < limit) {
        const remainingLimit = limit - items.length;
        const candQuery = { isDeleted: { $ne: true } };
        if (safeSearch) {
          candQuery.$or = [
            { name: { $regex: safeSearch, $options: 'i' } },
            { email: { $regex: safeSearch, $options: 'i' } },
            { currentRole: { $regex: safeSearch, $options: 'i' } },
            { technicalSkills: { $in: [new RegExp(safeSearch, 'i')] } },
          ];
        }
        if (status && status !== 'All') candQuery.status = status;

        const registeredCandidates = await Candidate.find(candQuery)
          .select(
            'name email phone currentRole jobId jobTitle client rateCard currentCTC ' +
            'relevantExperience currentCompany preferredLocation applicationDate month ' +
            'noticePeriod location technicalSkills experience expectedSalary status ' +
            'assessmentStatus assessmentScore fitScore avatarUrl avatarType benchAvatarCode ' +
            'resumeUrl notes bio createdAt updatedAt'
          )
          .sort({ createdAt: -1, _id: -1 })
          .limit(remainingLimit + candidatesWithApps.size)
          .lean();

        const registeredOnly = registeredCandidates
          .filter((cand) => !candidatesWithApps.has(String(cand._id)))
          .slice(0, remainingLimit)
          .map((cand) => ({
            id: String(cand._id),
            _id: cand._id,
            candidateId: cand._id,
            name: cand.name,
            email: cand.email,
            phone: cand.phone || '',
            currentRole: cand.currentRole || 'Software Engineer',
            jobId: cand.jobId || '',
            positionApplied:
              cand.positionApplied || cand.jobTitle || 'General Talent Pool',
            jobTitle: cand.jobTitle || 'General Talent Pool',
            client: cand.client || 'Enterprise Partner',
            rateCard: cand.rateCard || '',
            currentCTC: cand.currentCTC || '',
            relevantExperience: cand.relevantExperience || 0,
            currentCompany: cand.currentCompany || '',
            preferredLocation: cand.preferredLocation || '',
            applicationDate: cand.applicationDate || '',
            month: cand.month || '',
            noticePeriod: cand.noticePeriod || 'Immediate',
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

        items = [...items, ...registeredOnly];
      }

      if (items.length === 0 && total === 0 && !safeSearch && (!status || status === 'All')) {
        const fallbackList = inMemoryData.candidates || [];
        total = fallbackList.length;
        items = fallbackList.slice(skip, skip + limit);
      }
    } else {
      let filtered = inMemoryData.candidates || [];
      if (search && search.trim()) {
        const s = search.trim().toLowerCase();
        filtered = filtered.filter((cand) => {
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

      if (status && status !== 'All') {
        filtered = filtered.filter((cand) => cand.status === status);
      }

      total = filtered.length;
      items = filtered.slice(skip, skip + limit);
    }

    if (isCursorMode) {
      const lastItem = items[items.length - 1];
      if (lastItem) {
        nextCursor = hasNextPage
          ? encodeCursor({ id: lastItem.id || lastItem._id, sortValue: lastItem.createdAt })
          : null;
      }
    } else {
      hasNextPage = (page * limit < total);
      if (hasNextPage && items.length > 0) {
        const lastItem = items[items.length - 1];
        nextCursor = encodeCursor({ id: lastItem.id || lastItem._id, sortValue: lastItem.createdAt });
      }
    }

    res.json({
      success: true,
      candidates: items,
      pagination: {
        total,
        page: isCursorMode ? undefined : page,
        limit,
        totalPages: isCursorMode ? undefined : (Math.ceil(total / limit) || 1),
        cursor: req.query.cursor || null,
        nextCursor,
        hasNextPage,
      },
    });
  } catch (err) {
    console.error('getCandidates error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Retrieve Active Job Application Pipeline for Admins (Excludes Rejected & Withdrawn)
 * GET /api/admin/applications
 */
export const getApplicationPipeline = async (req, res) => {
  try {
    const cursorPagination = parseCursorPagination(req.query, 50, 100);
    const { page, skip } = parsePagination(req.query, 50, 100);
    const { limit, cursor, isCursorMode } = cursorPagination;
    const search =
      typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const status =
      typeof req.query.status === 'string' ? req.query.status.trim() : '';
    const jobId =
      typeof req.query.jobId === 'string' ? req.query.jobId.trim() : '';
    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const ACTIVE_PIPELINE_STAGES = [
      'Applied',
      'Screening',
      'Interview',
      'Offered',
      'Hired',
    ];
    const CLOSED_STAGES = ['Rejected', 'Withdrawn'];

    // Closed applications never appear in the active application pipeline
    if (status && CLOSED_STAGES.includes(status)) {
      return res.json({
        success: true,
        applications: [],
        candidates: [],
        pagination: {
          total: 0,
          page: isCursorMode ? undefined : page,
          limit,
          totalPages: isCursorMode ? undefined : 1,
          cursor: null,
          nextCursor: null,
          hasNextPage: false,
        },
      });
    }

    let items = [];
    let total = 0;
    let hasNextPage = false;
    let nextCursor = null;

    if (isMongoActive()) {
      let appQuery = {
        isDeleted: { $ne: true },
        status: { $nin: CLOSED_STAGES },
      };

      if (status && status !== 'All' && ACTIVE_PIPELINE_STAGES.includes(status)) {
        appQuery.status = status;
      }
      if (jobId) {
        appQuery.jobId = jobId;
      }
      if (safeSearch) {
        appQuery.$or = [
          { candidateName: { $regex: safeSearch, $options: 'i' } },
          { firstName: { $regex: safeSearch, $options: 'i' } },
          { lastName: { $regex: safeSearch, $options: 'i' } },
          { email: { $regex: safeSearch, $options: 'i' } },
          { jobTitle: { $regex: safeSearch, $options: 'i' } },
          { currentEmployer: { $regex: safeSearch, $options: 'i' } },
          { skills: { $in: [new RegExp(safeSearch, 'i')] } },
        ];
      }

      total = await JobApplication.countDocuments(appQuery);

      if (isCursorMode && cursor) {
        appQuery = buildCursorQuery(appQuery, cursor, 'createdAt', -1);
      }

      const fetchLimit = isCursorMode ? limit + 1 : limit;
      const applications = await JobApplication.find(appQuery)
        .select(
          'candidate candidateName firstName lastName email mobileNumber currentEmployer ' +
          'totalExperienceYears relevantExperienceYears expectedCTC status assessmentStatus ' +
          'assessmentScore screeningPassed fitScore fitBadge avatarUrl anonymousCode ' +
          'resumeUrl resumeOriginalName candidateNote notes createdAt updatedAt jobId jobTitle ' +
          'client rateCard currentCTC preferredLocation applicationDate month noticePeriod department location skills'
        )
        .populate({
          path: 'candidate',
          select:
            'name email phone currentRole status experience avatarUrl avatarType ' +
            'technicalSkills location benchAvatarCode vettingScore',
        })
        .sort({ createdAt: -1, _id: -1 })
        .skip(isCursorMode ? 0 : skip)
        .limit(fetchLimit)
        .lean();

      if (isCursorMode && applications.length > limit) {
        hasNextPage = true;
        applications.pop();
      }

      items = applications.map((app) => {
        const cand =
          app.candidate && typeof app.candidate === 'object'
            ? app.candidate
            : null;
        const candidateName =
          (
            app.candidateName || `${app.firstName || ''} ${app.lastName || ''}`
          ).trim() ||
          (cand && cand.name) ||
          'Applicant Candidate';

        return {
          id: String(app._id),
          _id: app._id,
          applicationId: app._id,
          candidateId: cand ? cand._id : app.candidate,
          name: candidateName,
          email: app.email || (cand && cand.email) || '',
          phone: app.mobileNumber || (cand && cand.phone) || '',
          currentRole:
            app.currentEmployer ||
            (cand && cand.currentRole) ||
            'Software Engineer',
          jobId: app.jobId || '',
          positionApplied: app.jobTitle || 'General Technical Position',
          jobTitle: app.jobTitle || 'General Technical Position',
          client: app.client || 'Enterprise Partner',
          rateCard: app.rateCard || '',
          currentCTC: app.currentCTC || '',
          relevantExperience: app.relevantExperienceYears
            ? Number(app.relevantExperienceYears) || 0
            : 0,
          currentCompany: app.currentEmployer || '',
          preferredLocation: app.preferredLocation || '',
          applicationDate: app.applicationDate || '',
          month: app.month || '',
          noticePeriod: app.noticePeriod || 'Immediate',
          department: app.department || 'Engineering',
          location:
            app.location ||
            (cand && cand.location) ||
            'Remote',
          technicalSkills:
            app.skills && app.skills.length > 0
              ? app.skills
              : (cand && cand.technicalSkills) || [],
          experience: app.totalExperienceYears
            ? Number(app.totalExperienceYears) || app.totalExperienceYears
            : (cand && cand.experience) || 0,
          expectedSalary: app.expectedCTC || 'Market Standard',
          status: app.status || 'Applied',
          assessmentStatus: app.assessmentStatus || 'Not Started',
          assessmentScore:
            app.assessmentScore !== undefined && app.assessmentScore !== null
              ? app.assessmentScore
              : cand && cand.assessmentScore,
          vettingScore: cand && cand.vettingScore,
          screeningPassed: app.screeningPassed ?? false,
          fitScore: app.fitScore || 85,
          fitBadge: app.fitBadge || 'Top Match',
          avatarUrl: app.avatarUrl || (cand && cand.avatarUrl) || '',
          avatarType: (cand && cand.avatarType) || 'initials',
          anonymousCode:
            app.anonymousCode || (cand && cand.benchAvatarCode) || 'TW-ENG-01',
          resumeUrl: app.resumeUrl || '',
          resumeOriginalName: app.resumeOriginalName || '',
          notes: app.candidateNote || app.notes || '',
          createdAt: app.createdAt || new Date().toISOString(),
          updatedAt: app.updatedAt || app.createdAt,
        };
      });
    } else {
      let filtered = (inMemoryData.candidates || []).filter(
        (c) => !CLOSED_STAGES.includes(c.status)
      );
      if (status && status !== 'All' && ACTIVE_PIPELINE_STAGES.includes(status)) {
        filtered = filtered.filter((c) => c.status === status);
      }
      if (safeSearch) {
        const s = search.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            (c.name || '').toLowerCase().includes(s) ||
            (c.email || '').toLowerCase().includes(s) ||
            (c.jobTitle || '').toLowerCase().includes(s)
        );
      }
      total = filtered.length;
      items = filtered.slice(skip, skip + limit);
    }

    if (isCursorMode) {
      const lastItem = items[items.length - 1];
      if (lastItem) {
        nextCursor = hasNextPage
          ? encodeCursor({
              id: lastItem.id || lastItem._id,
              sortValue: lastItem.createdAt,
            })
          : null;
      }
    } else {
      hasNextPage = page * limit < total;
      if (hasNextPage && items.length > 0) {
        const lastItem = items[items.length - 1];
        nextCursor = encodeCursor({
          id: lastItem.id || lastItem._id,
          sortValue: lastItem.createdAt,
        });
      }
    }

    return res.json({
      success: true,
      applications: items,
      candidates: items,
      pagination: {
        total,
        page: isCursorMode ? undefined : page,
        limit,
        totalPages: isCursorMode ? undefined : Math.ceil(total / limit) || 1,
        cursor: req.query.cursor || null,
        nextCursor,
        hasNextPage,
      },
    });
  } catch (err) {
    console.error('getApplicationPipeline error:', err);
    return res.status(500).json({ success: false, error: err.message });
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

    if (dossier && !dossier.scores) {
      const dualScoreReport = buildDualScoreReport({
        resumeScore: dossier.overallMatchScore || application?.fitScore || 85,
        assessmentScore: application?.assessmentScore ?? candidate?.assessmentScore ?? 85,
        assessmentData: application?.assessment || {},
        candidateAnswers: application?.draftAnswers || {},
        evalResult: {
          total_score: application?.assessmentScore ?? candidate?.assessmentScore ?? 85,
          passed: (application?.assessmentScore ?? candidate?.assessmentScore ?? 85) >= 75,
        },
      });
      dossier.scores = dualScoreReport.scores;
      if (!dossier.assessmentAudit && dualScoreReport.assessmentAudit) {
        dossier.assessmentAudit = dualScoreReport.assessmentAudit;
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

    const dualScoreReport = buildDualScoreReport({
      resumeScore: updatedDossier.overallMatchScore || 85,
      assessmentScore: application?.assessmentScore ?? candidate?.assessmentScore ?? 85,
      assessmentData: application?.assessment || {},
      candidateAnswers: application?.draftAnswers || {},
      recruiterScreenScore: recruiterNotes && recruiterNotes.trim().length > 15 ? 88 : 80,
      evalResult: {
        total_score: application?.assessmentScore ?? candidate?.assessmentScore ?? 85,
        passed: (application?.assessmentScore ?? candidate?.assessmentScore ?? 85) >= 75,
      },
    });
    updatedDossier.scores = dualScoreReport.scores;
    updatedDossier.assessmentAudit = dualScoreReport.assessmentAudit;

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
    if (!requireProductionDb(res)) return;
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
    if (!requireProductionDb(res)) return;
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
    if (!requireProductionDb(res)) return;
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
    const userRole = (req.user?.role || '').toLowerCase();
    if (userRole === 'cms_admin') {
      return res.status(403).json({
        success: false,
        error:
          'Access denied: CMS Administrators are restricted from deleting candidate records (RBAC_CMS_ADMIN_RESTRICTED).',
      });
    }
    if (!requireProductionDb(res)) return;
    const { id } = req.params;

    inMemoryData.candidates = inMemoryData.candidates.filter(
      (c) => c.id !== id && String(c._id) !== id
    );

    if (isMongoActive()) {
      const deletionPayload = { $set: { isDeleted: true, deletedAt: new Date() } };
      if (mongoose.Types.ObjectId.isValid(id)) {
        const app = await JobApplication.findByIdAndUpdate(id, deletionPayload);
        if (!app) {
          await Candidate.findByIdAndUpdate(id, deletionPayload);
        }
      } else {
        await Candidate.findOneAndUpdate({ id }, deletionPayload);
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
    const { industry, status } = req.query;
    const { page, limit, skip } = parsePagination(req.query, 50, 100);
    const search =
      typeof req.query.search === 'string' ? req.query.search.trim() : '';

    let items = [];
    let total = 0;
    if (isMongoActive()) {
      let query = { isDeleted: { $ne: true } };
      if (search) {
        const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        query.$or = [
          { companyName: { $regex: safeSearch, $options: 'i' } },
          { contactPerson: { $regex: safeSearch, $options: 'i' } },
          { email: { $regex: safeSearch, $options: 'i' } },
        ];
      }
      if (industry && industry !== 'All') query.industry = industry;
      if (status && status !== 'All') query.status = status;

      total = await Client.countDocuments(query);
      items = await Client.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      if (
        total === 0 &&
        !search &&
        (!industry || industry === 'All') &&
        (!status || status === 'All')
      ) {
        const fallbackList = inMemoryData.clients || [];
        total = fallbackList.length;
        items = fallbackList.slice(skip, skip + limit);
      }
    } else {
      const filtered = inMemoryData.clients.filter((cli) => {
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
      total = filtered.length;
      items = filtered.slice(skip, skip + limit);
    }

    res.json({
      success: true,
      clients: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createClient = async (req, res) => {
  try {
    if (!requireProductionDb(res)) return;
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
    if (!requireProductionDb(res)) return;
    const { id } = req.params;
    const {
      companyName,
      contactPerson,
      email,
      phone,
      industry,
      status,
      location,
      contractType,
      notes,
      activeOpenings,
      tier,
      accountManager,
    } = req.body || {};

    const safeUpdates = {};
    if (companyName !== undefined) safeUpdates.companyName = String(companyName).trim();
    if (contactPerson !== undefined) safeUpdates.contactPerson = String(contactPerson).trim();
    if (email !== undefined) safeUpdates.email = String(email).toLowerCase().trim();
    if (phone !== undefined) safeUpdates.phone = String(phone).trim();
    if (industry !== undefined) safeUpdates.industry = String(industry).trim();
    if (status !== undefined) safeUpdates.status = String(status).trim();
    if (location !== undefined) safeUpdates.location = String(location).trim();
    if (contractType !== undefined) safeUpdates.contractType = String(contractType).trim();
    if (notes !== undefined) safeUpdates.notes = String(notes);
    if (activeOpenings !== undefined) safeUpdates.activeOpenings = Number(activeOpenings) || 0;
    if (tier !== undefined) safeUpdates.tier = String(tier).trim();
    if (accountManager !== undefined) safeUpdates.accountManager = String(accountManager).trim();

    const idx = inMemoryData.clients.findIndex(
      (c) => c.id === id || String(c._id) === id
    );
    if (idx !== -1) {
      inMemoryData.clients[idx] = {
        ...inMemoryData.clients[idx],
        ...safeUpdates,
        updatedAt: new Date().toISOString(),
      };
    }

    if (isMongoActive()) {
      const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
      await Client.findOneAndUpdate(
        query,
        { $set: safeUpdates },
        { new: true, runValidators: true }
      );
    }

    await logActivity(
      'Client Updated',
      'Client',
      id,
      `Updated information for ${safeUpdates.companyName || inMemoryData.clients[idx]?.companyName || 'client'}.`,
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
    if (!requireProductionDb(res)) return;
    const { id } = req.params;

    inMemoryData.clients = inMemoryData.clients.filter(
      (c) => c.id !== id && String(c._id) !== id
    );

    if (isMongoActive()) {
      const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
      // Soft-delete client record (SEC-DB-04)
      await Client.findOneAndUpdate(query, {
        $set: { isDeleted: true, deletedAt: new Date() },
      });
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
    const { priority, status, industry, jobMode, type, category } =
      req.query;
    const { page, limit, skip } = parsePagination(req.query, 50, 100);
    const search =
      typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let items = [];
    let total = 0;
    if (isMongoActive()) {
      let query = { isDeleted: { $ne: true } };
      if (safeSearch) {
        query.$or = [
          { title: { $regex: safeSearch, $options: 'i' } },
          { client: { $regex: safeSearch, $options: 'i' } },
          { contactPerson: { $regex: safeSearch, $options: 'i' } },
          { contactEmail: { $regex: safeSearch, $options: 'i' } },
          { description: { $regex: safeSearch, $options: 'i' } },
          { requirements: { $regex: safeSearch, $options: 'i' } },
          { requiredSkills: { $in: [new RegExp(safeSearch, 'i')] } },
          { industry: { $regex: safeSearch, $options: 'i' } },
          { jobMode: { $regex: safeSearch, $options: 'i' } },
          { workMode: { $regex: safeSearch, $options: 'i' } },
          { officeLocation: { $regex: safeSearch, $options: 'i' } },
          { location: { $regex: safeSearch, $options: 'i' } },
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

      total = await JobRequirement.countDocuments(query);
      items = await JobRequirement.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      if (
        total === 0 &&
        !safeSearch &&
        (!status || status === 'All') &&
        (!category || category === 'All')
      ) {
        const fallbackList = inMemoryData.jobs || [];
        total = fallbackList.length;
        items = fallbackList.slice(skip, skip + limit);
      }
    } else {
      const filtered = (inMemoryData.jobs || []).filter((j) => {
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
      total = filtered.length;
      items = filtered.slice(skip, skip + limit);
    }

    res.json({
      success: true,
      jobs: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createJob = async (req, res) => {
  try {
    if (!requireProductionDb(res)) return;
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

export const bulkImportJobs = async (req, res) => {
  try {
    if (!requireProductionDb(res)) return;
    const { jobs } = req.body;
    if (!Array.isArray(jobs) || jobs.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No jobs payload provided.',
        count: 0,
        importedJobs: [],
      });
    }

    const importedJobs = [];
    const now = Date.now();

    for (let i = 0; i < jobs.length; i++) {
      try {
        const item = jobs[i];
        if (!item || typeof item !== 'object') continue;

        // Auto-heal missing or mistyped values gracefully
        const title = String(item.title || item.role || item.position || '').trim() || 'Senior Software Engineer';
        const client = String(item.client || item.company || '').trim() || 'Enterprise Partner';

        const skillsArray = Array.isArray(item.requiredSkills)
          ? item.requiredSkills
          : typeof item.requiredSkills === 'string'
            ? item.requiredSkills
                .split(/[,;|]/)
                .map((s) => s.trim())
                .filter(Boolean)
            : Array.isArray(item.skills)
              ? item.skills
              : [];

        const jobRecord = {
          id: `job_${now}_${i}`,
          jobId: item.jobId ? String(item.jobId).trim() : `JOB-${(now + i).toString().slice(-5)}`,
          title,
          client,
          industry: item.industry || 'Information Technology & Cloud',
          jobMode: item.jobMode || 'Permanent',
          workMode: item.workMode || 'Work From Office',
          officeLocation: item.officeLocation || '',
          location:
            item.workMode === 'Work From Office' && item.officeLocation
              ? item.officeLocation
              : item.location ||
                (item.workMode === 'Work From Home'
                  ? 'Remote (India/US)'
                  : 'Hybrid'),
          noticePeriod: item.noticePeriod || 'Immediate',
          noticePeriodOther: item.noticePeriodOther || '',
          requiredSkills: skillsArray,
          skills: skillsArray,
          experienceRequired: Number(item.experienceRequired) || 3,
          openingsCount: Number(item.openingsCount) || 1,
          fulfilledCount: 0,
          priority: item.priority || 'High',
          status: item.status || 'Open',
          budget: item.budget || '',
          description: item.description || '',
          requirements: item.requirements || '',
          isRequisition: false,
          category: 'Staffing Requirement',
          source: 'Bulk Import',
          jobCreationDate:
            item.jobCreationDate ||
            item.creationDate ||
            new Date().toISOString().split('T')[0],
          expectedJoiningDate:
            item.expectedJoiningDate || item.joiningDate || '',
          createdAt:
            item.jobCreationDate ||
            item.creationDate ||
            new Date().toISOString(),
        };

        importedJobs.push(jobRecord);
      } catch (rowErr) {
        console.warn(`[bulkImportJobs] Skipping malformed row #${i}:`, rowErr.message);
      }
    }

    if (importedJobs.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No valid job records could be processed from payload.',
        count: 0,
        importedJobs: [],
      });
    }

    // Prepend to in-memory store
    inMemoryData.jobs = inMemoryData.jobs || [];
    inMemoryData.jobs.unshift(...importedJobs);

    // Persist to MongoDB
    if (isMongoActive()) {
      await JobRequirement.insertMany(importedJobs);
    }

    await logActivity(
      'Bulk Imported Jobs',
      'Jobs',
      `bulk_${now}`,
      `Imported ${importedJobs.length} job requirements via Excel/CSV.`,
      req.user,
      '#10B981'
    );

    res.status(201).json({
      success: true,
      message: `Successfully imported ${importedJobs.length} job requirements.`,
      count: importedJobs.length,
      importedJobs,
    });
  } catch (err) {
    console.error('bulkImportJobs error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const bulkImportCandidates = async (req, res) => {
  try {
    if (!requireProductionDb(res)) return;
    const { candidates, updateExisting = false } = req.body;
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No candidates payload provided.',
        count: 0,
        importedCandidates: [],
        skippedEmails: [],
      });
    }

    const importedCandidates = [];
    const skippedEmails = [];
    const now = Date.now();

    // Generate secure random default password hash for database schema integrity (NO password in file!)
    const autoPasswordHash = await hashPassword(
      'Thinkwires@' + Math.random().toString(36).slice(-6)
    );

    for (let i = 0; i < candidates.length; i++) {
      try {
        const item = candidates[i];
        if (!item || typeof item !== 'object') continue;

        // Auto-heal missing or mistyped identity fields so no row is dropped
        let email = String(item.email || '').toLowerCase().trim();
        let name = String(item.name || '').trim();
        const phone = String(item.phone || item.contactNo || '').trim();
        const jobId = item.jobId ? String(item.jobId).trim() : '';
        const positionApplied = String(
          item.positionApplied || item.jobTitle || item.role || item.position || ''
        ).trim();

        if (!email) {
          const safeName = (name || 'candidate').toLowerCase().replace(/[^a-z0-9]/g, '.');
          email = `${safeName}_${now}_${i + 1}@imported.thinkwires.com`;
        }

        if (!name) {
          const nameGuess = email.split('@')[0].replace(/[._]/g, ' ');
          name = nameGuess.charAt(0).toUpperCase() + nameGuess.slice(1);
        }

        // Duplicate check against existing in-memory / MongoDB
        let existingInDb = null;
        if (isMongoActive()) {
          existingInDb = await Candidate.findOne({ email });
        } else {
          existingInDb = (inMemoryData.candidates || []).find(
            (c) => (c.email || '').toLowerCase() === email
          );
        }

        const rawSkills = item.primarySkill || item.technicalSkills || '';
        const skillsArray = Array.isArray(rawSkills)
          ? rawSkills
          : typeof rawSkills === 'string'
            ? rawSkills
                .split(/[,;|]/)
                .map((s) => s.trim())
                .filter(Boolean)
            : [];

        const candidateRecord = {
          name,
          email,
          phone,
          password: autoPasswordHash,
          jobId,
          positionApplied: positionApplied || 'Lead Full Stack & Frontend Engineer',
          jobTitle: positionApplied || item.currentRole || 'Lead Full Stack & Frontend Engineer',
          currentRole:
            item.currentRole ||
            positionApplied ||
            (skillsArray[0]
              ? `${skillsArray[0]} Engineer`
              : 'Software Engineer'),
          technicalSkills: skillsArray,
          experience: Number(item.totalExperience || item.experience) || 0,
          relevantExperience: Number(item.relevantExperience) || 0,
          expectedSalary:
            item.expectedCTC || item.expectedSalary || 'Market Standard',
          currentCTC: item.currentCTC || item.ctc || '',
          location: item.currentLocation || item.location || '',
          preferredLocation: item.preferredLocation || '',
          currentCompany: item.currentCompany || '',
          client: item.client || 'Enterprise Partner',
          rateCard: item.rateCard || '',
          noticePeriod: item.noticePeriod || 'Immediate',
          applicationDate:
            item.applicationDate || new Date().toISOString().split('T')[0],
          month:
            item.month ||
            new Date().toLocaleString('default', {
              month: 'long',
              year: 'numeric',
            }),
          workMode: item.mode || 'Full-Time Looking',
          status: item.status || 'Applied',
          notes: item.notes || item.candidateNotes || '',
          createdAt: new Date().toISOString(),
        };

        if (existingInDb) {
          if (updateExisting) {
            if (isMongoActive()) {
              await Candidate.updateOne({ email }, { $set: candidateRecord });
              await JobApplication.updateMany(
                { email },
                {
                  $set: {
                    ...(candidateRecord.jobId ? { jobId: candidateRecord.jobId } : {}),
                    ...(candidateRecord.positionApplied ? { jobTitle: candidateRecord.positionApplied } : {}),
                    skills: skillsArray,
                    client: candidateRecord.client,
                  },
                }
              );
            }
            const idx = (inMemoryData.candidates || []).findIndex(
              (c) => (c.email || '').toLowerCase() === email
            );
            if (idx !== -1) {
              inMemoryData.candidates[idx] = {
                ...inMemoryData.candidates[idx],
                ...candidateRecord,
              };
            }
            importedCandidates.push({ ...candidateRecord, updated: true });
          } else {
            skippedEmails.push(email);
          }
        } else {
          candidateRecord.id = `cand_${now}_${i}`;
          if (isMongoActive()) {
            const createdDoc = await Candidate.create(candidateRecord);
            candidateRecord._id = createdDoc._id;

            // Create associated intake JobApplication record in ATS
            await JobApplication.create({
              candidate: createdDoc._id,
              jobId: candidateRecord.jobId || 'direct-admin-intake',
              jobTitle:
                candidateRecord.positionApplied ||
                candidateRecord.jobTitle ||
                candidateRecord.currentRole,
              candidateName: name,
              email,
              mobileNumber: phone,
              lastName: name.split(' ').slice(1).join(' ') || name,
              firstName: name.split(' ')[0],
              status: candidateRecord.status || 'Applied',
              skills: skillsArray,
              totalExperienceYears: String(candidateRecord.experience || 0),
              relevantExperienceYears: String(
                candidateRecord.relevantExperience || 0
              ),
              currentEmployer: candidateRecord.currentCompany,
              currentCTC: candidateRecord.currentCTC,
              expectedCTC: candidateRecord.expectedSalary,
              city: candidateRecord.location,
              client: candidateRecord.client,
              rateCard: candidateRecord.rateCard,
              preferredLocation: candidateRecord.preferredLocation,
              applicationDate: candidateRecord.applicationDate,
              month: candidateRecord.month,
              noticePeriod: candidateRecord.noticePeriod,
              candidateNote: candidateRecord.notes,
            });
          }
          inMemoryData.candidates = inMemoryData.candidates || [];
          inMemoryData.candidates.unshift(candidateRecord);
          importedCandidates.push(candidateRecord);
        }
      } catch (rowErr) {
        console.warn(`[bulkImportCandidates] Skipping malformed row #${i}:`, rowErr.message);
      }
    }

    if (importedCandidates.length === 0 && skippedEmails.length > 0) {
      return res.status(200).json({
        success: true,
        message: `All ${skippedEmails.length} candidates were skipped because their emails already exist in the database.`,
        importedCount: 0,
        skippedCount: skippedEmails.length,
        skippedEmails,
      });
    }

    await logActivity(
      'Bulk Imported Candidates',
      'ATS',
      `bulk_${now}`,
      `Imported ${importedCandidates.length} candidates (${skippedEmails.length} skipped duplicates).`,
      req.user,
      '#7C3AED'
    );

    res.status(201).json({
      success: true,
      message: `Successfully imported ${importedCandidates.length} candidate(s). ${skippedEmails.length > 0 ? `(${skippedEmails.length} existing duplicate(s) skipped)` : ''}`,
      importedCount: importedCandidates.length,
      skippedCount: skippedEmails.length,
      skippedEmails,
      importedCandidates,
    });
  } catch (err) {
    console.error('bulkImportCandidates error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateJob = async (req, res) => {
  try {
    if (!requireProductionDb(res)) return;
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
    const userRole = (req.user?.role || '').toLowerCase();
    if (userRole === 'cms_admin') {
      return res.status(403).json({
        success: false,
        error:
          'Access denied: CMS Administrators are restricted from deleting recruitment mandates (RBAC_CMS_ADMIN_RESTRICTED).',
      });
    }
    if (!requireProductionDb(res)) return;
    const { id } = req.params;

    inMemoryData.jobs = (inMemoryData.jobs || []).filter(
      (j) => j.id !== id && String(j._id) !== id && j.jobId !== id
    );

    if (isMongoActive()) {
      const query = mongoose.Types.ObjectId.isValid(id)
        ? { $or: [{ _id: id }, { id }, { jobId: id }] }
        : { $or: [{ id }, { jobId: id }] };
      // Soft-delete job requirement (SEC-DB-04)
      await JobRequirement.findOneAndUpdate(query, {
        $set: { isDeleted: true, deletedAt: new Date() },
      });
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

  const isScoping = Boolean(
    reqData.isScopingCall ||
    reqData.requestType === 'scoping_call' ||
    (jobDescription && jobDescription.includes('[Scoping Call Request]')) ||
    (engagementModel && engagementModel.includes('Enterprise Consultation')) ||
    reqData.consultationDate
  );

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
    isScopingCall: isScoping,
    consultationDate: reqData.consultationDate || null,
    consultationTime: reqData.consultationTime || null,
    domain: reqData.domain || null,
    scopeNotes: reqData.scopeNotes || null,
    description:
      jobDescription ||
      `Enterprise talent mandate for ${headcount || 1}x ${targetRole} (${seniority || 'Senior'}) by ${company} (${fullName} - ${corporateEmail}). 5-Hour Candidate Dossier SLA active.`,
    requirements: `Required Technologies: ${skillsArray.join(', ')}. Deployment model: ${engagementModel}.`,
    category: isScoping ? 'Enterprise Scoping' : 'Client Requisition',
    source: isScoping ? 'Homepage Scoping Intake' : 'Client Inbound Requisition',
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
    isScoping ? 'Technical Scoping Call Scheduled' : 'Staffing Requisition Inbound Request',
    'Job',
    newRequisition.id,
    isScoping
      ? `Technical scoping call scheduled with ${company} (${fullName}) for ${reqData.consultationDate || 'Immediate'} (${reqData.consultationTime || 'TBD'}). Domain: ${reqData.domain || newRequisition.title}.`
      : `Inbound candidate requisition received from ${company} (${fullName}) for ${newRequisition.openingsCount}x ${newRequisition.title}. Urgency: ${newRequisition.priority}.`,
    { name: fullName || 'Enterprise Client', role: 'client' },
    isScoping ? '#2563EB' : '#7C3AED'
  );

  return newRequisition;
};

// ============================================================================
// 6. PLACEMENTS CRUD
// ============================================================================
export const getPlacements = async (req, res) => {
  try {
    const role = (req.user?.role || '').toLowerCase();
    const { page, limit, skip } = parsePagination(req.query, 50, 100);
    const query = { isDeleted: { $ne: true } };
    let items = [];
    let total = 0;
    if (isMongoActive()) {
      total = await Placement.countDocuments(query);
      items = await Placement.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      if (items.length === 0 && total === 0) {
        items = inMemoryData.placements.slice(skip, skip + limit);
        total = inMemoryData.placements.length;
      }
    } else {
      total = inMemoryData.placements.length;
      items = inMemoryData.placements.slice(skip, skip + limit);
    }
    if (role === 'cms_admin') {
      items = items.map((p) => {
        const item = typeof p.toObject === 'function' ? p.toObject() : { ...p };
        delete item.billingRate;
        delete item.grossMargin;
        return item;
      });
    }
    res.json({
      success: true,
      placements: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createPlacement = async (req, res) => {
  try {
    if (!requireProductionDb(res)) return;
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
    if (!requireProductionDb(res)) return;
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
    if (!requireProductionDb(res)) return;
    const { id } = req.params;

    inMemoryData.placements = inMemoryData.placements.filter(
      (p) => p.id !== id && String(p._id) !== id
    );

    if (isMongoActive()) {
      const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { id };
      // Soft-delete placement record (SEC-DB-04)
      await Placement.findOneAndUpdate(query, {
        $set: { isDeleted: true, deletedAt: new Date() },
      });
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
    const { page, limit, skip } = parsePagination(req.query, 50, 100);
    let items = [];
    let total = 0;
    if (isMongoActive()) {
      total = await Page.countDocuments({ isDeleted: { $ne: true } });
      items = await Page.find({ isDeleted: { $ne: true } })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      if (items.length === 0 && total === 0) {
        items = inMemoryData.pages.slice(skip, skip + limit);
        total = inMemoryData.pages.length;
      }
    } else {
      total = inMemoryData.pages.length;
      items = inMemoryData.pages.slice(skip, skip + limit);
    }
    res.json({
      success: true,
      pages: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
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
      await Page.findOneAndUpdate(query, {
        $set: { isDeleted: true, deletedAt: new Date() },
      });
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
    const { category, status } = req.query;
    const { page, limit, skip } = parsePagination(req.query, 50, 100);
    const search =
      typeof req.query.search === 'string' ? req.query.search.trim() : '';

    const result = await articlesStore.getCmsArticles({
      search,
      category,
      status,
      page,
      limit,
      skip,
    });
    inMemoryData.articles = inMemoryArticles;

    const items = Array.isArray(result) ? result : result.items || [];
    const total =
      typeof result.total === 'number'
        ? result.total
        : inMemoryArticles.length;

    res.json({
      success: true,
      articles: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createCmsArticle = async (req, res) => {
  try {
    const newArt = await articlesStore.createArticle(req.body, req.user);
    inMemoryData.articles = inMemoryArticles;

    await logActivity(
      'Created Blog Article',
      'CMS',
      newArt.id,
      `Authored article '${newArt.title}'.`,
      req.user,
      '#8064D8'
    );

    res.status(201).json({
      success: true,
      message: 'Article created successfully',
      article: newArt,
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

export const updateCmsArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await articlesStore.updateArticle(id, req.body, req.user);
    inMemoryData.articles = inMemoryArticles;

    await logActivity(
      'Updated Article',
      'CMS',
      id,
      `Updated blog post '${updated.title}'.`,
      req.user,
      '#8064D8'
    );

    res.json({
      success: true,
      message: 'Article updated successfully',
      article: updated,
    });
  } catch (err) {
    const statusCode = err.message === 'Article not found.' ? 404 : 400;
    res.status(statusCode).json({ success: false, error: err.message });
  }
};

export const togglePublishCmsArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { article, newStatus } = await articlesStore.togglePublishArticle(id, req.user);
    inMemoryData.articles = inMemoryArticles;

    await logActivity(
      'Article Status Toggled',
      'CMS',
      id,
      `Article '${article.title}' marked as ${newStatus}.`,
      req.user,
      '#8064D8'
    );

    res.json({
      success: true,
      message: `Article status changed to ${newStatus}`,
      status: newStatus,
      article,
    });
  } catch (err) {
    const statusCode = err.message === 'Article not found.' ? 404 : 400;
    res.status(statusCode).json({ success: false, error: err.message });
  }
};

export const deleteCmsArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await articlesStore.deleteArticle(id, req.user);
    inMemoryData.articles = inMemoryArticles;

    await logActivity(
      'Deleted Article',
      'CMS',
      id,
      `Removed blog post '${deleted.title || id}'.`,
      req.user,
      '#DC2626'
    );

    res.json({ success: true, message: 'Article deleted successfully' });
  } catch (err) {
    const statusCode = err.message === 'Article not found.' ? 404 : 400;
    res.status(statusCode).json({ success: false, error: err.message });
  }
};

// ============================================================================
// 9. CMS - MEDIA LIBRARY
// ============================================================================
export const getCmsMedia = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, 50, 100);
    let items = [];
    let total = 0;
    if (isMongoActive()) {
      total = await Media.countDocuments({ isDeleted: { $ne: true } });
      items = await Media.find({ isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      if (items.length === 0 && total === 0) {
        items = inMemoryData.media.slice(skip, skip + limit);
        total = inMemoryData.media.length;
      }
    } else {
      total = inMemoryData.media.length;
      items = inMemoryData.media.slice(skip, skip + limit);
    }
    res.json({
      success: true,
      media: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
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
      await Media.findOneAndUpdate(query, {
        $set: { isDeleted: true, deletedAt: new Date() },
      });
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
      ? await Page.find().limit(100).lean()
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
    const { page, limit, skip } = parsePagination(req.query, 50, 100);
    let items = [];
    let total = 0;
    if (isMongoActive()) {
      total = await Announcement.countDocuments({ isDeleted: { $ne: true } });
      items = await Announcement.find({ isDeleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      if (items.length === 0 && total === 0) {
        items = inMemoryData.announcements.slice(skip, skip + limit);
        total = inMemoryData.announcements.length;
      }
    } else {
      total = inMemoryData.announcements.length;
      items = inMemoryData.announcements.slice(skip, skip + limit);
    }
    res.json({
      success: true,
      announcements: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
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
      await Announcement.findOneAndUpdate(query, {
        $set: { isDeleted: true, deletedAt: new Date() },
      });
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
    let pages = [];
    let articles = [];
    let media = [];
    let announcements = [];
    let totalPages = 0;
    let publishedPages = 0;
    let draftPages = 0;
    let totalArticles = 0;
    let publishedArticles = 0;
    let draftArticles = 0;
    let totalMedia = 0;
    let totalAnnouncements = 0;
    let recentUpdates = [];

    if (isMongoActive()) {
      const [
        pgCount,
        pgPubCount,
        artCount,
        artPubCount,
        medCount,
        annCount,
        recentPages,
        recentArts,
        annList,
      ] = await Promise.all([
        Page.countDocuments({ isDeleted: { $ne: true } }),
        Page.countDocuments({ status: 'published', isDeleted: { $ne: true } }),
        Article.countDocuments({ isDeleted: { $ne: true } }),
        Article.countDocuments({
          status: 'published',
          isDeleted: { $ne: true },
        }),
        Media.countDocuments({ isDeleted: { $ne: true } }),
        Announcement.countDocuments({ isDeleted: { $ne: true } }),
        Page.find({ isDeleted: { $ne: true } })
          .select('title slug status lastUpdatedBy author updatedAt createdAt')
          .sort({ updatedAt: -1 })
          .limit(6)
          .lean(),
        Article.find({ isDeleted: { $ne: true } })
          .select('title slug status lastUpdatedBy author updatedAt createdAt')
          .sort({ updatedAt: -1 })
          .limit(6)
          .lean(),
        Announcement.find({ status: 'published', isDeleted: { $ne: true } })
          .sort({ createdAt: -1 })
          .limit(5)
          .lean(),
      ]);

      totalPages = pgCount;
      publishedPages = pgPubCount;
      draftPages = Math.max(0, pgCount - pgPubCount);
      totalArticles = artCount;
      publishedArticles = artPubCount;
      draftArticles = Math.max(0, artCount - artPubCount);
      totalMedia = medCount;
      totalAnnouncements = annCount;
      announcements = annList.length
        ? annList
        : inMemoryData.announcements.filter((a) => a.status === 'published');

      recentUpdates = [...recentPages, ...recentArts]
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
    } else {
      pages = inMemoryData.pages;
      articles = inMemoryData.articles;
      media = inMemoryData.media;
      announcements = inMemoryData.announcements;

      totalPages = pages.length;
      publishedPages = pages.filter((p) => p.status === 'published').length;
      draftPages = pages.filter((p) => p.status === 'draft').length;

      totalArticles = articles.length;
      publishedArticles = articles.filter(
        (a) => a.status === 'published'
      ).length;
      draftArticles = articles.filter((a) => a.status === 'draft').length;
      totalMedia = media.length;
      totalAnnouncements = announcements.length;

      recentUpdates = [...pages, ...articles]
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
    }

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
    const role = (req.user?.role || '').toLowerCase();
    const { page, limit, skip } = parsePagination(req.query, 30, 100);
    const cmsAllowedEntityTypes = [
      'Page',
      'Article',
      'Media',
      'Announcement',
      'CMS',
    ];

    let query = {};
    if (role === 'cms_admin') {
      query = { entityType: { $in: cmsAllowedEntityTypes } };
    }

    let items = [];
    let total = 0;
    if (isMongoActive()) {
      total = await Activity.countDocuments(query);
      items = await Activity.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      if (items.length === 0 && total === 0) {
        let baseList = inMemoryData.activities || [];
        if (role === 'cms_admin') {
          baseList = baseList.filter((a) =>
            cmsAllowedEntityTypes.includes(a.entityType)
          );
        }
        total = baseList.length;
        items = baseList.slice(skip, skip + limit);
      }
    } else {
      let baseList = inMemoryData.activities || [];
      if (role === 'cms_admin') {
        baseList = baseList.filter((a) =>
          cmsAllowedEntityTypes.includes(a.entityType)
        );
      }
      total = baseList.length;
      items = baseList.slice(skip, skip + limit);
    }
    res.json({
      success: true,
      activities: items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
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

    // In production, instantly reject login if default/demo credentials are submitted
    if (process.env.NODE_ENV === 'production') {
      const lowered = String(password).toLowerCase();
      if (
        lowered === 'thinkwires@admin2026!' ||
        lowered === 'thinkwires@2026' ||
        lowered === 'admin123' ||
        lowered === 'password'
      ) {
        return res.status(403).json({
          success: false,
          error:
            'Default demo credentials are not permitted in production. Please use your securely configured credentials.',
        });
      }
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = null;

    if (isMongoActive()) {
      user = await UserMongo.findOne({ email: cleanEmail }).select('+password');
    }

    // Secondary relational store fallback (PostgreSQL) if not found in MongoDB
    if (!user) {
      try {
        const { User: UserPg } = await import('../models/user.model.js');
        const pgUser = await UserPg.findOne({ where: { email: cleanEmail } });
        if (pgUser) {
          user = pgUser.toJSON();
        }
      } catch {
        // PostgreSQL optional fallback
      }
    }

    // Fallback to in-memory seeded users if MongoDB is unavailable or user was not in DB
    if (!user) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(401).json({
          success: false,
          error:
            'Invalid official credentials. Respective persons should use the password and email created by superadmin.',
        });
      }
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
    const userPassword = user.password || null;

    if (userPassword) {
      if (userPassword.startsWith('$2a$') || userPassword.startsWith('$2b$')) {
        isMatch = await comparePassword(password, userPassword);
      } else if (process.env.NODE_ENV !== 'production') {
        // Safe equality comparison for seeded demo credentials or unhashed seed users only in dev/test
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
      token,
      csrfToken,
      mustChangePassword: Boolean(user.mustChangePassword),
      user: {
        id: user._id ? user._id.toString() : user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation || 'System Member',
        mustChangePassword: Boolean(user.mustChangePassword),
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

/**
 * Force or handle self-service password change for authenticated administrators
 */
export const changeAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const adminUser = req.user;

    if (!adminUser || !adminUser.email) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required to change credentials.',
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required.',
      });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password and confirmation do not match.',
      });
    }

    if (newPassword.length < 12) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 12 characters long.',
      });
    }

    const loweredNew = newPassword.toLowerCase();
    const commonInsecure = ['password', 'password123', 'admin123', 'thinkwires@2026', 'thinkwires@admin2026!'];
    if (
      commonInsecure.includes(loweredNew) ||
      loweredNew.includes('thinkwires@admin2026') ||
      loweredNew.includes('thinkwires@2026')
    ) {
      return res.status(400).json({
        success: false,
        error: 'New password cannot be a known default, demo, or insecure password.',
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password must be different from current password.',
      });
    }

    const cleanEmail = adminUser.email.toLowerCase().trim();
    let dbUser = null;

    if (isMongoActive()) {
      dbUser = await UserMongo.findOne({ email: cleanEmail }).select('+password');
    }

    let isMatch = false;
    let storedPassword = dbUser ? dbUser.password : null;

    if (!storedPassword) {
      const inMem = (inMemoryData.users || []).find(
        (u) => (u.email || '').toLowerCase().trim() === cleanEmail
      );
      if (inMem) storedPassword = inMem.password;
    }

    if (storedPassword) {
      if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')) {
        isMatch = await comparePassword(currentPassword, storedPassword);
      } else {
        isMatch = currentPassword === storedPassword;
      }
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect.',
      });
    }

    const hashedNew = await hashPassword(newPassword);

    if (dbUser) {
      dbUser.password = hashedNew;
      dbUser.mustChangePassword = false;
      dbUser.passwordChangedAt = new Date();
      dbUser.tokenVersion = (dbUser.tokenVersion || 0) + 1;
      await dbUser.save();
    }

    // Update in-memory user if present
    const inMemIdx = (inMemoryData.users || []).findIndex(
      (u) => (u.email || '').toLowerCase().trim() === cleanEmail
    );
    if (inMemIdx !== -1) {
      inMemoryData.users[inMemIdx].password = hashedNew;
      inMemoryData.users[inMemIdx].mustChangePassword = false;
    }

    // Re-issue JWT with updated claims
    const updatedUser = dbUser
      ? dbUser.toObject()
      : { ...adminUser, mustChangePassword: false };
    const newToken = generateAdminToken(updatedUser);
    setAdminAuthCookie(res, newToken);

    await logActivity(
      'Password Changed',
      'Security RBAC',
      cleanEmail,
      `Superadmin/Admin ${adminUser.name} (${cleanEmail}) successfully changed their account password.`,
      req.user,
      '#10B981'
    );

    return res.json({
      success: true,
      message: 'Password changed successfully.',
      mustChangePassword: false,
    });
  } catch (error) {
    console.error('Change admin password error:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred while changing the password.',
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

    const { page, limit, skip } = parsePagination(req.query, 50, 100);
    let members = [];
    let total = 0;
    if (isMongoActive()) {
      total = await UserMongo.countDocuments();
      members = await UserMongo.find()
        .select('-password -__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    }

    if (!isMongoActive() && (!members || members.length === 0)) {
      const fallbackList = (inMemoryData.users || []).map((u) => {
        const { password, ...rest } = u;
        return rest;
      });
      total = fallbackList.length;
      members = fallbackList.slice(skip, skip + limit);
    }

    res.json({
      success: true,
      members,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const createSystemMember = async (req, res) => {
  try {
    if (!requireProductionDb(res)) return;
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
    if (!requireProductionDb(res)) return;
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

    // Invalidate existing sessions if credentials, role, or active status are altered (Issue #197)
    if (password || role || isActive === false) {
      updates.$inc = { tokenVersion: 1 };
      updates.passwordChangedAt = new Date();
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
    if (!requireProductionDb(res)) return;
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

// ============================================================================
// HelpDesk Administration Handlers
// ============================================================================

export const getHelpDeskTicketsHandler = async (req, res) => {
  try {
    const result = await queryHelpDeskTickets(req.query);
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getHelpDeskStatsHandler = async (req, res) => {
  try {
    const stats = await getHelpDeskStats();
    res.json({
      success: true,
      stats,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getHelpDeskTicketByIdHandler = async (req, res) => {
  try {
    const { id } = req.params;
    let ticket = null;

    if (isMongoActive()) {
      ticket = mongoose.Types.ObjectId.isValid(id)
        ? await HelpDeskTicket.findById(id).lean()
        : await HelpDeskTicket.findOne({ ticketId: id }).lean();
    }

    if (!ticket) {
      ticket = memoryHelpDeskStore.find(
        (t) => t._id === id || t.ticketId === id
      );
    }

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found.' });
    }

    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateHelpDeskTicketHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, note, internalNote } = req.body;

    const updates = {};
    if (status) updates.status = status;
    if (priority) updates.priority = priority;

    if (internalNote && (typeof internalNote === 'object' ? internalNote.note : internalNote)) {
      updates.internalNote = {
        author: (typeof internalNote === 'object' && internalNote.author) || req.user?.name || 'Staffing Admin',
        note: (typeof internalNote === 'object' ? internalNote.note : internalNote).trim(),
      };
    } else if (note && note.trim()) {
      updates.internalNote = {
        author: req.user?.name || 'Staffing Admin',
        note: note.trim(),
      };
    }

    const updated = await updateHelpDeskTicket(id, updates);

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Ticket not found.' });
    }

    await logActivity(
      'HelpDesk Ticket Updated',
      'HelpDesk',
      id,
      `Admin updated status of ticket ${id} to ${updated.status}.`,
      req.user,
      '#059669'
    );

    res.json({ success: true, ticket: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const replyHelpDeskTicketHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { replyText, replyMessage, recipientEmail } = req.body;
    const messageContent = (replyText || replyMessage || '').trim();

    if (!messageContent) {
      return res.status(400).json({ success: false, error: 'Reply text is required.' });
    }

    let ticket = null;
    if (isMongoActive()) {
      ticket = mongoose.Types.ObjectId.isValid(id)
        ? await HelpDeskTicket.findById(id)
        : await HelpDeskTicket.findOne({ ticketId: id });
    }
    if (!ticket) {
      ticket = memoryHelpDeskStore.find(
        (t) => t._id === id || t.ticketId === id
      );
    }

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found.' });
    }

    const targetEmail = recipientEmail || ticket.email;
    const repliedBy = req.user?.name || 'Thinkwires Staffing Director';

    const replyEntry = {
      repliedBy,
      replyContent: messageContent,
      recipientEmail: targetEmail,
      sentAt: new Date(),
    };

    // If SMTP configured, dispatch reply email
    const transport = getTransporter();
    if (transport) {
      try {
        await transport.sendMail({
          from: `"Thinkwires HelpDesk" <${process.env.SMTP_USER || 'notifications@thinkwires.com'}>`,
          to: targetEmail,
          subject: `Re: [${ticket.ticketId}] ${ticket.subject}`,
          text: replyText.trim(),
          html: `<div style="font-family: sans-serif; padding: 16px; line-height: 1.6;">${replyText.trim().replace(/\n/g, '<br/>')}</div>`,
        });
      } catch (mailErr) {
        console.warn('HelpDesk email reply error:', mailErr.message);
      }
    }

    if (isMongoActive() && ticket.save) {
      ticket.replyHistory.push(replyEntry);
      ticket.status = 'Replied';
      await ticket.save();
    } else {
      ticket.replyHistory = ticket.replyHistory || [];
      ticket.replyHistory.push({
        ...replyEntry,
        sentAt: replyEntry.sentAt.toISOString(),
      });
      ticket.status = 'Replied';
      ticket.updatedAt = new Date().toISOString();
    }

    await logActivity(
      'HelpDesk Email Reply Sent',
      'HelpDesk',
      ticket.ticketId,
      `Sent email response to ${targetEmail} for ticket ${ticket.ticketId}.`,
      req.user,
      '#2563eb'
    );

    res.json({
      success: true,
      message: `Reply sent successfully to ${targetEmail}.`,
      ticket,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const convertHelpDeskToRequisitionHandler = async (req, res) => {
  try {
    const { id } = req.params;

    let ticket = null;
    if (isMongoActive()) {
      ticket = mongoose.Types.ObjectId.isValid(id)
        ? await HelpDeskTicket.findById(id).lean()
        : await HelpDeskTicket.findOne({ ticketId: id }).lean();
    }
    if (!ticket) {
      ticket = memoryHelpDeskStore.find(
        (t) => t._id === id || t.ticketId === id
      );
    }

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found.' });
    }

    const requisitionPayload = {
      engagementModel: `Converted from HelpDesk: ${ticket.category}`,
      targetRole: ticket.metadata?.targetRole || ticket.subject || 'Engineering Squad Mandate',
      techStack: ticket.metadata?.techStack || [ticket.subject],
      headcount: ticket.metadata?.headcount || 1,
      seniority: ticket.metadata?.seniority || 'Mid-to-Senior',
      deploymentUrgency: ticket.metadata?.deploymentUrgency || ticket.metadata?.timeline || 'Immediate',
      workArrangement: ticket.metadata?.workArrangement || 'Remote / Hybrid',
      fullName: ticket.fullName,
      corporateEmail: ticket.email,
      company: ticket.company || 'Enterprise Client Inquiry',
      phone: ticket.phone,
      jobDescription: `[Converted from HelpDesk Ticket ${ticket.ticketId}]\n${ticket.message}\nConsultation: ${ticket.metadata?.consultationSlot || 'Direct Coordination'}`,
    };

    const createdReq = await recordInboundRequisition(requisitionPayload);

    // Update ticket status to In Review and append internal note
    const updatedTicket = await updateHelpDeskTicket(id, {
      status: 'In Review',
      metadata: {
        convertedRequisitionId: createdReq?.requisitionId || createdReq?.id || createdReq?._id,
      },
      internalNote: {
        author: req.user?.name || 'Admin',
        note: `1-Click converted to Client Requisition ${createdReq?.requisitionId || 'Inbound'} on ${new Date().toLocaleDateString()}.`,
      },
    });

    await logActivity(
      'Converted Ticket to Requisition',
      'HelpDesk',
      ticket.ticketId,
      `Inquiry converted into Client Requisition ${createdReq?.requisitionId}.`,
      req.user,
      '#059669'
    );

    res.json({
      success: true,
      message: `Inquiry successfully converted to Client Requisition ${createdReq?.requisitionId}.`,
      requisition: createdReq,
      ticket: updatedTicket,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
