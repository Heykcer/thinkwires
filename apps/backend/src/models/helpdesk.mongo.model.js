import mongoose from 'mongoose';
import {
  resolveNotificationEmail,
  sendHelpDeskNotificationEmail,
} from '../utils/notificationDispatcher.util.js';

const isMongoActive = () => mongoose.connection.readyState === 1;

const helpDeskSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'General Inquiry',
        'Talent Callback',
        'Workforce Consultation',
        'Service Consultation',
        'Enterprise Requisition',
        'Enterprise Scoping',
        'Bench Interview',
        'Newsletter',
      ],
      index: true,
    },
    destinationEmail: {
      type: String,
      required: true,
      index: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      default: null,
      trim: true,
    },
    company: {
      type: String,
      default: 'Individual / Confidential',
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['New', 'In Review', 'Replied', 'Archived'],
      default: 'New',
      index: true,
    },
    priority: {
      type: String,
      enum: ['Urgent', 'High', 'Normal', 'Low'],
      default: 'Normal',
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    internalNotes: [
      {
        author: { type: String, default: 'Admin' },
        note: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    replyHistory: [
      {
        repliedBy: { type: String, default: 'Staffing Director' },
        replyContent: { type: String, required: true },
        recipientEmail: { type: String, required: true },
        sentAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const HelpDeskTicket =
  mongoose.models.HelpDeskTicket ||
  mongoose.model('HelpDeskTicket', helpDeskSchema);

// In-memory fallback store for offline/demo/testing environments
export const memoryHelpDeskStore = [
  {
    _id: 'mem-hd-001',
    ticketId: 'HD-2026-B101',
    category: 'Enterprise Scoping',
    destinationEmail: 'hr@thinkwires.com',
    fullName: 'David Sterling',
    email: 'd.sterling@fintech-apex.com',
    phone: '+1 (415) 555-0199',
    company: 'Apex Financial Technologies',
    subject: 'High-Throughput Distributed Ledger Engineers',
    message: 'We require 3-5 staff-level distributed systems engineers with Rust and Kafka expertise for our Q3 settlement platform migration.',
    status: 'New',
    priority: 'Urgent',
    metadata: {
      domain: 'Full Stack & Web Systems',
      techStack: ['Rust', 'Kafka', 'Go', 'Kubernetes'],
      headcount: '3-5 Engineers (Core Squad)',
      timeline: 'Immediate (Within 48h - Bench Pool)',
      consultationSlot: '2026-11-15 (Morning 09:00 - 12:00)',
    },
    internalNotes: [],
    replyHistory: [],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: 'mem-hd-002',
    ticketId: 'HD-2026-B102',
    category: 'General Inquiry',
    destinationEmail: 'info@thinkwires.com',
    fullName: 'Claire Beaumont',
    email: 'claire.b@globalventure.co',
    phone: '+44 20 7946 0912',
    company: 'Global Venture Partners',
    subject: 'Cross-Border EOR Compliance & Billing Framework',
    message: 'Requesting documentation on your Employer of Record compliance structure for hiring engineering contractors across India hubs.',
    status: 'In Review',
    priority: 'Normal',
    metadata: {
      inquiryType: 'Partnership',
    },
    internalNotes: [
      {
        author: 'Priya Nair',
        note: 'Sent introductory EOR overview deck. Following up with compliance lead.',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
    replyHistory: [],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    _id: 'mem-hd-003',
    ticketId: 'HD-2026-B103',
    category: 'Talent Callback',
    destinationEmail: 'hr@thinkwires.com',
    fullName: 'Direct Callback Requester',
    email: 'marcus.vance@cloudnative.io',
    phone: '+1 (212) 555-8421',
    company: 'CloudNative Scale',
    subject: 'Immediate Talent Callback Requested',
    message: 'Client requested callback via homepage CTA for cloud systems engineering consultation.',
    status: 'New',
    priority: 'High',
    metadata: {
      source: 'Homepage CTA Card',
    },
    internalNotes: [],
    replyHistory: [],
    createdAt: new Date(Date.now() - 900000).toISOString(),
    updatedAt: new Date(Date.now() - 900000).toISOString(),
  },
];

/**
 * Standardized intake function used across all public contact endpoints.
 */
export const recordHelpDeskInquiry = async ({
  category,
  fullName,
  email,
  phone = null,
  company = 'Individual / Confidential',
  subject,
  message,
  metadata = {},
  priority = 'Normal',
}) => {
  const destinationEmail = resolveNotificationEmail(category);
  const ticketId = `HD-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;

  const ticketData = {
    ticketId,
    category,
    destinationEmail,
    fullName: (fullName || 'Inbound Lead').trim(),
    email: (email || '').trim().toLowerCase(),
    phone: phone ? phone.trim() : null,
    company: (company || 'Individual / Confidential').trim(),
    subject: (subject || `${category} Inbound Submission`).trim(),
    message: (message || 'No additional text provided.').trim(),
    status: 'New',
    priority: priority || 'Normal',
    metadata: metadata || {},
    internalNotes: [],
    replyHistory: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let savedTicket = null;

  if (isMongoActive()) {
    try {
      savedTicket = await HelpDeskTicket.create(ticketData);
    } catch (err) {
      console.warn('Could not persist HelpDesk ticket to MongoDB, falling back to memory:', err.message);
    }
  }

  if (!savedTicket) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Database connection unavailable: unable to durably persist inquiry in production.');
    }
    const memoryRecord = {
      _id: `mem-hd-${Date.now()}`,
      ...ticketData,
      createdAt: ticketData.createdAt.toISOString(),
      updatedAt: ticketData.updatedAt.toISOString(),
    };
    memoryHelpDeskStore.unshift(memoryRecord);
    savedTicket = memoryRecord;
  }

  // Gracefully trigger email notification (non-blocking)
  sendHelpDeskNotificationEmail({
    ticketId,
    category,
    fullName: ticketData.fullName,
    email: ticketData.email,
    phone: ticketData.phone,
    company: ticketData.company,
    subject: ticketData.subject,
    message: ticketData.message,
    metadata: ticketData.metadata,
    recipientEmail: destinationEmail,
  }).catch((emailErr) => {
    console.warn('HelpDesk email dispatch warning (non-blocking):', emailErr.message);
  });

  return savedTicket;
};

/**
 * Queries HelpDesk tickets with filtering and search.
 */
export const queryHelpDeskTickets = async ({
  search = '',
  category = 'all',
  status = 'all',
  priority = 'all',
  page = 1,
  limit = 20,
}) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const lim = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

  if (isMongoActive()) {
    try {
      const query = {};
      if (category && category !== 'all') {
        query.category = category;
      }
      if (status && status !== 'all') {
        query.status = status;
      }
      if (priority && priority !== 'all') {
        query.priority = priority;
      }
      if (search && search.trim()) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [
          { ticketId: regex },
          { fullName: regex },
          { email: regex },
          { company: regex },
          { subject: regex },
          { message: regex },
        ];
      }

      const total = await HelpDeskTicket.countDocuments(query);
      const tickets = await HelpDeskTicket.find(query)
        .sort({ createdAt: -1 })
        .skip((p - 1) * lim)
        .limit(lim)
        .lean();

      return {
        tickets,
        total,
        page: p,
        totalPages: Math.ceil(total / lim) || 1,
      };
    } catch (err) {
      console.warn('MongoDB HelpDesk query failed, using memory store fallback:', err.message);
    }
  }

  // Memory fallback
  let list = [...memoryHelpDeskStore];

  if (category && category !== 'all') {
    list = list.filter((t) => t.category === category);
  }
  if (status && status !== 'all') {
    list = list.filter((t) => t.status === status);
  }
  if (priority && priority !== 'all') {
    list = list.filter((t) => t.priority === priority);
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    list = list.filter(
      (t) =>
        t.ticketId.toLowerCase().includes(q) ||
        t.fullName.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        (t.company && t.company.toLowerCase().includes(q)) ||
        (t.subject && t.subject.toLowerCase().includes(q)) ||
        (t.message && t.message.toLowerCase().includes(q))
    );
  }

  const total = list.length;
  const start = (p - 1) * lim;
  const paginated = list.slice(start, start + lim);

  return {
    tickets: paginated,
    total,
    page: p,
    totalPages: Math.ceil(total / lim) || 1,
  };
};

/**
 * Returns HelpDesk metrics summary for header ribbon.
 */
export const getHelpDeskStats = async () => {
  if (isMongoActive()) {
    try {
      const total = await HelpDeskTicket.countDocuments({});
      const newCount = await HelpDeskTicket.countDocuments({ status: 'New' });
      const inReviewCount = await HelpDeskTicket.countDocuments({ status: 'In Review' });
      const repliedCount = await HelpDeskTicket.countDocuments({ status: 'Replied' });
      const infoCount = await HelpDeskTicket.countDocuments({
        destinationEmail: process.env.COMPANY_INFO_EMAIL || 'info@thinkwires.com',
      });
      const hrCount = await HelpDeskTicket.countDocuments({
        destinationEmail: process.env.HR_REQUISITION_EMAIL || 'hr@thinkwires.com',
      });

      return {
        total,
        new: newCount,
        inReview: inReviewCount,
        replied: repliedCount,
        infoInquiries: infoCount,
        hrInquiries: hrCount,
        routing: {
          overrideEmail: process.env.OVERRIDE_NOTIFICATION_EMAIL || null,
          companyInfoEmail: process.env.COMPANY_INFO_EMAIL || 'info@thinkwires.com',
          hrRequisitionEmail: process.env.HR_REQUISITION_EMAIL || 'hr@thinkwires.com',
        },
      };
    } catch (err) {
      console.warn('MongoDB HelpDesk stats failed, calculating from memory store:', err.message);
    }
  }

  const total = memoryHelpDeskStore.length;
  const newCount = memoryHelpDeskStore.filter((t) => t.status === 'New').length;
  const inReviewCount = memoryHelpDeskStore.filter((t) => t.status === 'In Review').length;
  const repliedCount = memoryHelpDeskStore.filter((t) => t.status === 'Replied').length;
  const infoCount = memoryHelpDeskStore.filter(
    (t) => (t.destinationEmail && t.destinationEmail.includes('info@')) || t.category === 'General Inquiry'
  ).length;
  const hrCount = total - infoCount;

  return {
    total,
    new: newCount,
    inReview: inReviewCount,
    replied: repliedCount,
    infoInquiries: infoCount,
    hrInquiries: hrCount,
    routing: {
      overrideEmail: process.env.OVERRIDE_NOTIFICATION_EMAIL || null,
      companyInfoEmail: process.env.COMPANY_INFO_EMAIL || 'info@thinkwires.com',
      hrRequisitionEmail: process.env.HR_REQUISITION_EMAIL || 'hr@thinkwires.com',
    },
  };
};

/**
 * Appends internal note or updates ticket status.
 */
export const updateHelpDeskTicket = async (ticketIdOrId, updates = {}) => {
  if (isMongoActive()) {
    try {
      const query = mongoose.Types.ObjectId.isValid(ticketIdOrId)
        ? { _id: ticketIdOrId }
        : { ticketId: ticketIdOrId };

      const updateOp = { $set: { updatedAt: new Date() } };

      if (updates.status) updateOp.$set.status = updates.status;
      if (updates.priority) updateOp.$set.priority = updates.priority;
      if (updates.metadata) {
        Object.entries(updates.metadata).forEach(([k, v]) => {
          updateOp.$set[`metadata.${k}`] = v;
        });
      }

      if (updates.internalNote) {
        updateOp.$push = {
          internalNotes: {
            author: updates.internalNote.author || 'Admin',
            note: updates.internalNote.note,
            createdAt: new Date(),
          },
        };
      }

      const updated = await HelpDeskTicket.findOneAndUpdate(query, updateOp, {
        new: true,
      }).lean();

      if (updated) return updated;
    } catch (err) {
      console.warn('MongoDB ticket update error, updating in memory store:', err.message);
    }
  }

  const idx = memoryHelpDeskStore.findIndex(
    (t) => t._id === ticketIdOrId || t.ticketId === ticketIdOrId
  );
  if (idx !== -1) {
    if (updates.status) memoryHelpDeskStore[idx].status = updates.status;
    if (updates.priority) memoryHelpDeskStore[idx].priority = updates.priority;
    if (updates.metadata) {
      memoryHelpDeskStore[idx].metadata = {
        ...(memoryHelpDeskStore[idx].metadata || {}),
        ...updates.metadata,
      };
    }
    if (updates.internalNote) {
      memoryHelpDeskStore[idx].internalNotes.push({
        author: updates.internalNote.author || 'Admin',
        note: updates.internalNote.note,
        createdAt: new Date().toISOString(),
      });
    }
    memoryHelpDeskStore[idx].updatedAt = new Date().toISOString();
    return memoryHelpDeskStore[idx];
  }

  return null;
};
