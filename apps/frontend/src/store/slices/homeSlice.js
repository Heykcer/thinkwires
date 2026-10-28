import API_BASE from '../../utils/apiConfig';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import mockData from '../../data/mockdata.json';
import staticData from '../../data/staticData.json';

const initialOpenings = (mockData.openings || []).map((j) => ({
  ...j,
  company: 'Enterprise Client (Confidential)',
  client: 'Enterprise Client (Confidential)',
}));
const {
  techStack: staticTechStack = [],
  process: staticProcess = [],
  capabilities: staticCapabilities = [],
  benefits: staticBenefits = [],
  faqs: staticFaqs = [],
  industries: staticIndustries = [],
  reports: staticReports = [],
} = staticData;

// Resolved safely via apiConfig (defaults to relative '/api' on production)
// API_BASE is imported above

export const fetchOpenings = createAsyncThunk(
  'home/fetchOpenings',
  async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.q) queryParams.append('q', params.q);
      if (params.location && params.location !== 'All')
        queryParams.append('location', params.location);
      if (params.experience && params.experience !== 'All')
        queryParams.append('experience', params.experience);
      if (
        params.workMode &&
        params.workMode !== 'All Modes' &&
        params.workMode !== 'All'
      )
        queryParams.append('workMode', params.workMode);
      if (
        params.jobMode &&
        params.jobMode !== 'All Modes' &&
        params.jobMode !== 'All Types' &&
        params.jobMode !== 'All'
      )
        queryParams.append('jobMode', params.jobMode);
      if (
        params.noticePeriod &&
        params.noticePeriod !== 'All Notice' &&
        params.noticePeriod !== 'All'
      )
        queryParams.append('noticePeriod', params.noticePeriod);
      if (
        params.department &&
        params.department !== 'All Roles' &&
        params.department !== 'All'
      )
        queryParams.append('department', params.department);
      if (params.sort) queryParams.append('sort', params.sort);

      const queryString = queryParams.toString();
      const response = await fetch(
        `${API_BASE}/openings${queryString ? `?${queryString}` : ''}`
      );
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {
      // Backend offline or unreachable - use rich local dataset
    }

    let filtered = [...initialOpenings];
    if (params.q) {
      const qLower = params.q.toLowerCase();
      filtered = filtered.filter(
        (j) =>
          j.title.toLowerCase().includes(qLower) ||
          j.category.toLowerCase().includes(qLower) ||
          (j.skills && j.skills.some((s) => s.toLowerCase().includes(qLower)))
      );
    }
    if (
      params.department &&
      params.department !== 'All Roles' &&
      params.department !== 'All'
    ) {
      filtered = filtered.filter((j) => j.department === params.department);
    }
    if (params.location && params.location !== 'All') {
      filtered = filtered.filter((j) =>
        j.location.toLowerCase().includes(params.location.toLowerCase())
      );
    }
    if (
      params.workMode &&
      params.workMode !== 'All Modes' &&
      params.workMode !== 'All'
    ) {
      filtered = filtered.filter((j) => j.workMode === params.workMode);
    }
    if (
      params.jobMode &&
      params.jobMode !== 'All Types' &&
      params.jobMode !== 'All Modes' &&
      params.jobMode !== 'All'
    ) {
      filtered = filtered.filter((j) => j.jobMode === params.jobMode);
    }
    return filtered;
  }
);

export const fetchTechStack = createAsyncThunk(
  'home/fetchTechStack',
  async () => staticTechStack
);

export const fetchStats = createAsyncThunk('home/fetchStats', async () => {
  const response = await fetch(`${API_BASE}/stats`);
  return await response.json();
});

export const fetchIndustries = createAsyncThunk(
  'home/fetchIndustries',
  async () => {
    const response = await fetch(`${API_BASE}/industries`);
    return await response.json();
  }
);

export const fetchProcess = createAsyncThunk('home/fetchProcess', async () => {
  const response = await fetch(`${API_BASE}/process`);
  return await response.json();
});

export const fetchCapabilities = createAsyncThunk(
  'home/fetchCapabilities',
  async () => {
    const response = await fetch(`${API_BASE}/capabilities`);
    return await response.json();
  }
);

export const fetchReports = createAsyncThunk('home/fetchReports', async () => {
  const response = await fetch(`${API_BASE}/reports`);
  return await response.json();
});

export const fetchBenefits = createAsyncThunk(
  'home/fetchBenefits',
  async () => {
    const response = await fetch(`${API_BASE}/benefits`);
    return await response.json();
  }
);

export const fetchFaqs = createAsyncThunk('home/fetchFaqs', async () => {
  const response = await fetch(`${API_BASE}/faqs`);
  return await response.json();
});

const homeSlice = createSlice({
  name: 'home',
  initialState: {
    techStack: staticTechStack,
    openings: initialOpenings,
    stats: {
      vacancies: 125,
      companies: 740,
      hired: 999,
      satisfaction: 95,
      jobsFilled: 130,
      corePlacements: 55,
      contingentHired: 125,
      clientRetention: 95,
    },
    industries: staticIndustries,
    process: staticProcess,
    capabilities: staticCapabilities,
    reports: staticReports,
    benefits: staticBenefits,
    faqs: staticFaqs,
    status: {
      techStack: 'idle',
      openings: 'idle',
      stats: 'idle',
      industries: 'idle',
      process: 'idle',
      capabilities: 'idle',
      reports: 'idle',
      benefits: 'idle',
      faqs: 'idle',
    },
    errors: {
      techStack: null,
      openings: null,
      stats: null,
      industries: null,
      process: null,
      capabilities: null,
      reports: null,
      benefits: null,
      faqs: null,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Tech Stack (Static)
      .addCase(fetchTechStack.fulfilled, (state) => {
        state.status.techStack = 'succeeded';
        state.techStack = staticTechStack;
      })
      // Openings
      .addCase(fetchOpenings.pending, (state) => {
        state.status.openings = 'loading';
      })
      .addCase(fetchOpenings.fulfilled, (state, action) => {
        state.status.openings = 'succeeded';
        state.openings = action.payload;
      })
      .addCase(fetchOpenings.rejected, (state, action) => {
        state.status.openings = 'failed';
        state.errors.openings = action.error.message;
      })
      // Stats
      .addCase(fetchStats.pending, (state) => {
        state.status.stats = 'loading';
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.status.stats = 'succeeded';
        state.stats = action.payload;
      })
      .addCase(fetchStats.rejected, (state, action) => {
        state.status.stats = 'failed';
        state.errors.stats = action.error.message;
      })
      // Industries
      .addCase(fetchIndustries.pending, (state) => {
        state.status.industries = 'loading';
      })
      .addCase(fetchIndustries.fulfilled, (state, action) => {
        state.status.industries = 'succeeded';
        state.industries = action.payload;
      })
      .addCase(fetchIndustries.rejected, (state, action) => {
        state.status.industries = 'failed';
        state.errors.industries = action.error.message;
      })
      // Process
      .addCase(fetchProcess.pending, (state) => {
        state.status.process = 'loading';
      })
      .addCase(fetchProcess.fulfilled, (state, action) => {
        state.status.process = 'succeeded';
        state.process = action.payload;
      })
      .addCase(fetchProcess.rejected, (state, action) => {
        state.status.process = 'failed';
        state.errors.process = action.error.message;
      })
      // Capabilities
      .addCase(fetchCapabilities.pending, (state) => {
        state.status.capabilities = 'loading';
      })
      .addCase(fetchCapabilities.fulfilled, (state, action) => {
        state.status.capabilities = 'succeeded';
        state.capabilities = action.payload;
      })
      .addCase(fetchCapabilities.rejected, (state, action) => {
        state.status.capabilities = 'failed';
        state.errors.capabilities = action.error.message;
      })
      // Reports
      .addCase(fetchReports.pending, (state) => {
        state.status.reports = 'loading';
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.status.reports = 'succeeded';
        state.reports = action.payload;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.status.reports = 'failed';
        state.errors.reports = action.error.message;
      })
      // Benefits
      .addCase(fetchBenefits.pending, (state) => {
        state.status.benefits = 'loading';
      })
      .addCase(fetchBenefits.fulfilled, (state, action) => {
        state.status.benefits = 'succeeded';
        state.benefits = action.payload;
      })
      .addCase(fetchBenefits.rejected, (state, action) => {
        state.status.benefits = 'failed';
        state.errors.benefits = action.error.message;
      })
      // FAQs
      .addCase(fetchFaqs.pending, (state) => {
        state.status.faqs = 'loading';
      })
      .addCase(fetchFaqs.fulfilled, (state, action) => {
        state.status.faqs = 'succeeded';
        state.faqs = action.payload;
      })
      .addCase(fetchFaqs.rejected, (state, action) => {
        state.status.faqs = 'failed';
        state.errors.faqs = action.error.message;
      });
  },
});

export default homeSlice.reducer;
