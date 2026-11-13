import React from 'react';
import SectionBadge from '../common/SectionBadge';
import ScrollReveal from '../common/ScrollReveal';

const DEFAULT_MILESTONES = [
  {
    id: 'timeline-2022',
    year: '2022',
    tag: 'Founding',
    title: 'Foundation & Model Inception',
    description:
      'Founded in Noida with a core team dedicated to borderless recruitment, pioneering an agency aggregator network that delivers verified profiles in under 5 hours.',
    variant: 'default',
  },
  {
    id: 'timeline-2023',
    year: '2023',
    tag: 'Practice Alignment',
    title: 'Growth & Practice Alignment',
    description:
      'Unit economics break-even achieved. Launched specialized talent practices across SAP ABAP/HANA, Cloud/DevOps, and Enterprise Salesforce consulting.',
    variant: 'default',
  },
  {
    id: 'timeline-2024',
    year: '2024',
    tag: 'Cross-Border',
    title: 'Cross-Border Expansion',
    description:
      'Inaugurated dedicated talent corridors into the United States and Canada. Rolled out comprehensive Employer of Record (EOR) and global payroll management.',
    variant: 'cobalt',
  },
  {
    id: 'timeline-2026',
    year: '2025+',
    tag: 'FUTURE HORIZONS',
    title: 'AI-Powered Delivery & Telemetry Vetting',
    description:
      'Automated code telemetry vetting, generative talent search matching, and sub-48-hour global deployment pipelines across AI and PLM systems.',
    variant: 'dark-emerald',
  },
];

const GrowthTimeline = ({ data }) => {
  const {
    eyebrow = 'CHRONICLE OF EXECUTION',
    heading = 'Our Growth Evolution',
    description = 'From an agile aggregator in Sector 63, Noida to a cross-continental staffing architecture powering Fortune 500 engineering initiatives.',
    milestones = [],
    roadmap = [],
  } = data || {};

  // If incoming data has milestones and roadmap, combine or fallback to Stitch default
  const sourceList =
    milestones.length > 0 || roadmap.length > 0
      ? [...milestones, ...roadmap].slice(0, 4)
      : DEFAULT_MILESTONES;

  const resolvedList = DEFAULT_MILESTONES.map((def, idx) => {
    const item = sourceList[idx] || {};
    return {
      ...def,
      ...item,
      year: item.year || def.year,
      tag: item.tag || def.tag,
      title: item.title || def.title,
      description: item.description || def.description,
      variant: idx === 3 ? 'dark-emerald' : idx === 2 ? 'cobalt' : 'default',
    };
  });

  return (
    <section
      className="GrowthTimeline-section"
      aria-label="Chronicle of Execution - Our Growth Evolution"
      id="growth"
    >
      <div className="GrowthTimeline-container">
        {/* Section Header */}
        <header className="GrowthTimeline-header">
          <SectionBadge
            text={eyebrow}
            icon={
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            }
          />
          <h2 className="GrowthTimeline-title">{heading}</h2>
          <p className="GrowthTimeline-subtitle">{description}</p>
        </header>

        {/* 4 Horizontal Cards Grid */}
        <div className="GrowthTimeline-grid">
          {resolvedList.map((item, idx) => {
            const isDarkCard = idx === 3 || item.variant === 'dark-emerald';
            const isCobalt = idx === 2 || item.variant === 'cobalt';

            const cardVariantClass =
              idx === 3
                ? 'GrowthTimeline-card--2026 GrowthTimeline-card--dark'
                : idx === 2
                  ? 'GrowthTimeline-card--2024'
                  : idx === 1
                    ? 'GrowthTimeline-card--2023'
                    : 'GrowthTimeline-card--2022';

            const yearVariantClass =
              idx === 3
                ? 'GrowthTimeline-year--2026 GrowthTimeline-year--emerald'
                : idx === 2
                  ? 'GrowthTimeline-year--2024 GrowthTimeline-year--cobalt'
                  : idx === 1
                    ? 'GrowthTimeline-year--2023'
                    : 'GrowthTimeline-year--2022 GrowthTimeline-year--muted';

            const tagVariantClass =
              idx === 3
                ? 'GrowthTimeline-tag--2026 GrowthTimeline-tag--emerald'
                : idx === 2
                  ? 'GrowthTimeline-tag--2024 GrowthTimeline-tag--cobalt'
                  : idx === 1
                    ? 'GrowthTimeline-tag--2023'
                    : 'GrowthTimeline-tag--2022 GrowthTimeline-tag--default';

            return (
              <ScrollReveal
                key={item.id || idx}
                direction="up"
                delay={idx * 0.08}
                distance={35}
                style={{ display: 'flex' }}
              >
                <div
                  className={`GrowthTimeline-card ${cardVariantClass}`}
                  style={{ width: '100%' }}
                >
                  {/* Subtle globe-inspired decorative element for 2024 */}
                  {idx === 2 && (
                    <div
                      className="GrowthTimeline-globeWatermark"
                      aria-hidden="true"
                    >
                      <svg
                        width="110"
                        height="110"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                        <path d="M2 12h20" />
                      </svg>
                    </div>
                  )}

                  {/* Ambient futuristic glow for 2026+ standout card */}
                  {idx === 3 && (
                    <div
                      className="GrowthTimeline-ambientGlow"
                      aria-hidden="true"
                    />
                  )}

                  {/* Card Top: Year & Tag */}
                  <div className="GrowthTimeline-cardTop">
                    <span className={`GrowthTimeline-year ${yearVariantClass}`}>
                      {item.year}
                    </span>

                    <span className={`GrowthTimeline-tag ${tagVariantClass}`}>
                      {item.tag}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3
                    className={`GrowthTimeline-cardTitle ${isDarkCard ? 'text-white' : ''}`}
                  >
                    {item.title}
                  </h3>
                  <p
                    className={`GrowthTimeline-cardDesc ${isDarkCard ? 'text-slate-300' : ''}`}
                  >
                    {item.description}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default GrowthTimeline;
