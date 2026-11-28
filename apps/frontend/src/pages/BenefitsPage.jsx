import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import {
  EMPLOYEE_BENEFITS,
  EMPLOYEE_CENTRIC_CULTURE,
  EMPLOYEE_TESTIMONIALS,
} from '../data/teamData';

const BenefitIcon = ({ type }) => {
  switch (type) {
    case 'wallet':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
        </svg>
      );
    case 'laptop':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="12" rx="2" />
          <line x1="2" y1="20" x2="22" y2="20" />
        </svg>
      );
    case 'graduation':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      );
    case 'shield':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case 'trending':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      );
    case 'compass':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      );
    case 'globe':
    default:
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
  }
};

const BenefitsPage = () => {
  return (
    <div className="BenefitsPage-wrapper">
      <Helmet>
        <title>Benefits Working with Thinkwires | Employee Benefits &amp; Well-Being</title>
        <meta
          name="description"
          content="Explore employee benefits at Thinkwires: reliable compensation, work-life harmony, statutory benefits (EPF, ESIC, EPS), continuous learning, and global career exposure."
        />
        <meta
          property="og:title"
          content="Benefits Working with Thinkwires | Employee Benefits & Well-Being"
        />
        <meta
          property="og:description"
          content="Discover how Thinkwires supports financial stability, work-life harmony, career development, and an employee-centric culture."
        />
        <meta property="og:image" content="https://thinkwires.com/og-image.jpg" />
      </Helmet>

      <Navbar />

      <main style={{ minHeight: 'calc(100vh - 400px)' }}>
        <section id="benefits-page" className="TW-LifePage-root">
          <div className="TW-Life-ambientBloom TW-Life-ambientBloom--top" aria-hidden="true" />
          <div className="TW-Life-ambientBloom TW-Life-ambientBloom--mid" aria-hidden="true" />

          {/* =================================================================
              1. HERO SECTION
              ================================================================= */}
          <header className="TW-BenefitsHero-section">
            <div className="TW-Life-container">
              <div className="TW-BenefitsHero-inner">
                <div className="TW-SectionPill TW-LifeHero-pill">
                  <span className="TW-LifeHero-pulseIndicator" />
                  <span>LIFE AT THINKWIRES • BENEFITS</span>
                </div>

                <h1 className="TW-BenefitsHero-title">
                  Benefits Working with{' '}
                  <span className="TW-LifeHero-gradientText">Thinkwires</span>
                </h1>

                <p className="TW-BenefitsHero-subtitle">
                  We believe great careers thrive on financial stability, work-life harmony,
                  statutory security, and continuous learning. Discover how we support our
                  people across India and international organizations.
                </p>

                <div className="TW-BenefitsHero-actions">
                  <Link to="/jobs" className="TW-Life-primaryBtn">
                    <span>Explore Open Positions</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                  <Link to="/life-at-thinkwires" className="TW-Life-secondaryBtn">
                    <span>Life at Thinkwires</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </header>

          {/* =================================================================
              2. CORE BENEFITS GRID (7 Benefits from DOCX)
              ================================================================= */}
          <section className="TW-BenefitsSection-root">
            <div className="TW-Life-container">
              <div className="TW-SectionHeader text-center">
                <span className="TW-SectionPill">EMPLOYEE BENEFITS &amp; WELL-BEING</span>
                <h2 className="TW-SectionTitle">Everything You Need to Thrive</h2>
                <p className="TW-SectionSubtitle">
                  From on-time compensation and statutory social security to personalized career
                  guidance and global exposure.
                </p>
              </div>

              <div className="TW-BenefitsGrid-container">
                {EMPLOYEE_BENEFITS.map((benefit, index) => {
                  const isLastOdd =
                    EMPLOYEE_BENEFITS.length % 3 === 1 && index === EMPLOYEE_BENEFITS.length - 1;
                  return (
                    <div
                      key={benefit.id}
                      className={`TW-BenefitCard-root${isLastOdd ? ' TW-BenefitCard-root--wide' : ''}`}
                    >
                      <div className="TW-BenefitCard-top">
                        <div className="TW-BenefitCard-iconBox">
                          <BenefitIcon type={benefit.icon} />
                        </div>
                        <span className="TW-BenefitCard-badge">{benefit.badge}</span>
                      </div>
                      <span className="TW-BenefitCard-tag">{benefit.tag}</span>
                      <h3 className="TW-BenefitCard-title">{benefit.title}</h3>
                      <p className="TW-BenefitCard-desc">{benefit.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* =================================================================
              3. EMPLOYEE-CENTRIC CULTURE (4 Pillars from DOCX)
              ================================================================= */}
          <section className="TW-BenefitsCulture-section">
            <div className="TW-Life-container">
              <div className="TW-SectionHeader text-center">
                <span className="TW-SectionPill">PEOPLE-FIRST PHILOSOPHY</span>
                <h2 className="TW-SectionTitle">
                  How Thinkwires Creates an Employee-Centric Culture
                </h2>
                <p className="TW-SectionSubtitle">
                  Four core commitments that guide how we communicate, invest in growth,
                  recognize achievements, and act on feedback.
                </p>
              </div>

              <div className="TW-BenefitsCulture-grid">
                {EMPLOYEE_CENTRIC_CULTURE.map((pillar) => (
                  <article key={pillar.id} className="TW-BenefitsCulture-card">
                    <div className="TW-BenefitsCulture-num">{pillar.number}</div>
                    <h3 className="TW-BenefitsCulture-title">{pillar.title}</h3>
                    <p className="TW-BenefitsCulture-desc">{pillar.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {/* =================================================================
              4. EMPLOYEE TESTIMONIALS (4 Stories from DOCX)
              ================================================================= */}
          <section className="TW-BenefitsTestimonials-section">
            <div className="TW-Life-container">
              <div className="TW-SectionHeader text-center">
                <span className="TW-SectionPill">VOICES OF THINKWIRES</span>
                <h2 className="TW-SectionTitle">Employee Testimonials</h2>
                <p className="TW-SectionSubtitle">
                  Hear directly from our consultants, account managers, and HR specialists about
                  their growth and day-to-day experience at Thinkwires.
                </p>
              </div>

              <div className="TW-BenefitsTestimonials-grid">
                {EMPLOYEE_TESTIMONIALS.map((item) => (
                  <blockquote key={item.id} className="TW-BenefitsTestimonial-card">
                    <div className="TW-BenefitsTestimonial-quoteMark" aria-hidden="true">
                      &ldquo;
                    </div>
                    <p className="TW-BenefitsTestimonial-quote">{item.quote}</p>
                    <footer className="TW-BenefitsTestimonial-author">
                      <div className="TW-BenefitsTestimonial-avatar" aria-hidden="true">
                        {item.initials}
                      </div>
                      <div>
                        <div className="TW-BenefitsTestimonial-name">{item.name}</div>
                        <div className="TW-BenefitsTestimonial-role">{item.role}</div>
                      </div>
                    </footer>
                  </blockquote>
                ))}
              </div>
            </div>
          </section>

          {/* =================================================================
              5. CLOSING CTA
              ================================================================= */}
          <section className="TW-ClosingCTA-section">
            <div className="TW-Life-container">
              <div className="TW-ClosingCTA-card">
                <div className="TW-ClosingCTA-aura" aria-hidden="true" />
                <div className="TW-ClosingCTA-content">
                  <span className="TW-ClosingCTA-pill">CAREER OPPORTUNITIES</span>
                  <h2 className="TW-ClosingCTA-title">Ready to Grow with Thinkwires?</h2>
                  <p className="TW-ClosingCTA-desc">
                    Join a workplace built around transparency, continuous learning, and meaningful
                    global opportunities. Explore open roles or connect with our team today.
                  </p>

                  <div className="TW-ClosingCTA-actions">
                    <Link to="/jobs" className="TW-ClosingCTA-btnPrimary">
                      <span>Explore Open Positions</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </Link>

                    <Link to="/contact" className="TW-ClosingCTA-btnSecondary">
                      <span>Contact Our Team</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BenefitsPage;
