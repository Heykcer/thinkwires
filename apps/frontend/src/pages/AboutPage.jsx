import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAboutData, fallbackAboutData } from '../store/slices/aboutSlice';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import AboutHero from '../components/AboutComponents/AboutHero';
import AboutMissionVisionSection from '../components/AboutComponents/AboutMissionVisionSection';
import Philosophy from '../components/AboutComponents/Philosophy';
import LeadershipTeam from '../components/AboutComponents/LeadershipTeam';
import GrowthTimeline from '../components/AboutComponents/GrowthTimeline';
import Methodology from '../components/AboutComponents/Methodology';
import AboutCTA from '../components/AboutComponents/AboutCTA';

const AboutPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { data: rawData, status } = useSelector((state) => state.about || {});

  // Fallback to fallbackAboutData if redux state is empty or still initializing
  const aboutData =
    rawData && Object.keys(rawData).length > 0 ? rawData : fallbackAboutData;

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchAboutData());
    }
  }, [dispatch, status]);

  // Handle URL hash anchor scrolling (e.g. /about#mission-vision, /about#core-values)
  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const scrollToElement = () => {
        const element = document.getElementById(targetId);
        if (element) {
          if (window.__lenis) {
            window.__lenis.scrollTo(element, { offset: -90, duration: 1.2 });
          } else {
            const y = element.getBoundingClientRect().top + window.pageYOffset - 90;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
          return true;
        }
        return false;
      };

      // Try immediately, then retry after a short delay in case DOM elements are mounting
      if (!scrollToElement()) {
        const timer = setTimeout(scrollToElement, 150);
        return () => clearTimeout(timer);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.hash]);

  return (
    <div className="AboutPage-wrapper">
      <Helmet>
        <title>About Us | Thinkwires — Borderless Tech Talent & Workforce Advisory</title>
        <meta
          name="description"
          content="Learn about Thinkwires, our Mission, Vision, Core Values, executive leadership, and mission to deliver borderless engineering talent across the globe."
        />
        <meta
          property="og:title"
          content="About Thinkwires — Global Workforce Advisory"
        />
        <meta
          property="og:description"
          content="Learn about Thinkwires, our Mission, Vision, Core Values, executive leadership, and mission to deliver borderless engineering talent across the globe."
        />
        <meta property="og:image" content="https://thinkwires.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="About Thinkwires — Global Workforce Advisory"
        />
        <meta
          name="twitter:description"
          content="Learn about Thinkwires, our Mission, Vision, Core Values, executive leadership, and mission to deliver borderless engineering talent across the globe."
        />
        <meta name="twitter:image" content="https://thinkwires.com/og-image.jpg" />
      </Helmet>
      <Navbar />
      <main className="AboutPage-main" id="main-content">
        {/* 1. Hero Section with Integrated Key Value Metrics Bar */}
        <AboutHero
          data={aboutData.hero || aboutData.company}
          stats={aboutData.statsStrip || aboutData.stats}
        />

        {/* 2. Brand-New Mission, Vision, Core Values & Code of Conduct Sections */}
        <AboutMissionVisionSection />

        {/* 3. Our Core Philosophy (Deep Navy Editorial) */}
        <Philosophy data={aboutData.philosophy} />

        {/* 4. Executive Leadership Team (3+2 Arrangement) */}
        <LeadershipTeam
          data={aboutData.leadershipTeam || { members: aboutData.leadership }}
        />

        {/* 5. Chronicle of Execution / Our Growth Evolution (4 Milestone Cards) */}
        <GrowthTimeline data={aboutData.growthTimeline} />

        {/* 6. Methodology (Spec to Squad) */}
        <Methodology data={aboutData.methodology} />

        {/* 7. Strategy Consultation & Direct Operations Container */}
        <AboutCTA data={aboutData.ctaSection || aboutData.contact} />
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
