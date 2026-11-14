import React from 'react';
import { Link } from 'react-router-dom';

const CareersClosingCTA = ({ onDropResumeClick }) => {
  const scrollToJobs = (e) => {
    e.preventDefault();
    const target = document.getElementById('career-opportunities');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="CR-ClosingCTA-root">
      <div className="CR-Container">
        <div className="CR-ClosingCard">
          <div className="CR-ClosingCard-bloom" aria-hidden="true" />
          <div className="CR-ClosingCard-content">
            <span className="CR-ClosingCard-pill">START YOUR APPLICATION</span>
            <h2 className="CR-ClosingCard-title">Your Next Chapter Starts Here.</h2>
            <p className="CR-ClosingCard-desc">
              Be part of a team that values innovation, collaboration, continuous learning,
              and meaningful work. Explore live enterprise opportunities and shape the future
              of global software engineering with ThinkWires.
            </p>

            <div className="CR-ClosingCard-actions">
              <a
                href="#career-opportunities"
                onClick={scrollToJobs}
                className="CR-Btn CR-Btn--white"
              >
                <span>Explore Open Positions</span>
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
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>

              <Link to="/contact" className="CR-Btn CR-Btn--frosted">
                <span>Contact Our Team</span>
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
              </Link>

              {onDropResumeClick && (
                <button
                  type="button"
                  onClick={onDropResumeClick}
                  className="CR-Btn CR-Btn--outline"
                >
                  <span>Drop Your CV / Join Bench</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CareersClosingCTA;
