import API_BASE from '../../utils/apiConfig';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Resolved safely via apiConfig (defaults to relative '/api' on production)
// API_BASE is imported above

export const fallbackBenchData = {
  hero: {
    liveRepoBadge: '142 PRE-VETTED TALENTS ON ACTIVE BENCH',
    title: 'Engineers on the Bench. Available to Deploy in 48 Hours.',
    subtitle:
      'Bypass the 60-day hiring cycle. Access active Thinkwires senior contractors, fully vetted with verified code commits, system design scores, and instant contract execution.',
    slaCard: {
      tag: '48-HOUR SLA ASSURANCE',
      title: 'Instant Pod Matching & Zero-Friction EOR Onboarding',
      description:
        'Every engineer has cleared multi-stage system architecture audits and is cleared for immediate client sprints.',
    },
  },
  statsBadges: [
    {
      icon: 'bolt',
      title: '48h Deployment SLA',
      desc: 'Contract to sprint kickoff in 2 business days',
    },
    {
      icon: 'verified_user',
      title: 'Top 1.5% Vetted',
      desc: 'Rigorous system design & live code defense',
    },
    {
      icon: 'shield',
      title: 'Zero Placement Risk',
      desc: '2-week satisfaction guarantee on every match',
    },
    {
      icon: 'lock',
      title: '100% IP & NDA Protected',
      desc: 'Enterprise-grade IP assignment & compliance',
    },
    {
      icon: 'trending_up',
      title: 'Flexible Pod Scaling',
      desc: 'Weekly, monthly, or contract-to-hire terms',
    },
  ],
  specialtyFilters: [
    { label: 'All Engineering', count: 142 },
    { label: 'GenAI & LLMs', count: 38 },
    { label: 'Cloud & DevOps', count: 31 },
    { label: 'SAP & Enterprise', count: 24 },
    { label: 'Systems & Distributed', count: 27 },
    { label: 'Data & Analytics', count: 22 },
  ],
  filterOptions: {
    urgency: [
      'All Urgency',
      'Immediate (24-48h)',
      'Ready in 24h',
      'Immediate Availability',
      'Immediate Joining',
      'Available in 48h',
      'Available in 7 Days',
    ],
    noticePeriod: [
      'All Notice Periods',
      '30 Days',
      'Immediate',
      '60 Days',
      '90 Days',
    ],
    experience: [
      'All Experience',
      'Staff/Principal (10+y)',
      'Senior (6-9y)',
      'Lead (8+y)',
    ],
    locations: [
      'All Locations',
      'Bengaluru (EST Overlap)',
      'Hyderabad / Remote Global',
      'Pune / Noida / Hybrid',
      'Chennai / Remote',
      'Pan-India (Full US Shift)',
      'Gurugram / Remote',
    ],
    sortOptions: [
      'AI Assessment',
      'Highest Score',
      'Fastest Availability',
      'Lowest Rate',
    ],
  },
  talents: [
    {
      id: 'TW-BENCH-902',
      code: 'TW-BENCH-902',
      role: 'Lead Cloud Infrastructure & Platform Architect',
      initials: 'AR',
      specialty: 'Cloud & DevOps',
      experienceLevel: 'Staff/Principal (10+y)',
      yearsExp: '11+ Yrs Experience',
      location: 'Bengaluru (EST Overlap)',
      score: 98,
      assessmentScore: 98,
      noticePeriod: 'Immediate',
      urgency: 'Immediate (24-48h)',
      hourlyRate: '₹5,500 – ₹6,800',
      proofQuote:
        'Reduced AWS infra spend by ₹10 Cr/yr while scaling payment gateway to 45k TPS with zero ledger anomalies.',
      skills: [
        'AWS EKS',
        'Terraform',
        'Istio Mesh',
        'FinOps',
        'Go',
        'Kubernetes',
      ],
      rubric: {
        systemDesign: 98,
        codeQuality: 99,
        liveDebugging: 99,
        communication: 97,
      },
      bio: 'Exceptional mastery over multi-tenant Kubernetes topologies across 8 AWS availability zones with zero downtime under payment flash sales.',
    },
    {
      id: 'TW-BENCH-884',
      code: 'TW-BENCH-884',
      role: 'Principal Generative AI & LLM Systems Engineer',
      initials: 'VK',
      specialty: 'GenAI & LLMs',
      experienceLevel: 'Staff/Principal (10+y)',
      yearsExp: '9+ Yrs (4 Yrs GenAI)',
      location: 'Hyderabad / Remote Global',
      score: 96,
      assessmentScore: 96,
      noticePeriod: '30 Days',
      urgency: '30 Days',
      hourlyRate: '₹6,000 – ₹7,200',
      proofQuote:
        'Engineered sovereign agentic RAG pipeline handling 3.5M daily document queries at <320ms TTFT.',
      skills: ['PyTorch', 'LangChain', 'vLLM', 'Pinecone', 'Triton', 'Python'],
      rubric: {
        systemDesign: 96,
        codeQuality: 97,
        liveDebugging: 98,
        communication: 95,
      },
      bio: 'In-depth understanding of GPU memory bandwidth constraints, KV cache optimizations, and Triton inference server orchestration.',
    },
    {
      id: 'TW-BENCH-741',
      code: 'TW-BENCH-741',
      role: 'Lead SAP ABAP on HANA & S/4 Cloud Specialist',
      initials: 'PS',
      specialty: 'SAP & Enterprise',
      experienceLevel: 'Lead (8+y)',
      yearsExp: '8+ Yrs (4 Greenfield S/4)',
      location: 'Pune / Noida / Hybrid',
      score: 95,
      assessmentScore: 95,
      noticePeriod: 'Immediate',
      urgency: 'Immediate (24-48h)',
      hourlyRate: '₹5,000 – ₹6,400',
      proofQuote:
        'Spearheaded core manufacturing logistics migration to SAP S/4HANA with 100% custom RICEF remediation.',
      skills: [
        'SAP S/4 HANA',
        'CDS Views',
        'AMDP',
        'Fiori',
        'OData v4',
        'ABAP Cloud',
      ],
      rubric: {
        systemDesign: 95,
        codeQuality: 96,
        liveDebugging: 97,
        communication: 94,
      },
      bio: 'Demonstrated seamless migration from classic ECC to clean-core S/4HANA with zero customer downtime.',
    },
    {
      id: 'TW-BENCH-655',
      code: 'TW-BENCH-655',
      role: 'Senior Adobe AEM Full Stack Architect (Cloud Service)',
      initials: 'RT',
      specialty: 'Systems & Distributed',
      experienceLevel: 'Lead (8+y)',
      yearsExp: '8+ Yrs Experience',
      location: 'Chennai / Remote',
      score: 94,
      assessmentScore: 94,
      noticePeriod: '30 Days',
      urgency: '30 Days',
      hourlyRate: '₹4,600 – ₹5,900',
      proofQuote:
        'Led omnichannel headless re-architecture achieving 99 Lighthouse performance across 14 localized domains.',
      skills: [
        'AEMaaCS',
        'OSGi',
        'React',
        'Adobe Target',
        'HTL / Sling',
        'GraphQL',
      ],
      rubric: {
        systemDesign: 94,
        codeQuality: 95,
        liveDebugging: 96,
        communication: 95,
      },
      bio: 'Strong mastery of Adobe Experience Platform Web SDK and seamless SPA editor integration.',
    },
    {
      id: 'TW-BENCH-512',
      code: 'TW-BENCH-512',
      role: 'Staff Distributed Systems & Payment Platform Engineer',
      initials: 'SM',
      specialty: 'Systems & Distributed',
      experienceLevel: 'Staff/Principal (10+y)',
      yearsExp: '10+ Yrs Experience',
      location: 'Pan-India (Full US Shift)',
      score: 99,
      assessmentScore: 99,
      noticePeriod: '30 Days',
      urgency: '30 Days',
      hourlyRate: '₹6,400 – ₹7,600',
      proofQuote:
        'Architected real-time distributed ACH ledger processing ₹6,700 Cr monthly volume with sub-millisecond locks.',
      skills: [
        'Java 21',
        'Rust',
        'Kafka Streams',
        'Distributed Locks',
        'SOC2 Type II',
        'PostgreSQL',
      ],
      rubric: {
        systemDesign: 99,
        codeQuality: 99,
        liveDebugging: 99,
        communication: 98,
      },
      bio: 'Phenomenal clarity on distributed ledger consistency, raft consensus, and transactional isolation levels.',
    },
    {
      id: 'TW-BENCH-389',
      code: 'TW-BENCH-389',
      role: 'Senior Snowflake Data Platform & dbt Architect',
      initials: 'NA',
      specialty: 'Data & Analytics',
      experienceLevel: 'Senior (6-9y)',
      yearsExp: '7+ Yrs Experience',
      location: 'Gurugram / Remote',
      score: 95,
      assessmentScore: 95,
      noticePeriod: '60 Days',
      urgency: '60 Days',
      hourlyRate: '₹4,600 – ₹5,900',
      proofQuote:
        'Cut analytical query latency by 68% and optimized cloud warehouse computing credits by 42% via dbt models.',
      skills: [
        'Snowflake',
        'dbt Core',
        'Airflow',
        'PySpark',
        'Databricks',
        'SQL',
      ],
      rubric: {
        systemDesign: 95,
        codeQuality: 96,
        liveDebugging: 95,
        communication: 96,
      },
      bio: 'Exceptional expertise in cost-governed data pipelines and zero-copy cloning for QA verification.',
    },
  ],
  dossierFeatures: [
    {
      step: '01',
      icon: 'terminal',
      title: 'Real PR & GitHub Audit',
      description:
        'We inspect actual pull requests, branch management, unit test coverage (>85%), and cyclomatic code complexity ratings.',
      highlight: 'Automated SonarQube Proof',
    },
    {
      step: '02',
      icon: 'rule',
      title: 'Architect Rubric Scorecard',
      description:
        '60-minute recorded system design session evaluated by Thinkwires Principal Reviewers against CAP theorem, caching, and resiliency.',
      highlight: 'Standardized 100-pt Scale',
    },
    {
      step: '03',
      icon: 'videocam',
      title: '4-Min Technical Video Intro',
      description:
        'Candidate verbally explains their toughest production architectural failure, how they resolved it, and communicates in executive English.',
      highlight: 'Verify Soft Skills Instantly',
    },
    {
      step: '04',
      icon: 'verified',
      title: 'Pre-Cleared EOR Compliance',
      description:
        'Dual criminal background checks, past employer statutory PF verification, degrees validated, and immediate IP agreement readiness.',
      highlight: 'Zero Legal Drag',
    },
  ],
  vettingGates: [
    {
      gateNumber: 'GATE 01',
      title: 'Deep Code & Concurrency Review',
      passRate: '68% Filtered',
      badge: 'Automated Sandbox & Git',
      details: [
        'Production repository inspection and PR review',
        'Thread safety, edge case handling, and algorithmic efficiency',
      ],
    },
    {
      gateNumber: 'GATE 02',
      title: 'Live System Architecture Defense',
      passRate: '82% Cumulative Drop',
      badge: 'Principal Staff Defense',
      details: [
        'Defense of high-concurrency caching & microservice boundaries',
        'Data consistency under failure modes before Principal Architects',
      ],
    },
    {
      gateNumber: 'GATE 03',
      title: 'Bilateral EOR & Communication Bar',
      passRate: 'Final Pass Rate: 1.5%',
      badge: 'Executive & IP Pre-Clearance',
      details: [
        'Strict executive English communication appraisal & timezone check',
        'Identity validation and bilateral IP contract signing',
      ],
    },
  ],
  requisitionCta: {
    tag: 'NEED BESPOKE TALENT PODS?',
    title: "Can't Find the Exact Stack on Today's Active Bench?",
    description:
      'Deploy a custom requisition. Our dedicated sourcing team will curate and evaluate candidate dossiers matching your exact stack within 48 to 72 hours.',
    primaryBtn: { text: 'Dispatch Custom Pod Requisition', link: '/contact' },
    secondaryBtn: { text: 'Speak with a Director', link: '/contact' },
  },
};

export const fetchBenchData = createAsyncThunk(
  'bench/fetchBenchData',
  async () => {
    const response = await fetch(`${API_BASE}/bench`);
    if (!response.ok) {
      throw new Error('Failed to fetch bench data');
    }
    return response.json();
  }
);

export const bookTalentInterview = createAsyncThunk(
  'bench/bookTalentInterview',
  async (bookingData) => {
    const response = await fetch(`${API_BASE}/bench/book-interview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    });
    if (!response.ok) {
      throw new Error('Failed to book talent interview');
    }
    return response.json();
  }
);

const initialState = {
  hero: fallbackBenchData.hero,
  statsBadges: fallbackBenchData.statsBadges,
  specialtyFilters: fallbackBenchData.specialtyFilters,
  filterOptions: fallbackBenchData.filterOptions,
  talents: fallbackBenchData.talents,
  dossierFeatures: fallbackBenchData.dossierFeatures,
  vettingGates: fallbackBenchData.vettingGates,
  requisitionCta: fallbackBenchData.requisitionCta,

  // UI Filter state
  activeSpecialty: 'All Engineering',
  activeUrgency: 'All Urgency',
  activeNoticePeriod: 'All Notice Periods',
  activeExperience: 'All Experience',
  activeLocation: 'All Locations',
  sortBy: 'AI Assessment',
  searchQuery: '',
  selectedTalent: null, // For slide-over drawer modal
  drawerOpen: false,
  bookingStatus: 'idle', // 'idle' | 'loading' | 'success' | 'failed'
  bookingMessage: null,

  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const benchSlice = createSlice({
  name: 'bench',
  initialState,
  reducers: {
    setActiveSpecialty: (state, action) => {
      state.activeSpecialty = action.payload;
    },
    setActiveUrgency: (state, action) => {
      state.activeUrgency = action.payload;
    },
    setActiveNoticePeriod: (state, action) => {
      state.activeNoticePeriod = action.payload;
    },
    setActiveExperience: (state, action) => {
      state.activeExperience = action.payload;
    },
    setActiveLocation: (state, action) => {
      state.activeLocation = action.payload;
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    openDrawer: (state, action) => {
      state.selectedTalent = action.payload;
      state.drawerOpen = true;
      state.bookingStatus = 'idle';
      state.bookingMessage = null;
    },
    closeDrawer: (state) => {
      state.drawerOpen = false;
      state.selectedTalent = null;
    },
    resetBookingStatus: (state) => {
      state.bookingStatus = 'idle';
      state.bookingMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBenchData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchBenchData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const data = action.payload || {};
        state.hero = data.hero || null;
        state.statsBadges = data.statsBadges || [];
        state.specialtyFilters = data.specialtyFilters || [];
        state.filterOptions = data.filterOptions || initialState.filterOptions;
        state.talents = data.talents || [];
        state.dossierFeatures = data.dossierFeatures || [];
        state.vettingGates = data.vettingGates || [];
        state.requisitionCta = data.requisitionCta || null;
      })
      .addCase(fetchBenchData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(bookTalentInterview.pending, (state) => {
        state.bookingStatus = 'loading';
      })
      .addCase(bookTalentInterview.fulfilled, (state, action) => {
        state.bookingStatus = 'success';
        state.bookingMessage =
          action.payload?.message || 'Interview successfully scheduled!';
      })
      .addCase(bookTalentInterview.rejected, (state, action) => {
        state.bookingStatus = 'failed';
        state.bookingMessage =
          action.error.message || 'Failed to submit interview booking.';
      });
  },
});

export const {
  setActiveSpecialty,
  setActiveUrgency,
  setActiveNoticePeriod,
  setActiveExperience,
  setActiveLocation,
  setSortBy,
  setSearchQuery,
  openDrawer,
  closeDrawer,
  resetBookingStatus,
} = benchSlice.actions;

export default benchSlice.reducer;
