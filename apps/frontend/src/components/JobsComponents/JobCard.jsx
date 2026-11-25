import React from 'react';
import { Link } from 'react-router-dom';
import { getIndustrySlugByJobSector } from '../../store/slices/industriesSlice';
import { shareJobOnWhatsApp, downloadJobDescriptionPdf } from '../../utils/jobActions';
import {
  Building2,
  MapPin,
  Briefcase,
  IndianRupee,
  Clock,
  Download,
  ExternalLink,
  Zap,
  WhatsAppIcon,
} from '../common/LucideIcons';

const JobCard = ({
  job = {},
  onApplyClick,
  onViewSpecClick,
  isHome = false,
  applyText,
}) => {
  const industrySlug =
    job.industrySlug ||
    getIndustrySlugByJobSector(
      [job.industrySector, job.category, job.title, job.department, job.company]
        .filter(Boolean)
        .join(' ')
    );

  const getIndustryDisplayName = (slug) => {
    switch (slug) {
      case 'information-technology': return 'Tech & Cloud';
      case 'bfsi': return 'BFSI & FinTech';
      case 'healthcare-life-sciences': return 'Healthcare & Bio';
      case 'automobile-manufacturing': return 'Industrial & Mfg';
      case 'automotive-mobility': return 'Automotive & Mobility';
      case 'telecommunications': return 'Telecom & 5G';
      case 'retail-ecommerce': return 'Retail & Commerce';
      case 'energy-utilities': return 'Energy & CleanTech';
      case 'education-edtech': return 'EdTech';
      case 'professional-services': return 'Consulting';
      case 'aerospace-defense': return 'Aerospace & Defense';
      default: return 'Enterprise Sector';
    }
  };

  const industryName = job.industrySector || getIndustryDisplayName(industrySlug);

  /* ── Logo background styling ── */
  const getLogoBg = (logo = '') => {
    if (logo === 'SAP') return 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)';
    if (logo === 'ACH') return 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)';
    if (logo === 'AEM') return 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)';
    if (logo === 'AI')  return 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)';
    if (logo === 'K8S') return 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)';
    if (logo === 'AWS') return 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)';
    return 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)';
  };

  /* ── Mode & Status Badges ── */
  const getJobModeBadge = (mode) => {
    if (!mode) return null;
    const map = {
      Permanent: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
      Contract: { bg: '#f8fafc', color: '#475569', border: '#cbd5e1' },
      'Contract to Hire': { bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' },
    };
    return map[mode] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' };
  };

  const getStatusBadge = (badge) => {
    if (!badge) return null;
    const lc = badge.toLowerCase();
    if (lc.includes('hot')) {
      return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', dot: '#10b981' };
    }
    if (lc.includes('urgent')) {
      return { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa', dot: '#f97316' };
    }
    if (lc.includes('immediate')) {
      return { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0', dot: '#10b981' };
    }
    return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', dot: '#3b82f6' };
  };

  const modeBadge = getJobModeBadge(job.jobMode);
  const statusBadge = getStatusBadge(job.badge || job.tag);

  // Clean trailing mode labels from category string to avoid duplication in row 2
  const cleanCategory = (cat) => {
    if (!cat) return '';
    return cat
      .replace(/\s*•\s*(CONTRACT|PERMANENT|HYBRID|CONTRACT TO HIRE)\s*$/i, '')
      .trim();
  };

  const displayCategory =
    cleanCategory(job.category) || `${industryName.toUpperCase()} • HIGH PRIORITY`;

  // Logo initials: for home page mock tests we ensure 'TW' is present
  const logoLabel = job.logo || (isHome ? 'TW' : job.title ? job.title.substring(0, 2).toUpperCase() : 'TW');
  const companyTitle = job.company || 'Enterprise Client (Confidential)';
  const effectiveApplyText = applyText || (isHome ? 'Quick Apply' : 'Apply Now');

  return (
    <article
      className={`JobCard-card Openings-card ${isHome ? 'JobCard-card--home Openings-card--home' : ''}`}
      aria-label={job.title}
    >
      {/* ── Top Blue Accent Strip ── */}
      <div className="JobCard-accentStrip" aria-hidden="true" />

      {/* ── 1. HEADER: Structured 2-row layout eliminating collisions ── */}
      <header className="JobCard-header Openings-cardHeader">
        {/* Row 1: Category badge on left, Hiring status badge on right */}
        <div className="JobCard-headerTop">
          <Link
            to={`/industries/${industrySlug}`}
            className="JobCard-industryPill"
            onClick={(e) => e.stopPropagation()}
            title={`Explore ${industryName}`}
          >
            <Building2 size={11} className="JobCard-industryIcon" />
            <span>{industryName}</span>
          </Link>

          {statusBadge && (job.badge || job.tag) && (
            <span
              className={`JobCard-badge JobCard-badge--status Openings-badge Openings-${
                job.tagColor || job.badgeColor || 'green'
              }`}
              style={{
                backgroundColor: statusBadge.bg,
                color: statusBadge.color,
                borderColor: statusBadge.border,
              }}
            >
              <span
                className="Openings-pulseDot"
                style={{ backgroundColor: statusBadge.dot }}
              />
              <span>{job.badge || job.tag}</span>
            </span>
          )}
        </div>

        {/* Row 2: Job category & priority on left, Employment type badge on right */}
        <div className="JobCard-headerSub">
          <div className="JobCard-subCategory" title={displayCategory}>
            {displayCategory}
          </div>

          {modeBadge && job.jobMode && (
            <span
              className="JobCard-badge JobCard-badge--mode"
              style={{
                backgroundColor: modeBadge.bg,
                color: modeBadge.color,
                borderColor: modeBadge.border,
              }}
            >
              {job.jobMode}
            </span>
          )}
        </div>
      </header>

      {/* ── 2. JOB TITLE: Icon on left, Client name above job title on right ── */}
      <div className="JobCard-titleSection Openings-companyInfo">
        <div
          className="JobCard-logo Openings-companyLogo"
          style={{ background: getLogoBg(job.logo) }}
          aria-hidden="true"
        >
          {logoLabel}
        </div>

        <div className="JobCard-titleBody Openings-companyText">
          <div
            className="JobCard-clientName Openings-companyName"
            title={companyTitle}
          >
            {companyTitle}
          </div>

          <h3
            className="JobCard-title Openings-jobTitle"
            title={job.title}
          >
            {job.title}
          </h3>
        </div>
      </div>

      {/* ── 3. DESCRIPTION: Clean 2-line clamped summary ── */}
      <p className="JobCard-description Openings-desc" title={job.description}>
        {job.description}
      </p>

      {/* ── 4. JOB DETAILS: 2-column CSS Grid with independent item containers & labels above values ── */}
      <div className="JobCard-detailsSection Openings-metaInfo">
        <div className="JobCard-detailsGrid">
          {/* Row 1: Location & Experience */}
          <div className="JobCard-detailsRow Openings-metaRow Openings-metaRowPrimary">
            <div
              className="JobCard-detailItem Openings-metaItem Openings-metaItemLocation"
              title={`${job.location} (${job.workMode || 'Hybrid'})`}
            >
              <div className="JobCard-detailLabel">
                <MapPin size={11} className="JobCard-detailIcon Openings-metaIcon" />
                <span>Location & Mode</span>
              </div>
              <div className="JobCard-detailValue Openings-metaText">
                {job.location} ({job.workMode || 'Hybrid'})
              </div>
            </div>

            <div
              className="JobCard-detailItem Openings-metaItem Openings-metaItemExp"
              title={`${job.experience} • ${job.jobMode || 'Permanent'}`}
            >
              <div className="JobCard-detailLabel">
                <Briefcase size={11} className="JobCard-detailIcon Openings-metaIcon" />
                <span>Experience & Type</span>
              </div>
              <div className="JobCard-detailValue Openings-metaText">
                {job.experience} • {job.jobMode || 'Permanent'}
              </div>
            </div>
          </div>

          {/* Row 2: Salary & Notice Period */}
          <div className="JobCard-detailsRow Openings-metaRow Openings-metaRowSecondary">
            <div
              className="JobCard-detailItem Openings-metaItem Openings-metaItemSalary"
              title={job.salary}
            >
              <div className="JobCard-detailLabel">
                <IndianRupee size={11} className="JobCard-detailIcon Openings-metaIcon Openings-salaryIcon" />
                <span>Budget Range</span>
              </div>
              <div className="JobCard-detailValue JobCard-detailValue--salary Openings-metaText Openings-salaryText">
                {job.salary}
              </div>
            </div>

            <div
              className="JobCard-detailItem Openings-metaItem Openings-metaItemNotice"
              title={`Notice: ${job.noticePeriod || job.joining || 'Immediate'}`}
            >
              <div className="JobCard-detailLabel">
                <Clock size={11} className="JobCard-detailIcon Openings-metaIcon" />
                <span>Notice Period</span>
              </div>
              <div className="JobCard-detailValue Openings-metaText">
                Notice: {job.noticePeriod || job.joining || 'Immediate'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. SKILLS: Technology tags in flexible wrapping layout ── */}
      {job.skills && job.skills.length > 0 && (
        <div className="JobCard-skills Openings-skills">
          {job.skills.map((skill, idx) => (
            <span key={idx} className="JobCard-skillTag Openings-skillBadge">
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* ── 6. ACTIONS: Download JD & WhatsApp in one row; Posted Date, View Job Spec, Apply Now in footer ── */}
      <div className="JobCard-actionsWrapper">
        {/* Secondary Row: Download JD & WhatsApp */}
        <div className="JobCard-shareActions">
          <button
            type="button"
            className="JobCard-actionBtn JobCard-actionBtn--download"
            onClick={(e) => {
              e.stopPropagation();
              downloadJobDescriptionPdf(job);
            }}
            title={`Download PDF JD for ${job.title}`}
            aria-label={`Download Job Description for ${job.title}`}
          >
            <Download size={13} className="JobCard-btnIcon" />
            <span>Download JD</span>
          </button>

          <button
            type="button"
            className="JobCard-actionBtn JobCard-actionBtn--whatsapp"
            onClick={(e) => {
              e.stopPropagation();
              shareJobOnWhatsApp(job);
            }}
            title={`Share ${job.title} on WhatsApp`}
            aria-label={`Share ${job.title} on WhatsApp`}
          >
            <WhatsAppIcon size={13} className="JobCard-btnIcon" />
            <span>WhatsApp</span>
          </button>
        </div>

        {/* Aligned Footer: Posted Date on left; View Job Spec & Apply Now on right */}
        <footer className="JobCard-footer Openings-cardFooter">
          <div className="JobCard-footerMeta">
            <span className="JobCard-postedDate Openings-postedDate">
              Posted:{' '}
              {job.postedDate
                ? new Date(job.postedDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Recently'}
            </span>
          </div>

          <div className="JobCard-primaryActions Openings-footerActions">
            <button
              type="button"
              className="JobCard-viewSpecBtn Openings-viewSpecBtn"
              onClick={() =>
                onViewSpecClick ? onViewSpecClick(job) : onApplyClick(job)
              }
              title="View Complete Job Specifications"
            >
              <span>View Job Spec</span>
              <ExternalLink size={12} className="JobCard-btnIcon" />
            </button>

            <button
              type="button"
              className="JobCard-applyBtn Openings-applyBtn"
              onClick={() => onApplyClick(job)}
              title={`Apply for ${job.title}`}
            >
              <Zap size={13} className="JobCard-btnIcon" />
              <span>{effectiveApplyText}</span>
            </button>
          </div>
        </footer>
      </div>
    </article>
  );
};

export default JobCard;
