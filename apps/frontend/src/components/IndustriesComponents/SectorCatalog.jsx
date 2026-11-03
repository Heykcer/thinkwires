import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchIndustriesPageData,
  INDUSTRY_TABS,
  getAllIndustries,
  getIndustrySlugByJobSector,
} from '../../store/slices/industriesSlice';
import { fetchOpenings } from '../../store/slices/homeSlice';
import ScrollReveal from '../common/ScrollReveal';

const SectorCatalog = () => {
  const dispatch = useDispatch();
  const { sectors, sectorTabs, status } = useSelector(
    (state) => state.industries
  );
  const { openings = [] } = useSelector((state) => state.home);

  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchIndustriesPageData());
    }
  }, [status, dispatch]);

  useEffect(() => {
    if (!openings || openings.length === 0) {
      dispatch(fetchOpenings());
    }
  }, [dispatch, openings]);

  // Helper to calculate verified active job count for a sector slug
  const getActiveJobsCount = (targetSlug) => {
    if (!openings || openings.length === 0 || !targetSlug) return 0;
    return openings.filter((job) => {
      const jobSlug =
        job.industrySlug ||
        getIndustrySlugByJobSector(
          [job.industrySector, job.category, job.title, job.department, job.company]
            .filter(Boolean)
            .join(' ')
        );
      return jobSlug === targetSlug;
    }).length;
  };

  const tabs =
    sectorTabs && sectorTabs.length > 0 ? sectorTabs : INDUSTRY_TABS;

  const displaySectors =
    sectors && sectors.length > 0 ? sectors : getAllIndustries();

  const filteredSectors =
    activeTab === 'all'
      ? displaySectors
      : displaySectors.filter(
          (s) =>
            s.category === activeTab ||
            s.filter === activeTab ||
            s.id === activeTab
        );

  return (
    <section className="SectorCatalog-section" id="sectors-catalog">
      <ScrollReveal direction="up">
        <div className="SectorCatalog-header">
          <div>
            <span className="SectorCatalog-badge">Specialized Practices</span>
            <h2 className="SectorCatalog-title">Industries We Serve</h2>
            <p className="SectorCatalog-subtitle">
              Browse our domain-calibrated practices across 11 core industries.
              Click any sector card to explore deep delivery capabilities, technical
              stacks, and active hiring pods.
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div
          className="SectorCatalog-filterBar"
          role="tablist"
          aria-label="Sector Categories"
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`SectorCatalog-tabBtn ${
                activeTab === tab.key ? 'SectorCatalog-tabBtn--active' : ''
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* Cards Grid with Themed Background Images */}
      <div className="SectorCatalog-grid">
        {filteredSectors.map((sector, index) => {
          const targetSlug = sector.slug || 'information-technology';
          const bgImg =
            sector.bgImage ||
            'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80';

          return (
            <ScrollReveal
              key={sector.slug || sector.id || index}
              direction="up"
              delay={(index % 3) * 0.08}
              className="SectorCatalog-cardWrapper"
            >
              <article
                className="SectorCatalog-card SectorCatalog-card--imageThemed group"
                data-sector={sector.slug || sector.id}
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.42) 0%, rgba(15, 23, 42, 0.88) 55%, #0f172a 100%), url("${bgImg}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <Link
                  to={`/industries/${targetSlug}`}
                  className="SectorCatalog-cardFullOverlayLink"
                  aria-label={`View ${sector.title} details`}
                />

                <div className="SectorCatalog-cardTop">
                  <div className="SectorCatalog-cardHeader flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="SectorCatalog-cardIconWrap SectorCatalog-cardIconWrap--glass">
                        <span className="material-symbols-outlined SectorCatalog-cardIcon">
                          {sector.icon || 'star'}
                        </span>
                      </div>
                      <span className="SectorCatalog-cardBadge SectorCatalog-cardBadge--glass">
                        <span
                          className="SectorCatalog-cardBadgeDot"
                          style={{
                            backgroundColor:
                              sector.badgeDot || 'var(--color-cobalt-bright, #2563EB)',
                          }}
                        ></span>
                        {sector.badgeText || sector.badge || 'Domain Verified'}
                      </span>
                    </div>

                    {/* Active Jobs Badge (Clickable, links to /hot-jobs?industry={slug}) */}
                    {(() => {
                      const activeCount = getActiveJobsCount(targetSlug);
                      return (
                        <Link
                          to={`/hot-jobs?industry=${encodeURIComponent(targetSlug)}`}
                          className="SectorCatalog-hiringBadge"
                          aria-label={
                            activeCount > 0
                              ? `View ${activeCount} active openings in ${sector.title}`
                              : `Explore hiring opportunities in ${sector.title}`
                          }
                          title={
                            activeCount > 0
                              ? `${activeCount} Verified Open Roles in ${sector.title}`
                              : `Explore opportunities in ${sector.title}`
                          }
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="SectorCatalog-hiringBadgeIcon" aria-hidden="true">
                            ⚡
                          </span>
                          <span>
                            {activeCount > 0
                              ? `${activeCount} Active ${activeCount === 1 ? 'Opening' : 'Openings'}`
                              : 'Explore Opportunities'}
                          </span>
                        </Link>
                      );
                    })()}
                  </div>

                  <h3 className="SectorCatalog-cardTitle SectorCatalog-cardTitle--light">
                    {sector.title}
                  </h3>
                  <p className="SectorCatalog-cardDesc SectorCatalog-cardDesc--light">
                    {sector.shortDesc || sector.desc || sector.description}
                  </p>

                  {/* Mandatory Compliance Stacks */}
                  <div className="SectorCatalog-complianceBox SectorCatalog-complianceBox--glass">
                    <div className="SectorCatalog-complianceHeader SectorCatalog-complianceHeader--light">
                      <span className="material-symbols-outlined SectorCatalog-complianceIcon">
                        verified_user
                      </span>
                      Mandatory Compliance Stacks
                    </div>
                    <p className="SectorCatalog-complianceText SectorCatalog-complianceText--light">
                      {sector.complianceText ||
                        (Array.isArray(sector.compliance)
                          ? sector.compliance.slice(0, 4).join(', ')
                          : 'SOC 2, ISO 27001, Domain Regulations')}
                    </p>
                  </div>

                  {/* High-Demand Placements */}
                  <div className="SectorCatalog-placementsSection">
                    <span className="SectorCatalog-placementsLabel SectorCatalog-placementsLabel--light">
                      High-Demand Placements
                    </span>
                    <div className="SectorCatalog-tags">
                      {(sector.placements || []).slice(0, 4).map((placement, i) => (
                        <span
                          key={i}
                          className="SectorCatalog-tag SectorCatalog-tag--glass"
                        >
                          {placement}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="SectorCatalog-cardFooter SectorCatalog-cardFooter--glass">
                  <span className="SectorCatalog-podsCount SectorCatalog-podsCount--light">
                    Pods Deployed:{' '}
                    <strong>
                      {sector.podsDeployed || sector.pods || '20+'}
                    </strong>
                  </span>
                  <Link
                    to={`/industries/${targetSlug}`}
                    className="SectorCatalog-deployLink SectorCatalog-deployLink--glass"
                  >
                    <span>Explore Domain</span>
                    <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </Link>
                </div>
              </article>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
};

export default SectorCatalog;
