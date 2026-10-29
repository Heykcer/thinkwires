import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getApiBaseUrl } from '../../utils/apiConfig';

export const fallbackCandidatePortalData = {
  profile: {
    name: 'Arvind S. Nair',
    headline: 'Principal Cloud & Distributed Systems Architect',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCXwtAT0f7p0VCdMlVo3MiUjwUJGp5af5ZjwGH57y-n1sKCl--3KmXzsBx_gTdCYVHYQhDAcJUAKy47e-0_F6Mu7jOBiodVqnG88O1HtQNQ8qEbYvZF41FdUOWNC9-pDHAEVY893vrP1on_tnyhnYbEUOzw-QT6BUM8DXsbVDwlLXdkgj9FblGxXHK-pAn2aLQ_l1sL9I1k9c8Rk2SSxGHttlDydbJDUexg6U6vrUFaeZyZ0LgWxEK2HA',
    location: 'Bengaluru • Remote US & India Overlap (4h EST/PST)',
    compliance: 'SOC 2 & ISO 27001 Verified Identity',
    vettingTag: 'Top 3.4% Pre-Vetted Talent • Active on Live Bench',
    dispatchTag: 'Immediate 48-Hour Client Dispatch',
    healthScore: '96%',
    healthStatus: 'All Background Checks Sealed',
  },
  metrics: [
    {
      id: 'matches',
      title: 'Active Matches',
      stat: '7',
      unit: 'Mandates',
      subtext: '+3 new this week (US & GCC clients)',
      icon: 'hub',
    },
    {
      id: 'ctc',
      title: 'CTC / Bench Retainer',
      stat: '₹42 LPA',
      unit: 'Annual Retainer',
      subtext: 'Fixed Base + Milestone Escrow',
      icon: 'payments',
    },
    {
      id: 'vetting',
      title: 'Vetting Scorecard',
      stat: '98.4th',
      unit: 'Percentile',
      subtext: 'System Arch & Distributed Ledgers',
      icon: 'military_tech',
    },
    {
      id: 'interview',
      title: 'Next Interview',
      stat: 'In 3 Hours',
      unit: 'TODAY',
      subtext: 'Series-C FinTech • San Francisco (CTO Round)',
      icon: 'alarm',
      isHighlight: true,
    },
  ],
  stages: [
    {
      stage: 1,
      title: 'Identity & Stack Verification',
      desc: 'KYC, Global Criminal Background, and credential verification audited under SOC 2.',
      status: 'Completed & Sealed',
      isDone: true,
    },
    {
      stage: 2,
      title: 'Architecture Peer Review',
      desc: 'Rigorous live system design panel with US tier-1 engineering directors.',
      status: 'Passed with 98.4%',
      isDone: true,
    },
    {
      stage: 3,
      title: 'Live Bench Syndication',
      desc: 'Candidate profile syndicated to 740+ verified enterprise client accounts.',
      status: 'Visible to 740+ Enterprises',
      isDone: true,
    },
    {
      stage: 4,
      title: 'Client Mandate Alignment',
      desc: 'Direct dispatch to US FinTech or Healthcare engineering pods.',
      status: 'Final Offer Stage (Active)',
      isActive: true,
    },
    {
      stage: 5,
      title: 'Contract Signing & Milestone Escrow',
      desc: 'Bi-weekly payout escrow lock and milestone verification.',
      status: 'Pending Stage 4 Completion',
      isPending: true,
    },
  ],
  pipeline: [
    {
      id: 'p1',
      badge: 'VC',
      role: 'Staff Infrastructure Architect',
      status: 'Executive CTO Round Scheduled',
      statusType: 'interview',
      company: 'Vantage Cloud Systems • San Francisco (Remote US)',
      sla: 'Interview: Today at 5:30 PM IST (Zoom)',
      panel: 'Panel: Alex Chen (VP Eng) & Sarah Lin (Staff Arch)',
      canJoin: true,
    },
    {
      id: 'p2',
      badge: 'NL',
      role: 'Lead Distributed Systems Engineer',
      status: 'Panel Feedback: Strong Hire (98.4%)',
      statusType: 'review',
      company: 'Nexus Ledger Labs • New York (Hybrid EST)',
      sla: 'HR Compensation Discussion Pending',
      panel: 'Interviewer rating: 4.9 / 5.0',
      canJoin: false,
    },
    {
      id: 'p3',
      badge: 'AF',
      role: 'Principal Solutions Architect',
      status: 'Offer Rolled Out • ₹44 LPA + Retention Bonus',
      statusType: 'offer',
      company: 'Apex Financial GCC • Hyderabad (Enterprise Hybrid)',
      sla: 'Decision Window: 4 business days remaining',
      panel: 'Includes US Equity Component',
      isOffer: true,
    },
  ],
  technicalAssessment: {
    auditDate: 'Dec 2024 Audit',
    scores: [
      { name: 'Clean Code', val: 99 },
      { name: 'Distributed Rel.', val: 98 },
      { name: 'Cloud Security', val: 97 },
      { name: 'System Design', val: 98 },
    ],
    repository: {
      url: 'github.com/arvind-nair/distributed-ledger-core',
      stars: 840,
      whitepaper: 'High-Throughput Zero-Copy Ring Buffers in Go',
    },
    sponsoredTrack: {
      title: 'Kubernetes CKA Refresh Challenge',
      desc: 'Thinkwires sponsors 100% of exam fees for certified cloud architects refreshing their advanced container security credentials.',
      target: 'CNCF CKA 2025 v1.31 Release',
      prepTime: 'Estimated prep time: 8-12 hours',
    },
  },
  payoutAndCompliance: {
    activePlacement: {
      client: 'Vantage Cloud Systems',
      contract: 'On-demand Staff Augmentation Pod (Tier-1)',
      hours: '38.5 / 40.0 hrs',
      status: 'Approved',
    },
    escrow: {
      amountInr: '₹3,50,000',
      amountUsd: '/ Month Net',
      releaseDate: 'Automated Direct Transfer on 30th',
      bank: 'Primary Account: HDFC Bank •••• 8419',
      verified: true,
    },
    complianceVault: [
      { title: 'Form 16 Generated', meta: 'FY 2024-25' },
      { title: 'Form W-8BEN Signed', meta: 'US Tax Treaty' },
      { title: 'IP Assignment Agreement', meta: 'Active' },
    ],
  },
  concierge: {
    name: 'Meera Iyer',
    role: 'Senior Director - Global Talent Operations & Candidate Advocate',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD3_fNrKZrdX7wzEga8HMg9HJC7tpO5ja7xmdZLSByZZLcsRwqFCX9iqpwXVfUXprZuj4U-KpNN7i88ZcFgooAN0vN0E5YD0e3ZJMYorLezjr2_RDjt2ASUe77cxWwCWLTGoIqRNlnS0Xw6RrPLZpBB6JBfv98XcTccVovBHjTGC5R8nDduq2iuoeSm6NAQlZT1kcrSdSrQxONMQ2PC7hB_n14aPTJenVxZkLhQCoOjyru4Ks7F-28uSA',
    email: 'hr@thinkwires.com',
    sla: 'Average response time: < 8 minutes',
  },
};

export const fetchCandidatePortalData = createAsyncThunk(
  'candidatePortal/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/candidate-portal`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch Candidate Portal data');
      }
      return await response.json();
    } catch (error) {
      console.warn('Using fallback Candidate Portal data:', error.message);
      return fallbackCandidatePortalData;
    }
  }
);

export const submitCandidateTimesheet = createAsyncThunk(
  'candidatePortal/submitTimesheet',
  async (timesheetData, { rejectWithValue }) => {
    try {
      const apiBase = getApiBaseUrl();
      const response = await fetch(`${apiBase}/candidate-portal/timesheet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(timesheetData),
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to submit timesheet');
      }
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const candidatePortalSlice = createSlice({
  name: 'candidatePortal',
  initialState: {
    data: fallbackCandidatePortalData,
    status: 'idle',
    error: null,
    timesheetStatus: 'idle',
    timesheetSuccess: false,
    incognitoActive: false,
  },
  reducers: {
    toggleIncognito: (state) => {
      state.incognitoActive = !state.incognitoActive;
    },
    resetTimesheetState: (state) => {
      state.timesheetStatus = 'idle';
      state.timesheetSuccess = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCandidatePortalData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCandidatePortalData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.data = action.payload || fallbackCandidatePortalData;
      })
      .addCase(fetchCandidatePortalData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(submitCandidateTimesheet.pending, (state) => {
        state.timesheetStatus = 'loading';
        state.timesheetSuccess = false;
      })
      .addCase(submitCandidateTimesheet.fulfilled, (state) => {
        state.timesheetStatus = 'succeeded';
        state.timesheetSuccess = true;
      })
      .addCase(submitCandidateTimesheet.rejected, (state) => {
        state.timesheetStatus = 'failed';
      });
  },
});

export const { toggleIncognito, resetTimesheetState } =
  candidatePortalSlice.actions;
export default candidatePortalSlice.reducer;
