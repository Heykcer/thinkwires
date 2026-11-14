import React from 'react';
import Skeleton from './Skeleton';
import './skeleton.css';

/**
 * Skeleton Loader matching Thinkwires Flagship Featured Article Layout
 *
 * @param {Object} props
 * @param {string} [props.className] - Optional extra class
 */
export const FeaturedArticleSkeleton = ({ className = '' }) => {
  return (
    <article
      className={`tw-skeleton-featured-card ${className}`}
      role="status"
      aria-busy="true"
      aria-label="Loading featured article..."
    >
      {/* Left Column: Flagship Article Details */}
      <div className="tw-skeleton-featured-content">
        {/* Top Badges */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Skeleton variant="rounded" width={130} height={28} />
          <Skeleton variant="rounded" width={90} height={28} />
        </div>

        {/* Title (2 lines) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Skeleton variant="text" width="95%" height={32} />
          <Skeleton variant="text" width="70%" height={32} />
        </div>

        {/* Excerpt (3 lines) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <Skeleton variant="text" width="100%" height={16} />
          <Skeleton variant="text" width="92%" height={16} />
          <Skeleton variant="text" width="80%" height={16} />
        </div>

        {/* Callout Box */}
        <div className="tw-skeleton-featured-callout">
          <Skeleton variant="text" width={140} height={14} />
          <Skeleton variant="text" width="90%" height={14} />
        </div>

        {/* Author & Read Time */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Skeleton variant="circular" width={42} height={42} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <Skeleton variant="text" width={120} height={16} />
              <Skeleton variant="text" width={80} height={12} />
            </div>
          </div>
          <Skeleton variant="rounded" width={110} height={36} />
        </div>
      </div>

      {/* Right Column: Hero Graphic Preview */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 280 }}>
        <Skeleton variant="rounded" width="100%" height="100%" style={{ minHeight: 280, borderRadius: '16px' }} />
      </div>
    </article>
  );
};

export default FeaturedArticleSkeleton;

