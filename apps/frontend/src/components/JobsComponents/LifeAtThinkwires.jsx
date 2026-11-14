import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  TEAM_DEPARTMENTS,
  TEAM_MEMBERS,
  CULTURE_THEMES,
  EMPLOYEE_EXPERIENCE_ITEMS,
  GALLERY_ITEMS,
} from '../../data/teamData';

const LifeAtThinkwires = () => {
  // Department filter state
  const [activeDepartment, setActiveDepartment] = useState('all');

  // Interactive profile modal state
  const [selectedMember, setSelectedMember] = useState(null);

  // Gallery lightbox state
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(null);

  // Filter team members based on department
  const filteredMembers = useMemo(() => {
    if (activeDepartment === 'all') return TEAM_MEMBERS;
    return TEAM_MEMBERS.filter(
      (m) =>
        m.department === activeDepartment ||
        (m.additionalDepartments && m.additionalDepartments.includes(activeDepartment))
    );
  }, [activeDepartment]);

  // Gallery active item
  const activeGalleryItem =
    activeGalleryIndex !== null ? GALLERY_ITEMS[activeGalleryIndex] : null;

  // Gallery navigation
  const handlePrevGallery = useCallback(() => {
    setActiveGalleryIndex((prev) =>
      prev === null ? null : prev === 0 ? GALLERY_ITEMS.length - 1 : prev - 1
    );
  }, []);

  const handleNextGallery = useCallback(() => {
    setActiveGalleryIndex((prev) =>
      prev === null ? null : (prev + 1) % GALLERY_ITEMS.length
    );
  }, []);

  // Global Keyboard event handler for modals & lightbox
  const handleGlobalKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        setSelectedMember(null);
        setActiveGalleryIndex(null);
      } else if (activeGalleryIndex !== null) {
        if (e.key === 'ArrowLeft') {
          handlePrevGallery();
        } else if (e.key === 'ArrowRight') {
          handleNextGallery();
        }
      }
    },
    [activeGalleryIndex, handlePrevGallery, handleNextGallery]
  );

  useEffect(() => {
    const isModalOpen = selectedMember !== null || activeGalleryIndex !== null;
    if (isModalOpen) {
      window.addEventListener('keydown', handleGlobalKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedMember, activeGalleryIndex, handleGlobalKeyDown]);

  // Smooth scroll helpers
  const scrollToTeam = (e) => {
    e.preventDefault();
    const target = document.getElementById('team-showcase');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToCulture = (e) => {
    e.preventDefault();
    const target = document.getElementById('culture-experience');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToJobListings = (e) => {
    const openingsSection =
      document.getElementById('openings') ||
      document.querySelector('.FeaturedPositions-container') ||
      document.querySelector('.JobSearch-container');
    if (openingsSection) {
      e.preventDefault();
      openingsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section id="life-at-thinkwires" className="TW-LifePage-root">
      {/* Ambient background light gradients */}
      <div className="TW-Life-ambientBloom TW-Life-ambientBloom--top" aria-hidden="true" />
      <div className="TW-Life-ambientBloom TW-Life-ambientBloom--mid" aria-hidden="true" />

      {/* ===================================================================
          1. HERO SECTION: Meet the People Behind Thinkwires
          =================================================================== */}
      <header className="TW-LifeHero-section">
        <div className="TW-Life-container">
          <div className="TW-LifeHero-grid">
            {/* Left Content Column */}
            <div className="TW-LifeHero-textCol">
              <div className="TW-LifeHero-eyebrow">
                <span className="TW-LifeHero-pulseIndicator" />
                <span>LIFE AT THINKWIRES</span>
              </div>

              <h1 className="TW-LifeHero-title">
                Great People.{' '}
                <span className="TW-LifeHero-gradientText">Shared Vision.</span>{' '}
                Bigger Possibilities.
              </h1>

              <p className="TW-LifeHero-description">
                Discover the people, collaboration, and experiences that make Thinkwires
                more than just a workplace. We bring together talented individuals who
                learn, innovate, and build meaningful solutions together.
              </p>

              <div className="TW-LifeHero-ctaGroup">
                <a
                  href="#team-showcase"
                  onClick={scrollToTeam}
                  className="TW-Life-primaryBtn"
                >
                  <span>Meet Our Team</span>
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
                  href="#culture-experience"
                  onClick={scrollToCulture}
                  className="TW-Life-secondaryBtn"
                >
                  <span>Explore Our Culture</span>
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

              {/* Verified Trust Strip */}
              <div className="TW-LifeHero-trustRow">
                <div className="TW-LifeHero-trustItem">
                  <span className="TW-LifeHero-trustVal">500+</span>
                  <span className="TW-LifeHero-trustLabel">Engineers &amp; Specialists</span>
                </div>
                <div className="TW-LifeHero-trustDivider" />
                <div className="TW-LifeHero-trustItem">
                  <span className="TW-LifeHero-trustVal">3</span>
                  <span className="TW-LifeHero-trustLabel">Global Corridors (IN, US, CA)</span>
                </div>
                <div className="TW-LifeHero-trustDivider" />
                <div className="TW-LifeHero-trustItem">
                  <span className="TW-LifeHero-trustVal">98%</span>
                  <span className="TW-LifeHero-trustLabel">Team Satisfaction</span>
                </div>
              </div>
            </div>

            {/* Right Visual Column: Multi-photo Editorial Composition */}
            <div className="TW-LifeHero-visualCol">
              <div className="TW-LifeHero-mosaicContainer">
                {/* Main Featured Team Photo */}
                <div className="TW-LifeHero-mainPhotoCard">
                  <img
                    src="/images/about-philosophy.jpg"
                    alt="Thinkwires multidisciplinary team meeting"
                    className="TW-LifeHero-mainImg"
                  />
                  <div className="TW-LifeHero-mainPhotoOverlay">
                    <span className="TW-LifeHero-tag">Engineering &amp; Culture Hub</span>
                    <h3 className="TW-LifeHero-cardHeadline">Thinkwires Technology Collective</h3>
                  </div>
                </div>

                {/* Staggered Floating Employee Avatars with Authentic Photos */}
                <div className="TW-LifeHero-floatingAvatarsCard">
                  <span className="TW-LifeHero-floatingLabel">Meet Leadership &amp; Engineering</span>
                  <div className="TW-LifeHero-avatarCluster">
                    <img
                      src="/images/team/ananya-mehta.jpg"
                      alt="Ananya Mehta"
                      className="TW-LifeHero-avatarThumb"
                      title="Ananya Mehta - CEO"
                    />
                    <img
                      src="/images/team/arjun-verma.jpg"
                      alt="Arjun Verma"
                      className="TW-LifeHero-avatarThumb"
                      title="Arjun Verma - CPO & CMO"
                    />
                    <img
                      src="/images/team/meera-iyer.jpg"
                      alt="Meera Iyer"
                      className="TW-LifeHero-avatarThumb"
                      title="Meera Iyer - Senior Director"
                    />
                    <img
                      src="/images/team/anju-balyan.jpg"
                      alt="Anju Balyan"
                      className="TW-LifeHero-avatarThumb"
                      title="Anju Balyan - Co-Founder"
                    />
                    <img
                      src="/images/team/naziya-husain.jpg"
                      alt="Naziya Husain"
                      className="TW-LifeHero-avatarThumb"
                      title="Naziya Husain - Founder Member"
                    />
                    <span className="TW-LifeHero-avatarMore">+100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ===================================================================
          2. MEET OUR TEAM: Main Highlight & Interactive Showcase
          =================================================================== */}
      <section id="team-showcase" className="TW-TeamSection-root">
        <div className="TW-Life-container">
          <div className="TW-SectionHeader text-center">
            <span className="TW-SectionPill">THE PEOPLE BEHIND THINKWIRES</span>
            <h2 className="TW-SectionTitle">Meet Our Team</h2>
            <p className="TW-SectionSubtitle">
              The engineers, leaders, and specialists shaping the future of global
              technology consulting. Click any team member to view their full profile.
            </p>
          </div>

          {/* Interactive Department Filters */}
          <div className="TW-TeamFilter-nav" role="tablist" aria-label="Department filters">
            {TEAM_DEPARTMENTS.map((dept) => {
              const isActive = activeDepartment === dept.id;
              const count =
                dept.id === 'all'
                  ? TEAM_MEMBERS.length
                  : TEAM_MEMBERS.filter(
                      (m) =>
                        m.department === dept.id ||
                        (m.additionalDepartments && m.additionalDepartments.includes(dept.id))
                    ).length;

              // Only show filter if members exist
              if (count === 0) return null;

              return (
                <button
                  key={dept.id}
                  role="tab"
                  aria-selected={isActive}
                  className={`TW-TeamFilter-btn ${isActive ? 'TW-TeamFilter-btn--active' : ''}`}
                  onClick={() => setActiveDepartment(dept.id)}
                >
                  <span>{dept.label}</span>
                  <span className="TW-TeamFilter-count">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Responsive Interactive Team Grid */}
          <div className="TW-TeamGrid-container">
            {filteredMembers.map((member) => (
              <article
                key={member.id}
                className="TW-TeamCard-root"
                onClick={() => setSelectedMember(member)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedMember(member);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`View profile for ${member.name}, ${member.designation}`}
              >
                {/* Photo & Badge Wrapper */}
                <div className="TW-TeamCard-photoWrapper">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="TW-TeamCard-photo"
                      loading="lazy"
                    />
                  ) : (
                    <div className="TW-TeamCard-photoFallback">
                      <span className="TW-TeamCard-fallbackInitials">
                        {member.avatarFallback}
                      </span>
                    </div>
                  )}

                  <span className="TW-TeamCard-deptBadge">
                    {member.departmentLabel}
                  </span>
                </div>

                {/* Card Body */}
                <div className="TW-TeamCard-body">
                  <div className="TW-TeamCard-header">
                    <h3 className="TW-TeamCard-name">{member.name}</h3>
                    <p className="TW-TeamCard-designation">{member.designation}</p>
                  </div>

                  <p className="TW-TeamCard-intro">{member.shortIntro}</p>

                  <div className="TW-TeamCard-footer">
                    <span className="TW-TeamCard-viewBtn">
                      <span>View Profile</span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </span>

                    {member.linkedin && (
                      <span
                        className="TW-TeamCard-linkedinIcon"
                        title="LinkedIn Profile Available"
                        aria-label="LinkedIn Profile"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================
          3. OUR CULTURE: Interactive Experience & Storytelling
          =================================================================== */}
      <section id="culture-experience" className="TW-CultureSection-root">
        <div className="TW-Life-container">
          <div className="TW-SectionHeader text-center">
            <span className="TW-SectionPill">CORE CULTURAL FOUNDATIONS</span>
            <h2 className="TW-SectionTitle">Our Culture in Action</h2>
            <p className="TW-SectionSubtitle">
              Five foundational pillars that shape how our people connect, build, and
              grow together across international technology mandates.
            </p>
          </div>

          <div className="TW-CultureGrid-container">
            {CULTURE_THEMES.map((theme, index) => {
              const isLarge = theme.aspect === 'wide';
              return (
                <div
                  key={theme.id}
                  className={`TW-CultureCard-root ${isLarge ? 'TW-CultureCard--wide' : 'TW-CultureCard--standard'}`}
                >
                  <div className="TW-CultureCard-imgWrapper">
                    <img
                      src={theme.image}
                      alt={theme.title}
                      className="TW-CultureCard-img"
                      loading="lazy"
                    />
                    <div className="TW-CultureCard-scrim" />
                  </div>

                  <div className="TW-CultureCard-content">
                    <span className="TW-CultureCard-badge">{theme.badge}</span>
                    <h3 className="TW-CultureCard-title">{theme.title}</h3>
                    <p className="TW-CultureCard-tagline">{theme.tagline}</p>
                    <p className="TW-CultureCard-desc">{theme.description}</p>

                    <div className="TW-CultureCard-chips">
                      {theme.highlights.map((h, i) => (
                        <span key={i} className="TW-CultureCard-chipItem">
                          ✓ {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================================================================
          4. EMPLOYEE EXPERIENCE: Alternating Visual Narrative
          =================================================================== */}
      <section className="TW-ExperienceSection-root">
        <div className="TW-Life-container">
          <div className="TW-SectionHeader text-center">
            <span className="TW-SectionPill">THE WORKPLACE EXPERIENCE</span>
            <h2 className="TW-SectionTitle">Designed for Growth, Autonomy &amp; Purpose</h2>
            <p className="TW-SectionSubtitle">
              We invest in environments that empower technical curiosity, shared
              ownership, and seamless global collaboration.
            </p>
          </div>

          <div className="TW-ExpTimeline-container">
            {EMPLOYEE_EXPERIENCE_ITEMS.map((item) => (
              <div
                key={item.id}
                className={`TW-ExpItem-row ${item.reverse ? 'TW-ExpItem-row--reverse' : ''}`}
              >
                {/* Visual Media Column */}
                <div className="TW-ExpItem-mediaCol">
                  <div className="TW-ExpItem-imgFrame">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="TW-ExpItem-img"
                      loading="lazy"
                    />
                    <div className="TW-ExpItem-statBadge">
                      <span className="TW-ExpItem-statNumber">{item.stat}</span>
                      <span className="TW-ExpItem-statLabel">{item.statLabel}</span>
                    </div>
                  </div>
                </div>

                {/* Text Description Column */}
                <div className="TW-ExpItem-textCol">
                  <span className="TW-ExpItem-tag">{item.tag}</span>
                  <h3 className="TW-ExpItem-title">{item.title}</h3>
                  <p className="TW-ExpItem-desc">{item.description}</p>

                  <ul className="TW-ExpItem-bulletList">
                    {item.bullets.map((bullet, idx) => (
                      <li key={idx} className="TW-ExpItem-bullet">
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
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================
          5. PHOTO GALLERY: Asymmetric Masonry Grid + Lightbox
          =================================================================== */}
      <section className="TW-GallerySection-root">
        <div className="TW-Life-container">
          <div className="TW-Gallery-headerRow">
            <div>
              <span className="TW-SectionPill">AUTHENTIC MOMENTS</span>
              <h2 className="TW-SectionTitle">Life at Thinkwires Gallery</h2>
              <p className="TW-SectionSubtitle" style={{ marginBottom: 0 }}>
                A glimpse into our workspaces, celebrations, technical discussions, and community initiatives.
              </p>
            </div>
            <div className="TW-Gallery-hint">
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
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
              <span>Click any image to view in fullscreen</span>
            </div>
          </div>

          <div className="TW-Gallery-grid">
            {GALLERY_ITEMS.map((photo, index) => (
              <div
                key={photo.id}
                className={`TW-GalleryCard-root ${photo.spanClass}`}
                onClick={() => setActiveGalleryIndex(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveGalleryIndex(index);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Open photo: ${photo.title}`}
              >
                <img
                  src={photo.src}
                  alt={photo.title}
                  className="TW-GalleryCard-img"
                  loading="lazy"
                />
                <div className="TW-GalleryCard-overlay">
                  <span className="TW-GalleryCard-category">{photo.category}</span>
                  <h4 className="TW-GalleryCard-title">{photo.title}</h4>
                  <span className="TW-GalleryCard-prompt">
                    <span>Enlarge photo</span>
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
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
      </section>

      {/* ===================================================================
          6. CLOSING CTA: Your Next Chapter Starts Here
          =================================================================== */}
      <section className="TW-ClosingCTA-section">
        <div className="TW-Life-container">
          <div className="TW-ClosingCTA-card">
            <div className="TW-ClosingCTA-aura" aria-hidden="true" />
            <div className="TW-ClosingCTA-content">
              <span className="TW-ClosingCTA-pill">CAREER OPPORTUNITIES</span>
              <h2 className="TW-ClosingCTA-title">Your Next Chapter Starts Here.</h2>
              <p className="TW-ClosingCTA-desc">
                Be part of a team that values innovation, collaboration, continuous learning,
                and meaningful work. Explore opportunities to grow with Thinkwires.
              </p>

              <div className="TW-ClosingCTA-actions">
                <Link
                  to="/jobs"
                  onClick={scrollToJobListings}
                  className="TW-ClosingCTA-btnPrimary"
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
                </Link>

                <Link to="/contact" className="TW-ClosingCTA-btnSecondary">
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
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================================================
          MODAL A: Interactive Team Profile Modal
          =================================================================== */}
      {selectedMember && (
        <div
          className="TW-ModalBackdrop"
          onClick={() => setSelectedMember(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tw-member-name"
        >
          <div
            className="TW-MemberModal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              className="TW-Modal-closeBtn"
              onClick={() => setSelectedMember(null)}
              aria-label="Close profile modal"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="TW-MemberModal-grid">
              {/* Profile Image & Quick Facts */}
              <div className="TW-MemberModal-leftCol">
                <div className="TW-MemberModal-photoWrapper">
                  {selectedMember.image ? (
                    <img
                      src={selectedMember.image}
                      alt={selectedMember.name}
                      className="TW-MemberModal-photo"
                    />
                  ) : (
                    <div className="TW-MemberModal-fallback">
                      <span>{selectedMember.avatarFallback}</span>
                    </div>
                  )}
                </div>

                <div className="TW-MemberModal-quickFacts">
                  <div className="TW-MemberModal-factItem">
                    <span className="TW-MemberModal-factLabel">Experience</span>
                    <span className="TW-MemberModal-factVal">{selectedMember.experienceYears}</span>
                  </div>
                  <div className="TW-MemberModal-factItem">
                    <span className="TW-MemberModal-factLabel">Location</span>
                    <span className="TW-MemberModal-factVal">{selectedMember.location}</span>
                  </div>
                  <div className="TW-MemberModal-factItem">
                    <span className="TW-MemberModal-factLabel">Department</span>
                    <span className="TW-MemberModal-factVal">{selectedMember.departmentLabel}</span>
                  </div>
                </div>
              </div>

              {/* Bio & Details */}
              <div className="TW-MemberModal-rightCol">
                <span className="TW-MemberModal-tag">{selectedMember.departmentLabel}</span>
                <h3 id="tw-member-name" className="TW-MemberModal-name">
                  {selectedMember.name}
                </h3>
                <p className="TW-MemberModal-designation">{selectedMember.designation}</p>

                <div className="TW-MemberModal-section">
                  <h4 className="TW-MemberModal-secTitle">Biography</h4>
                  <p className="TW-MemberModal-bio">{selectedMember.bio}</p>
                </div>

                <div className="TW-MemberModal-section">
                  <h4 className="TW-MemberModal-secTitle">Core Competencies &amp; Expertise</h4>
                  <div className="TW-MemberModal-chips">
                    {selectedMember.expertise.map((exp, i) => (
                      <span key={i} className="TW-MemberModal-chip">
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedMember.linkedin && (
                  <div className="TW-MemberModal-footer">
                    <a
                      href={selectedMember.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="TW-MemberModal-linkedinBtn"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.761-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                      <span>Connect on LinkedIn</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL B: Accessible Lightbox Modal
          =================================================================== */}
      {activeGalleryItem && (
        <div
          className="TW-ModalBackdrop"
          onClick={() => setActiveGalleryIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label={activeGalleryItem.title}
        >
          <div
            className="TW-Lightbox-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with counter and close */}
            <div className="TW-Lightbox-header">
              <span className="TW-Lightbox-counter">
                Photo {activeGalleryIndex + 1} of {GALLERY_ITEMS.length}
              </span>
              <button
                className="TW-Modal-closeBtn"
                onClick={() => setActiveGalleryIndex(null)}
                aria-label="Close lightbox"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Stage */}
            <div className="TW-Lightbox-stage">
              <button
                className="TW-Lightbox-navBtn TW-Lightbox-navBtn--prev"
                onClick={handlePrevGallery}
                aria-label="Previous photo"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <div className="TW-Lightbox-imgWrapper">
                <img
                  src={activeGalleryItem.src}
                  alt={activeGalleryItem.title}
                  className="TW-Lightbox-img"
                />
              </div>

              <button
                className="TW-Lightbox-navBtn TW-Lightbox-navBtn--next"
                onClick={handleNextGallery}
                aria-label="Next photo"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Captions Drawer */}
            <div className="TW-Lightbox-footer">
              <span className="TW-Lightbox-tag">{activeGalleryItem.category}</span>
              <h4 className="TW-Lightbox-title">{activeGalleryItem.title}</h4>
              <p className="TW-Lightbox-caption">{activeGalleryItem.caption}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default LifeAtThinkwires;
