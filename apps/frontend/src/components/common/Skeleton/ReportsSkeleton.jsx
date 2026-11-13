import React from 'react';
import Skeleton from './Skeleton';
import BlogCardSkeleton from './BlogCardSkeleton';
import './skeleton.css';

/**
 * Skeleton Loader matching Thinkwires Homepage Reports Section
 *
 * @param {Object} props
 * @param {number} [props.count=3] - Number of report cards
 * @param {string} [props.className] - Optional extra class
 */
export const ReportsSkeleton = ({ count = 3, className = '' }) => {
  return (
    <section
      className={`tw-skeleton-reports-section ${className}`}
      role="status"
      aria-busy="true"
      aria-label="Loading reports section..."
    >
      {/* Header: Tag + Title + Link */}
      <div className="tw-skeleton-reports-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <Skeleton variant="rounded" width={160} height={22} />
          <Skeleton variant="text" width={320} height={32} />
        </div>
        <Skeleton variant="rounded" width={140} height={32} />
      </div>

      {/* Cards Grid */}
      <div className="tw-skeleton-reports-grid">
        <BlogCardSkeleton count={count} />
      </div>
    </section>
  );
};

export default ReportsSkeleton;

