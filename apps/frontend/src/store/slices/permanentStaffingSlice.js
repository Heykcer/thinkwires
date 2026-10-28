import API_BASE from '../../utils/apiConfig';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Resolved safely via apiConfig (defaults to relative '/api' on production)
// API_BASE is imported above

export const fallbackPermanentStaffingData = {
  hero: {
    badge: 'EXECUTIVE SEARCH & PERMANENT TALENT ACQUISITION • 90-DAY GUARANTEE',
    heading:
      'Secure Visionary Tech Leadership & Core Permanent Engineering Talent',
    description:
      'From principal architects to C-suite executive leaders (CTO, VP of Engineering, CPO), Thinkwires delivers verified transformational talent that drives long-term organizational growth across North America and APAC GCCs.',
    ctaSearchText: 'Initiate Executive Search',
    ctaRolesText: 'View Specialized Practice Roles',
    proofStats: [
      {
        icon: 'verified',
        value: '90-Day',
        label: 'Placement Guarantee',
        color: 'emerald',
      },
      {
        icon: 'schedule',
        value: '14 Days',
        label: 'Average Shortlist SLA',
        color: 'primary',
      },
      {
        icon: 'diamond',
        value: 'Top 3.4%',
        label: 'Vetted Talent Network',
        color: 'cobalt',
      },
    ],
  },
  pillars: {
    eyebrow: 'Architectural Foundation',
    heading: 'Strategic Talent Architecture',
    description:
      'Permanent staffing is an institutional asset allocation decision. Our search architecture removes asymmetric information and locks down elite leadership with unmatched retention longevity.',
    slaBadge: 'Institutional Executive SLA Enforced',
    items: [
      {
        step: 'PILLAR // 01',
        icon: 'travel_explore',
        title: 'Comprehensive Talent Search',
        description:
          'Multi-channel direct sourcing and exhaustive market intelligence mapping across Tier-1 global product engineering companies and regional GCCs. We tap confidential passive candidate pools unavailable through generic job portals.',
        points: [
          'Passive candidate mapping across Fortune 500 tech nodes',
          'Deep intelligence dossiers with compensation benchmarks',
          'Pre-vetted engineering leadership availability pipeline',
        ],
        accent: 'primary',
      },
      {
        step: 'PILLAR // 02',
        icon: 'psychology',
        title: 'Rigorous Multi-Tier Assessment',
        description:
          'Every profile passes high-order scrutiny before reaching executive committee review. We conduct deep architectural problem-solving audits, distributed systems stress tests, and leadership emotional intelligence appraisals.',
        points: [
          'Senior Peer-Level Architecture & Code Reviews',
          'Hogan-aligned behavioral leadership psychometrics',
          '360° confidential supervisory and peer references',
        ],
        accent: 'cobalt',
      },
      {
        step: 'PILLAR // 03',
        icon: 'shield',
        title: 'Executive Search Services',
        description:
          'High-stakes executive mandates carried out under ironclad non-disclosure agreements. We manage delicate board interactions, succession transitions, and cross-border executive relocations with complete operational discretion.',
        points: [
          'Confidential C-level & VP mandate representation',
          'Board-level competency & governance alignment',
          'Executive compensation packaging & LTI structuring',
        ],
        accent: 'emerald',
      },
      {
        step: 'PILLAR // 04',
        icon: 'handshake',
        title: 'Long-Term Partnership & Retention',
        description:
          'Placement day is the starting line. Our 90-day replacement guarantee is paired with structured day-30, day-60, and day-90 stakeholder alignment reviews ensuring organizational assimilation and peak productivity.',
        points: [
          'Contractual 90-Day no-cost replacement guarantee',
          'First 100 days executive onboarding integration',
          'Ongoing organizational retention health check-ins',
        ],
        accent: 'primary',
      },
    ],
  },
  process: {
    eyebrow: 'Precision Methodology',
    heading: 'Structured 4-Step Recruitment Process',
    description:
      'From intake calibration to executive day one, our delivery roadmap is engineered for speed without compromising rigorous quality standards.',
    steps: [
      {
        step: '1',
        phase: 'Phase I: Days 1–3',
        title: 'Requirements Analysis & Competency Matrix',
        description:
          'Collaborative alignment with C-suite and technical leads. We construct a multi-dimensional scorecard defining technical non-negotiables, leadership style, and expected outcomes.',
        deliverable: 'Role Blueprint & Scorecard',
      },
      {
        step: '2',
        phase: 'Phase II: Days 4–10',
        title: 'Talent Sourcing & Passive Intelligence',
        description:
          'Executing deep market sweeps across target enterprise ecosystems. Discreet approach vectors initiate exploratory discussions with passive high-performing industry leaders.',
        deliverable: 'Initial Market Map of 25+ Candidates',
      },
      {
        step: '3',
        phase: 'Phase III: Days 11–18',
        title: 'Deep Screening & Leadership Assessment',
        description:
          'Multi-stage evaluations conducted by our domain practice heads. Only top candidates surpassing rigorous cultural and technical bars are submitted.',
        deliverable: 'Curated Dossier of 3–5 Finalists',
      },
      {
        step: '4',
        phase: 'Phase IV: Days 19–30+',
        title: 'Placement, Offer & Executive Onboarding',
        description:
          'Strategic compensation calibration, counter-offer mitigation, and background verification. Thinkwires facilitates transition through day 90 and beyond.',
        deliverable: 'Signed Mandate & Onboarding Plan',
      },
    ],
    metricsStrip: {
      retention: '98.2%',
      retentionLabel: 'Executive Retention at 12 Months',
      retentionDesc:
        'Our placements stay, scale teams, and deliver substantial shareholder value.',
      acceptance: '94.6%',
      acceptanceLabel: 'First-Offer Acceptance Rate',
    },
  },
  roles: {
    eyebrow: 'Practice Disciplines',
    heading: 'Specialized Permanent Roles We Place',
    description:
      'Specialized recruitment teams dedicated solely to specific technical and operational domains.',
    items: [
      {
        badge: 'Executive Board',
        icon: 'token',
        title: 'C-Suite & VP Leadership',
        description:
          'Visionary leaders who define technology roadmaps, govern massive engineering organizations, and communicate with corporate boards.',
        positions: [
          { title: 'Chief Technology Officer (CTO)', sla: 'Avg. 22d SLA' },
          { title: 'VP of Global Engineering', sla: 'Avg. 18d SLA' },
          { title: 'Chief Information Officer (CIO)', sla: 'Avg. 25d SLA' },
        ],
        tags: ['P&L Ownership', 'Scale: 500+ Eng', 'Board Governance'],
      },
      {
        badge: 'Infrastructure',
        icon: 'cloud_sync',
        title: 'Cloud & Principal Architects',
        description:
          'Core platform builders spearheading modern cloud infrastructure, zero-trust security postures, and multi-region resilience.',
        positions: [
          { title: 'Principal Enterprise Architect', sla: 'Avg. 14d SLA' },
          { title: 'Head of Cloud & Site Reliability', sla: 'Avg. 12d SLA' },
          { title: 'Chief Security Architect', sla: 'Avg. 19d SLA' },
        ],
        tags: ['AWS / GCP / Azure', 'Kubernetes', 'Multi-Cloud'],
      },
      {
        badge: 'Applied Intelligence',
        icon: 'hub',
        title: 'AI / ML & Data Directors',
        description:
          'Pioneers translating foundational model capabilities and enterprise data lakes into production-grade cognitive systems.',
        positions: [
          {
            title: 'Director of Applied Machine Learning',
            sla: 'Avg. 16d SLA',
          },
          { title: 'Chief Data Officer (CDO)', sla: 'Avg. 21d SLA' },
          { title: 'Lead AI Solutions Architect', sla: 'Avg. 15d SLA' },
        ],
        tags: ['LLM Orchestration', 'PyTorch', 'Snowflake'],
      },
      {
        badge: 'Core ERP Systems',
        icon: 'database',
        title: 'SAP & ERP Practice Leaders',
        description:
          'Seasoned functional and technical captains leading complex global S/4HANA migrations and unified digital core integrations.',
        positions: [
          { title: 'SAP S/4HANA Transformation Lead', sla: 'Avg. 14d SLA' },
          { title: 'Oracle Cloud ERP Program Director', sla: 'Avg. 17d SLA' },
          {
            title: 'Senior Principal ABAP / BTP Architect',
            sla: 'Avg. 11d SLA',
          },
        ],
        tags: ['S/4HANA', 'SAP BTP', 'Supply Chain'],
      },
      {
        badge: 'Governance & Strategy',
        icon: 'security',
        title: 'Cybersecurity & CISO',
        description:
          'Defenders protecting critical institutional infrastructure, global regulatory compliance, and incident containment posture.',
        positions: [
          {
            title: 'Chief Information Security Officer (CISO)',
            sla: 'Avg. 20d SLA',
          },
          { title: 'Head of AppSec & DevSecOps', sla: 'Avg. 13d SLA' },
          { title: 'VP Product Management (SaaS)', sla: 'Avg. 15d SLA' },
        ],
        tags: ['SOC 2 / ISO', 'Zero Trust', 'Threat Intel'],
      },
      {
        badge: 'Core Software',
        icon: 'terminal',
        title: 'Principal Software Engineers',
        description:
          'Elite individual contributors delivering low-latency architectures, robust distributed systems, and core foundation services.',
        positions: [
          { title: 'Staff Distributed Systems Engineer', sla: 'Avg. 10d SLA' },
          { title: 'Principal Full-Stack Architect', sla: 'Avg. 9d SLA' },
          { title: 'Head of Engineering Operations', sla: 'Avg. 16d SLA' },
        ],
        tags: ['Go / Rust / Java', 'React / Node.js', 'gRPC / Kafka'],
      },
    ],
  },
  faqs: [
    {
      question:
        'What is the difference between permanent staffing and temporary staffing?',
      answer:
        'Permanent staffing focuses on placing candidates in full-time, long-term positions directly on your corporate payroll, whereas temporary or augmented staffing deploys external specialists for designated project lifecycles. Permanent placements involve exhaustive cultural fit evaluation, long-term equity/compensation design, and succession planning, making them ideal for building core, highly committed organizational teams.',
    },
    {
      question:
        'How long does the permanent recruitment process typically take?',
      answer:
        'Timelines depend on domain rarity and seniority. For core engineering and managerial roles, Thinkwires delivers qualified shortlists within 7–14 business days, with final placement completed in 2–4 weeks. Specialized C-suite or VP searches typically require 6–10 weeks to accommodate discreet passive talent engagement, deep multi-stakeholder interviews, and executive notice periods.',
    },
    {
      question: 'What industries and roles do you specialize in?',
      answer:
        'We specialize in deep technology verticals: Enterprise SaaS, Banking & FinTech, Life Sciences, Cloud Infrastructure, Telecommunications, and Global Capability Centers (GCCs). Our role expertise spans Principal Architects, Engineering Managers, Data Science Leads, SAP/ERP Champions, Product Leaders, CISOs, VPs of Engineering, and C-suite officers (CTO, CIO).',
    },
    {
      question: 'Do you offer a guarantee on permanent placements?',
      answer:
        'Yes. Every permanent placement executed by Thinkwires is safeguarded by our formal 90-day replacement guarantee. In the uncommon event that a placed leader departs or fails to meet documented competency objectives within 90 calendar days, Thinkwires immediately initiates an expedited search and delivers a fully qualified replacement at zero additional placement fee.',
    },
    {
      question: 'How do you ensure cultural fit for permanent positions?',
      answer:
        'Cultural alignment is assessed quantitatively through structured behavioral models and qualitative situational analysis. Before sourcing candidates, we immerse our recruitment leads into your executive cadence, core leadership values, and operating velocity. Candidates are rigorously tested for work ethic, ambiguity handling, feedback receptiveness, and management style before board presentation.',
    },
  ],
  consultation: {
    eyebrow: 'Confidential Mandate Desk',
    heading: 'Initiate Executive Search Mandate',
    description:
      'Connect directly with our senior talent acquisition partners. We will formulate a preliminary market intelligence brief and talent acquisition roadmap within 24 business hours.',
    email: 'hr@thinkwires.com',
    hotlineAvailability: 'Available 09:00 AM – 19:00 PM IST • Mon – Fri',
    hubs: [
      {
        title: 'Noida HQ Operations',
        address: 'Tower B, Sector 62, Electronic City, Noida, UP 201309',
      },
      {
        title: 'North American Delivery Hub',
        address: 'San Francisco • Toronto Delivery Center',
      },
    ],
    confidentialityNote:
      'All client inquiries are bound by mutual NDA terms upon initial transmission. No information is disclosed without explicit board-level approval.',
  },
};

export const fetchPermanentStaffingData = createAsyncThunk(
  'permanentStaffing/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/permanent-staffing`);
      if (!response.ok) {
        throw new Error('Failed to fetch permanent staffing data');
      }
      const data = await response.json();
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const submitPermanentStaffingConsultation = createAsyncThunk(
  'permanentStaffing/submitConsultation',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_BASE}/permanent-staffing/consultation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register mandate');
      }
      return await response.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const permanentStaffingSlice = createSlice({
  name: 'permanentStaffing',
  initialState: {
    data: fallbackPermanentStaffingData,
    status: 'idle',
    error: null,
    consultationStatus: 'idle',
    consultationMessage: null,
    consultationError: null,
  },
  reducers: {
    resetPermConsultationState: (state) => {
      state.consultationStatus = 'idle';
      state.consultationMessage = null;
      state.consultationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPermanentStaffingData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPermanentStaffingData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload && Object.keys(action.payload).length > 0) {
          state.data = action.payload;
        }
      })
      .addCase(fetchPermanentStaffingData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(submitPermanentStaffingConsultation.pending, (state) => {
        state.consultationStatus = 'loading';
        state.consultationError = null;
      })
      .addCase(
        submitPermanentStaffingConsultation.fulfilled,
        (state, action) => {
          state.consultationStatus = 'succeeded';
          state.consultationMessage =
            action.payload?.message ||
            'Executive mandate registered successfully!';
        }
      )
      .addCase(
        submitPermanentStaffingConsultation.rejected,
        (state, action) => {
          state.consultationStatus = 'failed';
          state.consultationError =
            action.payload || 'Failed to register mandate';
        }
      );
  },
});

export const { resetPermConsultationState } = permanentStaffingSlice.actions;
export default permanentStaffingSlice.reducer;
