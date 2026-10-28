import API_BASE from '../../utils/apiConfig';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Resolved safely via apiConfig (defaults to relative '/api' on production)
// API_BASE is imported above

export const fallbackStaffAugmentationData = {
  hero: {
    badge: 'ENTERPRISE TECH STAFF AUGMENTATION • 48-HR POD DISPATCH',
    heading:
      'Scale High-Velocity Engineering Squads Without Long-Term Overhead.',
    description:
      'Access pre-vetted L5/L7 enterprise tech talent in 48 hours. Flexible engagement models that seamlessly integrate with your existing Jira, Slack, and agile sprint cadences.',
    ctaConsultationText: 'Schedule Workforce Consultation',
    ctaBenchText: 'Explore Available Bench (48h SLA)',
    trustLine:
      'Trusted by high-growth scale-ups & Global 2000 enterprises across US, Canada & India',
    talentReadiness: {
      acceptanceRate: '3.4%',
      acceptanceDesc: 'Acceptance rate across 45,000+ vetted senior engineers',
      velocity: 'Avg 48 Hours',
      velocityPct: 88,
      guaranteeTitle: 'Zero Idle Cost Guarantee',
      guaranteeSub: '15-Day Roll-off flexibility',
    },
  },
  valueProps: [
    {
      icon: 'published_with_changes',
      title: 'Flexible Hiring',
      description:
        'Scale up or down smoothly with a transparent 15-day notice period. Zero long-term lock-ins.',
      accent: 'primary',
    },
    {
      icon: 'savings',
      title: 'Cost-Effective',
      description:
        'Up to 40% reduction versus onshore agency markups, with zero equipment, benefits, or tax headaches.',
      accent: 'emerald',
    },
    {
      icon: 'psychology',
      title: 'Expert Talent',
      description:
        'Vetted senior engineers across Cloud, SAP, Databricks, AI/ML, and modern Full-Stack stacks.',
      accent: 'cobalt',
    },
    {
      icon: 'speed',
      title: 'Rapid Pod Dispatch',
      description:
        'Pre-vetted engineering squads deployed to active sprints in as little as 48 hours with full NDA protection.',
      accent: 'navy',
    },
  ],
  solutions: {
    eyebrow: 'Our Solutions',
    heading: 'On-Demand Talent Solutions by Thinkwires',
    description:
      'We provide enterprise solutions that are fast, business-focused, and tailored to mission-critical engineering initiatives.',
    pillars: [
      {
        icon: 'bolt',
        title: 'Efficient Solutions',
        description:
          'Streamlined 3-step intake, live coding assessment, and match deployment in under 5 working days, bypassing standard multi-month hiring cycles.',
        footerKey: 'Intake to Onboard',
        footerVal: '48 - 72 Hours',
      },
      {
        icon: 'domain_verification',
        title: 'Business-Focused',
        description:
          'Domain pods tuned for fintech security, HIPAA compliance, e-commerce scale, and enterprise ERP migrations without onboarding friction.',
        footerKey: 'Specialized Pods',
        footerVal: 'BFSI, Health, Retail',
      },
      {
        icon: 'sync_alt',
        title: 'Seamless Integration',
        description:
          'Pre-configured dev environments, signed NDAs, code repository clearances, and overlap across US EST, PST, or European time zones.',
        footerKey: 'Standup Overlap',
        footerVal: '4 - 6 Hours / Day',
      },
    ],
    spotlight: {
      badge: 'Workforce Governance Framework',
      title: 'People4People • Turnkey Workforce Management',
      description:
        'People4People by Thinkwires delivers rigorous third-party contingent workforce administration. From contract compliance and hardware provision to bi-weekly velocity reporting and instant replacement guarantees, we manage workforce operations so your engineering leads can focus on shipping.',
      bullets: [
        'Automated Performance Audits',
        'No-Questions-Asked Replacements',
        '100% IP Transfer & Non-Compete',
      ],
      metrics: [
        { label: 'Sprint Alignment', value: '100%' },
        { label: 'Resource Retention', value: '96.8%' },
        { label: 'Billing Transparency', value: 'Net-30 / Timecards' },
      ],
    },
  },
  benefits: {
    eyebrow: 'Key Benefits',
    heading: 'Strategic Advantages of Technical Staff Augmentation',
    description:
      'Discover why high-growth enterprises leverage Thinkwires talent augmentation to de-risk engineering roadmaps and accelerate feature delivery.',
    cards: [
      {
        icon: 'account_balance_wallet',
        title: 'Cost-Effective Solution',
        description:
          'Eliminate recruitment commissions, severance, medical benefits, and hardware provision costs. Pay solely for productive engineering hours on your roadmap.',
        stat: 'Up to 40% Operational Savings',
        iconStat: 'trending_down',
        accent: 'primary',
      },
      {
        icon: 'trending_up',
        title: 'Rapid Scaling & Flexibility',
        description:
          'Scale capacity up or down dynamically during quarterly release crunches or seasonal surges. Eliminate headcount commitments that outlive specific features.',
        stat: '15-Day Scaling Notice',
        iconStat: 'tune',
        accent: 'emerald',
      },
      {
        icon: 'hub',
        title: 'Specialized Domain Expertise',
        description:
          'Instant access to niche architects: SAP HANA, Databricks, Distributed Systems, Kubernetes, Rust/Go, and Enterprise Generative AI implementations.',
        stat: 'Top Tier Subject Matter Experts',
        iconStat: 'stars',
        accent: 'cobalt',
      },
      {
        icon: 'rocket_launch',
        title: '3x Faster Time-to-Market',
        description:
          'Accelerate release cycles by onboarding day-one ready engineers with verified technical depth. Bypass the standard 60-day tech interview pipeline and maintain steady sprint velocity without diverting internal team leads from architecture tasks.',
        stat: 'Immediate Standup & Jira Delivery',
        iconStat: 'speed',
        accent: 'primary',
      },
      {
        icon: 'gavel',
        title: 'Reduced Hiring Risk',
        description:
          'Mitigate costly mis-hires with our 90-day retention and continuous replacement guarantee, backed by multi-stage code reviews and client verification.',
        stat: 'Replacement Guarantee',
        iconStat: 'security',
        accent: 'emerald',
      },
    ],
  },
  bench: {
    eyebrow: 'Live Talent Bench',
    heading: 'Pre-Vetted Engineers Available in 48 Hours',
    description:
      'Ready to join your team with background checks and technical vetting complete.',
    activeCount: '38 Engineers Active on Bench',
    engineers: [
      {
        initials: 'DA',
        role: 'Lead Cloud Architect',
        stack: 'AWS / GCP / Terraform',
        sla: '48h SLA',
        experience: '9+ Years',
        overlap: 'US EST (6h)',
        skills: ['Kubernetes', 'Go', 'Kafka', 'FinOps'],
      },
      {
        initials: 'RK',
        role: 'Sr. Full-Stack Engineer',
        stack: 'Next.js / Node / TypeScript',
        sla: '48h SLA',
        experience: '7+ Years',
        overlap: 'US PST (5h)',
        skills: ['React', 'GraphQL', 'PostgreSQL', 'Tailwind'],
      },
      {
        initials: 'MS',
        role: 'Data & AI Architect',
        stack: 'Databricks / Python / LLMs',
        sla: '48h SLA',
        experience: '8+ Years',
        overlap: 'US EST (5h)',
        skills: ['PySpark', 'LangChain', 'Snowflake', 'Vector DBs'],
      },
    ],
  },
  comparison: {
    eyebrow: 'Compare Engagement Models',
    heading: 'Why Augment Your Tech Teams With Thinkwires?',
    description:
      'Compare models to choose the right delivery structure for your engineering roadmap.',
    rows: [
      {
        feature: 'Scale your lineup as needed',
        aug: '15-Day Notice',
        pods: 'Sprint Milestones',
        trad: 'Fixed Scope SOW',
      },
      {
        feature: 'Direct dev integration into daily standups',
        aug: 'Full Daily Integration',
        pods: 'Integrated via Lead',
        trad: 'Weekly / Monthly Status',
      },
      {
        feature: 'Dedicated squad assigned to your backlog',
        aug: 'Assigned per role',
        pods: 'Full Squad',
        trad: 'Shared Agency Pool',
      },
      {
        feature: 'Technical management & task direction',
        aug: 'Client Direct Control',
        pods: 'Co-Managed by Pod Lead',
        trad: 'Vendor Managed (Black Box)',
      },
      {
        feature: 'IP & Codebase Ownership',
        aug: '100% Client Owned',
        pods: '100% Client Owned',
        trad: 'Subject to Contract Terms',
      },
      {
        feature: 'Average Deployment SLA',
        aug: '48 Hours',
        pods: '1 - 2 Weeks',
        trad: '6 - 8 Weeks',
      },
    ],
  },
  faqs: [
    {
      question:
        'What is staff augmentation and how does it differ from traditional hiring?',
      answer:
        'Staff augmentation is a flexible hiring model where you add skilled technical specialists directly to your existing internal team on a project basis. Unlike traditional hiring, it allows you to scale up capacity quickly without long-term severance commitments, costly benefits packages, or multi-month recruitment delays. You maintain full operational control over daily sprints and technical direction, while Thinkwires manages HR, compliance, payroll, and infrastructure support.',
    },
    {
      question: 'How quickly can you provide staff augmentation resources?',
      answer:
        'Our active bench allows us to deploy pre-vetted engineers (Full-Stack, Cloud, Data) in as little as 48 hours. For specialized or bespoke architectural skill sets, our talent network connects you with vetted profiles typically within 1 to 2 weeks.',
    },
    {
      question: 'What are the cost benefits compared to full-time hiring?',
      answer:
        'Staff augmentation eliminates overhead costs associated with full-time staff—such as benefits packages, local payroll taxes, high-spec hardware provisioning, workspace leases, and onboarding overhead. You only pay for active engineering hours, reducing effective engineering costs by up to 40% compared to onshore full-time equivalents.',
    },
    {
      question:
        'How do you ensure the quality and cultural fit of augmented staff?',
      answer:
        'We run a 4-tier evaluation: technical assessments, live code architecture reviews, background checks, and spoken communication/cultural fit interviews. You receive transparent candidate summaries and interview each resource directly prior to onboarding. If an engineer is not the right fit, we provide a replacement within 5 working days.',
    },
    {
      question:
        'Can we scale up or down the augmented team as project needs change?',
      answer:
        'Yes. One of the core benefits of our engagement model is agility. You can add engineers for critical sprints or reduce squad size with a standard 15-day notice period. This protects your runway while giving you elasticity to tackle roadmap milestones.',
    },
  ],
  consultation: {
    eyebrow: 'Direct Channel',
    heading: 'Schedule a Workforce Strategy Call',
    description:
      'Speak directly with an Enterprise Talent Partner to calibrate your tech stack needs, budget constraints, and delivery timelines.',
    email: 'hr@thinkwires.com',
    hubs: 'Noida Sector 63 (India) • San Francisco • Austin • Toronto',
    sla: '5-Hour Response SLA',
    certifications:
      'ISO 27001 • SOC 2 Type II Compliant • 100% NDA Protection Prior to Discussion',
  },
};

export const fetchStaffAugmentationData = createAsyncThunk(
  'staffAugmentation/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/staff-augmentation`);
      if (!response.ok) {
        throw new Error('Failed to fetch staff augmentation data');
      }
      const data = await response.json();
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const submitStaffAugmentationConsultation = createAsyncThunk(
  'staffAugmentation/submitConsultation',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_BASE}/staff-augmentation/consultation`,
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
        throw new Error(
          errorData.error || 'Failed to submit consultation request'
        );
      }
      return await response.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const staffAugmentationSlice = createSlice({
  name: 'staffAugmentation',
  initialState: {
    data: fallbackStaffAugmentationData,
    status: 'idle',
    error: null,
    consultationStatus: 'idle',
    consultationMessage: null,
    consultationError: null,
  },
  reducers: {
    resetConsultationState: (state) => {
      state.consultationStatus = 'idle';
      state.consultationMessage = null;
      state.consultationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStaffAugmentationData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchStaffAugmentationData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload && Object.keys(action.payload).length > 0) {
          state.data = action.payload;
        }
      })
      .addCase(fetchStaffAugmentationData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(submitStaffAugmentationConsultation.pending, (state) => {
        state.consultationStatus = 'loading';
        state.consultationError = null;
      })
      .addCase(
        submitStaffAugmentationConsultation.fulfilled,
        (state, action) => {
          state.consultationStatus = 'succeeded';
          state.consultationMessage =
            action.payload?.message ||
            'Consultation request submitted successfully!';
        }
      )
      .addCase(
        submitStaffAugmentationConsultation.rejected,
        (state, action) => {
          state.consultationStatus = 'failed';
          state.consultationError =
            action.payload || 'Failed to submit consultation request';
        }
      );
  },
});

export const { resetConsultationState } = staffAugmentationSlice.actions;
export default staffAugmentationSlice.reducer;
