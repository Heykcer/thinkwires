import React from 'react';
import Skeleton from './Skeleton';
import './skeleton.css';

/**
 * Skeleton Loader matching Thinkwires Recruitment Process Methodology Section
 *
 * @param {Object} props
 * @param {number} [props.count=6] - Number of process cards
 * @param {string} [props.className] - Optional extra class
 */
export const ProcessSkeleton = ({ count = 6, className = '' }) => {
  return (
    <section
      className={`tw-skeleton-process-section ${className}`}
      role="status"
      aria-busy="true"
      aria-label="Loading recruitment process section..."
    >
      {/* Centered Header */}
      <div className="tw-skeleton-process-header">
        <Skeleton variant="rounded" width={180} height={24} />
        <Skeleton variant="text" width="85%" height={34} />
        <Skeleton variant="text" width="65%" height={16} />
      </div>

      {/* Process Steps Grid */}
      <div className="tw-skeleton-process-grid">
        {Array.from({ length: count }, (_, idx) => (
          <div key={idx} className="tw-skeleton-process-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Skeleton variant="text" width={40} height={28} />
              <Skeleton variant="circular" width={36} height={36} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <Skeleton variant="text" width="70%" height={20} />
              <Skeleton variant="text" width="50%" height={14} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <Skeleton variant="text" width="100%" height={13} />
              <Skeleton variant="text" width="90%" height={13} />
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <Skeleton variant="rounded" width={75} height={20} style={{ borderRadius: '4px' }} />
              <Skeleton variant="rounded" width={90} height={20} style={{ borderRadius: '4px' }} />
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--color-card-stroke, #e2e8f0)' }}>
              <Skeleton variant="text" width="85%" height={12} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ProcessSkeleton;

