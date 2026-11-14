import React from 'react';
import CapabilitiesSkeleton from './CapabilitiesSkeleton';
import OpeningsSkeleton from './OpeningsSkeleton';
import ProcessSkeleton from './ProcessSkeleton';
import StatsJourneySkeleton from './StatsJourneySkeleton';
import IndustriesSkeleton from './IndustriesSkeleton';
import ReportsSkeleton from './ReportsSkeleton';
import CTASkeleton from './CTASkeleton';
import './skeleton.css';

/**
 * Composite Skeleton Loader matching entire Thinkwires Below-the-fold Homepage Suite
 *
 * @param {Object} props
 * @param {string} [props.className] - Optional extra class
 */
export const HomePageSkeleton = ({ className = '' }) => {
  return (
    <div
      className={`tw-skeleton-homepage ${className}`}
      role="status"
      aria-busy="true"
      aria-label="Loading homepage content..."
    >
      <CapabilitiesSkeleton />
      <OpeningsSkeleton />
      <ProcessSkeleton />
      <StatsJourneySkeleton />
      <IndustriesSkeleton />
      <ReportsSkeleton />
      <CTASkeleton />
    </div>
  );
};

export default HomePageSkeleton;

