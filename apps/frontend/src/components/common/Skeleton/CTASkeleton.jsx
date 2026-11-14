import React from 'react';
import Skeleton from './Skeleton';
import './skeleton.css';

/**
 * Skeleton Loader matching Thinkwires Call To Action Section
 *
 * @param {Object} props
 * @param {string} [props.className] - Optional extra class
 */
export const CTASkeleton = ({ className = '' }) => {
  return (
    <section
      className={`tw-skeleton-cta-section ${className}`}
      role="status"
      aria-busy="true"
      aria-label="Loading call to action section..."
    >
      <div className="tw-skeleton-cta-banner">
        <Skeleton variant="rounded" width={140} height={24} />
        <Skeleton variant="text" width="60%" height={36} />
        <Skeleton variant="text" width="45%" height={16} />

        {/* Buttons / Input Row */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Skeleton variant="rounded" width={180} height={46} style={{ borderRadius: '8px' }} />
          <Skeleton variant="rounded" width={180} height={46} style={{ borderRadius: '8px' }} />
        </div>
      </div>
    </section>
  );
};

export default CTASkeleton;

