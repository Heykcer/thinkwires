import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchOpenings } from '../store/slices/homeSlice';
import { getSearchTermForIndustry } from '../store/slices/industriesSlice';

import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ApplyModal from '../components/common/ApplyModal';
import JobSpecModal from '../components/JobsComponents/JobSpecModal';

// Above-the-fold component loaded synchronously
import CareersHero from '../components/JobsComponents/CareersHero';

// Below-the-fold sections loaded for optimal bundle splitting
const LifeAtThinkwires = lazy(
  () => import('../components/JobsComponents/LifeAtThinkwires')
);
const CareersOpportunities = lazy(
  () => import('../components/JobsComponents/CareersOpportunities')
);
const CareersBlogsSection = lazy(
  () => import('../components/JobsComponents/CareersBlogsSection')
);
const CareersBenefitsSection = lazy(
  () => import('../components/JobsComponents/CareersBenefitsSection')
);
const CareersClosingCTA = lazy(
  () => import('../components/JobsComponents/CareersClosingCTA')
);

const SectionLoader = () => (
  <div className="CR-SectionLoader">
    <div className="CR-Spinner" />
    <span>Loading careers experience...</span>
  </div>
);

const JobPage = () => {
  const dispatch = useDispatch();
  const { openings = [], status = {}, errors = {} } = useSelector(
    (state) => state.home || {}
  );
  const { isAuthenticated } = useSelector((state) => state.auth || {});

  const [selectedJobForModal, setSelectedJobForModal] = useState(null);
  const [selectedJobForSpec, setSelectedJobForSpec] = useState(null);

  const [searchParams] = useSearchParams();
  const industrySlugParam = searchParams.get('industry');

  const navigate = useNavigate();

  // Load openings from backend via Redux thunk
  const loadJobsFromBackend = useCallback(() => {
    dispatch(fetchOpenings());
  }, [dispatch]);

  useEffect(() => {
    loadJobsFromBackend();
  }, [loadJobsFromBackend]);

  const isLoading = status.openings === 'loading';
  const isError = status.openings === 'failed';

  // Apply handler
  const handleApplyJob = (job) => {
    if (!job) {
      setSelectedJobForModal('General Talent Bench Application');
      return;
    }

    const jobIdentifier =
      job.id ||
      job._id ||
      'job-' +
        encodeURIComponent((job.title || 'role').toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    const empType = job.jobMode || job.employmentType || job.type || 'Permanent';
    const postDate = job.postedDate
      ? new Date(job.postedDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : job.postingDate || 'Active Mandate';
    const targetApplyUrl = `/jobs/${jobIdentifier}/apply?title=${encodeURIComponent(
      job.title || ''
    )}&department=${encodeURIComponent(
      job.department || 'Engineering'
    )}&location=${encodeURIComponent(
      job.location || 'Remote'
    )}&employmentType=${encodeURIComponent(empType)}&postingDate=${encodeURIComponent(
      postDate
    )}`;

    if (isAuthenticated) {
      navigate(targetApplyUrl);
    } else {
      setSelectedJobForModal(job);
    }
  };

  const handleDropResume = () => {
    setSelectedJobForModal({
      title: 'Global Talent Bench — General Application',
      department: 'Engineering & Consulting',
      location: 'India / US / Canada',
      type: 'Full-Time / Contract',
    });
  };

  return (
    <div className="JobPage-wrapper CR-PageRoot">
      <Helmet>
        <title>Careers &amp; Life at ThinkWires | Global Talent Cloud</title>
        <meta
          name="description"
          content="Explore high-impact engineering careers at ThinkWires. Browse verified openings across Cloud, AI, and Enterprise platforms in India, USA, and Canada."
        />
        <meta property="og:title" content="Careers & Life at ThinkWires" />
        <meta
          property="og:description"
          content="Build the future of technology with ThinkWires. Explore real team culture, verified openings, and competitive total rewards."
        />
        <meta property="og:image" content="https://thinkwires.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Careers at ThinkWires" />
        <meta
          name="twitter:description"
          content="Explore high-impact engineering careers at ThinkWires across India, USA, and Canada."
        />
      </Helmet>

      <Navbar />

      <main className="JobPage-main">
        {/* Section 1: Hero */}
        <CareersHero totalJobsCount={openings.length} />

        <Suspense fallback={<SectionLoader />}>
          {/* Section 2, 3, 4: Life at ThinkWires, Meet Our People, Our Culture, Photo Gallery */}
          <LifeAtThinkwires />

          {/* Section 5: Career Opportunities (Official Job Listings with Functional Search & Multi-Filters) */}
          <CareersOpportunities
            jobsList={openings}
            isLoading={isLoading}
            isError={isError}
            errorMessage={errors.openings}
            onRetry={loadJobsFromBackend}
            onApplyClick={handleApplyJob}
            onViewSpecClick={setSelectedJobForSpec}
          />

          {/* Section 6: Career Blogs & Tips (6 Official Articles with Reader Modal) */}
          <CareersBlogsSection />

          {/* Section 7: Benefits & Growth (Official Benefits: Medical, PF, Gratuity, IJP, Training, Leave, etc.) */}
          <CareersBenefitsSection />

          {/* Section 8: Final CTA */}
          <CareersClosingCTA onDropResumeClick={handleDropResume} />
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
