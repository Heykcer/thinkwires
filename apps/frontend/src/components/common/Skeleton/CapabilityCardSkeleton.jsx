import React from 'react';
import Skeleton from './Skeleton';
import './skeleton.css';

/**
 * Skeleton Loader matching Thinkwires Capabilities Card Layout
 *
 * @param {Object} props
 * @param {number} [props.count=1] - Number of cards to render
 * @param {string} [props.className] - Optional extra class
 */
export const CapabilityCardSkeleton = ({ count = 1, className = '' }) => {
  const cards = Array.from({ length: count }, (_, idx) => (
    <div
      key={idx}
      className={`tw-skeleton-capability-card ${className}`}
      role="status"
      aria-busy="true"
      aria-label="Loading capability..."
    >
      <div>
        {/* Icon Wrapper */}
        <Skeleton
          variant="rounded"
          width={48}
          height={48}
          style={{ borderRadius: '0.75rem', marginBottom: '1.25rem' }}
        />

        {/* Card Header: Eyebrow + Title + Desc */}
        <div style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Skeleton variant="text" width={90} height={12} />
          <Skeleton variant="text" width="75%" height={22} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.25rem' }}>
            <Skeleton variant="text" width="100%" height={14} />
            <Skeleton variant="text" width="85%" height={14} />
          </div>
        </div>

        {/* Feature Bullet Points */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {[1, 2, 3, 4].map((fIdx) => (
            <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Skeleton variant="circular" width={16} height={16} />
              <Skeleton variant="text" width={`${65 + (fIdx % 3) * 12}%`} height={14} />
            </div>
          ))}
        </div>
      </div>

      {/* Card Footer Link */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--color-card-stroke, #e2e8f0)',
        }}
      >
        <Skeleton variant="text" width={130} height={16} />
        <Skeleton variant="circular" width={20} height={20} />
      </div>
    </div>
  ));

  return count === 1 ? cards[0] : <>{cards}</>;
};

export default CapabilityCardSkeleton;

