import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useSelector, useDispatch } from 'react-redux';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import CTA from '../components/common/CTA';
import ScrollReveal from '../components/common/ScrollReveal';
import JobCard from '../components/JobsComponents/JobCard';
import QuickApplyModal from '../components/common/QuickApplyModal';
import JobSpecModal from '../components/JobsComponents/JobSpecModal';
import { fetchOpenings } from '../store/slices/homeSlice';
import {
  fetchIndustryBySlug,
  getIndustryBySlug,
  getAllIndustries,
  getIndustrySlugByJobSector,
} from '../store/slices/industriesSlice';

const IndustryDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { openings = [] } = useSelector((state) => state.home);
  const { industryDetails, currentIndustry } = useSelector((state) => state.industries);
  const [selectedJobForApply, setSelectedJobForApply] = useState(null);
  const [selectedJobForSpec, setSelectedJobForSpec] = useState(null);

  // Dispatch fetch to refresh from CMS / backend
  useEffect(() => {
    if (slug) {
      dispatch(fetchIndustryBySlug(slug));
    }
  }, [slug, dispatch]);

  const industryData =
    industryDetails[slug] ||
    (currentIndustry?.slug === slug ? currentIndustry : null) ||
    getIndustryBySlug(slug);

  // Ensure openings are loaded for matching sector jobs
  useEffect(() => {
    if (!openings || openings.length === 0) {
      dispatch(fetchOpenings());
    }
  }, [dispatch, openings]);

  // Filter jobs matching this industry domain
  const matchedJobs = useMemo(() => {
    if (!industryData || !openings) return [];
    return openings.filter((job) => {
      const jobSlug =
        job.industrySlug ||
        getIndustrySlugByJobSector(
          [job.industrySector, job.category, job.title, job.department, job.company]
            .filter(Boolean)
            .join(' ')
        );
      return jobSlug === industryData.slug;
    });
  }, [industryData, openings]);

  // Scroll to section helper
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!industryData) {
    return (
      <div className="IndustryDetail-notFoundPage">
        <Navbar />
        <div className="IndustryDetail-notFoundContainer">
          <span className="material-symbols-outlined text-[64px] text-blue-500 mb-4">
            travel_explore
          </span>
          <h1 className="text-3xl font-bold mb-2">Industry Sector Not Found</h1>
          <p className="text-slate-600 mb-6 max-w-md text-center">
            The industry sector you requested does not exist or may have been relocated.
          </p>
          <Link to="/industries" className="btn btn-primary">
            Explore All 11 Industries
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const {
    title,
    heroTagline,
    shortDesc,
    fullDesc,
    bgImage,
    badgeText,
    badgeDot,
    stats = [],
    solutions = [],
    domains = [],
    compliance = [],
    placements = [],
    podsDeployed = '25+',
  } = industryData;

  const allIndustries = getAllIndustries();

  return (
    <div className="IndustryDetailPage-root">
      <Helmet>
        <title>{`${title} | Thinkwires Domain Solutions`}</title>
        <meta name="description" content={shortDesc || fullDesc} />
        <meta property="og:title" content={`${title} | Thinkwires`} />
        <meta property="og:description" content={shortDesc} />
        <meta property="og:image" content={bgImage} />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <Navbar />

      <main className="IndustryDetailPage-main">
        {/* Hero Section with Themed Banner Wallpaper */}
        <section
          className="IndustryDetail-heroSection"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.72) 0%, rgba(15, 23, 42, 0.94) 75%, #0f172a 100%), url("${bgImage}")`,
          }}
        >
          <div className="IndustryDetail-heroContainer">
            {/* Breadcrumb Navigation */}
            <div className="IndustryDetail-breadcrumbs">
              <Link to="/" className="IndustryDetail-breadcrumbLink">
                Home
              </Link>
              <span className="IndustryDetail-breadcrumbSeparator">/</span>
              <Link to="/industries" className="IndustryDetail-breadcrumbLink">
                Industries
              </Link>
              <span className="IndustryDetail-breadcrumbSeparator">/</span>
              <span className="IndustryDetail-breadcrumbCurrent">{title}</span>
            </div>

            <ScrollReveal direction="up">
              <div className="IndustryDetail-heroBadgeRow">
                <span className="IndustryDetail-heroBadge">
                  <span
                    className="IndustryDetail-badgeDot"
                    style={{ backgroundColor: badgeDot || '#2563EB' }}
                  ></span>
                  {badgeText || 'Specialized Domain Practice'}
                </span>
                <span className="IndustryDetail-heroPodsBadge">
                  <span className="material-symbols-outlined text-[15px]">
                    hub
                  </span>
                  <span>{podsDeployed} Active Pods Deployed</span>
                </span>
              </div>

              <h1 className="IndustryDetail-heroTitle">{title}</h1>
              {heroTagline && (
                <p className="IndustryDetail-heroTagline">{heroTagline}</p>
              )}
              <p className="IndustryDetail-heroDesc">
                {fullDesc || shortDesc}
              </p>

              {/* Action Buttons */}
              <div className="IndustryDetail-heroActionRow">
                <button
                  type="button"
                  onClick={() => scrollToSection('contact-form')}
                  className="btn btn-primary IndustryDetail-primaryBtn"
                >
                  <span>Deploy Talent Pod</span>
                  <span className="material-symbols-outlined text-[18px]">
                    arrow_forward
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('active-openings')}
                  className="btn btn-outline IndustryDetail-outlineBtn"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    work
                  </span>
                  <span>View Domain Openings ({matchedJobs.length})</span>
                </button>
              </div>

              {/* Quick Domain Stats Strip */}
              {stats && stats.length > 0 && (
                <div className="IndustryDetail-statsStrip">
                  {stats.map((stat, idx) => (
                    <div key={idx} className="IndustryDetail-statItem">
                      <div className="IndustryDetail-statNumber">
                        <span>{stat.value}</span>
                        <span className="IndustryDetail-statUnit">
                          {stat.unit}
                        </span>
                      </div>
                      <span className="IndustryDetail-statLabel">
                        {stat.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </ScrollReveal>
          </div>
        </section>

        {/* Core Workforce Solutions / Delivery Pillars */}
        {solutions && solutions.length > 0 && (
          <section className="IndustryDetail-section" id="solutions-pillars">
            <div className="IndustryDetail-container">
              <ScrollReveal direction="up">
                <div className="IndustryDetail-sectionHeader">
                  <span className="IndustryDetail-eyebrow">
                    DELIVERY CAPABILITIES
                  </span>
                  <h2 className="IndustryDetail-sectionTitle">
                    Specialized Workforce Solutions
                  </h2>
                  <p className="IndustryDetail-sectionDesc">
                    Tailored engagement models designed to meet strict regulatory,
                    compliance, and velocity requirements in {title}.
                  </p>
                </div>
              </ScrollReveal>

              <div className="IndustryDetail-solutionsGrid">
                {solutions.map((sol, index) => (
                  <ScrollReveal
                    key={index}
                    direction="up"
                    delay={(index % 3) * 0.08}
                  >
                    <div className="IndustryDetail-solutionCard group">
                      <div className="IndustryDetail-solutionIcon">
                        <span className="material-symbols-outlined text-[28px]">
                          {sol.icon || 'star'}
                        </span>
                      </div>
                      <h3 className="IndustryDetail-solutionTitle">
                        {sol.title}
                      </h3>
                      <p className="IndustryDetail-solutionDesc">
                        {sol.desc}
                      </p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Specialized Technology Domains & Tech Stacks */}
        {domains && domains.length > 0 && (
          <section className="IndustryDetail-section IndustryDetail-section--alt" id="tech-domains">
            <div className="IndustryDetail-container">
              <ScrollReveal direction="up">
                <div className="IndustryDetail-sectionHeader">
                  <span className="IndustryDetail-eyebrow">
                    TECHNICAL ARCHITECTURE
                  </span>
                  <h2 className="IndustryDetail-sectionTitle">
                    Specialized Technology Domains
                  </h2>
                  <p className="IndustryDetail-sectionDesc">
                    Our pre-screened engineering talent covers the complete spectrum of
                    modern cloud, distributed architectures, and domain-specific stacks.
                  </p>
                </div>
              </ScrollReveal>

              <div className="IndustryDetail-domainsGrid">
                {domains.map((dom, index) => (
                  <ScrollReveal
                    key={index}
                    direction="up"
                    delay={(index % 2) * 0.08}
                  >
                    <div className="IndustryDetail-domainCard">
                      <div className="IndustryDetail-domainHeader">
                        <span className="material-symbols-outlined text-blue-600 text-[22px]">
                          developer_board
                        </span>
                        <h3 className="IndustryDetail-domainTitle">
                          {dom.name}
                        </h3>
                      </div>
                      <div className="IndustryDetail-skillTags">
                        {(dom.skills || []).map((skill, sIdx) => (
                          <span key={sIdx} className="IndustryDetail-skillTag">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Regulatory Compliance & Statutory Standards */}
        {compliance && compliance.length > 0 && (
          <section className="IndustryDetail-section" id="compliance-stack">
            <div className="IndustryDetail-container">
              <ScrollReveal direction="up">
                <div className="IndustryDetail-complianceBanner">
                  <div className="IndustryDetail-complianceLeft">
                    <span className="material-symbols-outlined text-green-500 text-[36px]">
                      verified_user
                    </span>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">
                        Mandatory Regulatory &amp; Compliance Stacks
                      </h3>
                      <p className="text-slate-300 text-sm max-w-xl">
                        Every deployment pod is thoroughly vetted for jurisdictional
                        compliance, data sovereignty, and security frameworks relevant to{' '}
                        {title}.
                      </p>
                    </div>
                  </div>
                  <div className="IndustryDetail-complianceBadges">
                    {compliance.map((item, cIdx) => (
                      <span key={cIdx} className="IndustryDetail-compliancePill">
                        <span className="material-symbols-outlined text-[15px] text-green-400">
                          check_circle
                        </span>
                        <span>{item}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </section>
        )}

        {/* 5-Step Engagement Methodology */}
        <section className="IndustryDetail-section IndustryDetail-section--alt" id="methodology">
          <div className="IndustryDetail-container">
            <ScrollReveal direction="up">
              <div className="IndustryDetail-sectionHeader">
                <span className="IndustryDetail-eyebrow">THE THINKWIRES METHOD</span>
                <h2 className="IndustryDetail-sectionTitle">
                  5-Step Talent Deployment Pipeline
                </h2>
                <p className="IndustryDetail-sectionDesc">
                  How we accelerate time-to-productivity from intake to sprint execution in
                  under 72 hours.
                </p>
              </div>
            </ScrollReveal>

            <div className="IndustryDetail-methodologySteps">
              <div className="IndustryDetail-stepCard">
                <span className="IndustryDetail-stepNum">01</span>
                <h4 className="IndustryDetail-stepTitle">Discovery &amp; Scoping</h4>
                <p className="IndustryDetail-stepDesc">
                  Comprehensive alignment on technical stack, regulatory constraints, sprint
                  cadence, and budget boundaries.
                </p>
              </div>

              <div className="IndustryDetail-stepCard">
                <span className="IndustryDetail-stepNum">02</span>
                <h4 className="IndustryDetail-stepTitle">Architect Technical Vetting</h4>
                <p className="IndustryDetail-stepDesc">
                  Live whiteboarding, algorithmic assessments, and domain code reviews led by
                  senior engineering practitioners.
                </p>
              </div>

              <div className="IndustryDetail-stepCard">
                <span className="IndustryDetail-stepNum">03</span>
                <h4 className="IndustryDetail-stepTitle">Shortlist Presentation</h4>
                <p className="IndustryDetail-stepDesc">
                  Within 48 hours, receive curated candidate dossiers featuring verified coding
                  evaluations and notice periods.
                </p>
              </div>

              <div className="IndustryDetail-stepCard">
                <span className="IndustryDetail-stepNum">04</span>
                <h4 className="IndustryDetail-stepTitle">Frictionless Onboarding</h4>
                <p className="IndustryDetail-stepDesc">
                  Immediate integration into your Slack, Jira, and Git repositories with full EOR
                  and payroll compliance.
                </p>
              </div>

              <div className="IndustryDetail-stepCard">
                <span className="IndustryDetail-stepNum">05</span>
                <h4 className="IndustryDetail-stepTitle">Continuous Scaling</h4>
                <p className="IndustryDetail-stepDesc">
                  Ongoing sprint velocity monitoring, performance reviews, and elastic pod
                  adjustments as project needs evolve.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Active Domain Openings Section */}
        <section className="IndustryDetail-section" id="active-openings">
          <div className="IndustryDetail-container">
            <ScrollReveal direction="up">
              <div className="IndustryDetail-sectionHeader">
                <span className="IndustryDetail-eyebrow">CAREER OPPORTUNITIES</span>
                <h2 className="IndustryDetail-sectionTitle">
                  Active Openings in {title}
                </h2>
                <p className="IndustryDetail-sectionDesc">
                  Explore current specialized mandates and deploy with top-tier technology
                  clients and enterprises.
                </p>
              </div>
            </ScrollReveal>

            {matchedJobs.length > 0 ? (
              <div className="IndustryDetail-jobsGrid">
                {matchedJobs.slice(0, 4).map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onApplyClick={(j) => setSelectedJobForApply(j)}
                    onViewSpecClick={(j) => setSelectedJobForSpec(j)}
                  />
                ))}
              </div>
            ) : (
              <div className="IndustryDetail-emptyJobs">
                <span className="material-symbols-outlined text-[40px] text-blue-500 mb-2">
                  playlist_add_check
                </span>
                <h3 className="text-lg font-bold text-slate-800 mb-1">
                  New Positions Sourcing Daily
                </h3>
                <p className="text-slate-500 text-sm max-w-md text-center mb-4">
                  We are constantly opening new engineering mandates in {title}. Submit your profile to join our verified talent bench.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedJobForApply({
                      jobId: 'general-intake',
                      title: `${title} Specialized Candidate Pool`,
                      department: title,
                      location: 'Remote / India / USA',
                    })
                  }
                  className="btn btn-primary"
                >
                  Join Talent Bench
                </button>
              </div>
            )}

            <div className="flex justify-center mt-8">
              <Link
                to={`/jobs?industry=${slug}`}
                className="btn btn-outline"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.75rem',
                  borderRadius: '9999px',
                }}
              >
                <span>Browse All Active Mandates</span>
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Sector Navigation Strip: Explore Other Industries */}
        <section className="IndustryDetail-section IndustryDetail-section--alt">
          <div className="IndustryDetail-container">
            <div className="IndustryDetail-otherHeader">
              <h3 className="text-lg font-bold text-slate-800">
                Explore Other Specialized Industry Practices
              </h3>
              <Link
                to="/industries"
                className="text-blue-600 font-semibold text-sm hover:underline flex items-center gap-1"
              >
                <span>View All 11 Sectors</span>
                <span className="material-symbols-outlined text-[16px]">
                  arrow_forward
                </span>
              </Link>
            </div>
            <div className="IndustryDetail-otherChips">
              {allIndustries
                .filter((ind) => ind.slug !== slug)
                .map((ind) => (
                  <Link
                    key={ind.slug}
                    to={`/industries/${ind.slug}`}
                    className="IndustryDetail-otherChip"
                  >
                    <span className="material-symbols-outlined text-[16px] text-blue-600">
                      {ind.icon || 'terminal'}
                    </span>
                    <span>{ind.title}</span>
                  </Link>
                ))}
            </div>
          </div>
        </section>

        {/* Customer Hiring Form - Placed directly above Footer */}
        <div id="contact-form">
          <CTA />
        </div>
      </main>

      <Footer />

      {/* Quick Apply Candidate Modal */}
      {selectedJobForApply && (
        <QuickApplyModal
          isOpen={!!selectedJobForApply}
          onClose={() => setSelectedJobForApply(null)}
          jobData={selectedJobForApply}
        />
      )}

      {/* Job Spec Modal */}
      {selectedJobForSpec && (
        <JobSpecModal
          isOpen={!!selectedJobForSpec}
          onClose={() => setSelectedJobForSpec(null)}
          job={selectedJobForSpec}
          onApplyClick={(j) => {
            setSelectedJobForSpec(null);
            setSelectedJobForApply(j);
          }}
        />
      )}
    </div>
  );
};

export default IndustryDetailPage;
