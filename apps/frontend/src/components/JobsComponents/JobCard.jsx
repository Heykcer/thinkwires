import React from 'react';
import { Link } from 'react-router-dom';
import { getIndustrySlugByJobSector } from '../../store/slices/industriesSlice';

const JobCard = ({ job, onApplyClick, onViewSpecClick }) => {
  const industrySlug =
    job.industrySlug ||
    getIndustrySlugByJobSector(
      [job.industrySector, job.category, job.title, job.department, job.company]
        .filter(Boolean)
        .join(' ')
    );

  const getIndustryDisplayName = (slug) => {
    switch (slug) {
      case 'information-technology':
        return 'Tech & Cloud';
      case 'bfsi':
        return 'BFSI & FinTech';
      case 'healthcare-life-sciences':
        return 'Healthcare & Bio';
      case 'automobile-manufacturing':
        return 'Industrial & Mfg';
      case 'automotive-mobility':
        return 'Automotive & Mobility';
      case 'telecommunications':
        return 'Telecom & 5G';
      case 'retail-ecommerce':
        return 'Retail & Commerce';
      case 'energy-utilities':
        return 'Energy & CleanTech';
      case 'education-edtech':
        return 'EdTech';
      case 'professional-services':
        return 'Consulting';
      case 'aerospace-defense':
        return 'Aerospace & Defense';
      default:
        return 'Enterprise Sector';
    }
  };

  const industryName = job.industrySector || getIndustryDisplayName(industrySlug);

  const getBadgeStyle = (badgeColor = 'green') => {
    if (badgeColor === 'green') {
      return {
        background: '#e6f4ea',
        color: '#137333',
        border: '1px solid #ceead6',
      };
    }
    if (badgeColor === 'blue') {
      return {
        background: '#e8f0fe',
        color: '#1a73e8',
        border: '1px solid #d2e3fc',
      };
    }
    if (badgeColor === 'purple') {
      return {
        background: '#f3e8ff',
        color: '#7e22ce',
        border: '1px solid #e9d5ff',
      };
    }
    if (badgeColor === 'red') {
      return {
        background: '#fce8e6',
        color: '#c5221f',
        border: '1px solid #fad2cf',
      };
    }
    return {
      background: '#f1f5f9',
      color: '#475569',
      border: '1px solid #e2e8f0',
    };
  };

  const getLogoBg = (logo = '') => {
    if (logo === 'SAP') return 'linear-gradient(135deg, #0284c7, #0369a1)';
    if (logo === 'ACH') return 'linear-gradient(135deg, #0d9488, #0f766e)';
    if (logo === 'AEM') return 'linear-gradient(135deg, #2563eb, #1d4ed8)';
    if (logo === 'AI') return 'linear-gradient(135deg, #7c3aed, #6d28d9)';
    if (logo === 'K8S') return 'linear-gradient(135deg, #2563eb, #0284c7)';
    return 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
  };

  return (
    <div className="JobCard-figmaCard">
      {/* Top Header Row: Category, Industry Domain & Status Badge */}
      <div className="JobCard-topCategoryRow">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className="JobCard-categoryText">
            {job.category || 'ENTERPRISE SYSTEMS • CONTRACT'}
          </span>
          <Link
            to={`/industries/${industrySlug}`}
            className="JobCard-industryPill"
            onClick={(e) => e.stopPropagation()}
            title={`Explore ${industryName} practice details and hiring pods`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.15rem 0.55rem',
              borderRadius: '9999px',
              fontSize: '0.7rem',
              fontWeight: 700,
              background: 'rgba(37, 99, 235, 0.08)',
              color: '#1d4ed8',
              border: '1px solid rgba(37, 99, 235, 0.22)',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>
              domain
            </span>
            <span>{industryName}</span>
          </Link>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '0.4rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {job.jobMode && (
            <span
              className="JobCard-modePill"
              style={{
                fontSize: '0.72rem',
                padding: '0.2rem 0.55rem',
                borderRadius: '4px',
                fontWeight: 600,
                background: 'rgba(37, 99, 235, 0.08)',
                color: '#2563eb',
                border: '1px solid rgba(37, 99, 235, 0.2)',
              }}
            >
              {job.jobMode}
            </span>
          )}
          <span
            className="JobCard-badgePill"
            style={getBadgeStyle(job.badgeColor)}
          >
            {job.badge || job.tag || 'Immediate Joining'}
          </span>
        </div>
      </div>

      {/* Main Title & Logo Row */}
      <div className="JobCard-titleAndLogoRow">
        <div
          className="JobCard-logoSquare"
          style={{ background: getLogoBg(job.logo) }}
        >
          {job.logo ||
            (job.title ? job.title.substring(0, 2).toUpperCase() : 'TW')}
        </div>
        <h3 className="JobCard-cardJobTitle">{job.title}</h3>
      </div>

      {/* Description Snippet */}
      <p className="JobCard-cardDescription">{job.description}</p>

      {/* 4 Specs Grid */}
      <div className="JobCard-specsGrid">
        <div className="JobCard-specItem">
          <span className="JobCard-specLabel">Location & Mode</span>
          <span className="JobCard-specVal">
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '15px',
                verticalAlign: 'middle',
                marginRight: '4px',
              }}
            >
              {job.workMode === 'Work From Home'
                ? 'home'
                : job.workMode === 'Work From Office'
                  ? 'domain'
                  : 'location_on'}
            </span>
            {job.location} ({job.workMode || 'Hybrid'})
          </span>
        </div>

        <div className="JobCard-specItem">
          <span className="JobCard-specLabel">Experience & Type</span>
          <span className="JobCard-specVal">
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '15px',
                verticalAlign: 'middle',
                marginRight: '4px',
              }}
            >
              work
            </span>
            {job.experience} • {job.jobMode || 'Permanent'}
          </span>
        </div>

        <div className="JobCard-specItem">
          <span className="JobCard-specLabel">Budget Range</span>
          <span className="JobCard-specVal JobCard-salaryVal">
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '15px',
                verticalAlign: 'middle',
                marginRight: '4px',
              }}
            >
              payments
            </span>
            {job.salary}
          </span>
        </div>

        <div className="JobCard-specItem">
          <span className="JobCard-specLabel">Notice Period</span>
          <span className="JobCard-specVal">
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '15px',
                verticalAlign: 'middle',
                marginRight: '4px',
              }}
            >
              timer
            </span>
            {job.noticePeriod || job.joining || 'Immediate'}
          </span>
        </div>
      </div>

      {/* Skill Chips */}
      {job.skills && job.skills.length > 0 && (
        <div className="JobCard-skillChipsRow">
          {job.skills.map((skill, idx) => (
            <span key={idx} className="JobCard-chip">
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Footer Row: View Job Spec & Apply Button */}
      <div className="JobCard-cardFooterRow">
        <button
          type="button"
          className="JobCard-viewSpecBtn"
          onClick={() => {
            if (onViewSpecClick) {
              onViewSpecClick(job);
            } else {
              onApplyClick(job);
            }
          }}
          title="View Complete Job Specifications"
        >
          <span>View Job Spec</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </button>

        <button
          type="button"
          className="JobCard-applyNowBlueBtn"
          onClick={() => onApplyClick(job)}
          title="Apply directly for this position"
        >
          Apply Now
        </button>
      </div>
    </div>
  );
};

export default JobCard;
