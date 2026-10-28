import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import mockData from '../../data/mockdata.json';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const fallbackPageData = mockData.industriesPageData || {};
const fallbackDetails = mockData.industriesDetails || {};

export const fetchIndustriesPageData = createAsyncThunk(
  'industries/fetchIndustriesPageData',
  async () => {
    try {
      const response = await fetch(`${API_BASE}/industries-page`);
      if (response.ok) {
        const data = await response.json();
        return { ...data, _isMock: false };
      }
    } catch (err) {
      console.warn('API /industries-page unavailable, utilizing mock data:', err.message);
    }
    return { ...fallbackPageData, _isMock: true };
  }
);

export const fetchSectorCatalog = createAsyncThunk(
  'industries/fetchSectorCatalog',
  async () => {
    try {
      const response = await fetch(`${API_BASE}/sector-catalog`);
      if (response.ok) {
        const data = await response.json();
        return { sectors: data, _isMock: false };
      }
    } catch (err) {
      console.warn('API /sector-catalog unavailable, utilizing mock data:', err.message);
    }
    return { sectors: fallbackPageData.sectors || [], _isMock: true };
  }
);

export const fetchIndustryBySlug = createAsyncThunk(
  'industries/fetchIndustryBySlug',
  async (slug) => {
    try {
      const response = await fetch(`${API_BASE}/industries/${slug}`);
      if (response.ok) {
        const resData = await response.json();
        const data = resData?.data || (resData && !('dynamic' in resData) ? resData : null);
        if (data && Object.keys(data).length > 0) {
          return { slug, data, _isMock: false };
        }
      }
    } catch (err) {
      console.warn(`API /industries/${slug} unavailable, utilizing mock data:`, err.message);
    }
    return {
      slug,
      data: fallbackDetails[slug] || null,
      _isMock: true,
    };
  }
);

const initialState = {
  hero: fallbackPageData.hero || null,
  sectorTabs: fallbackPageData.sectorTabs || [],
  sectors: fallbackPageData.sectors || [],
  featureComparison: fallbackPageData.featureComparison || null,
  caseStudies: fallbackPageData.caseStudies || null,
  capabilityBriefing: fallbackPageData.capabilityBriefing || null,
  industryDetails: fallbackDetails,
  currentIndustry: null,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const industriesSlice = createSlice({
  name: 'industries',
  initialState,
  reducers: {
    setCurrentIndustryBySlug: (state, action) => {
      const slug = action.payload;
      state.currentIndustry = state.industryDetails[slug] || null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Full industries page data
      .addCase(fetchIndustriesPageData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchIndustriesPageData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const data = action.payload || {};
        if (data.hero) state.hero = data.hero;
        if (data.sectorTabs && data.sectorTabs.length > 0) state.sectorTabs = data.sectorTabs;
        if (data.sectors && data.sectors.length > 0) state.sectors = data.sectors;
        if (data.featureComparison) state.featureComparison = data.featureComparison;
        if (data.caseStudies) state.caseStudies = data.caseStudies;
        if (data.capabilityBriefing) state.capabilityBriefing = data.capabilityBriefing;
      })
      .addCase(fetchIndustriesPageData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      // Sector catalog fetch
      .addCase(fetchSectorCatalog.fulfilled, (state, action) => {
        if (action.payload?.sectors && action.payload.sectors.length > 0) {
          state.sectors = action.payload.sectors;
        }
      })
      // Industry detail by slug
      .addCase(fetchIndustryBySlug.fulfilled, (state, action) => {
        const { slug, data } = action.payload || {};
        if (slug && data) {
          state.industryDetails[slug] = {
            ...(state.industryDetails[slug] || {}),
            ...data,
          };
          state.currentIndustry = state.industryDetails[slug];
        }
      });
  },
});

export const { setCurrentIndustryBySlug } = industriesSlice.actions;

// Utility Lookups & Selectors
export const INDUSTRY_TABS = fallbackPageData.sectorTabs || [];
export const industriesData = fallbackDetails;

export const getIndustryBySlug = (slug) => {
  if (!slug) return null;
  const cleanSlug = slug.toLowerCase().trim();
  return fallbackDetails[cleanSlug] || null;
};

export const getAllIndustries = () => {
  return Object.values(fallbackDetails);
};

export const getIndustrySlugByJobSector = (jobSectorOrTitle) => {
  if (!jobSectorOrTitle) return 'information-technology';
  const val = jobSectorOrTitle.toLowerCase();

  // Evaluate specific domain keywords first
  if (
    val.includes('fintech') ||
    val.includes('bank') ||
    val.includes('bfsi') ||
    val.includes('ach') ||
    val.includes('payment') ||
    val.includes('financial') ||
    val.includes('trading') ||
    val.includes('ledger') ||
    val.includes('crypto')
  ) {
    return 'bfsi';
  }
  if (
    val.includes('health') ||
    val.includes('clinical') ||
    val.includes('biotech') ||
    val.includes('pharma') ||
    val.includes('fhir') ||
    val.includes('hipaa') ||
    val.includes('medical') ||
    val.includes('life sciences')
  ) {
    return 'healthcare-life-sciences';
  }
  if (
    val.includes('defense') ||
    val.includes('aerospace') ||
    val.includes('avionics') ||
    val.includes('military') ||
    val.includes('satellite') ||
    val.includes('radar')
  ) {
    return 'aerospace-defense';
  }
  if (
    val.includes('telecom') ||
    val.includes('5g') ||
    val.includes('ran') ||
    val.includes('network') ||
    val.includes('optical') ||
    val.includes('oss/bss')
  ) {
    return 'telecommunications';
  }
  if (
    val.includes('retail') ||
    val.includes('commerce') ||
    val.includes('shopify') ||
    val.includes('cart') ||
    val.includes('ecommerce')
  ) {
    return 'retail-ecommerce';
  }
  if (
    val.includes('energy') ||
    val.includes('utility') ||
    val.includes('smart grid') ||
    val.includes('der') ||
    val.includes('scada') ||
    val.includes('renewable')
  ) {
    return 'energy-utilities';
  }
  if (
    val.includes('edtech') ||
    val.includes('education') ||
    val.includes('lms') ||
    val.includes('scorm') ||
    val.includes('learning')
  ) {
    return 'education-edtech';
  }
  if (
    val.includes('automotive') ||
    val.includes('ev') ||
    val.includes('adas') ||
    val.includes('autonomous') ||
    val.includes('autosar') ||
    val.includes('battery')
  ) {
    return 'automotive-mobility';
  }
  if (
    val.includes('manufacturing') ||
    val.includes('mes') ||
    val.includes('oee') ||
    val.includes('plc') ||
    val.includes('industry 4.0') ||
    val.includes('automobile')
  ) {
    return 'automobile-manufacturing';
  }
  if (
    val.includes('consulting') ||
    val.includes('professional') ||
    val.includes('audit') ||
    val.includes('legal') ||
    val.includes('advisory')
  ) {
    return 'professional-services';
  }
  if (
    val.includes('cloud') ||
    val.includes('software') ||
    val.includes('saas') ||
    val.includes('tech') ||
    val.includes('devops') ||
    val.includes('full stack') ||
    val.includes('kubernetes') ||
    val.includes('data') ||
    val.includes('ai') ||
    val.includes('frontend') ||
    val.includes('backend')
  ) {
    return 'information-technology';
  }

  return 'information-technology';
};

export const getSearchTermForIndustry = (slug) => {
  const map = {
    'bfsi': 'FinTech',
    'information-technology': 'Cloud',
    'healthcare-life-sciences': 'HealthTech',
    'automobile-manufacturing': 'Manufacturing',
    'automotive-mobility': 'Automotive',
    'telecommunications': 'Telecom',
    'retail-ecommerce': 'Commerce',
    'energy-utilities': 'Energy',
    'education-edtech': 'EdTech',
    'professional-services': 'Consulting',
    'aerospace-defense': 'Defense',
  };
  return map[slug] || '';
};

export default industriesSlice.reducer;
