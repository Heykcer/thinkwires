import React from 'react';
import BenchCandidateCard from './BenchCandidateCard';
import ScrollReveal from '../common/ScrollReveal';
import { BenchTalentSkeleton } from '../common/Skeleton';

const BenchCandidateGrid = ({ talents, totalCount, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="BenchGrid-wrapper">
        <div className="BenchGrid-grid">
          <BenchTalentSkeleton count={6} />
        </div>
      </div>
    );
  }

  if (!talents || talents.length === 0) {
    return (
      <div className="BenchGrid-emptyState">
        <span className="material-symbols-outlined BenchGrid-emptyIcon">
          person_search
        </span>
        <h3 className="BenchGrid-emptyTitle">
          No Talents Match Your Selected Filters
        </h3>
        <p className="BenchGrid-emptyDesc">
          Try expanding your specialty pills, urgency criteria, or search
          keywords. You can also request a custom pod requisition.
        </p>
      </div>
    );
  }

  return (
    <div className="BenchGrid-wrapper">
      <div className="BenchGrid-grid">
        {talents.map((talent, idx) => (
          <ScrollReveal
            key={talent.id || talent.code || idx}
            direction="up"
            delay={(idx % 2) * 0.1}
            style={{ display: 'flex', height: '100%' }}
          >
            <BenchCandidateCard talent={talent} />
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
};

export default BenchCandidateGrid;
