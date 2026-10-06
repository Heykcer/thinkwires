import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchOpenings } from '../store/slices/homeSlice';

import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ApplyModal from '../components/common/ApplyModal';

// Above-the-fold components loaded synchronously for instant LCP
import JobsHero from '../components/JobsComponents/JobsHero';
import JobSearch from '../components/JobsComponents/JobSearch';

// Below-the-fold components lazy loaded for optimal bundle splitting
const FeaturedPositions = lazy(() => import('../components/JobsComponents/FeaturedPositions'));
const TalentBench = lazy(() => import('../components/JobsComponents/TalentBench'));
const JobsStats = lazy(() => import('../components/JobsComponents/JobsStats'));
const CareerBenefits = lazy(() => import('../components/JobsComponents/CareerBenefits'));
const CareerInsights = lazy(() => import('../components/JobsComponents/CareerInsights'));
const CandidateFAQs = lazy(() => import('../components/JobsComponents/CandidateFAQs'));

const ComponentLoader = () => (
  <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: '#64748b', fontSize: '0.95rem' }}>
    Loading section...
  </div>
);

const JobPage = () => {
  const dispatch = useDispatch();
  const { openings, status, errors } = useSelector((state) => state.home);

  const [selectedJobForModal, setSelectedJobForModal] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');
  const [experienceFilter, setExperienceFilter] = useState('All');
  const [workMode, setWorkMode] = useState('All Modes');
  const [departmentFilter, setDepartmentFilter] = useState('All Roles');
  const [sortBy, setSortBy] = useState('Newest First');

  // Debounce search query to avoid triggering API calls on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Dispatch Redux thunk to fetch openings dynamically from backend
  const loadJobsFromBackend = useCallback((overrideQuery) => {
    const queryToUse = overrideQuery !== undefined ? overrideQuery : debouncedSearchQuery;
    dispatch(
      fetchOpenings({
        q: queryToUse,
        location: locationFilter,
        experience: experienceFilter,
        workMode: workMode,
        department: departmentFilter,
        sort: sortBy,
      })
    );
  }, [dispatch, debouncedSearchQuery, locationFilter, experienceFilter, workMode, departmentFilter, sortBy]);

  // Trigger search on filter changes, debounced query update, or initial load
  useEffect(() => {
    loadJobsFromBackend();
  }, [loadJobsFromBackend]);

  // Handle Search button submit (immediate trigger)
  const handleSearchSubmit = () => {
    setDebouncedSearchQuery(searchQuery);
    loadJobsFromBackend(searchQuery);
  };

  const isLoading = status.openings === 'loading';
  const isError = status.openings === 'failed';

  return (
    <div className="JobPage-wrapper">
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
            <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Loading dynamic job listings from backend...</div>
            </div>
          ) : isError && openings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#ef4444' }}>
              <div>{errors.openings || 'Unable to load live jobs from backend server.'}</div>
              <button 
                onClick={loadJobsFromBackend}
                style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '6px', background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                Retry
              </button>
            </div>
          ) : (
            <FeaturedPositions
              jobsList={openings}
              activeCategory={departmentFilter}
              setActiveCategory={setDepartmentFilter}
              onApplyClick={(job) => setSelectedJobForModal(job.title)}
            />
          )}

          <div className="section-divider-line" />

          {/* Drop CV Banner Section */}
          <TalentBench />

          <div className="section-divider-line" />

          {/* 4 Metrics Strip (Redux Dynamic Data) */}
          <JobsStats />

          <div className="section-divider-line" />

          {/* Why Build Your Career With ThinkWires Section (Redux Dynamic Data) */}
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

      {/* Apply Modal */}
      <ApplyModal
        isOpen={!!selectedJobForModal}
        onClose={() => setSelectedJobForModal(null)}
        roleTitle={selectedJobForModal || ''}
      />
    </div>
  );
};

export default JobPage;
