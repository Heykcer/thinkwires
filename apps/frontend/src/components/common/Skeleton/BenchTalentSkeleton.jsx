import React from 'react';
import Skeleton from './Skeleton';
import './skeleton.css';

/**
 * Skeleton Loader matching Thinkwires Bench Candidate Card Layout
 *
 * @param {Object} props
 * @param {number} [props.count=1] - Number of candidate cards to render
 * @param {string} [props.className] - Optional extra class
 */
export const BenchTalentSkeleton = ({ count = 1, className = '' }) => {
  const cards = Array.from({ length: count }, (_, idx) => (
    <article
      key={idx}
      className={`tw-skeleton-bench-card ${className}`}
      role="status"
      aria-busy="true"
      aria-label="Loading talent profile..."
    >
      {/* Top Meta Bar: Code Badge & Urgency Pill */}
      <div className="tw-skeleton-bench-header">
        <Skeleton variant="rounded" width={95} height={24} />
        <Skeleton variant="rounded" width={115} height={24} />
      </div>

      {/* Profile Row: Avatar & Role / Meta */}
      <div className="tw-skeleton-bench-profile">
        <Skeleton variant="circular" width={48} height={48} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
          <Skeleton variant="text" width="75%" height={20} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Skeleton variant="text" width={65} height={14} />
            <span style={{ color: 'var(--color-outline-variant, #cbd5e1)' }}>•</span>
            <Skeleton variant="text" width={75} height={14} />
            <span style={{ color: 'var(--color-outline-variant, #cbd5e1)' }}>•</span>
            <Skeleton variant="text" width={70} height={14} />
          </div>
        </div>
      </div>

      {/* Rate Box */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '0.5rem',
          padding: '0.65rem 0.85rem',
          background: 'var(--color-surface-container-low, #f8fafc)',
          borderRadius: '8px',
        }}
      >
        <Skeleton variant="text" width={80} height={22} />
        <Skeleton variant="text" width={60} height={14} />
      </div>

      {/* Vetting Score Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton variant="text" width={110} height={14} />
          <Skeleton variant="text" width={40} height={14} />
        </div>
        <Skeleton variant="rounded" width="100%" height={8} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
          <Skeleton variant="text" width={120} height={12} />
          <Skeleton variant="text" width={100} height={12} />
        </div>
      </div>

      {/* Skills Chips */}
      <div className="tw-skeleton-bench-skills">
        <Skeleton variant="rounded" width={70} height={24} />
        <Skeleton variant="rounded" width={85} height={24} />
        <Skeleton variant="rounded" width={60} height={24} />
        <Skeleton variant="rounded" width={75} height={24} />
      </div>

      {/* Footer Actions */}
      <div className="tw-skeleton-bench-footer">
        <Skeleton variant="rounded" width={120} height={34} />
        <Skeleton variant="rounded" width={110} height={34} />
      </div>
    </article>
  ));

  return count === 1 ? cards[0] : <>{cards}</>;
};

export default BenchTalentSkeleton;

