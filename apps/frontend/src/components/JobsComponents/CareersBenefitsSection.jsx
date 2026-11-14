import React from 'react';
import { OFFICIAL_BENEFITS } from '../../data/careersData';

const renderBenefitIcon = (iconName) => {
  switch (iconName) {
    case 'shield':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case 'vault':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="12" cy="12" r="2" />
          <path d="M6 12h.01M18 12h.01" />
        </svg>
      );
    case 'award':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="7" />
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
        </svg>
      );
    case 'trending':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      );
    case 'graduation':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      );
    case 'star':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case 'calendar':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case 'users':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    default:
      return null;
  }
};

const CareersBenefitsSection = () => {
  return (
    <section id="benefits-growth" className="CR-BenefitsSection-root">
      <div className="CR-Container">
        {/* Section Header */}
        <div className="CR-SectionHeader text-center">
          <span className="CR-SectionPill">TOTAL REWARDS &amp; WELL-BEING</span>
          <h2 className="CR-SectionTitle">Benefits &amp; Career Growth</h2>
          <p className="CR-SectionSubtitle">
            We invest comprehensively in your physical health, financial security,
            long-term tenure, and rapid engineering mobility.
          </p>
        </div>

        {/* 8 Official Benefits Cards Grid */}
        <div className="CR-BenefitsGrid">
          {OFFICIAL_BENEFITS.map((item) => (
            <div key={item.id} className="CR-BenefitCard-root">
              <div className="CR-BenefitCard-topRow">
                <div className="CR-BenefitCard-iconBox">
                  {renderBenefitIcon(item.icon)}
                </div>
                <span className="CR-BenefitCard-badge">{item.badge}</span>
              </div>

              <div className="CR-BenefitCard-body">
                <span className="CR-BenefitCard-category">{item.category}</span>
                <h3 className="CR-BenefitCard-title">{item.title}</h3>
                <p className="CR-BenefitCard-desc">{item.description}</p>
              </div>

              <div className="CR-BenefitCard-footerLine" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CareersBenefitsSection;
