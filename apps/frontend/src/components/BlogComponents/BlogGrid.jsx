import React from 'react';
import BlogCard from './BlogCard';
import ScrollReveal from '../common/ScrollReveal';
import { SearchIcon } from '../../admin/AdminIcons';
import { BlogCardSkeleton } from '../common/Skeleton';

const BlogGrid = ({
  articles = [],
  isLoading = false,
  bookmarkedArticles = [],
  onBookmarkToggle,
  onReadClick,
  onResetFilters,
}) => {
  if (isLoading) {
    return (
      <div className="BlogGrid-container">
        <BlogCardSkeleton count={6} />
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="BlogGrid-emptyState">
        <div className="BlogGrid-emptyIcon">
          <SearchIcon size={32} color="#94A3B8" />
        </div>
        <h3 className="BlogGrid-emptyTitle">No Research Articles Found</h3>
        <p className="BlogGrid-emptyText">
          We couldn't find any articles matching your search query or selected
          category filter.
        </p>
        {onResetFilters && (
          <button onClick={onResetFilters} className="BlogGrid-emptyBtn">
            View All Research Papers
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="BlogGrid-container">
      {articles.map((article, idx) => (
        <ScrollReveal key={article.id} direction="up" delay={(idx % 3) * 0.1}>
          <BlogCard
            article={article}
            isBookmarked={bookmarkedArticles.includes(article.id)}
            onBookmarkToggle={onBookmarkToggle}
            onReadClick={onReadClick}
          />
        </ScrollReveal>
      ))}
    </div>
  );
};

export default BlogGrid;
