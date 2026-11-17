import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation, Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import {
  FAQ_CATEGORIES,
  FAQ_ITEMS,
  filterFaqs,
  getCategoryCounts,
} from '../data/faqData';

/**
 * Helper to highlight search keywords inside text strings safely
 */
const HighlightedText = ({ text, highlight }) => {
  if (!highlight || !highlight.trim() || !text) {
    return <>{text}</>;
  }

  const query = highlight.trim();
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className="tw-faq-mark">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

const FaqPage = () => {
  const location = useLocation();

  // Read initial params from URL if available
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialCat = useMemo(() => {
    const cat = searchParams.get('category');
    return cat && FAQ_CATEGORIES.some((c) => c.id === cat) ? cat : 'all';
  }, [searchParams]);
  const initialQuery = useMemo(() => searchParams.get('q') || '', [searchParams]);

  const [activeCategory, setActiveCategory] = useState(initialCat);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [helpfulFeedback, setHelpfulFeedback] = useState({});

  const navScrollRef = useRef(null);

  // Category counts
  const categoryCounts = useMemo(() => getCategoryCounts(FAQ_ITEMS), []);

  // Filtered list based on current active category and search query
  const filteredFaqs = useMemo(
    () => filterFaqs(FAQ_ITEMS, activeCategory, searchQuery),
    [activeCategory, searchQuery]
  );

  // Group filtered FAQs by category for clean editorial sections
  const groupedFaqs = useMemo(() => {
    const groups = [];

    // Filter relevant categories (excluding 'all')
    const relevantCategories =
      activeCategory === 'all'
        ? FAQ_CATEGORIES.filter((c) => c.id !== 'all')
        : FAQ_CATEGORIES.filter((c) => c.id === activeCategory);

    relevantCategories.forEach((cat) => {
      const itemsInCat = filteredFaqs.filter((f) => f.categoryId === cat.id);
      if (itemsInCat.length > 0) {
        groups.push({
          category: cat,
          items: itemsInCat,
        });
      }
    });

    return groups;
  }, [filteredFaqs, activeCategory]);

  // Deep linking and hash navigation
  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const matched = FAQ_ITEMS.find((f) => f.id === targetId);
      if (matched) {
        setActiveCategory(matched.categoryId);
        setExpandedQuestionId(matched.id);
        setTimeout(() => {
          const el = document.getElementById(`faq-item-${targetId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 150);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.hash]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Toggle accordion question row
  const handleToggleQuestion = useCallback((id) => {
    setExpandedQuestionId((prev) => (prev === id ? null : id));
  }, []);

  // Copy direct link to specific FAQ
  const handleCopyLink = useCallback((faqId, e) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}#${faqId}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setToastMessage('Link copied to clipboard!');
      });
    } else {
      setToastMessage('Link copied to clipboard!');
    }
  }, []);

  // Handle helpful feedback
  const handleFeedback = useCallback((faqId, answer, e) => {
    e.stopPropagation();
    setHelpfulFeedback((prev) => ({ ...prev, [faqId]: answer }));
    setToastMessage('Thank you for your feedback!');
  }, []);

  // Clear search input
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Select category tab
  const handleSelectCategory = useCallback((catId) => {
    setActiveCategory(catId);
    setExpandedQuestionId(null);
  }, []);

  return (
    <div className="tw-faq-page">
      <Helmet>
        <title>FAQ & Help Center | Thinkwires Technical Talent & Workforce Solutions</title>
        <meta
          name="description"
          content="Explore answers about IT staffing, recruitment transformation, AI-powered hiring, and Thinkwires global workforce solutions."
        />
        <meta name="keywords" content="Thinkwires FAQ, IT staffing questions, AI recruitment FAQ, Staff Augmentation, Employer of Record" />
        <link rel="canonical" href="https://thinkwires.com/faqs" />
      </Helmet>

      {/* Global Navbar */}
      <Navbar />

      <main className="tw-faq-main">
        {/* ==================================================================
            1. Clean Centered Editorial Hero Section
            ================================================================== */}
        <section className="tw-faq-hero" aria-labelledby="faq-hero-heading">
          <div className="tw-faq-hero-glow" aria-hidden="true" />
          <div className="tw-faq-container tw-faq-hero-container">
            {/* Eyebrow Label */}
            <div className="tw-faq-eyebrow">
              <span className="tw-faq-eyebrow-dot" />
              <span>HELP CENTER</span>
            </div>

            {/* Main Heading as requested */}
            <h1 id="faq-hero-heading" className="tw-faq-hero-title">
              Everything You Need to Know
            </h1>

            {/* Supporting Text as requested */}
            <p className="tw-faq-hero-subtitle">
              Explore answers about IT staffing, recruitment transformation,
              AI-powered hiring, and our workforce solutions.
            </p>

            {/* Modern Search Bar */}
            <div className="tw-faq-search-wrapper">
              <div className="tw-faq-search-bar" role="search">
                <svg
                  className="tw-faq-search-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>

                <input
                  type="text"
                  className="tw-faq-search-input"
                  placeholder="Search by topic, keyword, or question (e.g., Staff Augmentation, AI, EOR)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search FAQ questions and answers"
                />

                {searchQuery && (
                  <button
                    type="button"
                    className="tw-faq-search-clear"
                    onClick={handleClearSearch}
                    aria-label="Clear search input"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      width="16"
                      height="16"
                      aria-hidden="true"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Compact Search / Category Counter */}
              <div className="tw-faq-search-meta" aria-live="polite">
                {searchQuery.trim() ? (
                  <span>
                    Showing <strong>{filteredFaqs.length}</strong> {filteredFaqs.length === 1 ? 'question' : 'questions'} matching “{searchQuery}”
                    {activeCategory !== 'all' && (
                      <> in <strong>{FAQ_CATEGORIES.find((c) => c.id === activeCategory)?.name}</strong></>
                    )}
                  </span>
                ) : (
                  <span>
                    {activeCategory === 'all'
                      ? `Showing all ${FAQ_ITEMS.length} questions across 7 specialized domains`
                      : `Showing ${filteredFaqs.length} questions in ${FAQ_CATEGORIES.find((c) => c.id === activeCategory)?.name}`}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================================
            2. Clean Horizontal Category Navigation (Editorial Tabs)
            ================================================================== */}
        <nav
          className="tw-faq-nav-bar"
          aria-label="FAQ Category Navigation"
        >
          <div className="tw-faq-container">
            <div
              ref={navScrollRef}
              className="tw-faq-tab-list"
              role="tablist"
              aria-label="FAQ Categories"
            >
              {FAQ_CATEGORIES.map((cat) => {
                const isSelected = activeCategory === cat.id;
                const count = categoryCounts[cat.id] || 0;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    id={`faq-tab-${cat.id}`}
                    aria-selected={isSelected}
                    aria-controls={`faq-panel-${cat.id}`}
                    className={`tw-faq-tab-item ${isSelected ? 'tw-faq-tab-item--active' : ''}`}
                    onClick={() => handleSelectCategory(cat.id)}
                  >
                    <span className="tw-faq-tab-label">{cat.name}</span>
                    <span className="tw-faq-tab-badge">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* ==================================================================
            3. Main Editorial FAQ Content Section
            ================================================================== */}
        <section
          className="tw-faq-content-wrap"
          id={`faq-panel-${activeCategory}`}
          role="tabpanel"
          aria-labelledby={`faq-tab-${activeCategory}`}
        >
          <div className="tw-faq-container tw-faq-content-container">
            {filteredFaqs.length === 0 ? (
              /* Polished Empty State */
              <div className="tw-faq-empty-state">
                <div className="tw-faq-empty-icon-box" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    width="32"
                    height="32"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </div>
                <h3 className="tw-faq-empty-title">No Matching Questions Found</h3>
                <p className="tw-faq-empty-desc">
                  We couldn’t find any questions matching “{searchQuery}”. Try
                  checking your spelling, searching broader terms, or selecting another category.
                </p>

                <div className="tw-faq-empty-topics">
                  <span className="tw-faq-empty-topics-label">Suggested Topics:</span>
                  <div className="tw-faq-empty-chips">
                    {['Staff Augmentation', 'AI Recruitment', 'Time-to-Fill', 'Employer of Record', 'Candidate Vetting'].map(
                      (topic) => (
                        <button
                          key={topic}
                          type="button"
                          className="tw-faq-chip"
                          onClick={() => {
                            setSearchQuery(topic);
                            setActiveCategory('all');
                          }}
                        >
                          {topic}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="tw-faq-btn-reset"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                >
                  Clear Search & View All Questions
                </button>
              </div>
            ) : (
              /* Editorial Grouped Categories & Expandable Rows */
              <div className="tw-faq-groups-list">
                {groupedFaqs.map((group) => (
                  <section
                    key={group.category.id}
                    className="tw-faq-group-section"
                    aria-labelledby={`group-heading-${group.category.id}`}
                  >
                    {/* Category Header */}
                    <div className="tw-faq-group-header">
                      <div className="tw-faq-group-title-row">
                        <h2
                          id={`group-heading-${group.category.id}`}
                          className="tw-faq-group-title"
                        >
                          {group.category.name}
                        </h2>
                        <span className="tw-faq-group-count">
                          {group.items.length} {group.items.length === 1 ? 'question' : 'questions'}
                        </span>
                      </div>
                      <p className="tw-faq-group-desc">
                        {group.category.description}
                      </p>
                    </div>

                    {/* Expandable Rows */}
                    <div className="tw-faq-accordion-list">
                      {group.items.map((faq) => {
                        const isOpen = expandedQuestionId === faq.id;
                        return (
                          <article
                            key={faq.id}
                            id={`faq-item-${faq.id}`}
                            className={`tw-faq-row ${isOpen ? 'tw-faq-row--expanded' : ''}`}
                          >
                            <button
                              type="button"
                              id={`faq-btn-${faq.id}`}
                              className="tw-faq-row-trigger"
                              aria-expanded={isOpen}
                              aria-controls={`faq-body-${faq.id}`}
                              onClick={() => handleToggleQuestion(faq.id)}
                            >
                              <span className="tw-faq-row-question">
                                <HighlightedText
                                  text={faq.question}
                                  highlight={searchQuery}
                                />
                              </span>

                              {/* Refined Plus/Minus Interaction Indicator */}
                              <span
                                className={`tw-faq-row-indicator ${isOpen ? 'tw-faq-row-indicator--open' : ''}`}
                                aria-hidden="true"
                              >
                                <svg
                                  className="tw-faq-indicator-icon"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <line x1="12" y1="5" x2="12" y2="19" className="tw-faq-icon-v" />
                                  <line x1="5" y1="12" x2="19" y2="12" className="tw-faq-icon-h" />
                                </svg>
                              </span>
                            </button>

                            {/* Expandable Answer Panel */}
                            {isOpen && (
                              <div
                                id={`faq-body-${faq.id}`}
                                className="tw-faq-row-body"
                                role="region"
                                aria-labelledby={`faq-btn-${faq.id}`}
                              >
                                <div className="tw-faq-row-content">
                                  {faq.answer.split('\n\n').map((paragraph, pIdx) => (
                                    <p key={pIdx} className="tw-faq-row-paragraph">
                                      <HighlightedText
                                        text={paragraph}
                                        highlight={searchQuery}
                                      />
                                    </p>
                                  ))}

                                  {/* Refined Metadata Footer */}
                                  <footer className="tw-faq-row-footer">
                                    <div className="tw-faq-row-feedback">
                                      <span className="tw-faq-feedback-text">
                                        Was this answer helpful?
                                      </span>
                                      <div className="tw-faq-feedback-actions">
                                        <button
                                          type="button"
                                          className={`tw-faq-btn-feedback ${
                                            helpfulFeedback[faq.id] === 'yes'
                                              ? 'tw-faq-btn-feedback--active'
                                              : ''
                                          }`}
                                          onClick={(e) => handleFeedback(faq.id, 'yes', e)}
                                        >
                                          Yes
                                        </button>
                                        <button
                                          type="button"
                                          className={`tw-faq-btn-feedback ${
                                            helpfulFeedback[faq.id] === 'no'
                                              ? 'tw-faq-btn-feedback--active'
                                              : ''
                                          }`}
                                          onClick={(e) => handleFeedback(faq.id, 'no', e)}
                                        >
                                          Need More Info
                                        </button>
                                      </div>
                                    </div>

                                    <div className="tw-faq-row-tools">
                                      <button
                                        type="button"
                                        className="tw-faq-btn-copy"
                                        onClick={(e) => handleCopyLink(faq.id, e)}
                                        title="Copy link to this answer"
                                      >
                                        <svg
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          width="14"
                                          height="14"
                                          aria-hidden="true"
                                        >
                                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                        </svg>
                                        Share Link
                                      </button>
                                    </div>
                                  </footer>
                                </div>
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ==================================================================
            4. Bottom CTA Section (as requested)
            ================================================================== */}
        <section className="tw-faq-cta-wrap" aria-labelledby="faq-cta-heading">
          <div className="tw-faq-container">
            <div className="tw-faq-cta-box">
              <div className="tw-faq-cta-inner">
                <span className="tw-faq-cta-badge">GET IN TOUCH</span>
                <h2 id="faq-cta-heading" className="tw-faq-cta-heading">
                  Still Have Questions?
                </h2>
                <p className="tw-faq-cta-text">
                  Let’s discuss how Thinkwires can help you find the right talent
                  and workforce solutions.
                </p>
                <div className="tw-faq-cta-links">
                  <Link to="/contact" className="tw-faq-cta-btn-primary">
                    Talk to Our Team
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      width="16"
                      height="16"
                      aria-hidden="true"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                  <Link to="/services" className="tw-faq-cta-btn-secondary">
                    Explore Our Services
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="tw-faq-toast" role="status" aria-live="polite">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="16"
            height="16"
            aria-hidden="true"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Footer */}
      <Footer />
    </div>
  );
};

export default FaqPage;
