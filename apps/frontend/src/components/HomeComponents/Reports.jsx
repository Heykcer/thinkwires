import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchReports } from '../../store/slices/homeSlice';

const Reports = () => {
  const dispatch = useDispatch();
  const { reports: reportsData, status } = useSelector((state) => state.home);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardsPerView, setCardsPerView] = useState(3);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (status.reports === 'idle') {
      dispatch(fetchReports());
    }
  }, [dispatch, status.reports]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setCardsPerView(1);
      } else if (window.innerWidth < 1024) {
        setCardsPerView(2);
      } else {
        setCardsPerView(3);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalReports = reportsData?.length || 0;
  const maxIndex = Math.max(0, totalReports - cardsPerView);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    if (distance > 50) {
      nextSlide();
    } else if (distance < -50) {
      prevSlide();
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  useEffect(() => {
    if (isPaused || totalReports <= cardsPerView) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      nextSlide();
    }, 7000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, totalReports, cardsPerView, maxIndex]);

  return (
    <section
      className="Reports-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="Reports-container">
        <div className="Reports-header">
          <div className="Reports-headerLeft">
            <span className="Reports-tag">TALENT ADVISORY INSIGHTS</span>
            <h2 className="Reports-title">
              Our Latest Tech &amp; Market Reports
            </h2>
          </div>
          <div className="Reports-headerRight">
            <Link to="/blog" className="Reports-browseLink">
              <span>Browse All Articles</span>
              <span className="material-symbols-outlined">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>

        {/* Carousel Slider Viewport */}
        <div
          className="Reports-sliderWrapper"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <motion.div
            className="Reports-sliderTrack"
            animate={{
              x: `calc(-${currentIndex} * ((100% + 24px) / ${cardsPerView}))`,
            }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 30,
            }}
          >
            {reportsData.map((report) => (
              <div
                key={report.id}
                className="Reports-slide"
                style={{
                  width:
                    cardsPerView === 1
                      ? '100%'
                      : cardsPerView === 2
                      ? 'calc((100% - 24px) / 2)'
                      : 'calc((100% - 48px) / 3)',
                }}
              >
                <div className="Reports-card">
                  <div className="Reports-imageContainer">
                    <img
                      src={report.image}
                      alt={report.title}
                      className="Reports-image"
                      loading="lazy"
                    />
                    <span className="Reports-tagBadge">
                      {report.tag}
                    </span>
                  </div>
                  <div className="Reports-content">
                    <span className="Reports-date">
                      {report.date}
                    </span>
                    <h3 className="Reports-cardTitle">
                      {report.title}
                    </h3>
                    <p className="Reports-cardDesc">
                      {report.desc}
                    </p>
                    <div className="Reports-footer">
                      <Link to="/blog" className="Reports-readLink">
                        <span>Read Analysis</span>
                        <span className="material-symbols-outlined">
                          arrow_forward
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Pagination Dots */}
        {maxIndex > 0 && (
          <div className="Reports-dotsIndicator">
            {Array.from({ length: maxIndex + 1 }).map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => setCurrentIndex(dotIdx)}
                aria-label={`Go to reports group ${dotIdx + 1}`}
                className={`Reports-dot ${
                  currentIndex === dotIdx ? 'Reports-dot--active' : ''
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
