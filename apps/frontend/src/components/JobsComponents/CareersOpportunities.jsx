import React, { useState, useMemo } from 'react';
import JobCard from './JobCard';

const CATEGORIES = [
  'All Roles',
  'SAP & Enterprise',
  'Full Stack & Frontend',
  'Cloud & DevOps',
  'AI & Data Engineering',
  'FinTech & Systems',
];

const LOCATIONS = [
  'All Locations',
  'Bangalore',
  'Noida',
  'Hyderabad',
  'Pune',
  'Mumbai',
  'Remote (US/IND)',
];

const EXPERIENCES = [
  'All Experience',
  '0-2 Years',
  '3-5 Years',
  '5-8 Years',
  '8-12 Years',
  '10+ Years',
];

const EMPLOYMENT_TYPES = [
  'All Types',
  'Permanent',
  'Contract',
  'Work From Home',
  'Hybrid',
];

const CareersOpportunities = ({
  jobsList = [],
  isLoading = false,
  isError = false,
  errorMessage = '',
  onRetry,
  onApplyClick,
  onViewSpecClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Roles');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedExperience, setSelectedExperience] = useState('All Experience');
  const [selectedType, setSelectedType] = useState('All Types');
  const [visibleCount, setVisibleCount] = useState(6);

  // Filter jobs dynamically
  const filteredJobs = useMemo(() => {
    let list = Array.isArray(jobsList) ? jobsList : [];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((job) => {
        const titleMatch = (job.title || '').toLowerCase().includes(q);
        const descMatch = (job.description || '').toLowerCase().includes(q);
        const skillMatch = Array.isArray(job.skills)
          ? job.skills.some((s) => s.toLowerCase().includes(q))
          : false;
        const deptMatch = (job.department || '').toLowerCase().includes(q);
        return titleMatch || descMatch || skillMatch || deptMatch;
      });
    }

    // Category filter
    if (selectedCategory && selectedCategory !== 'All Roles') {
      list = list.filter((job) => {
        return (
          job.department === selectedCategory ||
          (job.category &&
            job.category.toLowerCase().includes(selectedCategory.toLowerCase())) ||
          job.tag === selectedCategory
        );
      });
    }

    // Location filter
    if (selectedLocation && selectedLocation !== 'All Locations') {
      list = list.filter((job) => {
        const loc = (job.location || '').toLowerCase();
        const target = selectedLocation.toLowerCase();
        return loc.includes(target) || (target === 'remote' && loc.includes('remote'));
      });
    }

    // Experience filter
    if (selectedExperience && selectedExperience !== 'All Experience') {
      list = list.filter((job) => {
        const exp = (job.experience || '').toLowerCase();
        if (selectedExperience === '0-2 Years') return exp.includes('0') || exp.includes('1') || exp.includes('2');
        if (selectedExperience === '3-5 Years') return exp.includes('3') || exp.includes('4') || exp.includes('5');
        if (selectedExperience === '5-8 Years') return exp.includes('5') || exp.includes('6') || exp.includes('7') || exp.includes('8');
        if (selectedExperience === '8-12 Years') return exp.includes('8') || exp.includes('10') || exp.includes('12');
        if (selectedExperience === '10+ Years') return exp.includes('10') || exp.includes('12') || exp.includes('15');
        return true;
      });
    }

    // Employment type filter
    if (selectedType && selectedType !== 'All Types') {
      list = list.filter((job) => {
        const mode = (job.jobMode || job.type || job.workMode || '').toLowerCase();
        return mode.includes(selectedType.toLowerCase());
      });
    }

    return list;
  }, [
    jobsList,
    searchQuery,
    selectedCategory,
    selectedLocation,
    selectedExperience,
    selectedType,
  ]);

  const displayedJobs = filteredJobs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredJobs.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 6);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All Roles');
    setSelectedLocation('All Locations');
    setSelectedExperience('All Experience');
    setSelectedType('All Types');
  };

  return (
    <section id="career-opportunities" className="CR-JobsSection-root">
      <div className="CR-Container">
        {/* Section Header */}
        <div className="CR-SectionHeader text-center">
          <span className="CR-SectionPill">LIVE DEPLOYMENT PIPELINE</span>
          <h2 className="CR-SectionTitle">Career Opportunities</h2>
          <p className="CR-SectionSubtitle">
            Explore verified enterprise roles across cloud platforms, AI engineering, SAP,
            and full-stack distributed systems with prompt interview loops.
          </p>
        </div>

        {/* Search & Multi-Filter Control Hub */}
        <div className="CR-FilterHub-card">
          <div className="CR-FilterHub-searchRow">
            <div className="CR-SearchInputWrapper">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#64748b"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="CR-SearchIcon"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search by job title, skill (e.g. AWS, SAP, React), or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="CR-SearchInputField"
                aria-label="Search job title or keyword"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="CR-SearchClearBtn"
                  aria-label="Clear search query"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="CR-FilterSelectGroup">
              {/* Location Select */}
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="CR-FilterSelect"
                aria-label="Filter by location"
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>

              {/* Experience Select */}
              <select
                value={selectedExperience}
                onChange={(e) => setSelectedExperience(e.target.value)}
                className="CR-FilterSelect"
                aria-label="Filter by experience"
              >
                {EXPERIENCES.map((exp) => (
                  <option key={exp} value={exp}>
                    {exp}
                  </option>
                ))}
              </select>

              {/* Employment Type Select */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="CR-FilterSelect"
                aria-label="Filter by employment type"
              >
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Department Pills Bar */}
          <div className="CR-DepartmentPillsRow">
            <div className="CR-PillsScrollList">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`CR-CategoryPill ${isActive ? 'CR-CategoryPill--active' : ''}`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Dynamic Results Counter */}
            <div className="CR-ResultsCounter">
              <span className="CR-ResultsDot" />
              <span>
                Showing <strong>{filteredJobs.length}</strong> verified position
                {filteredJobs.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading && jobsList.length === 0 ? (
          <div className="CR-JobsState-box">
            <div className="CR-Spinner" />
            <p>Loading live positions from backend pipeline...</p>
          </div>
        ) : isError && jobsList.length === 0 ? (
          <div className="CR-JobsState-box CR-JobsState-box--error">
            <p>{errorMessage || 'Unable to connect to live job pipeline.'}</p>
            {onRetry && (
              <button onClick={onRetry} className="CR-Btn CR-Btn--primary">
                Retry Connection
              </button>
            )}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="CR-JobsState-box">
            <h3 className="CR-EmptyTitle">No matching positions found</h3>
            <p className="CR-EmptyDesc">
              Try adjusting your search query, location filter, or role category.
            </p>
            <button
              onClick={handleClearFilters}
              className="CR-Btn CR-Btn--secondary"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          /* Jobs Grid */
          <>
            <div className="CR-JobsGrid">
              {displayedJobs.map((job, idx) => (
                <JobCard
                  key={job.id || idx}
                  job={job}
                  onApplyClick={onApplyClick}
                  onViewSpecClick={onViewSpecClick}
                />
              ))}
            </div>

            {/* Load More Pagination */}
            {hasMore && (
              <div className="CR-LoadMoreRow">
                <button
                  onClick={handleLoadMore}
                  className="CR-Btn CR-Btn--primary CR-LoadMoreBtn"
                >
                  <span>Load More Positions ({filteredJobs.length - visibleCount} remaining)</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default CareersOpportunities;
