import React from 'react';
import Skeleton from './Skeleton';
import OpeningsCardSkeleton from './OpeningsCardSkeleton';
import './skeleton.css';

/**
 * Skeleton Loader matching Thinkwires Hot Jobs Openings Section
 *
 * @param {Object} props
 * @param {number} [props.count=4] - Number of cards to render
 * @param {string} [props.className] - Optional extra class
 */
export const OpeningsSkeleton = ({ count = 4, className = '' }) => {
  return (
    <section
      className={`tw-skeleton-openings-section ${className}`}
      role="status"
      aria-busy="true"
      aria-label="Loading job openings section..."
    >
      {/* Header Row: Left Meta + Right Stats Counter */}
      <div className="tw-skeleton-openings-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxWidth: '650px' }}>
          <Skeleton variant="rounded" width={160} height={24} />
          <Skeleton variant="text" width="75%" height={32} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.2rem' }}>
            <Skeleton variant="text" width="100%" height={15} />
            <Skeleton variant="text" width="70%" height={15} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Skeleton variant="circular" width={32} height={32} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <Skeleton variant="text" width={60} height={22} />
            <Skeleton variant="text" width={110} height={12} />
          </div>
        </div>
      </div>

      {/* Grid of Openings Cards */}
      <div className="tw-skeleton-openings-grid">
        <OpeningsCardSkeleton count={count} />
      </div>
    </section>
  );
};

export default OpeningsSkeleton;

