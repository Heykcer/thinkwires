import React from 'react';

const CareersHero = ({ totalJobsCount = 0 }) => {
  const scrollToJobs = (e) => {
    e.preventDefault();
    const target = document.getElementById('career-opportunities');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToLife = (e) => {
    e.preventDefault();
    const target = document.getElementById('life-at-thinkwires');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="CR-Hero-root">
      <div className="CR-Hero-ambientBloom CR-Hero-ambientBloom--1" aria-hidden="true" />
      <div className="CR-Hero-ambientBloom CR-Hero-ambientBloom--2" aria-hidden="true" />

      <div className="CR-Container">
        <div className="CR-Hero-grid">
          {/* Text Column */}
          <div className="CR-Hero-textCol">
            <div className="CR-Hero-eyebrow">
              <span className="CR-Hero-pulse" />
              <span>THINKWIRES GLOBAL TALENT CLOUD • CAREERS</span>
            </div>

            <h1 className="CR-Hero-title">
              Architect Your Future on a{' '}
              <span className="CR-Hero-gradientText">Global Engineering</span> Stage.
            </h1>

            <p className="CR-Hero-subtitle">
              Join a high-velocity technology collective delivering mission-critical cloud,
              AI, and enterprise solutions for Fortune 500 innovators across India, the US,
              and Canada.
            </p>

            <div className="CR-Hero-ctaGroup">
              <a
                href="#career-opportunities"
                onClick={scrollToJobs}
                className="CR-Btn CR-Btn--primary"
              >
                <span>Explore Open Roles</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </svg>
              </a>

              <a
                href="#life-at-thinkwires"
                onClick={scrollToLife}
                className="CR-Btn CR-Btn--secondary"
              >
                <span>Life at ThinkWires</span>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </a>
            </div>

            {/* Quick Credentials Strip */}
            <div className="CR-Hero-metricsStrip">
              <div className="CR-Hero-metricItem">
                <span className="CR-Hero-metricVal">
                  {totalJobsCount > 0 ? `${totalJobsCount}+` : 'Active'}
                </span>
                <span className="CR-Hero-metricLabel">Live Verified Openings</span>
              </div>
              <div className="CR-Hero-metricDivider" />
              <div className="CR-Hero-metricItem">
                <span className="CR-Hero-metricVal">3</span>
                <span className="CR-Hero-metricLabel">Global Hubs (IN, US, CA)</span>
              </div>
              <div className="CR-Hero-metricDivider" />
              <div className="CR-Hero-metricItem">
                <span className="CR-Hero-metricVal">98%</span>
                <span className="CR-Hero-metricLabel">Team Satisfaction Index</span>
              </div>
            </div>
          </div>

          {/* Visual Column */}
          <div className="CR-Hero-visualCol">
            <div className="CR-Hero-cardFrame">
              <div className="CR-Hero-imageWrapper">
                <img
                  src="/images/about-philosophy.jpg"
                  alt="ThinkWires cross-functional engineering team"
                  className="CR-Hero-mainPhoto"
                  loading="eager"
                />
                <div className="CR-Hero-scrim" />
              </div>

              {/* Floating Verified Badge */}
              <div className="CR-Hero-floatingPill">
                <div className="CR-Hero-pillIcon">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#1551D1"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <div className="CR-Hero-pillTitle">Borderless Talent Pods</div>
                  <div className="CR-Hero-pillSub">India • United States • Canada</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CareersHero;
