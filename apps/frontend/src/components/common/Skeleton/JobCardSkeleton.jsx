import React from 'react';
import Skeleton from './Skeleton';
import './skeleton.css';

/**
 * Skeleton Loader matching Thinkwires Job Mandate Card Layout
 *
 * @param {Object} props
 * @param {number} [props.count=1] - Number of cards to render
 * @param {string} [props.className] - Optional extra class
 */
export const JobCardSkeleton = ({ count = 1, className = '' }) => {
  const cards = Array.from({ length: count }, (_, idx) => (
    <article
      key={idx}
      className={`tw-skeleton-job-card ${className}`}
      role="status"
      aria-busy="true"
      aria-label="Loading job opening..."
    >
      {/* Top Header Row: Category, Industry & Status Badges */}
      <div className="tw-skeleton-job-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Skeleton variant="text" width={140} height={16} />
          <Skeleton variant="rounded" width={105} height={22} />
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Skeleton variant="rounded" width={65} height={22} />
          <Skeleton variant="rounded" width={95} height={22} />
        </div>
      </div>

      {/* Main Title & Logo Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <Skeleton variant="rounded" width={44} height={44} style={{ borderRadius: '10px', flexShrink: 0 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
          <Skeleton variant="text" width="80%" height={22} />
          <Skeleton variant="text" width="45%" height={16} />
        </div>
      </div>

      {/* Description Snippet */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <Skeleton variant="text" width="100%" height={14} />
        <Skeleton variant="text" width="85%" height={14} />
      </div>

      {/* 4 Specs Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.75rem',
          padding: '0.85rem',
          background: 'var(--color-surface-container-low, #f8fafc)',
          borderRadius: '10px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <Skeleton variant="text" width={70} height={12} />
          <Skeleton variant="text" width={100} height={16} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <Skeleton variant="text" width={80} height={12} />
          <Skeleton variant="text" width={95} height={16} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <Skeleton variant="text" width={75} height={12} />
          <Skeleton variant="text" width={85} height={16} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <Skeleton variant="text" width={70} height={12} />
          <Skeleton variant="text" width={90} height={16} />
        </div>
      </div>

      {/* Skill Chips */}
      <div className="tw-skeleton-job-card-tags">
        <Skeleton variant="rounded" width={65} height={24} />
        <Skeleton variant="rounded" width={78} height={24} />
        <Skeleton variant="rounded" width={60} height={24} />
        <Skeleton variant="rounded" width={85} height={24} />
      </div>

      {/* Footer / Actions */}
      <div className="tw-skeleton-job-card-footer">
        <Skeleton variant="rounded" width={110} height={32} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="rounded" width={90} height={32} />
        </div>
      </div>
    </article>
  ));

  return count === 1 ? cards[0] : <>{cards}</>;
};

export default JobCardSkeleton;

