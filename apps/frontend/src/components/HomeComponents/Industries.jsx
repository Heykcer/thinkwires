import React, { useRef, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchIndustriesPageData,
  getAllIndustries,
} from '../../store/slices/industriesSlice';

const Industries = () => {
  const dispatch = useDispatch();
  const { sectors: reduxSectors, status } = useSelector(
    (state) => state.industries
  );

  const trackRef = useRef(null);
  const resumeTimeoutRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchIndustriesPageData());
    }
  }, [dispatch, status]);

  const sectors =
    reduxSectors && reduxSectors.length > 0
      ? reduxSectors
      : getAllIndustries();

  const checkScroll = () => {
    if (!trackRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

    const cardTotalWidth = 344; // card width (320px) + gap (24px)
    const index = Math.round(scrollLeft / cardTotalWidth);
    setActiveIndex(Math.min(Math.max(0, index), sectors.length - 1));
  };

  useEffect(() => {
    checkScroll();
    const track = trackRef.current;
    if (track) {
      track.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
      return () => {
        track.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [sectors.length]);

  // Auto-sliding interval: advances every 3.5 seconds with pause on hover/interaction
  useEffect(() => {
    if (isPaused || sectors.length <= 1) return;

    const interval = setInterval(() => {
      if (!trackRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
      const cardTotalWidth = 344;
      const maxScroll = scrollWidth - clientWidth;

      // Loop back smoothly to the beginning if at the end
      if (scrollLeft >= maxScroll - 20) {
        trackRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        trackRef.current.scrollBy({ left: cardTotalWidth, behavior: 'smooth' });
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isPaused, sectors.length]);

  const pauseTemporarily = () => {
    setIsPaused(true);
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 6000);
  };

  const scroll = (direction) => {
    pauseTemporarily();
    if (!trackRef.current) return;
    const scrollAmount = direction === 'left' ? -344 : 344;
    trackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const scrollToCard = (index) => {
    pauseTemporarily();
    if (!trackRef.current) return;
    const targetX = index * 344;
    trackRef.current.scrollTo({ left: targetX, behavior: 'smooth' });
  };

  return (
    <section className="Industries-section" aria-label="Industries We Empower">
      <div className="Industries-container">
        {/* Section Header with Title and Carousel Controls */}
        <div className="Industries-header">
          <div className="Industries-headerLeft">
            <span className="Industries-tag">DOMAIN EXPERTISE</span>
            <h2 className="Industries-title">Industries We Empower</h2>
            <p className="Industries-description">
              Supplying deep niche technical knowledge tailored to regulatory,
              compliance, and velocity needs across key sectors.
            </p>
          </div>

          <div className="Industries-navControls" aria-label="Carousel Controls">
            {/* Play / Pause Toggle Button */}
            <button
              type="button"
              className="Industries-navBtn"
              onClick={() => setIsPaused((prev) => !prev)}
              aria-label={isPaused ? 'Resume auto-sliding' : 'Pause auto-sliding'}
              title={isPaused ? 'Resume auto-sliding' : 'Pause auto-sliding'}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isPaused ? 'play_arrow' : 'pause'}
              </span>
            </button>

            {/* Left and Right Scroll Buttons */}
            <button
              type="button"
              className={`Industries-navBtn ${
                !canScrollLeft ? 'Industries-navBtn--disabled' : ''
              }`}
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Previous industry cards"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button
              type="button"
              className={`Industries-navBtn ${
                !canScrollRight ? 'Industries-navBtn--disabled' : ''
              }`}
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Next industry cards"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Carousel Track with Background Themed Cards & Hover Pause */}
        <div
          className="Industries-carouselWrapper"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          <div
            ref={trackRef}
            className="Industries-carouselTrack"
            role="region"
            aria-label="Industry Cards Carousel"
          >
            {sectors.map((sector, index) => {
              const targetSlug = sector.slug || 'information-technology';
              const bgImg =
                sector.bgImage ||
                'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80';

              return (
                <article
                  key={sector.slug || sector.id || index}
                  className="Industries-carouselCard group"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.42) 0%, rgba(15, 23, 42, 0.88) 55%, #0f172a 100%), url("${bgImg}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <Link
                    to={`/industries/${targetSlug}`}
                    className="Industries-cardOverlayLink"
                    aria-label={`Explore ${sector.title || sector.name} practice`}
                  />

                  {/* Card Content Top */}
                  <div className="Industries-cardTop">
                    <div className="Industries-cardHeaderRow">
                      <div className="Industries-glassIconWrap">
                        <span className="material-symbols-outlined text-[24px]">
                          {sector.icon || 'domain'}
                        </span>
                      </div>
                      <span className="Industries-glassBadge">
                        <span
                          className="Industries-badgeDot"
                          style={{
                            backgroundColor:
                              sector.badgeDot || 'var(--color-cobalt-bright, #2563EB)',
                          }}
                        />
                        {sector.badgeText || sector.badge || 'Domain Verified'}
                      </span>
                    </div>

                    <h3 className="Industries-carouselCardTitle">
                      {sector.title || sector.name}
                    </h3>
                    <p className="Industries-carouselCardDesc">
                      {sector.shortDesc || sector.desc}
                    </p>

                    {/* Placements / High-Demand tags preview */}
                    {sector.placements && sector.placements.length > 0 && (
                      <div className="Industries-cardTags">
                        {sector.placements.slice(0, 3).map((tag, i) => (
                          <span key={i} className="Industries-cardTag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Footer Pinned at Bottom */}
                  <div className="Industries-carouselCardFooter">
                    <span className="Industries-carouselPodsCount">
                      Pods: <strong>{sector.podsDeployed || '25+'}</strong>
                    </span>
                    <span className="Industries-exploreLink">
                      <span>Explore Practice</span>
                      <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                        arrow_forward
                      </span>
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Carousel Pagination Dots */}
        <div
          className="Industries-dotsIndicator"
          role="tablist"
          aria-label="Carousel pagination dots"
        >
          {sectors.map((_, idx) => (
            <button
              key={idx}
              type="button"
              role="tab"
              aria-selected={activeIndex === idx}
              aria-label={`Go to industry slide ${idx + 1}`}
              className={`Industries-dot ${
                activeIndex === idx ? 'Industries-dot--active' : ''
              }`}
              onClick={() => scrollToCard(idx)}
            />
          ))}
        </div>

        {/* Bottom CTA Button */}
        <div className="Industries-bottomCta">
          <Link
            to="/industries"
            className="btn btn-outline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.75rem',
              borderRadius: '9999px',
              fontSize: '0.95rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <span>View All 11 Specialized Sectors</span>
            <span className="material-symbols-outlined text-[18px]">apps</span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Industries;
