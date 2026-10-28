import API_BASE from '../../utils/apiConfig';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Resolved safely via apiConfig (defaults to relative '/api' on production)
// API_BASE is imported above

export const fallbackEorData = {
  hero: {
    badge: 'GLOBAL EMPLOYER OF RECORD (EOR) • 100% REGULATORY COMPLIANCE',
    heading: 'Make Contract & Global Hiring Effortless With a Modern EOR',
    description:
      'Deploy, manage, and pay contingent engineering talent locally and internationally through Thinkwires on-demand EOR platform without foreign entity setup or compliance risk.',
    badges: [
      { icon: 'bolt', text: '5-Day Fast-Track Onboarding' },
      { icon: 'domain_disabled', text: 'Zero Foreign Entity Needed' },
      {
        icon: 'verified',
        text: 'Universal Cross-Border Benefits & Tax Compliance',
      },
    ],
    ctaScheduleText: 'Schedule EOR Consultation',
    ctaExploreText: 'Explore Global Hubs & Rates',
    complianceDeck: {
      title: 'Live Compliance Engine',
      subtitle: 'Multi-Jurisdiction',
      targetCoverage: 'India • US • CA • GCC',
      avgProvisioning: '< 120 Hours',
      statusRows: [
        {
          icon: 'gavel',
          title: 'Legal Employer Liability',
          desc: '100% Absorbed by Thinkwires EOR',
          status: 'Active Shield',
          statusType: 'emerald',
        },
        {
          icon: 'security',
          title: 'IP Assignment & NDAs',
          desc: 'Ironclad Direct Client Assignment',
          status: 'Secured',
          statusType: 'cobalt',
        },
        {
          icon: 'account_balance',
          title: 'Statutory Withholdings',
          desc: 'PF, ESI, TDS, 1099/W2 Equiv.',
          status: 'Compliant',
          statusType: 'emerald',
        },
      ],
      email: 'hr@thinkwires.com',
      slaText: '24/7 SLAs',
    },
  },
  kpiStrip: [
    { value: '5 Days', label: 'Full Contractor Onboarding', accent: 'primary' },
    {
      value: '0%',
      label: 'Foreign Entity Liability',
      accent: 'primary-container',
    },
    { value: '100%', label: 'Statutory & Tax Compliance', accent: 'tertiary' },
    { value: '30+', label: 'Enterprise Hubs Covered', accent: 'secondary' },
  ],
  explanationSection: {
    eyebrow: 'Operational Blueprint',
    heading: 'What is an Employer of Record (EOR) for Staffing?',
    description1:
      'When expanding engineering squads or engaging high-caliber contractors, an Employer of Record (EOR) acts as the official legal employer for contingent talent while your engineering leads maintain 100% operational command.',
    description2:
      'Thinkwires assumes complete institutional responsibility: background checks, mandatory insurance coverage, compliant tax withholdings, local labor law compliance, and tier-1 benefits. This safeguards your enterprise against misclassification liabilities and bureaucratic gridlock.',
    highlights: [
      {
        icon: 'verified_user',
        title: 'Background Verification',
        desc: 'Deep identity, criminal, academic, and credential audits prior to day one.',
      },
      {
        icon: 'receipt_long',
        title: 'Tax Withholding',
        desc: 'Automated TDS, state, national, and regional wage deduplication filing.',
      },
      {
        icon: 'health_and_safety',
        title: 'Statutory Insurances',
        desc: 'Workers comp, medical cover, EPF, and liability protection pre-bundled.',
      },
      {
        icon: 'shield',
        title: 'IP Assignment Shield',
        desc: 'Unconditional IP transfer guarantees all software artifacts belong directly to you.',
      },
    ],
    separationModel: {
      title: 'The Thinkwires EOR Separation Model',
      clientDirects: {
        title: 'You Direct (Day-to-Day)',
        points: [
          'Technical Architecture & Code',
          'Sprint Cycles & Backlog',
          'Team Culture & Performance',
          'Candidate Selection',
        ],
      },
      thinkWiresManages: {
        title: 'Thinkwires Employs (Legal)',
        points: [
          'Local Employment Contract',
          'Monthly Payroll & Direct Deposit',
          'Taxes & Statutory Remittances',
          'Severance & Labor Defense',
        ],
      },
      bannerImage:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAakPyWRNusR7xJyTMixaIPJy4qkWx9l8hdZoWwwl4_aFVZL0aO2dFtk6K8AskatQjeaRUqNG2n1VqFvDsKKtKDaHEfRyszGd1XfmH3o73wcFw8pb_LdzyTddX_4VYNIJ-EcRIFF24txRjwCcXCnV9U_RGzH5koFCSOsDoKbAZAKcdCkGrMckae9mEJWEmhxUSjS_W0wpB97Eudm_csK9TcyQyTLEzgjlIOZ3c6pVC2ckTk8ceyoOdK4A',
      bannerCaption: 'Compliant Cross-Border Squads in Canada, US, India & GCC',
    },
  },
  capabilitiesSection: {
    eyebrow: 'Enterprise Infrastructure',
    heading: 'Engineered for Frictionless Global Talent Deployment',
    description:
      'Complete end-to-end legal, fiscal, and personnel infrastructure built to handle hyper-growth engineering squads.',
    capabilities: [
      {
        icon: 'policy',
        tag: 'Zero Disruption Guarantee',
        title: 'Simplified Regulatory Processes',
        description:
          'Seamless onboarding that strictly aligns with municipal, state, and central compliance standards in India, the United States, and Canada. We absorb the operational exposure so contractors can start delivering immediate client impact.',
        bullets: [
          'We handle the complete risks of compliance and regulatory consistency',
          'Agile support tailored for dynamic, fast-scaling engineering roadmaps',
          'Custom contracts perfectly aligned with unique institutional policies',
        ],
        footerLeft: 'SLA: 100% Audit Readiness',
        footerRight: 'Standard in all EOR Tiers',
        accent: 'primary',
      },
      {
        icon: 'card_membership',
        tag: 'Candidate Attraction Edge',
        title: 'Enterprise Employee Benefits',
        description:
          "Succeed in today's fiercely competitive talent landscape. Thinkwires bundles executive-grade healthcare and wellness coverage with high-touch support, providing contingent hires with enterprise security and giving your firm an unparalleled hiring advantage.",
        bullets: [
          'Universal PTO eligibility across any state or province',
          'Predictable, fixed monthly copays for healthcare and outpatient coverage',
          'Customizable insurance tiers for niche specialists and interim teams',
        ],
        footerLeft: 'Retention Boost: +38% Contract Tenure',
        footerRight: 'Comprehensive Cover',
        accent: 'tertiary',
      },
      {
        icon: 'speed',
        tag: 'Velocity Focus',
        title: 'Rapid 5-Day Onboarding',
        description:
          'Speed up global deployment with automated digital workflows and real-time dispatch alerts. Our streamlined hiring pipeline removes paperwork friction, empowering talent to push pull requests by day five.',
        bullets: [
          'Massively reduces operational overhead for in-house HR & legal teams',
          'Fully configured workstation and device provisioning coordination',
          'Paperless digital signing & verification via mobile-friendly portals',
        ],
        footerLeft: 'Workflow: 100% Digital Document Vault',
        footerRight: 'Turnkey Setup',
        accent: 'cobalt-bright',
      },
      {
        icon: 'calculate',
        tag: 'Precision Payroll',
        title: 'Tax Retention & Statutory Filings',
        description:
          'Maintain uncompromising payroll compliance across tightly governed tax authorities. Thinkwires experts handle multi-level liabilities so you avoid double taxation risks and penalty exposures.',
        bullets: [
          'Administration of multi-level tax liabilities (EPF, ESI, TDS, W-2, 1099)',
          'Real-time tracking of legislative and labor statute updates',
          'Scalable banking rails for guaranteed on-time remuneration payouts',
        ],
        footerLeft: 'Accuracy: 99.98% On-Time Processing',
        footerRight: 'Institutional Scale',
        accent: 'navy-dark',
      },
    ],
  },
  comparisonSection: {
    eyebrow: 'Strategic Advantage',
    heading: 'Why Partner with Thinkwires EOR?',
    description:
      'Establishing a foreign subsidiary drains financial capital and consumes executive attention. Compare the traditional route against our agile EOR framework.',
    rows: [
      {
        factor: 'Time to First Hire',
        traditional: '4 to 9 Months',
        eor: 'Under 5 Days',
        eorIcon: 'verified',
        eorColor: 'emerald-accent',
      },
      {
        factor: 'Setup & Capital Outlay',
        traditional: '$50,000 – $120,000+',
        eor: '$0 Entity Capital',
        eorIcon: 'check_circle',
        eorColor: 'primary',
      },
      {
        factor: 'Local Corporate Governance',
        traditional: 'Resident directors, local bank accounts, annual filings',
        eor: '100% Handled by Thinkwires',
        eorIcon: 'shield',
        eorColor: 'emerald-accent',
      },
      {
        factor: 'Compliance & Labor Defense',
        traditional: 'Direct company legal exposure',
        eor: 'Thinkwires assumes legal liability',
        eorIcon: 'verified_user',
        eorColor: 'tertiary-container',
      },
      {
        factor: 'Offboarding & Termination',
        traditional: 'Complex severance disputes, high legal fees',
        eor: 'Turnkey compliant offboarding & release',
        eorIcon: 'bolt',
        eorColor: 'primary',
      },
    ],
    strip: {
      title: 'Expanding into India, US, or Canada?',
      subtitle:
        'Tap into immediate access to top 1% engineers without setting up local payroll infrastructure.',
      ctaText: 'Request Country Pricing',
    },
  },
  faqSection: {
    eyebrow: 'Clear Answers',
    heading: 'Frequently Asked Questions',
    description:
      'Everything enterprise stakeholders need to understand about compliance boundaries, IP safeguarding, and fast-track employment.',
    sidebar: {
      title: 'Need tailored contract clauses?',
      desc: 'Our legal counsel configures customized service level agreements and master services contracts for high-compliance sectors.',
      email: 'hr@thinkwires.com',
      actionText: 'Email HR & Legal Operations',
    },
    items: [
      {
        question: 'What are the benefits of partnering with an EOR?',
        answer:
          'Working with an Employer of Record (EOR) provides clear advantages: simplified compliance, minimized risk, improved HR processes, access to global talent, and greater workforce flexibility. Thinkwires absorbs local labor law liabilities, files statutory taxes, and provisions comprehensive benefits so you scale without administrative overhead.',
      },
      {
        question: 'How can EOR help my business grow internationally?',
        answer:
          'An EOR drives business growth through local expertise, strict compliance, streamlined payroll and benefits, and effective risk management. Instead of spending 6–9 months and $50k+ creating regional legal subsidiaries in India, North America, or the GCC, Thinkwires enables day-five deployment of verified engineering teams using our existing legal infrastructure.',
      },
      {
        question: 'How do I pick the right EOR partner for my business?',
        answer:
          'Choosing the ideal EOR partner entails evaluating their physical regional presence, technology portal capabilities, multi-currency processing rails, responsiveness of candidate support, and verified compliance certifications (such as ISO 27001 and SOC 2 Type II). Thinkwires pairs on-the-ground presence in Noida HQ, San Francisco, and Toronto with 24/7 dedicated account directors.',
      },
      {
        question: 'How does IP ownership and non-disclosure work under an EOR?',
        answer:
          'Intellectual Property ownership is strictly guarded via bi-lateral and tri-partite employment contracts. Under Thinkwires EOR covenants, all contractor inventions, source code, patents, and technical artifacts are automatically assigned directly to your company upon creation, supported by strict institutional NDAs valid in international jurisdictions.',
      },
    ],
  },
  consultationSection: {
    eyebrow: 'Fast-Track Evaluation',
    heading: 'Ready to Simplify Contract & Global Hiring?',
    description:
      'Speak with our senior cross-border EOR advisors. We will review your contractor headcounts, assess tax obligations, and generate a customized pricing matrix in under 5 business hours.',
    benefits: [
      'Guaranteed 5-Hour SLA Business Response',
      'SOC 2 Type II • ISO 27001 Certified Infrastructure',
      'Direct HR Advisory: hr@thinkwires.com',
    ],
    hq: 'Corporate Headquarters: Sector 62, Electronic City, Noida, UP 201309 • Operations in Silicon Valley & Toronto',
  },
};

export const fetchEorData = createAsyncThunk(
  'eor/fetchEorData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/eor`);
      if (!response.ok) {
        throw new Error(`Failed to fetch EOR data: ${response.statusText}`);
      }
      return await response.json();
    } catch (err) {
      console.warn('Falling back to local EOR data:', err.message);
      return fallbackEorData;
    }
  }
);

export const submitEorConsultation = createAsyncThunk(
  'eor/submitEorConsultation',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE}/eor/consultation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        throw new Error('Failed to submit EOR consultation');
      }
      return await response.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const eorSlice = createSlice({
  name: 'eor',
  initialState: {
    data: fallbackEorData,
    status: 'idle',
    error: null,
    submitStatus: 'idle',
    submitMessage: null,
  },
  reducers: {
    resetSubmitStatus: (state) => {
      state.submitStatus = 'idle';
      state.submitMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEorData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchEorData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload || fallbackEorData;
      })
      .addCase(fetchEorData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
        state.data = fallbackEorData;
      })
      .addCase(submitEorConsultation.pending, (state) => {
        state.submitStatus = 'loading';
      })
      .addCase(submitEorConsultation.fulfilled, (state, action) => {
        state.submitStatus = 'succeeded';
        state.submitMessage = action.payload.message;
      })
      .addCase(submitEorConsultation.rejected, (state, action) => {
        state.submitStatus = 'failed';
        state.submitMessage =
          action.payload || 'Submission failed. Please try again.';
      });
  },
});

export const { resetSubmitStatus } = eorSlice.actions;
export default eorSlice.reducer;
