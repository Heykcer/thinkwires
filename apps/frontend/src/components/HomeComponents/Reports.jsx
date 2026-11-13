import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchArticles,
  fetchFeaturedArticle,
} from '../../store/slices/blogSlice';
import { BlogCardSkeleton } from '../common/Skeleton';

const FALLBACK_IMAGES = {
  'card-1':
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
  'card-2':
    'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=800&q=80',
  'card-3':
    'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80',
  'card-4':
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
  'card-5':
    'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80',
  'card-6':
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
};

const getArticleImage = (art) => {
  if (art.imageUrl) return art.imageUrl;
  if (art.featuredImageUrl) return art.featuredImageUrl;
  if (art.image) return art.image;
  if (FALLBACK_IMAGES[art.id]) return FALLBACK_IMAGES[art.id];
  return 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80';
};

const getAuthorInitials = (author) => {
  if (!author) return 'TW';
  if (author.initials) return author.initials;
  if (typeof author === 'string') {
    return author
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  if (author.name) {
    return author.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  return 'TW';
};

const getInitialCardsPerView = () => {
  if (typeof window === 'undefined') return 3;
  if (window.innerWidth < 768) return 1;
  if (window.innerWidth < 1200) return 2;
  return 3;
};

const Reports = () => {
  const dispatch = useDispatch();
  const {
    articles: blogArticles,
    featuredArticle,
    status: blogStatus,
    error: blogError,
  } = useSelector((state) => state.blog);

  const trackRef = useRef(null);
  const currentSlideRef = useRef(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(getInitialCardsPerView);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Combine featured flagship paper and all published blog articles without arbitrary slicing
  const allArticles = useMemo(() => {
    const list = [];
    if (featuredArticle && featuredArticle.id) {
      list.push(featuredArticle);
    }
    if (Array.isArray(blogArticles)) {
      blogArticles.forEach((art) => {
        if (
          !list.some(
            (item) => item.id === art.id || (item.slug && item.slug === art.slug)
          )
        ) {
          list.push(art);
        }
      });
    }
    return list;
  }, [featuredArticle, blogArticles]);

  const totalReports = allArticles.length;

  // Reduce dots count to valid scroll stops: totalReports - cardsPerView + 1
  const maxDots = Math.max(1, totalReports - cardsPerView + 1);

  // Fetch blog data if idle
  useEffect(() => {
    if (blogStatus === 'idle') {
      dispatch(fetchArticles());
      dispatch(fetchFeaturedArticle());
    }
  }, [dispatch, blogStatus]);

  // Track responsive cards per view
  useEffect(() => {
    const handleResize = () => {
      let perView = 3;
      if (window.innerWidth < 768) {
        perView = 1;
      } else if (window.innerWidth < 1200) {
        perView = 2;
      }
      setCardsPerView(perView);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Programmatic scroll to a specific slide index using scrollIntoView
  const handleScrollToSlide = useCallback(
    (idx) => {
      const targetIdx = Math.max(0, Math.min(idx, maxDots - 1));
      currentSlideRef.current = targetIdx;
      setActiveSlide(targetIdx);

      const el = trackRef.current;
      if (el) {
        const cards = el.querySelectorAll('.Reports-slide');
        if (cards[targetIdx]) {
          const cardLeft = cards[targetIdx].offsetLeft - el.offsetLeft;
          el.scrollTo({
            left: cardLeft,
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
          });
        }
      }
    },
    [maxDots, prefersReducedMotion]
  );

  // Update active slide indicator as user scrolls manually
  const handleScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;

    const { scrollLeft } = el;
    const cards = el.querySelectorAll('.Reports-slide');
    if (!cards.length) return;

    const firstCard = cards[0];
    const cardStep = firstCard.offsetWidth + 24; // width + gap
    if (cardStep > 0) {
      let idx = Math.round(scrollLeft / cardStep);
      idx = Math.max(0, Math.min(idx, maxDots - 1));
      currentSlideRef.current = idx;
      setActiveSlide(idx);
    }
  }, [maxDots]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    handleScroll();
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll, allArticles]);

  // Keyboard navigation on track focus
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIdx = (currentSlideRef.current - 1 + maxDots) % maxDots;
      handleScrollToSlide(prevIdx);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIdx = (currentSlideRef.current + 1) % maxDots;
      handleScrollToSlide(nextIdx);
    }
  };

  // Continuous Auto-Scrolling every 5 seconds with pause on hover/touch
  useEffect(() => {
    if (isPaused || prefersReducedMotion || totalReports <= cardsPerView) {
      return;
    }

    const timer = setInterval(() => {
      const nextIdx = (currentSlideRef.current + 1) % maxDots;
      handleScrollToSlide(nextIdx);
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, prefersReducedMotion, totalReports, cardsPerView, maxDots, handleScrollToSlide]);

  // Deep-link destination for modal reader on Blog page
  const getReportDestination = (article) => {
    if (article.slug) return `/blog?article=${encodeURIComponent(article.slug)}`;
    if (article.id) return `/blog?article=${encodeURIComponent(article.id)}`;
    return `/blog?article=${encodeURIComponent(article.title)}`;
  };

  // 1. Loading state
  if (blogStatus === 'loading' && allArticles.length === 0) {
    return (
      <section
        className="Reports-section"
        aria-labelledby="reports-section-heading"
      >
        <div className="Reports-container">
          <div className="Reports-header">
            <div className="Reports-headerLeft">
              <span className="Reports-tag">TALENT ADVISORY INSIGHTS</span>
              <h2 id="reports-section-heading" className="Reports-title">
                Our Latest Tech &amp; Market Reports
              </h2>
            </div>
          </div>
          <div className="Reports-grid">
            <BlogCardSkeleton count={cardsPerView || 3} />
          </div>
        </div>
      </section>
    );
  }

  // 2. Error state
  if (blogStatus === 'failed' && allArticles.length === 0) {
    return (
      <section
        className="Reports-section"
        aria-labelledby="reports-section-heading"
      >
        <div className="Reports-container">
          <div className="Reports-header">
            <div className="Reports-headerLeft">
              <span className="Reports-tag">TALENT ADVISORY INSIGHTS</span>
              <h2 id="reports-section-heading" className="Reports-title">
                Our Latest Tech &amp; Market Reports
              </h2>
            </div>
            <Link to="/blog" className="Reports-browseLink group">
              <span>Browse All Reports</span>
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>
          </div>
          <div className="p-8 text-center bg-white rounded-2xl border border-red-100 shadow-sm">
            <p className="text-sm text-red-600 mb-3">
              Unable to load blog reports: {blogError || 'Network error'}
            </p>
            <button
              type="button"
              onClick={() => {
                dispatch(fetchArticles());
                dispatch(fetchFeaturedArticle());
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </section>
    );
  }

  // 3. Empty state
  if (allArticles.length === 0) {
    return (
      <section
        className="Reports-section"
        aria-labelledby="reports-section-heading"
      >
        <div className="Reports-container">
          <div className="Reports-header">
            <div className="Reports-headerLeft">
              <span className="Reports-tag">TALENT ADVISORY INSIGHTS</span>
              <h2 id="reports-section-heading" className="Reports-title">
                Our Latest Tech &amp; Market Reports
              </h2>
            </div>
            <Link to="/blog" className="Reports-browseLink group">
              <span>Browse All Reports</span>
              <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Link>
          </div>
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              No Research Articles Found
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Check back soon for new tech insights and whitepapers.
            </p>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Visit Blog Directory
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="Reports-section"
      aria-labelledby="reports-section-heading"
    >
      <div className="Reports-container">
        <div className="Reports-header">
          <div className="Reports-headerLeft">
            <span className="Reports-tag">TALENT ADVISORY INSIGHTS</span>
            <h2 id="reports-section-heading" className="Reports-title">
              Our Latest Tech &amp; Market Reports
            </h2>
          </div>
          <Link to="/blog" className="Reports-browseLink group">
            <span>Browse All Reports</span>
            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </Link>
        </div>

        {/* Carousel Viewport with Native Horizontal Scroll & CSS Scroll-Snap */}
        <div
          ref={trackRef}
          className="Reports-carouselTrack"
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label="Talent Advisory Insights Carousel"
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {allArticles.map((article) => {
            const destination = getReportDestination(article);
            const imageSrc = getArticleImage(article);
            const badgeText =
              article.badge || article.category || article.tag || 'Insights';
            const readTimeText = article.readTime || '8 min read';
            const publishDate =
              article.publishedAt || article.date || 'Aug 2026';
            const subCategoryText =
              article.subCategory || article.category;
            const authorName =
              typeof article.author === 'object'
                ? article.author?.name || 'Thinkwires Advisory Team'
                : article.author || 'Thinkwires Advisory Team';
            const authorAvatar =
              typeof article.author === 'object' ? article.author?.avatar : null;
            const authorInitials = getAuthorInitials(article.author);

            return (
              <div
                key={article.id || article.slug || article.title}
                className="Reports-slide"
              >
                <article className="Reports-card">
                  <div className="Reports-cardBody">
                    {/* Standardized Card Image Header */}
                    <div className="Reports-imageContainer">
                      <img
                        src={imageSrc}
                        alt={article.title}
                        className="Reports-image"
                        loading="lazy"
                      />
                      <span
                        className="Reports-tagBadge"
                        style={{
                          backgroundColor:
                            article.badgeBg || 'rgba(15, 23, 42, 0.85)',
                          color: article.badgeColor || '#ffffff',
                        }}
                      >
                        {badgeText}
                      </span>
                      {readTimeText && (
                        <span className="Reports-readBadge">
                          <span className="material-symbols-outlined text-[14px]">
                            schedule
                          </span>
                          <span>{readTimeText}</span>
                        </span>
                      )}
                    </div>

                    {/* Content Area with aligned typography */}
                    <div className="Reports-content">
                      <div className="Reports-metaRow">
                        <span className="Reports-metaDate">{publishDate}</span>
                        {subCategoryText && (
                          <>
                            <span className="Reports-metaDot">•</span>
                            <span className="Reports-metaCategory">
                              {subCategoryText}
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="Reports-cardTitle">
                        {article.title}
                      </h3>

                      <p className="Reports-cardDesc">
                        {article.excerpt || article.summary || article.desc}
                      </p>
                    </div>
                  </div>

                  {/* Aligned footer with author and Read Analysis */}
                  <div className="Reports-footer">
                    <div className="Reports-authorGroup">
                      {authorAvatar ? (
                        <img
                          src={authorAvatar}
                          alt={authorName}
                          className="Reports-authorAvatar"
                          style={{
                            width: 28,
                            height: 28,
                            minWidth: 28,
                            minHeight: 28,
                            maxWidth: 28,
                            maxHeight: 28,
                            borderRadius: '50%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div className="Reports-authorBubble">
                          {authorInitials}
                        </div>
                      )}
                      <span className="Reports-authorName">
                        {authorName}
                      </span>
                    </div>

                    <Link
                      to={destination}
                      className="Reports-readLink"
                    >
                      <span>Read Analysis</span>
                      <span className="material-symbols-outlined text-[16px]">
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                </article>
              </div>
            );
          })}
        </div>

        {/* Slide Indicator / Pagination Dots (Reduced to valid scroll stops) */}
        {maxDots > 1 && (
          <div
            className="Reports-dotsContainer"
            role="tablist"
            aria-label="Carousel pagination"
          >
            {Array.from({ length: maxDots }).map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => handleScrollToSlide(dotIdx)}
                aria-label={`Go to slide ${dotIdx + 1} of ${maxDots}`}
                aria-current={activeSlide === dotIdx ? 'true' : undefined}
                className={`Reports-dot ${
                  activeSlide === dotIdx ? 'active' : ''
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Reports;
