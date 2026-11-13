import React from 'react';
import Skeleton from './Skeleton';
import './skeleton.css';

/**
 * Skeleton Loader matching Thinkwires Hot Jobs Openings Card Layout
 *
 * @param {Object} props
 * @param {number} [props.count=1] - Number of cards to render
 * @param {string} [props.className] - Optional extra class
 */
export const OpeningsCardSkeleton = ({ count = 1, className = '' }) => {
  const cards = Array.from({ length: count }, (_, idx) => (
    <div
      key={idx}
      className={`tw-skeleton-openings-card ${className}`}
      role="status"
      aria-busy="true"
      aria-label="Loading job opening..."
    >
      {/* Header: Company Logo + Job Title + Priority Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', flex: 1 }}>
          <Skeleton variant="rounded" width={42} height={42} style={{ borderRadius: '8px', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
            <Skeleton variant="text" width={140} height={13} />
            <Skeleton variant="text" width="80%" height={20} />
          </div>
        </div>
        <Skeleton variant="rounded" width={95} height={24} style={{ borderRadius: '9999px', flexShrink: 0 }} />
      </div>

      {/* Meta Row Primary: Location, Experience, Salary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          padding: '0.75rem',
          background: 'var(--color-surface-container-low, #f8fafc)',
          borderRadius: '8px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <Skeleton variant="text" width={50} height={11} />
          <Skeleton variant="text" width="90%" height={14} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <Skeleton variant="text" width={55} height={11} />
          <Skeleton variant="text" width="85%" height={14} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <Skeleton variant="text" width={45} height={11} />
          <Skeleton variant="text" width="80%" height={14} />
        </div>
      </div>

      {/* Meta Row Secondary: Notice Period & Domain */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton variant="text" width={110} height={13} />
        <Skeleton variant="text" width={90} height={13} />
      </div>

      {/* Skills Chips */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Skeleton variant="rounded" width={65} height={22} style={{ borderRadius: '9999px' }} />
        <Skeleton variant="rounded" width={80} height={22} style={{ borderRadius: '9999px' }} />
        <Skeleton variant="rounded" width={60} height={22} style={{ borderRadius: '9999px' }} />
        <Skeleton variant="rounded" width={75} height={22} style={{ borderRadius: '9999px' }} />
      </div>

      {/* Footer: Date Posted + Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'auto',
          paddingTop: '0.85rem',
          borderTop: '1px solid var(--color-card-stroke, #e2e8f0)',
        }}
      >
        <Skeleton variant="text" width={85} height={14} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Skeleton variant="rounded" width={85} height={34} style={{ borderRadius: '6px' }} />
          <Skeleton variant="rounded" width={105} height={34} style={{ borderRadius: '6px' }} />
        </div>
      </div>
    </div>
  ));

  return count === 1 ? cards[0] : <>{cards}</>;
};

export default OpeningsCardSkeleton;

