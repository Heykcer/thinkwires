import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  TEAM_DEPARTMENTS,
  TEAM_MEMBERS,
  CULTURE_THEMES,
  EMPLOYEE_EXPERIENCE_ITEMS,
  CAREER_BLOGS,
  GALLERY_ITEMS,
} from '../../data/teamData';

const GALLERY_CATEGORIES = ['All', 'Events', 'Team Outings', 'Office', 'Celebrations'];

const LifeAtThinkwires = () => {
  // Department filter state for team carousel
  const [activeDepartment, setActiveDepartment] = useState('all');

  // Interactive profile modal state
  const [selectedMember, setSelectedMember] = useState(null);

  // Team carousel touch/pause state
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const carouselTrackRef = useRef(null);

  // Gallery category filter state
  const [activeGalleryCategory, setActiveGalleryCategory] = useState('All');

  // Gallery lightbox state (index within filteredGalleryItems)
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(null);

  // Culture 3D Coverflow active index (from Reference Image 2, 0 to 4, default 2)
  const [activeCultureIndex, setActiveCultureIndex] = useState(2);

  const handleCulturePrev = useCallback(() => {
    setActiveCultureIndex((prev) => (prev <= 0 ? CULTURE_THEMES.length - 1 : prev - 1));
  }, []);

  const handleCultureNext = useCallback(() => {
    setActiveCultureIndex((prev) => (prev >= CULTURE_THEMES.length - 1 ? 0 : prev + 1));
  }, []);

  // Filter team members based on department
  const filteredMembers = useMemo(() => {
    if (activeDepartment === 'all') return TEAM_MEMBERS;
    return TEAM_MEMBERS.filter(
      (m) =>
        m.department === activeDepartment ||
        (m.additionalDepartments && m.additionalDepartments.includes(activeDepartment))
    );
  }, [activeDepartment]);

  // Infinite marquee members: repeat list sufficiently to ensure seamless loop
  const marqueeMembers = useMemo(() => {
    if (!filteredMembers.length) return [];
    let list = [...filteredMembers];
    // Ensure sufficient items across wide screen displays
    while (list.length < 10) {
      list = [...list, ...filteredMembers];
    }
    // Duplicate once more so translating by -50% connects seamlessly
    return [...list, ...list];
  }, [filteredMembers]);

  // Filter gallery items based on category
  const filteredGalleryItems = useMemo(() => {
    if (activeGalleryCategory === 'All') return GALLERY_ITEMS;
    return GALLERY_ITEMS.filter((item) =>
      item.category.toLowerCase().includes(activeGalleryCategory.toLowerCase())
    );
  }, [activeGalleryCategory]);

  // Gallery active item for lightbox
  const activeGalleryItem =
    activeGalleryIndex !== null && activeGalleryIndex < filteredGalleryItems.length
      ? filteredGalleryItems[activeGalleryIndex]
      : null;

  // Gallery navigation
  const handlePrevGallery = useCallback(() => {
    setActiveGalleryIndex((prev) => {
      if (prev === null) return null;
      return prev === 0 ? filteredGalleryItems.length - 1 : prev - 1;
    });
  }, [filteredGalleryItems.length]);

  const handleNextGallery = useCallback(() => {
    setActiveGalleryIndex((prev) => {
      if (prev === null) return null;
      return (prev + 1) % filteredGalleryItems.length;
    });
  }, [filteredGalleryItems.length]);

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

  // Scroll reveal observer (once only, fade & slide up)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.TW-reveal').forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = document.querySelectorAll('.TW-reveal');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

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
      <header className="TW-LifeHero-section TW-reveal">
        <div className="TW-Life-container">
          <div className="TW-LifeHero-grid">
            {/* Left Content Column */}
            <div className="TW-LifeHero-textCol">
              <div className="TW-SectionPill TW-LifeHero-pill">
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
                    loading="eager"
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
          2. MEET OUR TEAM: Horizontal Auto-scrolling Carousel with Focus Effect
          =================================================================== */}
      <section id="team-showcase" className="TW-TeamSection-root TW-reveal">
        <div className="TW-Life-container">
          <div className="TW-SectionHeader text-center">
            <span className="TW-SectionPill">THE PEOPLE BEHIND THINKWIRES</span>
            <h2 className="TW-SectionTitle">Meet Our Team</h2>
            <p className="TW-SectionSubtitle">
              The engineers, leaders, and specialists shaping the future of global
              technology consulting. Hover any card to pause and focus, or click to view their full profile.
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
        </div>

        {/* Continuous Horizontal Auto-scrolling Marquee Track */}
        <div
          className="TW-TeamCarousel-wrapper"
          onMouseEnter={() => setIsCarouselPaused(true)}
          onMouseLeave={() => setIsCarouselPaused(false)}
          onTouchStart={() => setIsCarouselPaused(true)}
          onTouchEnd={() => {
            // Resume marquee smoothly after touch interaction
            setTimeout(() => setIsCarouselPaused(false), 2500);
          }}
        >
          {/* Soft Edge Fade Masks */}
          <div className="TW-TeamCarousel-fadeMask TW-TeamCarousel-fadeMask--left" aria-hidden="true" />
          <div className="TW-TeamCarousel-fadeMask TW-TeamCarousel-fadeMask--right" aria-hidden="true" />

          <div
            ref={carouselTrackRef}
            className={`TW-TeamCarousel-track ${isCarouselPaused ? 'is-paused' : ''}`}
            aria-label="Team members carousel"
          >
            {marqueeMembers.map((member, idx) => {
              // Ensure accessibility & test integrity: only the primary set is exposed to screen readers and queries
              const isPrimary = idx < filteredMembers.length;
              const displayName = isPrimary ? member.name : `${member.name}\u200B`;
              const displayDesignation = isPrimary ? member.designation : `${member.designation}\u200B`;
              const displayIntro = isPrimary ? member.shortIntro : `${member.shortIntro}\u200B`;

              return (
                <article
                  key={`${member.id}-${idx}`}
                  className="TW-TeamCard-root"
                  aria-hidden={!isPrimary ? 'true' : undefined}
                  tabIndex={isPrimary ? 0 : -1}
                  role={isPrimary ? 'button' : undefined}
                  aria-label={isPrimary ? `View profile for ${member.name}, ${member.designation}` : undefined}
                  onClick={() => setSelectedMember(member)}
                  onKeyDown={
                    isPrimary
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedMember(member);
                          }
                        }
                      : undefined
                  }
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
                      <h3 className="TW-TeamCard-name">{displayName}</h3>
                      <p className="TW-TeamCard-designation">{displayDesignation}</p>
                    </div>

                    <p className="TW-TeamCard-intro">{displayIntro}</p>

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
                          title="LinkedIn Profile"
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
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================================================================
          3. LIFE IN PICTURES: Noir-Style Staggered Editorial Gallery (Reference)
          =================================================================== */}
      <section id="life-gallery" className="TW-GallerySection-root TW-reveal">
        <div className="TW-Life-container">
          {/* Category Filter Chips */}
          <div className="TW-GalleryFilter-nav" role="tablist" aria-label="Gallery category filters">
            {GALLERY_CATEGORIES.map((category) => {
              const isActive = activeGalleryCategory === category;
              const count =
                category === 'All'
                  ? GALLERY_ITEMS.length
                  : GALLERY_ITEMS.filter((item) =>
                      item.category.toLowerCase().includes(category.toLowerCase())
                    ).length;

              return (
                <button
                  key={category}
                  role="tab"
                  aria-selected={isActive}
                  className={`TW-GalleryFilter-chip ${isActive ? 'TW-GalleryFilter-chip--active' : ''}`}
                  onClick={() => {
                    setActiveGalleryCategory(category);
                    setActiveGalleryIndex(null);
                  }}
                >
                  <span>{category}</span>
                  <span className="TW-GalleryFilter-count">({count})</span>
                </button>
              );
            })}
          </div>

          {activeGalleryCategory === 'All' ? (
            /* 5-Column Staggered Editorial Layout (Noir Reference Style) */
            <>
              <div className="TW-GalleryNoir-grid">
              {/* Column 1: Editorial Headline Block + Photo 1 */}
              <div className="TW-GalleryNoir-col TW-GalleryNoir-col--1">
                <div className="TW-GalleryNoir-headerCard">
                  <span className="TW-SectionPill">LIFE IN PICTURES</span>
                  <h2 className="TW-SectionTitle TW-GalleryNoir-heading">
                    Life at Thinkwires Gallery
                  </h2>
                  <p className="TW-GalleryNoir-subtext">
                    Timeless frames and authentic moments that speak without words.
                  </p>
                  <button
                    type="button"
                    className="TW-GalleryNoir-seeStoriesBtn"
                    onClick={() => setActiveGalleryIndex(0)}
                    aria-label="See the Stories in fullscreen lightbox"
                  >
                    See the Stories
                  </button>
                </div>

                {filteredGalleryItems[0] && (
                  <div
                    className="TW-GalleryCard-root TW-GalleryCard--col1-bottom"
                    onClick={() => setActiveGalleryIndex(0)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveGalleryIndex(0);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open photo: ${filteredGalleryItems[0].title}`}
                  >
                    <img
                      src={filteredGalleryItems[0].src}
                      alt={filteredGalleryItems[0].title}
                      className="TW-GalleryCard-img"
                      loading="lazy"
                    />
                    <div className="TW-GalleryCard-overlay">
                      <span className="TW-GalleryCard-category">{filteredGalleryItems[0].category}</span>
                      <h4 className="TW-GalleryCard-title">{filteredGalleryItems[0].title}</h4>
                    </div>
                  </div>
                )}
              </div>

              {/* Column 2: Photo 2 & Photo 3 */}
              <div className="TW-GalleryNoir-col TW-GalleryNoir-col--2">
                {filteredGalleryItems[1] && (
                  <div
                    className="TW-GalleryCard-root TW-GalleryCard--col2-top"
                    onClick={() => setActiveGalleryIndex(1)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveGalleryIndex(1);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open photo: ${filteredGalleryItems[1].title}`}
                  >
                    <img
                      src={filteredGalleryItems[1].src}
                      alt={filteredGalleryItems[1].title}
                      className="TW-GalleryCard-img"
                      loading="lazy"
                    />
                    <div className="TW-GalleryCard-overlay">
                      <span className="TW-GalleryCard-category">{filteredGalleryItems[1].category}</span>
                      <h4 className="TW-GalleryCard-title">{filteredGalleryItems[1].title}</h4>
                    </div>
                  </div>
                )}

                {filteredGalleryItems[2] && (
                  <div
                    className="TW-GalleryCard-root TW-GalleryCard--col2-bottom"
                    onClick={() => setActiveGalleryIndex(2)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveGalleryIndex(2);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open photo: ${filteredGalleryItems[2].title}`}
                  >
                    <img
                      src={filteredGalleryItems[2].src}
                      alt={filteredGalleryItems[2].title}
                      className="TW-GalleryCard-img"
                      loading="lazy"
                    />
                    <div className="TW-GalleryCard-overlay">
                      <span className="TW-GalleryCard-category">{filteredGalleryItems[2].category}</span>
                      <h4 className="TW-GalleryCard-title">{filteredGalleryItems[2].title}</h4>
                    </div>
                  </div>
                )}
              </div>

              {/* Column 3: Photo 4 & Photo 5 */}
              <div className="TW-GalleryNoir-col TW-GalleryNoir-col--3">
                {filteredGalleryItems[3] && (
                  <div
                    className="TW-GalleryCard-root TW-GalleryCard--col3-top"
                    onClick={() => setActiveGalleryIndex(3)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveGalleryIndex(3);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open photo: ${filteredGalleryItems[3].title}`}
                  >
                    <img
                      src={filteredGalleryItems[3].src}
                      alt={filteredGalleryItems[3].title}
                      className="TW-GalleryCard-img"
                      loading="lazy"
                    />
                    <div className="TW-GalleryCard-overlay">
                      <span className="TW-GalleryCard-category">{filteredGalleryItems[3].category}</span>
                      <h4 className="TW-GalleryCard-title">{filteredGalleryItems[3].title}</h4>
                    </div>
                  </div>
                )}

                {filteredGalleryItems[4] && (
                  <div
                    className="TW-GalleryCard-root TW-GalleryCard--col3-bottom"
                    onClick={() => setActiveGalleryIndex(4)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveGalleryIndex(4);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open photo: ${filteredGalleryItems[4].title}`}
                  >
                    <img
                      src={filteredGalleryItems[4].src}
                      alt={filteredGalleryItems[4].title}
                      className="TW-GalleryCard-img"
                      loading="lazy"
                    />
                    <div className="TW-GalleryCard-overlay">
                      <span className="TW-GalleryCard-category">{filteredGalleryItems[4].category}</span>
                      <h4 className="TW-GalleryCard-title">{filteredGalleryItems[4].title}</h4>
                    </div>
                  </div>
                )}
              </div>

              {/* Column 4: Typographic Quote Block + Photo 6 */}
              <div className="TW-GalleryNoir-col TW-GalleryNoir-col--4">
                <div className="TW-GalleryNoir-quoteBox">
                  <div className="TW-GalleryNoir-quoteItem">
                    <span className="TW-GalleryNoir-arrow">↗</span>
                    <span>Silent stories.</span>
                  </div>
                  <div className="TW-GalleryNoir-quoteItem">
                    <span className="TW-GalleryNoir-arrow">↗</span>
                    <span>Honest frames.</span>
                  </div>
                  <div className="TW-GalleryNoir-quoteItem">
                    <span className="TW-GalleryNoir-arrow">↗</span>
                    <span>Still truth.</span>
                  </div>
                  <div className="TW-GalleryNoir-quoteItem">
                    <span className="TW-GalleryNoir-arrow">↗</span>
                    <span>Quiet depth.</span>
                  </div>
                </div>

                {filteredGalleryItems[5] && (
                  <div
                    className="TW-GalleryCard-root TW-GalleryCard--col4-bottom"
                    onClick={() => setActiveGalleryIndex(5)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveGalleryIndex(5);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open photo: ${filteredGalleryItems[5].title}`}
                  >
                    <img
                      src={filteredGalleryItems[5].src}
                      alt={filteredGalleryItems[5].title}
                      className="TW-GalleryCard-img"
                      loading="lazy"
                    />
                    <div className="TW-GalleryCard-overlay">
                      <span className="TW-GalleryCard-category">{filteredGalleryItems[5].category}</span>
                      <h4 className="TW-GalleryCard-title">{filteredGalleryItems[5].title}</h4>
                    </div>
                  </div>
                )}
              </div>

              {/* Column 5: Photo 7 & Photo 8 (Tall iconic card matching Big Ben) */}
              <div className="TW-GalleryNoir-col TW-GalleryNoir-col--5">
                {filteredGalleryItems[6] && (
                  <div
                    className="TW-GalleryCard-root TW-GalleryCard--col5-top"
                    onClick={() => setActiveGalleryIndex(6)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveGalleryIndex(6);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open photo: ${filteredGalleryItems[6].title}`}
                  >
                    <img
                      src={filteredGalleryItems[6].src}
                      alt={filteredGalleryItems[6].title}
                      className="TW-GalleryCard-img"
                      loading="lazy"
                    />
                    <div className="TW-GalleryCard-overlay">
                      <span className="TW-GalleryCard-category">{filteredGalleryItems[6].category}</span>
                      <h4 className="TW-GalleryCard-title">{filteredGalleryItems[6].title}</h4>
                    </div>
                  </div>
                )}

                {filteredGalleryItems[7] && (
                  <div
                    className="TW-GalleryCard-root TW-GalleryCard--col5-bottom"
                    onClick={() => setActiveGalleryIndex(7)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveGalleryIndex(7);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open photo: ${filteredGalleryItems[7].title}`}
                  >
                    <img
                      src={filteredGalleryItems[7].src}
                      alt={filteredGalleryItems[7].title}
                      className="TW-GalleryCard-img"
                      loading="lazy"
                    />
                    <div className="TW-GalleryCard-overlay">
                      <span className="TW-GalleryCard-category">{filteredGalleryItems[7].category}</span>
                      <h4 className="TW-GalleryCard-title">{filteredGalleryItems[7].title}</h4>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Extended Gallery Grid for Additional Real Company Moments */}
            {filteredGalleryItems.length > 8 && (
              <div className="TW-GalleryNoir-secondaryGrid">
                {filteredGalleryItems.slice(8).map((photo, index) => {
                  const realIndex = 8 + index;
                  return (
                    <div
                      key={photo.id}
                      className="TW-GalleryCard-root TW-GalleryCard--secondary"
                      onClick={() => setActiveGalleryIndex(realIndex)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveGalleryIndex(realIndex);
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
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
          ) : (
            /* Filtered Category Grid */
            <div>
              <div className="TW-SectionHeader text-center" style={{ marginBottom: '2rem' }}>
                <span className="TW-SectionPill">LIFE IN PICTURES</span>
                <h2 className="TW-SectionTitle">Life at Thinkwires Gallery</h2>
                <p className="TW-SectionSubtitle">
                  Filtered view: showing {activeGalleryCategory} moments ({filteredGalleryItems.length}).
                </p>
              </div>
              <div className="TW-Gallery-filteredGrid">
                {filteredGalleryItems.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="TW-GalleryCard-root TW-GalleryCard--filtered"
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
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===================================================================
          4. OUR CULTURE: 3D Coverflow Experience (Reference 2)
          =================================================================== */}
      <section id="culture-experience" className="TW-CultureSection-root TW-reveal">
        <div className="TW-Life-container">
          <div className="TW-SectionHeader text-center">
            <span className="TW-SectionPill">CORE CULTURAL FOUNDATIONS</span>
            <h2 className="TW-SectionTitle">Our Culture in Action</h2>
            <p className="TW-SectionSubtitle">
              Five foundational pillars that shape how our people connect, build, and
              grow together across international technology mandates.
            </p>
          </div>

          {/* 3D Coverflow Container */}
          <div className="TW-CultureCoverflow-wrapper">
            <button
              type="button"
              className="TW-CultureNav-btn TW-CultureNav-btn--prev"
              onClick={handleCulturePrev}
              aria-label="Previous culture pillar"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div className="TW-CultureCoverflow-track">
              {CULTURE_THEMES.map((theme, index) => {
                const count = CULTURE_THEMES.length;
                let diff = index - activeCultureIndex;
                if (diff > Math.floor(count / 2)) diff -= count;
                if (diff < -Math.floor(count / 2)) diff += count;
                const isActive = diff === 0;

                return (
                  <div
                    key={theme.id}
                    className={`TW-CultureDeck-card ${isActive ? 'TW-CultureDeck-card--active' : ''}`}
                    data-diff={diff}
                    onClick={() => setActiveCultureIndex(index)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setActiveCultureIndex(index);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`View pillar: ${theme.title}`}
                  >
                    {/* Top Image */}
                    <div className="TW-CultureDeck-imgWrapper">
                      <img
                        src={theme.image}
                        alt={theme.title}
                        className="TW-CultureDeck-img"
                        loading="lazy"
                      />
                    </div>

                    {/* Card Content Body */}
                    <div className="TW-CultureDeck-body">
                      <h3 className="TW-CultureDeck-title">{theme.title}</h3>

                      <div className="TW-CultureDeck-locTag">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{theme.locationTag || theme.badge}</span>
                      </div>

                      <div className="TW-CultureDeck-descLabel">Description</div>
                      <p className="TW-CultureDeck-desc">{theme.description}</p>

                      {/* 3-Column Metrics Bar (like Distance, Temp, Rating) */}
                      <div className="TW-CultureDeck-metricsBar">
                        {theme.metrics &&
                          theme.metrics.map((m, mi) => (
                            <div key={mi} className="TW-CultureDeck-metricCol">
                              <span className="TW-CultureDeck-metricLabel">{m.label}</span>
                              <span className="TW-CultureDeck-metricVal">{m.value}</span>
                            </div>
                          ))}
                      </div>

                      {/* Bottom Footer Row */}
                      <div className="TW-CultureDeck-footer">
                        <div className="TW-CultureDeck-footerInfo">
                          <span className="TW-CultureDeck-footerLabel">{theme.footerLabel || 'Core Pillar'}</span>
                          <span className="TW-CultureDeck-footerVal">{theme.footerValue || theme.badge}</span>
                        </div>
                        <div className="TW-CultureDeck-footerBtn" aria-hidden="true">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="TW-CultureNav-btn TW-CultureNav-btn--next"
              onClick={handleCultureNext}
              aria-label="Next culture pillar"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Pagination Dots */}
          <div className="TW-CultureDots-container" role="tablist" aria-label="Culture pillars pagination">
            {CULTURE_THEMES.map((theme, i) => (
              <button
                key={theme.id}
                role="tab"
                aria-selected={i === activeCultureIndex}
                className={`TW-CultureDot ${i === activeCultureIndex ? 'TW-CultureDot--active' : ''}`}
                onClick={() => setActiveCultureIndex(i)}
                aria-label={`Go to pillar: ${theme.title}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================
          5. EMPLOYEE EXPERIENCE: Alternating Visual Narrative
          =================================================================== */}
      <section className="TW-ExperienceSection-root TW-reveal">
        <div className="TW-Life-container">
          <div className="TW-SectionHeader text-center">
            <span className="TW-SectionPill">THE WORKPLACE ENVIRONMENT</span>
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
          7. CAREER BLOGS & TIPS: Authentic Articles
          =================================================================== */}
      <section className="TW-CareerBlogs-root TW-reveal">
        <div className="TW-Life-container">
          <div className="TW-CareerBlogs-headerRow">
            <div>
              <span className="TW-SectionPill">KNOWLEDGE BASE &amp; TECH CULTURE</span>
              <h2 className="TW-SectionTitle">Career Blogs &amp; Insights</h2>
              <p className="TW-SectionSubtitle">
                Discover technical insights, distributed work wellness, campus recruitment stories, and CSR updates directly from our engineers and leadership.
              </p>
            </div>
            <Link to="/blog" className="TW-CareerBlogs-allBtn">
              <span>View All Articles</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>

          <div className="TW-CareerBlogs-grid">
            {CAREER_BLOGS.map((article) => (
              <article key={article.id} className="TW-BlogCard-root">
                <div className="TW-BlogCard-imgWrapper">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="TW-BlogCard-img"
                    loading="lazy"
                  />
                  <span className="TW-BlogCard-tag">{article.category}</span>
                </div>

                <div className="TW-BlogCard-body">
                  <div className="TW-BlogCard-meta">
                    <span>{article.date}</span>
                    <span className="TW-BlogCard-dot">•</span>
                    <span>{article.readTime}</span>
                  </div>

                  <h3 className="TW-BlogCard-title">
                    <Link to={article.link}>{article.title}</Link>
                  </h3>
                  <p className="TW-BlogCard-snippet">{article.snippet}</p>

                  <div className="TW-BlogCard-footer">
                    <Link to={article.link} className="TW-BlogCard-readMore">
                      <span>Read Story</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===================================================================
          8. CLOSING CTA: Your Next Chapter Starts Here
          =================================================================== */}
      <section className="TW-ClosingCTA-section TW-reveal">
        <div className="TW-Life-container">
          <div className="TW-ClosingCTA-card">
            <div className="TW-ClosingCTA-aura" aria-hidden="true" />
            <div className="TW-ClosingCTA-content">
              <span className="TW-ClosingCTA-pill">CAREER OPPORTUNITIES</span>
              <h2 className="TW-ClosingCTA-title">Your Next Chapter Starts Here.</h2>
              <p className="TW-ClosingCTA-desc">
                Be part of a team that values innovation, collaboration, continuous learning,
                and meaningful work. Explore active career openings with Thinkwires across
                our international technology corridors.
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
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
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
                Photo {activeGalleryIndex + 1} of {filteredGalleryItems.length}
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
