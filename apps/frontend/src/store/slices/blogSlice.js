import API_BASE from '../../utils/apiConfig';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import featuredImgAsset from '../../assets/blog_ai_gcc_dashboard.jpg';

// Resolved safely via apiConfig (defaults to relative '/api' on production)
// API_BASE is imported above

export const fetchArticles = createAsyncThunk(
  'blog/fetchArticles',
  async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.q) queryParams.append('q', params.q);
      if (
        params.category &&
        params.category !== 'all' &&
        params.category !== 'All' &&
        !params.category.startsWith('All Insights')
      ) {
        queryParams.append('category', params.category);
      }

      const queryString = queryParams.toString();
      const response = await fetch(
        `${API_BASE}/articles${queryString ? `?${queryString}` : ''}`
      );
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (err) {
      return null;
    }
  }
);

export const fetchFeaturedArticle = createAsyncThunk(
  'blog/fetchFeaturedArticle',
  async () => {
    try {
      const response = await fetch(`${API_BASE}/articles/featured`);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (err) {
      return null;
    }
  }
);

export const fetchResearchers = createAsyncThunk(
  'blog/fetchResearchers',
  async () => {
    try {
      const response = await fetch(`${API_BASE}/articles/researchers`);
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (err) {
      return null;
    }
  }
);

export const subscribeNewsletter = createAsyncThunk(
  'blog/subscribeNewsletter',
  async (data) => {
    try {
      const response = await fetch(`${API_BASE}/articles/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      return await response.json();
    } catch (err) {
      return null;
    }
  }
);

const featuredFlagshipArticle = {
  id: 'featured-flagship-1',
  featured: true,
  title:
    'Beyond the Code: How Data Science and AI Are Engine-Building the New India',
  excerpt:
    "India's tech story is undergoing a fundamental structural pivot. The nation is shifting from being the back-office support system for global tech to becoming the primary engine for global R&D and indigenous AI innovations. Over the next five years, data science will evolve from passive business intelligence into an infrastructure-level driver of governance, industry, and economic mobility.",
  primaryFinding:
    'Global GCC capability share in tier-1 Indian centers rose from 24% maintenance to 68% high-order machine learning IP generation in 2026.',
  category: 'AI & Data Science',
  categoryColor: '#2563EB',
  categories: [
    { name: 'AI & Data Science', bg: '#dbeafe', color: '#1e40af' },
    { name: 'GCC Trends', bg: '#f1f5f9', color: '#475569' },
    { name: 'Strategic Shift', bg: '#dcfce7', color: '#166534' },
  ],
  author: {
    name: 'Research & Advisory Team',
    role: 'Macro Technology Practice',
  },
  publishedAt: 'Sep 16, 2026',
  readTime: '12 min read',
  imageUrl: featuredImgAsset,
};

const figmaArticlesGrid = [
  {
    id: 'card-1',
    featured: false,
    badge: 'Market Report',
    badgeBg: '#dbeafe',
    badgeColor: '#1e40af',
    readTime: '8 min read',
    publishedAt: 'Aug 26, 2026',
    subCategory: 'Talent Benchmarks',
    title:
      "India's IT Job Market in 2026: Hiring Is Recovering — So Why Are Candidates Getting Fewer Responses?",
    excerpt:
      'The latest available India IT hiring data and market signals as of August 2026. The important finding is that the market is not simply "low hiring" — it is a...',
    telemetry: {
      type: 'box-split',
      label1: 'CONVERSION GAP',
      value1: '1:47 Ratio',
      badgeLabel: 'Selective Bias',
      badgeValue: 'Specialized vs General',
      boxBg: '#fae8ff',
    },
    author: {
      initials: 'AN',
      name: 'Ananya Roy',
      avatar:
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150',
    },
    category: 'IT Job Market Reports',
  },
  {
    id: 'card-2',
    featured: false,
    badge: 'AI Recruitment',
    badgeBg: '#ede9fe',
    badgeColor: '#5b21b6',
    readTime: '10 min read',
    publishedAt: 'Aug 01, 2026',
    subCategory: 'Recruitment Operations',
    title:
      "AI Recruitment in Q1 2026: Smarter Hiring, Longer Wait Times—What's Really Happening?",
    excerpt:
      'Organizations are leveraging AI to automate sourcing, resume screening, and scheduling. While efficiency has improved, a paradoxical...',
    telemetry: {
      type: 'chart-trend',
      label1: 'AVG. CYCLE SHIFT',
      value1: '+11 Days',
      boxBg: '#fee2e2',
    },
    author: {
      initials: 'KR',
      name: 'Karthik Ram',
      avatar:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
    },
    category: 'AI & Tech Trends',
  },
  {
    id: 'card-3',
    featured: false,
    badge: 'GCC Economics',
    badgeBg: '#dcfce7',
    badgeColor: '#166534',
    readTime: '6 min read',
    publishedAt: 'Jun 23, 2026',
    subCategory: 'Cost Optimization',
    title:
      'Why Are GCCs Still Paying More for Talent Acquisition Than They Need To?',
    excerpt:
      'The GCC ecosystem in India has evolved dramatically over the last decade. Yet, when it comes to talent acquisition, many organizations...',
    telemetry: {
      type: 'box-split',
      label1: 'SPEND LEAKAGE',
      value1: '28% Overhead',
      badgeLabel: 'New Aggregator Model',
      badgeValue: 'EOR & Dedicated Pods',
      boxBg: '#f3e8ff',
    },
    author: {
      initials: 'VS',
      name: 'Vikramjit Singh',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    },
    category: 'GCC Strategy',
  },
  {
    id: 'card-4',
    featured: false,
    badge: 'Market Power Shift',
    badgeBg: '#dbeafe',
    badgeColor: '#1e40af',
    readTime: '7 min read',
    publishedAt: 'May 23, 2026',
    subCategory: 'Enterprise Tech',
    title:
      'Why GCC Hiring Is Taking the Upper Hand in the Indian IT Market Over Traditional Service Providers',
    excerpt:
      'Traditional IT service providers that once dominated the market are now facing strong competition from Global Capability Centers...',
    telemetry: {
      type: 'box-split',
      label1: 'TALENT MIGRATION',
      value1: '64% Preference',
      badgeLabel: 'Product Ownership',
      badgeValue: 'vs Billable Hours',
      boxBg: '#e0f2fe',
    },
    author: {
      initials: 'RM',
      name: 'Rohan Mathur',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    },
    category: 'Workforce Culture',
  },
  {
    id: 'card-5',
    featured: false,
    badge: 'Talent Ops Audit',
    badgeBg: '#e0e7ff',
    badgeColor: '#3730a3',
    readTime: '11 min read',
    publishedAt: 'Apr 11, 2026',
    subCategory: 'Evolution Study',
    title:
      'Manual Recruitment in 2025 vs AI Recruitment in 2026: The Evolution of Hiring',
    excerpt:
      'A comprehensive operational review comparing traditional resume parsing with generative skill matching, adaptive technical assessments, and...',
    telemetry: {
      type: 'progress-bar',
      label1: 'Administrative Work Reduction',
      value1: '72%',
      boxBg: '#f1f5f9',
    },
    author: {
      initials: 'SP',
      name: 'Shreya Patel',
      avatar:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150',
    },
    category: 'Recruitment Operations',
  },
  {
    id: 'card-6',
    featured: false,
    badge: 'Regional Index',
    badgeBg: '#dcfce7',
    badgeColor: '#15803d',
    readTime: '5 min read',
    publishedAt: 'Feb 05, 2026',
    subCategory: 'Urban Tech Clusters',
    title: 'IT Hiring Boom 2026: Bangalore Leads with 1.25 Lakh New Tech Jobs',
    excerpt:
      'Tech hiring is set to add 1.25 lakh jobs in 2026 propelled by AI, data architecture, and cybersecurity infrastructure. City-wise growth...',
    telemetry: {
      type: 'box-split',
      label1: 'BENGALURU HEADCOUNT',
      value1: '125,000+',
      badgeLabel: 'YOY Growth',
      badgeValue: '12-15% Expansion',
      boxBg: '#ecfdf5',
    },
    author: {
      initials: 'TW',
      name: 'Advisory Desk',
      avatar:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150',
    },
    category: 'GCC Strategy',
  },
];

const figmaResearchers = [
  {
    id: 'res-1',
    name: 'Karthik Ram',
    role: 'Head of AI Advisory & Operations',
    organization:
      'Ex-Tier 1 Tech Architect, 14+ yrs in global talent pipelines',
    avatar:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'res-2',
    name: 'Ananya Roy',
    role: 'Director of GCC Market Intelligence',
    organization: 'Specializing in cross-border tech wage indexes & EOR',
    avatar:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'res-3',
    name: 'Vikramjit Singh',
    role: 'VP of Enterprise Solutions',
    organization: 'Advising North American and European Fortune 500 GCCs',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  },
];

const blogSlice = createSlice({
  name: 'blog',
  initialState: {
    articles: figmaArticlesGrid,
    featuredArticle: featuredFlagshipArticle,
    researchers: figmaResearchers,
    searchQuery: '',
    selectedCategory: 'all',
    sortBy: 'Latest',
    currentPage: 1,
    itemsPerPage: 6,
    newsletterSubmitted: false,
    bookmarkedArticles: [],
    status: 'idle',
    error: null,
  },
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
      state.currentPage = 1;
    },
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
      state.currentPage = 1;
    },
    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    toggleBookmark: (state, action) => {
      const articleId = action.payload;
      if (state.bookmarkedArticles.includes(articleId)) {
        state.bookmarkedArticles = state.bookmarkedArticles.filter(
          (id) => id !== articleId
        );
      } else {
        state.bookmarkedArticles.push(articleId);
      }
    },
    setNewsletterSubmitted: (state, action) => {
      state.newsletterSubmitted = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchArticles.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchArticles.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload && Array.isArray(action.payload)) {
          state.articles = action.payload;
        }
      })
      .addCase(fetchArticles.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchFeaturedArticle.fulfilled, (state, action) => {
        if (action.payload) {
          state.featuredArticle = action.payload;
        }
      })
      .addCase(fetchResearchers.fulfilled, (state, action) => {
        if (action.payload && Array.isArray(action.payload)) {
          state.researchers = action.payload;
        }
      })
      .addCase(subscribeNewsletter.fulfilled, (state, action) => {
        if (action.payload && action.payload.success) {
          state.newsletterSubmitted = true;
        }
      });
  },
});

export const {
  setSearchQuery,
  setSelectedCategory,
  setSortBy,
  setCurrentPage,
  toggleBookmark,
  setNewsletterSubmitted,
} = blogSlice.actions;

export default blogSlice.reducer;
