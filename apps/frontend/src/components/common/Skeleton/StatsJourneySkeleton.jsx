import React from 'react';
import Skeleton from './Skeleton';
import './skeleton.css';

/**
 * Skeleton Loader matching Thinkwires Stats & Journey Section
 *
 * @param {Object} props
 * @param {string} [props.className] - Optional extra class
 */
export const StatsJourneySkeleton = ({ className = '' }) => {
  return (
    <section
      className={`tw-skeleton-stats-section ${className}`}
      role="status"
      aria-busy="true"
      aria-label="Loading statistics and journey section..."
    >
      {/* Centered Header */}
      <div className="tw-skeleton-stats-header">
        <Skeleton variant="rounded" width={180} height={24} />
        <Skeleton variant="text" width="85%" height={34} />
        <Skeleton variant="text" width="60%" height={16} />
      </div>

      {/* 4 Key Metrics Cards */}
      <div className="tw-skeleton-stats-grid">
        {[1, 2, 3, 4].map((idx) => (
          <div key={idx} className="tw-skeleton-stats-card">
            <Skeleton variant="circular" width={44} height={44} />
            <Skeleton variant="text" width={100} height={36} />
            <Skeleton variant="text" width={120} height={16} />
            <Skeleton variant="text" width="80%" height={13} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatsJourneySkeleton;

