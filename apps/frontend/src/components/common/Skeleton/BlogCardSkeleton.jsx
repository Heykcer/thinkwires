import React from 'react';
import Skeleton from './Skeleton';
import './skeleton.css';

/**
 * Skeleton Loader matching Thinkwires Blog Research Card Layout
 *
 * @param {Object} props
 * @param {number} [props.count=1] - Number of cards to render
 * @param {string} [props.className] - Optional extra class
 */
export const BlogCardSkeleton = ({ count = 1, className = '' }) => {
  const cards = Array.from({ length: count }, (_, idx) => (
    <article
      key={idx}
      className={`tw-skeleton-blog-card ${className}`}
      role="status"
      aria-busy="true"
      aria-label="Loading research article..."
    >
      {/* Top Badge & Read Time Header */}
      <div className="tw-skeleton-blog-card-top">
        <Skeleton variant="rounded" width={110} height={26} />
        <Skeleton variant="text" width={75} height={16} />
      </div>

      {/* Date & Sub-Category Row */}
      <div className="tw-skeleton-blog-card-meta">
        <Skeleton variant="text" width={85} height={14} />
        <span style={{ color: 'var(--color-outline-variant, #cbd5e1)' }}>•</span>
        <Skeleton variant="text" width={115} height={14} />
      </div>

      {/* Title (2 lines) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        <Skeleton variant="text" width="92%" height={22} />
        <Skeleton variant="text" width="65%" height={22} />
      </div>

      {/* Excerpt (2 lines) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <Skeleton variant="text" width="100%" height={14} />
        <Skeleton variant="text" width="85%" height={14} />
      </div>

      {/* Telemetry Box */}
      <div className="tw-skeleton-blog-card-telemetry">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <Skeleton variant="text" width={90} height={12} />
          <Skeleton variant="text" width={65} height={18} />
        </div>
        <Skeleton variant="rounded" width={100} height={28} />
      </div>

      {/* Author Footer */}
      <div className="tw-skeleton-blog-card-footer">
        <div className="tw-skeleton-blog-card-author">
          <Skeleton variant="circular" width={34} height={34} />
          <Skeleton variant="text" width={110} height={16} />
        </div>
        <Skeleton variant="rounded" width={95} height={28} />
      </div>
    </article>
  ));

  return count === 1 ? cards[0] : <>{cards}</>;
};

export default BlogCardSkeleton;

