import React, { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchBenchData, setSearchQuery } from '../store/slices/benchSlice';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import BenchHero from '../components/BenchComponents/BenchHero';
import BenchFilterBar from '../components/BenchComponents/BenchFilterBar';
import BenchCandidateGrid from '../components/BenchComponents/BenchCandidateGrid';
import BenchDossierFeatures from '../components/BenchComponents/BenchDossierFeatures';
import BenchVettingGates from '../components/BenchComponents/BenchVettingGates';
import BenchRequisitionCTA from '../components/BenchComponents/BenchRequisitionCTA';
import BenchDossierDrawer from '../components/BenchComponents/BenchDossierDrawer';

const BenchPage = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const {
    talents,
    activeSpecialty,
    activeUrgency,
    activeNoticePeriod,
    activeExperience,
    activeLocation,
    sortBy,
    searchQuery,
    status,
  } = useSelector((state) => state.bench);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (status === 'idle') {
      dispatch(fetchBenchData());
    }
  }, [dispatch, status]);

  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q');
    if (q) {
      dispatch(setSearchQuery(q));
    }
  }, [searchParams, dispatch]);

  // Client-side filtering & sorting for instant responsiveness
  const filteredTalents = useMemo(() => {
    let result = [...(talents || [])];

    // Search query
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          (t.role && t.role.toLowerCase().includes(q)) ||
          (t.code && t.code.toLowerCase().includes(q)) ||
          (t.skills && t.skills.some((s) => s.toLowerCase().includes(q))) ||
          (t.proofQuote && t.proofQuote.toLowerCase().includes(q)) ||
          (t.location && t.location.toLowerCase().includes(q)) ||
          (t.noticePeriod && t.noticePeriod.toLowerCase().includes(q))
      );
    }

    // Specialty filter
    if (
      activeSpecialty &&
      activeSpecialty !== 'All Engineering' &&
      activeSpecialty !== 'All'
    ) {
      result = result.filter((t) => t.specialty === activeSpecialty);
    }

    // Urgency filter
    if (
      activeUrgency &&
      activeUrgency !== 'All Urgency' &&
      activeUrgency !== 'All'
    ) {
      result = result.filter((t) => t.urgency === activeUrgency);
    }

    // Notice Period filter (Issue #166)
    if (
      activeNoticePeriod &&
      activeNoticePeriod !== 'All Notice Periods' &&
      activeNoticePeriod !== 'All Notice' &&
      activeNoticePeriod !== 'All'
    ) {
      const filterTarget = activeNoticePeriod.toString().toLowerCase().trim();
      result = result.filter((t) => {
        const raw =
          t.noticePeriod !== undefined && t.noticePeriod !== null
            ? t.noticePeriod
            : t.urgency;

        if (raw === undefined || raw === null) return false;

        const str = raw.toString().toLowerCase().trim();
        const getDays = (val) => {
          if (typeof val === 'number') return val;
          if (!val) return 0;
          const s = val.toString().toLowerCase().trim();
          if (
            s.includes('immediate') ||
            s.includes('24h') ||
            s.includes('48h') ||
            s.includes('ready')
          )
            return 0;
          const m = s.match(/\d+/);
          if (m) {
            const n = parseInt(m[0], 10);
            if (s.includes('week')) return n * 7;
            if (s.includes('month')) return n * 30;
            return n;
          }
          return 999;
        };

        const days = getDays(raw);

        // Immediate (48h) toggle
        if (
          filterTarget.includes('48h') ||
          filterTarget === 'immediate (48h)' ||
          filterTarget === 'immediate'
        ) {
          return (
            days <= 2 ||
            str.includes('immediate') ||
            str.includes('24h') ||
            str.includes('48h')
          );
        }

        // Within 7 Days toggle
        if (filterTarget.includes('7') || filterTarget.includes('week')) {
          return days <= 7;
        }

        // Within 15 Days toggle
        if (filterTarget.includes('15') || filterTarget.includes('2 weeks')) {
          return days <= 15;
        }

        // If filtering by 30 days
        if (
          filterTarget === '30 days' ||
          filterTarget === '30' ||
          filterTarget === '30-day' ||
          filterTarget === '30 day' ||
          filterTarget === 'within 30 days' ||
          filterTarget === '30-day notice'
        ) {
          if (typeof raw === 'number') {
            return raw === 30;
          }
          if (str.includes('60') || str.includes('90') || str.includes('15')) {
            return false;
          }
          return (
            str === '30' ||
            str === '30 days' ||
            str === '30-day' ||
            str === '30 days notice' ||
            str.includes('30')
          );
        }

        // Generic matching for other options like '60 Days', etc.
        return str === filterTarget || str.includes(filterTarget);
      });
    }

    // Experience filter
    if (
      activeExperience &&
      activeExperience !== 'All Experience' &&
      activeExperience !== 'All'
    ) {
      result = result.filter((t) => t.experienceLevel === activeExperience);
    }

    // Location filter
    if (
      activeLocation &&
      activeLocation !== 'All Locations' &&
      activeLocation !== 'All'
    ) {
      result = result.filter((t) => t.location === activeLocation);
    }

    // Helper to extract actual AI assessment score from backend data
    const getAiScore = (candidate) => {
      if (typeof candidate.assessmentScore === 'number' && !isNaN(candidate.assessmentScore)) {
        return candidate.assessmentScore;
      }
      if (candidate.rubric && typeof candidate.rubric.systemDesign === 'number') {
        return candidate.rubric.systemDesign;
      }
      if (candidate.dossier?.rubric?.systemDesign) {
        const parsed = parseInt(candidate.dossier.rubric.systemDesign, 10);
        if (!isNaN(parsed)) return parsed;
      }
      return null;
    };

    // Sorting (AI Assessment as primary default)
    if (sortBy === 'AI Assessment') {
      result.sort((a, b) => {
        const scoreA = getAiScore(a);
        const scoreB = getAiScore(b);

        const hasScoreA = scoreA !== null;
        const hasScoreB = scoreB !== null;

        // Candidates without valid scores appear after scored candidates
        if (hasScoreA && !hasScoreB) return -1;
        if (!hasScoreA && hasScoreB) return 1;
        if (!hasScoreA && !hasScoreB) return (b.score || 0) - (a.score || 0);

        // Descending sorting: highest score -> lowest score
        return scoreB - scoreA;
      });
    } else if (sortBy === 'Highest Score') {
      result.sort((a, b) => b.score - a.score);
    } else if (sortBy === 'Fastest Availability') {
      const urgencyOrder = {
        'Immediate (24-48h)': 1,
        'Immediate': 1,
        'Within 1 Week': 2,
        'Within 2 Weeks': 3,
        '30 Days': 4,
        '60 Days': 5,
        '90 Days': 6,
      };
      result.sort(
        (a, b) =>
          (urgencyOrder[a.noticePeriod || a.urgency] || 99) -
          (urgencyOrder[b.noticePeriod || b.urgency] || 99)
      );
    } else if (sortBy === 'Lowest Rate') {
      result.sort((a, b) => {
        const rateA = parseInt((a.hourlyRate || '').replace(/[^0-9]/g, '')) || 0;
        const rateB = parseInt((b.hourlyRate || '').replace(/[^0-9]/g, '')) || 0;
        return rateA - rateB;
      });
    }

    return result;
  }, [
    talents,
    searchQuery,
    activeSpecialty,
    activeUrgency,
    activeNoticePeriod,
    activeExperience,
    activeLocation,
    sortBy,
  ]);

  return (
    <div className="BenchPage-root">
      <Helmet>
        <title>Talent Cloud & Ready Bench | Thinkwires</title>
        <meta
          name="description"
          content="Deploy pre-vetted, immediate-joiner senior software engineers and cloud architects from the Thinkwires Talent Cloud within 48 hours."
        />
        <meta
          property="og:title"
          content="Ready Talent Bench & Talent Cloud | Thinkwires"
        />
        <meta
          property="og:description"
          content="Deploy pre-vetted, immediate-joiner senior software engineers and cloud architects from the Thinkwires Talent Cloud within 48 hours."
        />
        <meta property="og:image" content="https://thinkwires.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Ready Talent Bench & Talent Cloud | Thinkwires"
        />
        <meta
          name="twitter:description"
          content="Deploy pre-vetted, immediate-joiner senior software engineers and cloud architects from the Thinkwires Talent Cloud."
        />
        <meta name="twitter:image" content="https://thinkwires.com/og-image.jpg" />
      </Helmet>
      <Navbar />

      <main className="BenchPage-main">
        {/* Hero Section */}
        <BenchHero />

        {/* Bench Explorer Console (Filtered List & Grid) */}
        <section className="BenchExplorer-section">
          <div className="BenchExplorer-container">
            <BenchFilterBar totalCount={filteredTalents.length} />
            <BenchCandidateGrid
              talents={filteredTalents}
              totalCount={filteredTalents.length}
            />
          </div>
        </section>

        {/* What's Inside a Technical Dossier */}
        <BenchDossierFeatures />

        {/* 3-Tier Technical Gate Funnel */}
        <BenchVettingGates />

        {/* Custom Pod Requisition CTA */}
        <BenchRequisitionCTA />
      </main>

      <Footer />

      {/* Flyout Slide-over Dossier Drawer */}
      <BenchDossierDrawer />
    </div>
  );
};

export default BenchPage;
