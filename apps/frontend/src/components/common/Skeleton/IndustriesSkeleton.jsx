import React from 'react';
import Skeleton from './Skeleton';
import './skeleton.css';

/**
 * Skeleton Loader matching Thinkwires Industries Domain Section
 *
 * @param {Object} props
 * @param {number} [props.count=4] - Number of cards to render
 * @param {string} [props.className] - Optional extra class
 */
export const IndustriesSkeleton = ({ count = 4, className = '' }) => {
  return (
    <section
      className={`tw-skeleton-industries-section ${className}`}
      role="status"
      aria-busy="true"
      aria-label="Loading industries section..."
    >
      {/* Header: Title/Subtext + Nav Controls */}
      <div className="tw-skeleton-industries-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxWidth: '650px' }}>
          <Skeleton variant="rounded" width={160} height={24} />
          <Skeleton variant="text" width="80%" height={32} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.2rem' }}>
            <Skeleton variant="text" width="100%" height={15} />
            <Skeleton variant="text" width="65%" height={15} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="circular" width={40} height={40} />
        </div>
      </div>

      {/* Cards Track */}
      <div className="tw-skeleton-industries-grid">
        {Array.from({ length: count }, (_, idx) => (
          <div key={idx} className="tw-skeleton-industries-card">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <Skeleton variant="rounded" width={100} height={24} style={{ borderRadius: '9999px' }} />
                <Skeleton variant="circular" width={32} height={32} />
              </div>
              <Skeleton variant="text" width="75%" height={24} style={{ marginBottom: '0.75rem' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <Skeleton variant="text" width="100%" height={14} />
                <Skeleton variant="text" width="85%" height={14} />
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
              <Skeleton variant="rounded" width={120} height={28} style={{ borderRadius: '6px', marginBottom: '1rem' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton variant="text" width={110} height={15} />
                <Skeleton variant="circular" width={18} height={18} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default IndustriesSkeleton;

