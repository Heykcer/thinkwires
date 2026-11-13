import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';

const GALLERY_IMAGES = [
  {
    id: 1,
    title: 'Cross-Functional Architecture Review',
    category: 'Engineering & Collaboration',
    caption:
      'Engineers and domain leads collaborate on high-scale cloud and microservices architectures in our modern workspace.',
    src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    span: 'large',
  },
  {
    id: 2,
    title: 'Thinkwires Technology Hub Team',
    category: 'Workplace Community',
    caption:
      'Our multidisciplinary team exchanging technical insights and client delivery benchmarks during weekly syncs.',
    src: '/images/about-philosophy.jpg',
    span: 'tall',
  },
  {
    id: 3,
    title: 'Next-Gen Talent Campus Drive',
    category: 'Learning & Cohorts',
    caption:
      'Selecting high-potential graduate talent across Cloud and Full-Stack cohorts during our university engagement drives.',
    src: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    span: 'standard',
  },
  {
    id: 4,
    title: 'Distributed Delivery & Pair Programming',
    category: 'Technical Excellence',
    caption:
      'Technical specialists and architects solving distributed engineering challenges with international enterprise clients.',
    src: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80',
    span: 'standard',
  },
  {
    id: 5,
    title: 'CSR & Environmental Sustainability',
    category: 'Social Impact',
    caption:
      'Combining enterprise consulting with purposeful community initiatives in healthcare, education, and tree planting.',
    src: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80',
    span: 'wide',
  },
];

const CULTURE_PILLARS = [
  {
    id: 'collab',
    title: 'Collaboration',
    subtitle: 'Cross-Functional Teamwork',
    description:
      'Multidisciplinary pods uniting recruitment specialists, solution architects, and engineering managers to deliver cohesive solutions across global clients.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    badge: 'Connected Pods',
  },
  {
    id: 'tech',
    title: 'Technology & Innovation',
    subtitle: 'Digital Transformation Core',
    description:
      'Deep domain focus across AI pipelines, Cloud Infrastructure (AWS, Azure, GCP), Data Engineering, and mission-critical enterprise systems.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
    badge: 'Modern Tech Stack',
  },
  {
    id: 'global',
    title: 'Global Perspectives',
    subtitle: 'International Corridors',
    description:
      'Bridging India-based technology delivery centers with forward-looking enterprise mandates across North America, Europe, and Asia-Pacific.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
    badge: 'Cross-Border Impact',
  },
  {
    id: 'growth',
    title: 'Growth & Learning',
    subtitle: 'Continuous Upskilling',
    description:
      'Encouraging technical mastery through architectural peer reviews, cloud certification sponsorships, hackathons, and real-world project exposure.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2v20" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        <polyline points="15 3 20 8 15 13" />
      </svg>
    ),
    badge: 'Skill Mastery',
  },
];

const LifeAtThinkwires = () => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Keyboard accessibility for lightbox
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        setSelectedPhoto(null);
      }
    },
    [setSelectedPhoto]
  );

  useEffect(() => {
    if (selectedPhoto) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedPhoto, handleKeyDown]);

  const scrollToCultureHighlights = (e) => {
    e.preventDefault();
    const target = document.getElementById('culture-highlights');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToJobListings = (e) => {
    const openingsSection = document.getElementById('openings') || document.querySelector('.FeaturedPositions-container') || document.querySelector('.JobSearch-container');
    if (openingsSection) {
      e.preventDefault();
      openingsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section id="life-at-thinkwires" className="TW-Life-section">
      <div className="TW-Life-container">
        {/* ===================================================================
            A. Culture Introduction / Hero
            =================================================================== */}
        <div className="TW-Life-heroRow">
          <div className="TW-Life-heroContent">
            <div className="TW-Life-eyebrowBadge">
              <span className="TW-Life-pulseDot" />
              <span>LIFE AT THINKWIRES • WORKPLACE &amp; CULTURE</span>
            </div>

            <h2 className="TW-Life-mainHeading">
              Life at <span className="TW-Life-gradientText">Thinkwires</span>
            </h2>

            <p className="TW-Life-subtitle">
              More Than Work. A Culture of Innovation, Collaboration and Growth.
            </p>

            <p className="TW-Life-description">
              Life at Thinkwires reflects the people, teams and experiences behind
              our work. As a global consulting, technology services and digital
              transformation company, we bring together different perspectives,
              expertise and ideas to create meaningful outcomes.
            </p>

            <div className="TW-Life-heroActionRow">
              <a
                href="#culture-highlights"
                onClick={scrollToCultureHighlights}
                className="TW-Life-btnPrimary"
              >
                <span>Explore Our Culture</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </svg>
              </a>

              <Link
                to="/jobs"
                onClick={scrollToJobListings}
                className="TW-Life-btnSecondary"
              >
                <span>View Open Positions</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="TW-Life-heroVisual">
            <div className="TW-Life-imageCard">
              <img
                src="/images/about-philosophy.jpg"
                alt="Thinkwires Engineering Team Hub"
                className="TW-Life-heroImage"
                loading="eager"
              />
              <div className="TW-Life-imageBackdropGlow" />

              <div className="TW-Life-floatingInfoPill">
                <div className="TW-Life-floatingIconBox">
                  <svg
                    width="16"
                    height="16"
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
                  <div className="TW-Life-floatingPillTitle">
                    Multidisciplinary Engineering Pods
                  </div>
                  <div className="TW-Life-floatingPillSub">
                    Collaborating across India, USA &amp; Canada
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================
            B. Workplace Experience (Editorial Narrative Grid)
            =================================================================== */}
        <div className="TW-Life-experienceSection">
          <div className="TW-Life-sectionHeader text-center">
            <span className="TW-Life-sectionPill">THE WORKPLACE EXPERIENCE</span>
            <h3 className="TW-Life-sectionTitle">
              Where Engineering Meets People-First Culture
            </h3>
            <p className="TW-Life-sectionSubtitle">
              A work environment designed for autonomy, shared technical standards,
              and purposeful collaboration.
            </p>
          </div>

          <div className="TW-Life-experienceGrid">
            <div className="TW-Life-experienceCard">
              <div className="TW-Life-expImgWrapper">
                <img
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
                  alt="Team collaboration in modern office"
                  className="TW-Life-expImg"
                  loading="lazy"
                />
                <span className="TW-Life-expTag">Collaborative Cadence</span>
              </div>
              <div className="TW-Life-expBody">
                <h4 className="TW-Life-expTitle">
                  Cross-Functional Problem Solving
                </h4>
                <p className="TW-Life-expText">
                  Teams interact across technical disciplines to evaluate
                  architectures, solve complex talent allocation challenges, and
                  refine digital solutions with mutual accountability.
                </p>
              </div>
            </div>

            <div className="TW-Life-experienceCard">
              <div className="TW-Life-expImgWrapper">
                <img
                  src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=80"
                  alt="Technology discussion and code review"
                  className="TW-Life-expImg"
                  loading="lazy"
                />
                <span className="TW-Life-expTag">Technical Standards</span>
              </div>
              <div className="TW-Life-expBody">
                <h4 className="TW-Life-expTitle">
                  Modern Engineering &amp; Transparency
                </h4>
                <p className="TW-Life-expText">
                  Open code audits, regular knowledge exchanges, and transparent
                  metrics ensure our engineering teams grow together while
                  delivering top-tier consulting value.
                </p>
              </div>
            </div>

            <div className="TW-Life-experienceCard">
              <div className="TW-Life-expImgWrapper">
                <img
                  src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80"
                  alt="Environmental sustainability and community engagement"
                  className="TW-Life-expImg"
                  loading="lazy"
                />
                <span className="TW-Life-expTag">Community &amp; CSR</span>
              </div>
              <div className="TW-Life-expBody">
                <h4 className="TW-Life-expTitle">
                  Purposeful Social Commitment
                </h4>
                <p className="TW-Life-expText">
                  Beyond code and delivery, our employees actively champion community
                  education, regional health camps, and environmental stewardship
                  such as our tree plantation drives.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================================
            C. What Defines Life at Thinkwires (Four Distinct Pillars)
            =================================================================== */}
        <div id="culture-highlights" className="TW-Life-pillarsSection">
          <div className="TW-Life-sectionHeader text-center">
            <span className="TW-Life-sectionPill">CORE CULTURAL FOUNDATIONS</span>
            <h3 className="TW-Life-sectionTitle">
              What Defines Life at Thinkwires
            </h3>
            <p className="TW-Life-sectionSubtitle">
              Four grounded principles that guide how our teams collaborate, learn,
              and build everyday.
            </p>
          </div>

          <div className="TW-Life-pillarsGrid">
            {CULTURE_PILLARS.map((pillar) => (
              <div key={pillar.id} className="TW-Life-pillarCard">
                <div className="TW-Life-pillarIconWrapper">
                  {pillar.icon}
                </div>
                <span className="TW-Life-pillarBadge">{pillar.badge}</span>
                <h4 className="TW-Life-pillarTitle">{pillar.title}</h4>
                <h5 className="TW-Life-pillarSubtitle">{pillar.subtitle}</h5>
                <p className="TW-Life-pillarDesc">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===================================================================
            D. Visual Culture Gallery (Asymmetric Masonry Grid + Lightbox)
            =================================================================== */}
        <div className="TW-Life-gallerySection">
          <div className="TW-Life-galleryHeaderRow">
            <div>
              <span className="TW-Life-sectionPill">AUTHENTIC MOMENTS</span>
              <h3 className="TW-Life-sectionTitle">Visual Culture Gallery</h3>
              <p className="TW-Life-sectionSubtitle" style={{ marginBottom: 0 }}>
                A glimpse into our teams, workplace interactions, and learning environments.
              </p>
            </div>
            <div className="TW-Life-galleryHint">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
              <span>Click image to view in lightbox</span>
            </div>
          </div>

          <div className="TW-Life-galleryGrid">
            {GALLERY_IMAGES.map((img) => (
              <div
                key={img.id}
                className={`TW-Life-galleryItem TW-Life-span-${img.span}`}
                onClick={() => setSelectedPhoto(img)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedPhoto(img);
                  }
                }}
                aria-label={`Open photo: ${img.title}`}
              >
                <img
                  src={img.src}
                  alt={img.title}
                  className="TW-Life-galleryImg"
                  loading="lazy"
                />
                <div className="TW-Life-galleryOverlay">
                  <span className="TW-Life-galleryTag">{img.category}</span>
                  <h4 className="TW-Life-galleryTitle">{img.title}</h4>
                  <span className="TW-Life-galleryPrompt">
                    <span>Enlarge photo</span>
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
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===================================================================
            E. Closing CTA
            =================================================================== */}
        <div className="TW-Life-closingSection">
          <div className="TW-Life-closingCard">
            <span className="TW-Life-closingPill">JOIN THE TEAM</span>
            <h3 className="TW-Life-closingTitle">Be Part of Our Journey</h3>
            <p className="TW-Life-closingDescription">
              Discover opportunities to grow, collaborate and contribute to the
              future of technology with Thinkwires.
            </p>

            <div className="TW-Life-closingActions">
              <Link
                to="/jobs"
                onClick={scrollToJobListings}
                className="TW-Life-btnPrimary"
              >
                <span>Explore Career Opportunities</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>

              <Link to="/blog" className="TW-Life-btnSecondary">
                <span>Read Technology Articles</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================
          Photo Lightbox Modal
          =================================================================== */}
      {selectedPhoto && (
        <div
          className="TW-Life-lightboxBackdrop"
          onClick={() => setSelectedPhoto(null)}
          role="dialog"
          aria-modal="true"
          aria-label={selectedPhoto.title}
        >
          <div
            className="TW-Life-lightboxContent"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="TW-Life-lightboxCloseBtn"
              onClick={() => setSelectedPhoto(null)}
              aria-label="Close lightbox"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="TW-Life-lightboxImgWrapper">
              <img
                src={selectedPhoto.src}
                alt={selectedPhoto.title}
                className="TW-Life-lightboxImg"
              />
            </div>

            <div className="TW-Life-lightboxFooter">
              <span className="TW-Life-lightboxTag">
                {selectedPhoto.category}
              </span>
              <h4 className="TW-Life-lightboxTitle">{selectedPhoto.title}</h4>
              <p className="TW-Life-lightboxCaption">{selectedPhoto.caption}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default LifeAtThinkwires;
