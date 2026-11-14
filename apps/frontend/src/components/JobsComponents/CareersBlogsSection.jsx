import React, { useState } from 'react';
import { OFFICIAL_CAREER_BLOGS } from '../../data/careersData';

const CareersBlogsSection = () => {
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = [
    'All',
    'Wellness & Culture',
    'Campus & Early Careers',
    'Workplace Health',
    'Culture & Innovation',
    'Social Responsibility',
    'Total Rewards',
  ];

  const filteredArticles =
    activeCategory === 'All'
      ? OFFICIAL_CAREER_BLOGS
      : OFFICIAL_CAREER_BLOGS.filter((a) => a.category === activeCategory);

  return (
    <section id="career-blogs" className="CR-BlogsSection-root">
      <div className="CR-Container">
        {/* Section Header */}
        <div className="CR-SectionHeader text-center">
          <span className="CR-SectionPill">EDITORIAL INSIGHTS &amp; CULTURE</span>
          <h2 className="CR-SectionTitle">Career Blogs &amp; Tips</h2>
          <p className="CR-SectionSubtitle">
            Perspectives on sustainable engineering, workplace well-being, campus
            enablement, and life inside our global talent cloud.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="CR-BlogFilters-row">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`CR-BlogFilterBtn ${isActive ? 'CR-BlogFilterBtn--active' : ''}`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* 6 Official Articles Grid */}
        <div className="CR-BlogsGrid">
          {filteredArticles.map((article) => (
            <article
              key={article.id}
              className="CR-BlogCard-root"
              onClick={() => setSelectedArticle(article)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedArticle(article);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Read article: ${article.title}`}
            >
              {/* Thumbnail Image */}
              <div className="CR-BlogCard-imgWrapper">
                <img
                  src={article.image}
                  alt={article.title}
                  className="CR-BlogCard-img"
                  loading="lazy"
                />
                <span className="CR-BlogCard-categoryPill">{article.category}</span>
              </div>

              {/* Card Body */}
              <div className="CR-BlogCard-body">
                <div className="CR-BlogCard-metaRow">
                  <span>{article.date}</span>
                  <span className="CR-BlogCard-dotSep">•</span>
                  <span>{article.readTime}</span>
                </div>

                <h3 className="CR-BlogCard-title">{article.title}</h3>
                <p className="CR-BlogCard-excerpt">{article.excerpt}</p>

                <div className="CR-BlogCard-footer">
                  <span className="CR-BlogCard-readMore">
                    <span>Read Article</span>
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
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Interactive Article Reading Modal */}
      {selectedArticle && (
        <div
          className="CR-ModalBackdrop"
          onClick={() => setSelectedArticle(null)}
          role="dialog"
          aria-modal="true"
          aria-label={selectedArticle.title}
        >
          <div
            className="CR-ArticleModal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedArticle(null)}
              className="CR-ModalCloseBtn"
              aria-label="Close article modal"
            >
              ✕
            </button>

            <div className="CR-ArticleModal-header">
              <span className="CR-ArticleModal-category">
                {selectedArticle.category}
              </span>
              <h2 className="CR-ArticleModal-title">{selectedArticle.title}</h2>
              <div className="CR-ArticleModal-meta">
                <span>Published on {selectedArticle.date}</span>
                <span>•</span>
                <span>{selectedArticle.readTime}</span>
              </div>
            </div>

            <div className="CR-ArticleModal-heroImgWrapper">
              <img
                src={selectedArticle.image}
                alt={selectedArticle.title}
                className="CR-ArticleModal-heroImg"
              />
            </div>

            <div className="CR-ArticleModal-body">
              {selectedArticle.content.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="CR-ArticleModal-paragraph">
                  {paragraph}
                </p>
              ))}

              <div className="CR-ArticleModal-tags">
                {selectedArticle.tags.map((tag, i) => (
                  <span key={i} className="CR-ArticleModal-tagItem">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CareersBlogsSection;
