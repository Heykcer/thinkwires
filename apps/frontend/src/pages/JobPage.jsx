import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchOpenings } from '../store/slices/homeSlice';
import { getIndustryBySlug, getSearchTermForIndustry } from '../store/slices/industriesSlice';

import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ApplyModal from '../components/common/ApplyModal';
import JobSpecModal from '../components/JobsComponents/JobSpecModal';

// Above-the-fold components loaded synchronously for instant LCP
import JobsHero from '../components/JobsComponents/JobsHero';
import JobSearch from '../components/JobsComponents/JobSearch';

// Below-the-fold components lazy loaded for optimal bundle splitting
const FeaturedPositions = lazy(
  () => import('../components/JobsComponents/FeaturedPositions')
);
const TalentBench = lazy(
  () => import('../components/JobsComponents/TalentBench')
);
const JobsStats = lazy(() => import('../components/JobsComponents/JobsStats'));
const CareerBenefits = lazy(
  () => import('../components/JobsComponents/CareerBenefits')
);
const CareerInsights = lazy(
  () => import('../components/JobsComponents/CareerInsights')
);
const CandidateFAQs = lazy(
  () => import('../components/JobsComponents/CandidateFAQs')
);

import { JobCardSkeleton } from '../components/common/Skeleton';

const ComponentLoader = () => (
  <section className="FeaturedPositions-section">
    <div className="FeaturedPositions-container">
      <div className="FeaturedPositions-grid">
        <JobCardSkeleton count={6} />
      </div>
    </div>
  </section>
);

const JobPage = () => {
  const dispatch = useDispatch();
  const { openings, status, errors } = useSelector((state) => state.home);

  const [selectedJobForModal, setSelectedJobForModal] = useState(null);
  const [selectedJobForSpec, setSelectedJobForSpec] = useState(null);

  const [searchParams] = useSearchParams();
  const industrySlugParam = searchParams.get('industry');
  const searchParam = searchParams.get('search') || searchParams.get('q');
  const locationParam = searchParams.get('location');
  const experienceParam = searchParams.get('experience');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState(() => {
    if (searchParam) return searchParam;
    return industrySlugParam ? getSearchTermForIndustry(industrySlugParam) : '';
  });
  const [prevIndustrySlug, setPrevIndustrySlug] = useState(industrySlugParam);

  if (prevIndustrySlug !== industrySlugParam) {
    setPrevIndustrySlug(industrySlugParam);
    if (industrySlugParam) {
      setSearchQuery(getSearchTermForIndustry(industrySlugParam));
    }
  }

  const [locationFilter, setLocationFilter] = useState(() => locationParam || 'All');
  const [experienceFilter, setExperienceFilter] = useState(() => experienceParam || 'All');

  // Sync state when URL search parameters change
  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q');
    if (q !== null && q !== undefined) {
      setSearchQuery(q);
    }
    const loc = searchParams.get('location');
    if (loc) {
      setLocationFilter(loc);
    }
    const exp = searchParams.get('experience');
    if (exp) {
      setExperienceFilter(exp);
    }
  }, [searchParams]);
  const [workMode, setWorkMode] = useState('All Modes');
  const [jobMode, setJobMode] = useState('All Types');
  const [noticePeriod, setNoticePeriod] = useState('All Notice');
  const [departmentFilter, setDepartmentFilter] = useState('All Roles');
  const [sortBy, setSortBy] = useState('Newest First');

  // Dispatch Redux thunk to fetch openings dynamically from backend
  const loadJobsFromBackend = useCallback(() => {
    dispatch(
      fetchOpenings({
        q: searchQuery,
        location: locationFilter,
        experience: experienceFilter,
        workMode: workMode,
        jobMode: jobMode,
        noticePeriod: noticePeriod,
        department: departmentFilter,
        sort: sortBy,
      })
    );
  }, [
    dispatch,
    searchQuery,
    locationFilter,
    experienceFilter,
    workMode,
    jobMode,
    noticePeriod,
    departmentFilter,
    sortBy,
  ]);

  // Trigger search on filter changes or initial load
  useEffect(() => {
    loadJobsFromBackend();
  }, [
    departmentFilter,
    workMode,
    jobMode,
    noticePeriod,
    sortBy,
    loadJobsFromBackend,
  ]);

  // Handle Search button submit
  const handleSearchSubmit = () => {
    loadJobsFromBackend();
  };

  const isLoading = status.openings === 'loading';
  const isError = status.openings === 'failed';

  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const handleApplyJob = (job) => {
    const jobIdentifier =
      job.id ||
      job._id ||
      'job-' +
        encodeURIComponent(job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    const empType =
      job.jobMode || job.employmentType || job.type || 'Permanent';
    const postDate = job.postedDate
      ? new Date(job.postedDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : job.postingDate || 'Active Mandate';
    const targetApplyUrl = `/jobs/${jobIdentifier}/apply?title=${encodeURIComponent(job.title)}&department=${encodeURIComponent(job.department || 'Engineering')}&location=${encodeURIComponent(job.location || 'Remote')}&employmentType=${encodeURIComponent(empType)}&postingDate=${encodeURIComponent(postDate)}`;

    if (isAuthenticated) {
      navigate(targetApplyUrl);
    } else {
      // Direct unauthenticated candidate to login with return redirect to the exact job application
      navigate(`/login?redirect=${encodeURIComponent(targetApplyUrl)}`);
    }
  };

  return (
    <div className="JobPage-wrapper">
      <Helmet>
        <title>Jobs | Thinkwires — Global Talent Cloud</title>
        <meta
          name="description"
          content="Browse 500+ active engineering and tech roles across India, USA, and Canada. Apply directly with AI-driven ATS screening."
        />
        <meta property="og:title" content="Hot Jobs | Thinkwires" />
        <meta
          property="og:description"
          content="Browse 500+ active engineering and tech roles across India, USA, and Canada. Apply directly with AI-driven ATS screening."
        />
        <meta property="og:image" content="https://thinkwires.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Hot Jobs | Thinkwires" />
        <meta
          name="twitter:description"
          content="Browse 500+ active engineering and tech roles across India, USA, and Canada."
        />
        <meta name="twitter:image" content="https://thinkwires.com/og-image.jpg" />
      </Helmet>
      <Navbar />

      <main className="JobPage-main">
        {/* Hero Section with Floating Search Bar (Instant Render) */}
        <JobsHero>
          <JobSearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            locationFilter={locationFilter}
            setLocationFilter={setLocationFilter}
            experienceFilter={experienceFilter}
            setExperienceFilter={setExperienceFilter}
            workMode={workMode}
            setWorkMode={setWorkMode}
            jobMode={jobMode}
            setJobMode={setJobMode}
            noticePeriod={noticePeriod}
            setNoticePeriod={setNoticePeriod}
            sortBy={sortBy}
            setSortBy={setSortBy}
            totalResults={openings.length}
            onSearchSubmit={handleSearchSubmit}
          />
        </JobsHero>

        <div className="section-divider-line" />

        {/* Lazy Loaded Below-the-fold Sections */}
        <Suspense fallback={<ComponentLoader />}>
          {/* Featured Positions Grid (Dynamic from Redux Store & Backend) */}
          {isLoading && openings.length === 0 ? (
            <section className="FeaturedPositions-section" id="featured-positions">
              <div className="FeaturedPositions-container">
                <div className="FeaturedPositions-grid">
                  <JobCardSkeleton count={6} />
                </div>
              </div>
            </section>
          ) : isError && openings.length === 0 ? (
            <div
              style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}
            >
              <div>
                {errors.openings ||
                  'Unable to load live jobs from backend server.'}
              </div>
              <button
                onClick={loadJobsFromBackend}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  background: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            <FeaturedPositions
              jobsList={openings}
              activeCategory={departmentFilter}
              setActiveCategory={setDepartmentFilter}
              onApplyClick={handleApplyJob}
              onViewSpecClick={setSelectedJobForSpec}
            />
          )}

          <div className="section-divider-line" />

          {/* Drop CV Banner Section */}
          <TalentBench />

          <div className="section-divider-line" />

          {/* 4 Metrics Strip (Redux Dynamic Data) */}
          <JobsStats />

          <div className="section-divider-line" />

          {/* Why Build Your Career With Thinkwires Section (Redux Dynamic Data) */}
          <CareerBenefits />

          <div className="section-divider-line" />

          {/* Career Insights & Tech Culture Section */}
          <CareerInsights />

          <div className="section-divider-line" />

          {/* Candidate FAQs Section (Redux Dynamic Data) */}
          <CandidateFAQs />
        </Suspense>
      </main>

      <Footer />

      {/* Complete Job Specifications Modal */}
      {selectedJobForSpec && (
        <JobSpecModal
          job={selectedJobForSpec}
          onClose={() => setSelectedJobForSpec(null)}
          onApply={(job) => {
            setSelectedJobForSpec(null);
            handleApplyJob(job);
          }}
        />
      )}

      {/* Apply Modal */}
      <ApplyModal
        isOpen={!!selectedJobForModal}
        onClose={() => setSelectedJobForModal(null)}
        jobData={selectedJobForModal}
        roleTitle={
          typeof selectedJobForModal === 'string'
            ? selectedJobForModal
            : selectedJobForModal?.title || ''
        }
      />
    </div>
  );
};

export default JobPage;
