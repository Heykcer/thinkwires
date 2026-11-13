import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import BlogHero from '../components/BlogComponents/BlogHero';
import BlogFilters from '../components/BlogComponents/BlogFilters';
import { CloseIcon, StarIcon } from '../admin/AdminIcons';
import API_BASE from '../utils/apiConfig';

import {
  setSearchQuery,
  setSelectedCategory,
  setCurrentPage,
  toggleBookmark,
  fetchArticles,
  fetchFeaturedArticle,
  fetchResearchers,
  subscribeNewsletter,
} from '../store/slices/blogSlice';

const FeaturedArticle = lazy(
  () => import('../components/BlogComponents/FeaturedArticle')
);
const BlogGrid = lazy(() => import('../components/BlogComponents/BlogGrid'));
const BlogPagination = lazy(
  () => import('../components/BlogComponents/BlogPagination')
);
const ResearchCollective = lazy(
  () => import('../components/BlogComponents/ResearchCollective')
);
const NewsletterCTA = lazy(
  () => import('../components/BlogComponents/NewsletterCTA')
);
const ContactCTA = lazy(
  () => import('../components/BlogComponents/ContactCTA')
);

import {
  FeaturedArticleSkeleton,
  BlogCardSkeleton,
} from '../components/common/Skeleton';

const BlogSectionLoader = () => (
  <div
    className="blog-container"
    style={{
      padding: '2rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '3rem',
    }}
  >
    <FeaturedArticleSkeleton />
    <div className="BlogGrid-container">
      <BlogCardSkeleton count={6} />
    </div>
  </div>
);

// Map of URL ?category= param values → BlogFilters category keys
const CATEGORY_PARAM_MAP = {
  'talent-strategy': 'Talent Strategy',
  'talent+strategy': 'Talent Strategy',
  'talent strategy': 'Talent Strategy',
  'ai-tech-trends': 'AI & Tech Trends',
  'ai+tech+trends': 'AI & Tech Trends',
  'ai & tech trends': 'AI & Tech Trends',
  'gcc-economics': 'GCC Economics',
  'gcc+economics': 'GCC Economics',
  'gcc economics': 'GCC Economics',
  'case-studies': 'Case Studies',
  'case+studies': 'Case Studies',
  'case studies': 'Case Studies',
};

// Helper to parse and render paragraphs & markdown images: ![caption](url)
const renderArticleContent = (content) => {
  if (!content) return null;
  const blocks = String(content).split(/\n\n+/).filter((p) => p.trim() !== '');

  return blocks.map((block, idx) => {
    const trimmed = block.trim();
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      const [, alt, src] = imgMatch;
      return (
        <figure
          key={idx}
          style={{
            margin: '1.5rem 0',
            textAlign: 'center',
            backgroundColor: '#F8FAFC',
            padding: '0.75rem',
            borderRadius: '12px',
          }}
        >
          <img
            src={src}
            alt={alt || 'Blog illustration'}
            style={{
              maxWidth: '100%',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
              maxHeight: '450px',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto',
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          {alt && (
            <figcaption
              style={{
                fontSize: '0.8rem',
                color: 'var(--color-outline)',
                marginTop: '0.5rem',
                fontStyle: 'italic',
              }}
            >
              {alt}
            </figcaption>
          )}
        </figure>
      );
    }
    return (
      <p
        key={idx}
        style={{
          lineHeight: '1.8',
          color: 'var(--color-on-surface-variant)',
          marginBottom: '1rem',
          whiteSpace: 'pre-line',
        }}
      >
        {block}
      </p>
    );
  });
};

const BlogPage = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const {
    articles,
    featuredArticle,
    researchers,
    searchQuery,
    selectedCategory,
    currentPage,
    itemsPerPage,
    newsletterSubmitted,
    bookmarkedArticles,
    status,
  } = useSelector((state) => state.blog);

  const [activeArticleModal, setActiveArticleModal] = useState(null);

  const handleArticleClick = async (art) => {
    if (!art) return;
    setActiveArticleModal(art);
    // If body or content isn't loaded (e.g. pruned in listing endpoint), fetch full article
    if (!art.body && !art.content) {
      try {
        const id = art.slug || art.articleId || art.id || art._id;
        const res = await fetch(`${API_BASE}/articles/${encodeURIComponent(id)}`);
        if (res.ok) {
          const fullArt = await res.json();
          setActiveArticleModal((current) =>
            current &&
            (current.id === art.id ||
              current.slug === art.slug ||
              current._id === art._id)
              ? { ...current, ...fullArt }
              : current
          );
        }
      } catch {
        // Fallback silently to existing preview
      }
    }
  };

  // Handle ?category= URL param — map to a known BlogFilters key
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      const normalised = categoryParam.toLowerCase();
      const mapped =
        CATEGORY_PARAM_MAP[normalised] ||
        CATEGORY_PARAM_MAP[normalised.replace(/\+/g, ' ')] ||
        null;
      if (mapped) {
        dispatch(setSelectedCategory(mapped));
      }
    }
  }, [searchParams, dispatch]);

  // Handle ?article= URL param — open the matching article in the reader modal
  useEffect(() => {
    const articleParam = searchParams.get('article');
    if (!articleParam) return;
    const target = articles.find(
      (a) =>
        String(a.id) === articleParam ||
        a.slug === articleParam ||
        a.title?.toLowerCase().includes(articleParam.toLowerCase())
    );
    if (target) {
      // Defer to avoid synchronous setState-in-effect lint warning
      setTimeout(() => handleArticleClick(target), 0);
    } else if (
      featuredArticle &&
      (articleParam === 'featured-flagship-1' ||
        String(featuredArticle.id) === articleParam ||
        featuredArticle.slug === articleParam ||
        featuredArticle.title?.toLowerCase().includes(articleParam.toLowerCase()))
    ) {
      setTimeout(() => handleArticleClick(featuredArticle), 0);
    }
  }, [searchParams, articles, featuredArticle]);

  useEffect(() => {
    dispatch(fetchArticles({ q: searchQuery, category: selectedCategory }));
    dispatch(fetchFeaturedArticle());
    dispatch(fetchResearchers());
  }, [dispatch, searchQuery, selectedCategory]);

  // Filter articles dynamically
  const filteredArticles = articles.filter((art) => {
    if (art.featured) return false;

    // "Talent Strategy" filter also includes report-adjacent categories and badges
    const isTalentStrategyFilter = selectedCategory === 'Talent Strategy';
    const talentStrategyAdjacent =
      isTalentStrategyFilter &&
      (art.category === 'IT Job Market Reports' ||
        art.category === 'Recruitment Operations' ||
        art.category === 'Workforce Culture' ||
        art.badge === 'Market Report' ||
        art.badge === 'Talent Ops Audit' ||
        art.badge === 'AI Recruitment');

    const matchesCategory =
      selectedCategory === 'all' ||
      selectedCategory === 'All' ||
      selectedCategory === 'All Insights' ||
      selectedCategory.startsWith('All Insights') ||
      art.category === selectedCategory ||
      art.badge === selectedCategory ||
      talentStrategyAdjacent;

    const matchesSearch =
      searchQuery.trim() === '' ||
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.author?.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalInsightsCount = articles.filter((art) => !art.featured).length;

  return (
    <div className="BlogPage-wrapper">
      <Helmet>
        <title>Insights & Blog | Thinkwires — Tech Talent & Engineering Trends</title>
        <meta
          name="description"
          content="Explore insights, hiring strategies, engineering culture, and global workforce intelligence from the Thinkwires engineering team."
        />
        <meta
          property="og:title"
          content="Engineering Insights & Tech Trends | Thinkwires"
        />
        <meta
          property="og:description"
          content="Explore insights, hiring strategies, engineering culture, and global workforce intelligence from the Thinkwires engineering team."
        />
        <meta property="og:image" content="https://thinkwires.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Engineering Insights & Tech Trends | Thinkwires"
        />
        <meta
          name="twitter:description"
          content="Explore insights, hiring strategies, engineering culture, and global workforce intelligence from the Thinkwires engineering team."
        />
        <meta name="twitter:image" content="https://thinkwires.com/og-image.jpg" />
      </Helmet>
      <Navbar />

      <main className="BlogPage-main">
        {/* 1. Hero Section */}
        <BlogHero />

        <Suspense fallback={<BlogSectionLoader />}>
          {/* 2. Featured Flagship Paper */}
          <FeaturedArticle
            article={featuredArticle}
            isBookmarked={bookmarkedArticles.includes(featuredArticle?.id)}
            onBookmarkToggle={(id) => dispatch(toggleBookmark(id))}
            onReadClick={handleArticleClick}
          />

          {/* 3. Figma Category Filter Bar */}
          <BlogFilters
            searchQuery={searchQuery}
            setSearchQuery={(q) => dispatch(setSearchQuery(q))}
            selectedCategory={selectedCategory}
            setSelectedCategory={(cat) => dispatch(setSelectedCategory(cat))}
            totalResults={filteredArticles.length}
            totalArticles={totalInsightsCount}
          />

          {/* 4. Articles Grid & Pagination */}
          <section className="BlogPage-gridSection blog-container">
            <BlogGrid
              articles={paginatedArticles}
              isLoading={status === 'loading'}
              bookmarkedArticles={bookmarkedArticles}
              onBookmarkToggle={(id) => dispatch(toggleBookmark(id))}
              onReadClick={handleArticleClick}
              onResetFilters={() => {
                dispatch(setSearchQuery(''));
                dispatch(setSelectedCategory('all'));
              }}
            />

            <BlogPagination
              currentPage={currentPage}
              totalItems={filteredArticles.length}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => dispatch(setCurrentPage(page))}
            />
          </section>

          {/* 5. Our Research Collective */}
          <ResearchCollective researchers={researchers} />

          <NewsletterCTA
            isSubmitted={newsletterSubmitted}
            onSubmit={(data) => dispatch(subscribeNewsletter(data))}
          />

          {/* 7. Industry Trend Contact Banner */}
          <ContactCTA />
        </Suspense>
      </main>

      {/* 8. Footer */}
      <Footer />

      {/* Reader Modal */}
      {activeArticleModal && (
        <div
          className="BlogPage-modalOverlay"
          onClick={() => setActiveArticleModal(null)}
        >
          <div
            className="BlogPage-modalContent"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveArticleModal(null)}
              className="BlogPage-modalCloseBtn"
              aria-label="Close reader"
            >
              <CloseIcon size={16} />
            </button>
            <div className="BlogPage-modalHeader">
              <span className="BlogPage-modalCategory">
                {activeArticleModal.badge || activeArticleModal.category}
              </span>
              <h2>{activeArticleModal.title}</h2>
              <div className="BlogPage-modalAuthor">
                {activeArticleModal.author?.avatar ? (
                  <img
                    src={activeArticleModal.author.avatar}
                    alt={activeArticleModal.author.name}
                  />
                ) : (
                  <div className="FigmaBlogCard-initialsBubble">
                    {activeArticleModal.author?.initials || 'TW'}
                  </div>
                )}
                <div>
                  <strong>{activeArticleModal.author?.name}</strong> •{' '}
                  {activeArticleModal.author?.role || activeArticleModal.subCategory || 'Contributor'}
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--color-outline)',
                    }}
                  >
                    Published on {activeArticleModal.publishedAt ? new Date(activeArticleModal.publishedAt).toLocaleDateString() : 'Recent'} •{' '}
                    {activeArticleModal.readTime || '4 min read'}
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Image Banner */}
            {activeArticleModal.featuredImageUrl && (
              <div style={{ marginBottom: '1.5rem', borderRadius: '12px', overflow: 'hidden' }}>
                <img
                  src={activeArticleModal.featuredImageUrl}
                  alt={activeArticleModal.title}
                  style={{ width: '100%', maxHeight: '340px', objectFit: 'cover', display: 'block' }}
                />
              </div>
            )}

            <div className="BlogPage-modalBody">
              {activeArticleModal.body || activeArticleModal.content ? (
                <>
                  {(activeArticleModal.excerpt || activeArticleModal.summary) && (
                    <p
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: '500',
                        color: 'var(--color-on-surface)',
                        lineHeight: '1.7',
                        marginBottom: '1.5rem',
                      }}
                    >
                      {activeArticleModal.excerpt || activeArticleModal.summary}
                    </p>
                  )}
                  {renderArticleContent(activeArticleModal.body || activeArticleModal.content)}
                </>
              ) : (activeArticleModal.excerpt || activeArticleModal.summary) ? (
                <p
                  style={{
                    lineHeight: '1.8',
                    color: 'var(--color-on-surface-variant)',
                    fontSize: '1.05rem',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {activeArticleModal.excerpt || activeArticleModal.summary}
                </p>
              ) : (
                <p
                  style={{
                    lineHeight: '1.8',
                    color: 'var(--color-on-surface-variant)',
                    fontStyle: 'italic',
                  }}
                >
                  No content available for this article.
                </p>
              )}
            </div>
            <div className="BlogPage-modalFooter">
              <button
                onClick={() => dispatch(toggleBookmark(activeArticleModal.id))}
                className="BlogPage-modalBookmarkBtn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <StarIcon
                  size={14}
                  filled={bookmarkedArticles.includes(activeArticleModal.id)}
                  color="currentColor"
                />
                <span>
                  {bookmarkedArticles.includes(activeArticleModal.id)
                    ? 'Bookmarked'
                    : 'Bookmark Article'}
                </span>
              </button>
              <button
                onClick={() => setActiveArticleModal(null)}
                className="BlogPage-modalDoneBtn"
              >
                Close Reader
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogPage;
