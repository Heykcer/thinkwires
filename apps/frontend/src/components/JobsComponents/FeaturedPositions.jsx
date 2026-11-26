import React, { useState } from 'react';
import JobCard from './JobCard';
import ScrollReveal from '../common/ScrollReveal';

const FeaturedPositions = ({
  jobsList = [],
  onApplyClick,
  onViewSpecClick,
  activeCategory,
  setActiveCategory,
}) => {
  const [visibleCount, setVisibleCount] = useState(6);

  const jobsToDisplay = Array.isArray(jobsList) ? jobsList : [];

  const categories = [
    'All Roles',
    'SAP & Enterprise',
    'Full Stack & Frontend',
    'Cloud & DevOps',
    'AI & Data Engineering',
    'FinTech & Systems',
  ];

  // Filter jobs based on active category
  const filteredJobs = jobsToDisplay.filter((job) => {
    if (!activeCategory || activeCategory === 'All Roles') return true;
    return (
      job.department === activeCategory ||
      (job.category &&
        job.category.toLowerCase().includes(activeCategory.toLowerCase())) ||
      job.tag === activeCategory
    );
  });

  const displayedJobs = filteredJobs.slice(0, visibleCount);

  return (
    <section className="FeaturedPositions-section" id="featured-positions">
      <div className="FeaturedPositions-container">
        {/* Section Header */}
        <div className="FeaturedPositions-figmaHeader">
          <div className="FeaturedPositions-headerTitleCol">
            <div className="FeaturedPositions-curatedBadge">
              CURATED HIGH-IMPACT ROLES
            </div>
            <h2 className="FeaturedPositions-mainHeading">
              Featured Positions
            </h2>
          </div>

          <div className="FeaturedPositions-headerSubCol">
            <p className="FeaturedPositions-headerDesc">
              Verified openings from global Tier-1 software organizations and
              enterprise consultancies with guaranteed prompt response.
            </p>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="FeaturedPositions-categories">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`FeaturedPositions-categoryPill ${
                activeCategory === cat ||
                (!activeCategory && cat === 'All Roles')
                  ? 'FeaturedPositions-activePill'
                  : ''
              }`}
              onClick={() => setActiveCategory && setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Jobs Grid */}
        {displayedJobs.length > 0 ? (
          <div className="FeaturedPositions-grid">
            {displayedJobs.map((job, idx) => (
              <ScrollReveal
                key={job.id || idx}
                direction="up"
                delay={(idx % 3) * 0.08}
                distance={40}
                style={{ display: 'flex', height: '100%', width: '100%' }}
              >
                <JobCard
                  job={job}
                  onApplyClick={onApplyClick}
                  onViewSpecClick={onViewSpecClick}
                />
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <div className="FeaturedPositions-emptyState">
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '48px',
                color: '#94a3b8',
                marginBottom: '0.75rem',
              }}
            >
              search_off
            </span>
            <h3>No positions found matching this criteria</h3>
            <p>
              Try resetting your filter or searching with different keywords.
            </p>
            <button
              className="FeaturedPositions-resetBtn"
              onClick={() =>
                setActiveCategory && setActiveCategory('All Roles')
              }
            >
              Show All Roles
            </button>
          </div>
        )}

        {/* Load More Button */}
        {filteredJobs.length > visibleCount && (
          <div className="FeaturedPositions-loadMoreWrapper">
            <button
              className="FeaturedPositions-loadMoreBtn"
              onClick={() => setVisibleCount((prev) => prev + 6)}
            >
              View More Openings ({filteredJobs.length - visibleCount}{' '}
              Remaining)
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedPositions;
