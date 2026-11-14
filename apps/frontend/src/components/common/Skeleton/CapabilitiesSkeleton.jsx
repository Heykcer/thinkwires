import React from 'react';
import Skeleton from './Skeleton';
import CapabilityCardSkeleton from './CapabilityCardSkeleton';
import './skeleton.css';

/**
 * Skeleton Loader matching Thinkwires Capabilities Section
 *
 * @param {Object} props
 * @param {number} [props.count=4] - Number of capability cards
 * @param {string} [props.className] - Optional extra class
 */
export const CapabilitiesSkeleton = ({ count = 4, className = '' }) => {
  return (
    <section
      className={`tw-skeleton-capabilities-section ${className}`}
      role="status"
      aria-busy="true"
      aria-label="Loading capabilities section..."
    >
      {/* Capabilities Section Header */}
      <div className="tw-skeleton-capabilities-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxWidth: '650px' }}>
          <Skeleton variant="rounded" width={110} height={22} />
          <Skeleton variant="text" width="85%" height={34} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.25rem' }}>
            <Skeleton variant="text" width="100%" height={16} />
            <Skeleton variant="text" width="70%" height={16} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-start' }}>
          <Skeleton variant="text" width={140} height={14} />
          <Skeleton variant="rounded" width={170} height={42} />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="tw-skeleton-capabilities-grid">
        <CapabilityCardSkeleton count={count} />
      </div>
    </section>
  );
};

export default CapabilitiesSkeleton;

