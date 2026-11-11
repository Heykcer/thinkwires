import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchOpenings } from '../../store/slices/homeSlice';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useMotionTemplate,
} from 'framer-motion';
import ApplyModal from '../common/ApplyModal';
import ScopeCallModal from '../common/ScopeCallModal';
import SkillSearchInput from '../common/SkillSearchInput';
import CyberGlobe from './CyberGlobe';

const SLIDE_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuA5nGnSn6TrjHRXk6Yrr1hngBL_Ptdje8dtE8juA2qY036lQqvHvN6avSAYmFKXi3Ws1s1GOGxDg1UJxSBPj1bormKO3GX6ikbORRKq0xiEnRjFfHJo92S4rMz1pkRIj6a5ttei2dUbSMuy8XDy119wvMZL2XWo1xcVcwOq7iaR0aXLZuhNnMM_WFqdq-qjIFA2YtN4dBM2z7SYgEFLd9VAlLdP7jvkhrd0JGOiVZuUwZkeI7SvLyKJQA',
  'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
];

const getCategoryIcon = (category = '', title = '') => {
  const text = `${category} ${title}`.toLowerCase();
  if (
    text.includes('ai') ||
    text.includes('genai') ||
    text.includes('data') ||
    text.includes('vision') ||
    text.includes('ml')
  )
    return 'smart_toy';
  if (
    text.includes('cloud') ||
    text.includes('devops') ||
    text.includes('k8s') ||
    text.includes('aws') ||
    text.includes('azure')
  )
    return 'cloud_sync';
  if (
    text.includes('sap') ||
    text.includes('enterprise') ||
    text.includes('ledger') ||
    text.includes('crm') ||
    text.includes('abap')
  )
    return 'terminal';
  if (
    text.includes('plm') ||
    text.includes('teamcenter') ||
    text.includes('embedded') ||
    text.includes('cad')
  )
    return 'precision_manufacturing';
  if (
    text.includes('stack') ||
    text.includes('web') ||
    text.includes('aem') ||
    text.includes('frontend') ||
    text.includes('developer')
  )
    return 'code';
  return 'work';
};

const getBadgeTheme = (badgeColor = '', idx = 0) => {
  const c = (badgeColor || '').toLowerCase();
  if (c.includes('green') || c.includes('emerald')) return 'emerald';
  if (c.includes('blue') || c.includes('cobalt')) return 'cobalt';
  if (c.includes('purple') || c.includes('cyan') || c.includes('teal'))
    return 'cyan';
  return idx % 3 === 0 ? 'emerald' : idx % 3 === 1 ? 'cobalt' : 'cyan';
};

const BRAND_PLACEHOLDER_SLIDES = [
  {
    id: 'hero-talent-stream',
    image: SLIDE_IMAGES[0],
    alt: 'Thinkwires Talent Cloud Dispatch',
    tag: 'TALENT DISPATCH ENGINE',
    liveBadgeText: 'Live Stream',
    badgeTheme: 'emerald',
    icon: 'terminal',
    title: 'High-Caliber Technical Specialists',
    subtitle: 'India • USA • Canada • Enterprise Engineering Nodes',
    metrics: ['Verified Openings', '48h Deployment SLA'],
    deployRole: 'Hire Top Tech Talent',
  },
];

const SLIDE_DURATION = 5000; // 5 seconds

// Staggered ingress animations for hero content
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

const NewHero = ({ onOpenModal }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { openings, status } = useSelector((state) => state.home);

  const heroRef = useRef(null);
  const [roleInput, setRoleInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [experienceInput, setExperienceInput] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Hire Top Tech Talent');

  // Fetch openings from single source if idle
  useEffect(() => {
    if (status.openings === 'idle') {
      dispatch(fetchOpenings());
    }
  }, [dispatch, status.openings]);

  // Dynamically map latest jobs from single source of truth (openings)
  const heroSlides = useMemo(() => {
    if (openings && openings.length > 0) {
      // Sort by priority and newest posted date
      const sorted = [...openings].sort((a, b) => {
        if (a.priority !== b.priority)
          return (a.priority || 99) - (b.priority || 99);
        return new Date(b.postedDate || 0) - new Date(a.postedDate || 0);
      });

      return sorted.slice(0, 4).map((job, idx) => ({
        id: `hero-job-${job.id || idx}`,
        image: SLIDE_IMAGES[idx % SLIDE_IMAGES.length],
        alt: `${job.title} - Enterprise Client (Confidential)`,
        tag: job.category || 'Direct Client Opening',
        liveBadgeText: job.badge || 'Verified Opening',
        badgeTheme: getBadgeTheme(job.badgeColor, idx),
        icon: getCategoryIcon(job.category, job.title),
        title: job.title,
        subtitle: `${job.location || 'Remote'} • ${job.experience || 'Experienced'} • Enterprise Client (Confidential)`,
        metrics: [
          job.salary || 'Market Premium',
          job.jobMode || 'Permanent',
          job.workMode || 'Hybrid',
          job.noticePeriod
            ? `Notice: ${job.noticePeriod}`
            : job.joining
              ? `Joining: ${job.joining}`
              : 'Immediate',
        ],
        deployRole: job.title,
      }));
    }
    return BRAND_PLACEHOLDER_SLIDES;
  }, [openings]);

  // Slideshow State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  // Motion Cursor Spotlight
  const mouseX = useMotionValue(400);
  const mouseY = useMotionValue(200);
  const smoothX = useSpring(mouseX, { damping: 25, stiffness: 120 });
  const smoothY = useSpring(mouseY, { damping: 25, stiffness: 120 });
  const spotlightBg = useMotionTemplate`radial-gradient(750px circle at ${smoothX}px ${smoothY}px, rgba(37, 99, 235, 0.08), transparent 80%)`;

  const handleHeroMouseMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  // 3D Tilt for Showcase Card
  const rotateXVal = useMotionValue(0);
  const rotateYVal = useMotionValue(0);
  const rotateX = useSpring(rotateXVal, { damping: 18, stiffness: 140 });
  const rotateY = useSpring(rotateYVal, { damping: 18, stiffness: 140 });

  const handleVisualMouseMove = (e) => {
    setIsPaused(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    rotateXVal.set(-y * 0.025);
    rotateYVal.set(x * 0.025);
  };

  const handleVisualMouseLeave = () => {
    setIsPaused(false);
    rotateXVal.set(0);
    rotateYVal.set(0);
  };

  const nextSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => (prev + 1) % heroSlides.length);
  }, [heroSlides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlideIndex(
      (prev) => (prev - 1 + heroSlides.length) % heroSlides.length
    );
  }, [heroSlides.length]);

  const goToSlide = (index) => {
    setCurrentSlideIndex(index);
  };

  // Auto-play slideshow timer
  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      nextSlide();
    }, SLIDE_DURATION);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextSlide]);

  const handleOpenModal = (roleTitle) => {
    setSelectedRole(roleTitle || 'Hire Top Tech Talent');
    if (onOpenModal) {
      onOpenModal(roleTitle || 'Hire Top Tech Talent');
    } else {
      setIsModalOpen(true);
    }
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (roleInput && roleInput.trim()) params.append('search', roleInput.trim());
    if (locationInput) params.append('location', locationInput);
    if (experienceInput) params.append('experience', experienceInput);

    navigate({
      pathname: '/bench',
      search: params.toString() ? `?${params.toString()}` : '',
    });
  };

  const handleHireTalent = (e) => {
    if (
      e?.defaultPrevented ||
      e?.button !== 0 ||
      e?.metaKey ||
      e?.ctrlKey ||
      e?.altKey ||
      e?.shiftKey
    ) {
      return;
    }
    e?.preventDefault();
    navigate('/talent-cloud');
  };

  const handleExploreJobs = (e) => {
    if (
      e?.defaultPrevented ||
      e?.button !== 0 ||
      e?.metaKey ||
      e?.ctrlKey ||
      e?.altKey ||
      e?.shiftKey
    ) {
      return;
    }
    e?.preventDefault();
    navigate('/hot-jobs');
  };

  const currentSlide = heroSlides[currentSlideIndex] || heroSlides[0];

  return (
    <>
      <section
        ref={heroRef}
        id="hero-section"
        className="NewHero-heroSection NewHero-section"
        onMouseMove={handleHeroMouseMove}
      >
        {/* Thinkwires 3D Transparent Network Globe in Hero Background: Positioned via CSS behind headline */}
        <CyberGlobe
          className="NewHero-globeBg"
          isBackground={true}
          height="100%"
          showFloor={false}
          globeOffsetX={-37}
          globeOffsetY={6}
          radius={35}
          showPolyhedra={false}
          showOrbitalRings={false}
          showPerimeterRim={false}
        />

        {/* OSS Dynamic Mouse-Tracking Spotlight */}
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 0,
            background: spotlightBg,
          }}
          aria-hidden="true"
        />

        {/* Ambient Glows */}
        <div
          className="NewHero-glowOrb NewHero-glowPrimary"
          aria-hidden="true"
        />
        <div className="NewHero-glowOrb NewHero-glowTeal" aria-hidden="true" />

        <div className="NewHero-container">
          {/* Main 2-Column Hero Grid with Staggered Motion */}
          <div className="NewHero-mainGrid">
            {/* Left Content Column */}
            <motion.div
              className="NewHero-contentCol"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Top Trust Micro-Badge with Glowing Pulse */}
              <motion.div
                variants={itemVariants}
                className="NewHero-trustBadge group cursor-default"
              >
                <span className="NewHero-pingWrapper">
                  <span className="NewHero-pingCircle" />
                  <span className="NewHero-pingDot" />
                </span>
                <span className="NewHero-badgeTitle">
                  BORDERLESS TALENT ENGINE
                </span>
                <span className="NewHero-badgeDivider">•</span>
                <span className="NewHero-badgeSubtitle">
                  India • USA • Canada Tech Corridors
                </span>
              </motion.div>

              <motion.h1 variants={itemVariants} className="NewHero-headline">
                Your Trusted Partner For{' '}
                <span className="NewHero-gradientText">
                  High-Quality IT Recruitment
                </span>{' '}
                &amp; Talent Augmentation
              </motion.h1>

              <motion.p variants={itemVariants} className="NewHero-description">
                Connecting enterprise engineering leaders with high-caliber skilled
                professionals and technology-driven solutions across{' '}
                <strong className="text-slate-900 font-semibold">Artificial Intelligence (AI)</strong>,{' '}
                <strong className="text-slate-900 font-semibold">Cloud Computing</strong>,{' '}
                <strong className="text-slate-900 font-semibold">Cybersecurity</strong>,{' '}
                <strong className="text-slate-900 font-semibold">Semiconductor</strong>,{' '}
                <strong className="text-slate-900 font-semibold">Engineering</strong>, and{' '}
                <strong className="text-slate-900 font-semibold">Digital Transformation</strong> within{' '}
                <strong className="text-primary font-semibold">48 to 72 hours</strong>.
              </motion.p>

              {/* Dual Action CTAs with Motion Physics */}
              <motion.div
                variants={itemVariants}
                className="NewHero-actionGroup"
              >
                <motion.a
                  href="/bench"
                  className="NewHero-btnPrimary"
                  onClick={handleHireTalent}
                  whileHover={{ scale: 1.025, y: -2 }}
                  whileTap={{ scale: 0.975 }}
                >
                  <span className="material-symbols-outlined NewHero-btnIcon">
                    person_add
                  </span>
                  <span>Deploy Bench Pool</span>
                </motion.a>

                <motion.a
                  href="/hot-jobs"
                  className="NewHero-btnSecondary"
                  onClick={handleExploreJobs}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Explore Hot Jobs</span>
                  <span className="material-symbols-outlined NewHero-btnIcon">
                    arrow_forward
                  </span>
                </motion.a>

                <motion.button
                  type="button"
                  className="NewHero-btnScoping"
                  onClick={() => setIsScopeModalOpen(true)}
                  whileHover={{ scale: 1.025, y: -2 }}
                  whileTap={{ scale: 0.975 }}
                >
                  <span className="material-symbols-outlined NewHero-btnIcon">
                    calendar_month
                  </span>
                  <span>Schedule Scoping Call</span>
                </motion.button>
              </motion.div>

              {/* Trust Metrics Bar */}
              <motion.div variants={itemVariants} className="NewHero-trustBar">
                <div className="NewHero-trustItem">
                  <span className="material-symbols-outlined NewHero-trustIcon NewHero-trustIconEmerald">
                    verified
                  </span>
                  <span className="NewHero-trustText">
                    3+ Years Industry Excellence
                  </span>
                </div>

                <div className="NewHero-trustItem">
                  <span className="material-symbols-outlined NewHero-trustIcon NewHero-trustIconCobalt">
                    bolt
                  </span>
                  <span className="NewHero-trustText">
                    48-Hr Fast Match SLA
                  </span>
                </div>

                <div className="NewHero-trustItem">
                  <span className="material-symbols-outlined NewHero-trustIcon NewHero-trustIconPrimary">
                    star
                  </span>
                  <span className="NewHero-trustText">
                    93% Enterprise Retention
                  </span>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Graphic & Telemetry Column (3D Motion Showcase) */}
            <motion.div
              className="NewHero-visualCol"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.7,
                delay: 0.2,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <motion.div
                className="NewHero-imageWrapper"
                style={{
                  perspective: 1000,
                  rotateX,
                  rotateY,
                }}
                onMouseMove={handleVisualMouseMove}
                onMouseLeave={handleVisualMouseLeave}
              >
                {/* Slideshow Background Image Layer with AnimatePresence Cross-fade */}
                <div className="NewHero-slideshowContainer">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide.id}
                      className="NewHero-slideItem active"
                      initial={{ opacity: 0, scale: 1.08 }}
                      animate={{ opacity: 1, scale: 1.0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <img
                        className="NewHero-heroImage"
                        src={currentSlide.image}
                        alt={currentSlide.alt}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>

                <div className="NewHero-imageGradientOverlay" />

                {/* Slideshow Top Navigation Bar */}
                <div className="NewHero-slideshowControls">
                  <div className="NewHero-slideCounter">
                    <span className="NewHero-currentNum">{`0${currentSlideIndex + 1}`}</span>
                    <span className="NewHero-counterSep">/</span>
                    <span className="NewHero-totalNum">{`0${heroSlides.length}`}</span>
                  </div>

                  {/* Navigation Arrows */}
                  <div className="NewHero-arrowGroup">
                    <motion.button
                      type="button"
                      className="NewHero-navArrowBtn"
                      onClick={prevSlide}
                      title="Previous Slide"
                      aria-label="Previous Slide"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                    >
                      <span className="material-symbols-outlined">
                        chevron_left
                      </span>
                    </motion.button>
                    <motion.button
                      type="button"
                      className="NewHero-navArrowBtn"
                      onClick={nextSlide}
                      title="Next Slide"
                      aria-label="Next Slide"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                    >
                      <span className="material-symbols-outlined">
                        chevron_right
                      </span>
                    </motion.button>
                  </div>
                </div>

                {/* Floating Live Dispatch Card with Gentle Levitation & Content Cross-fade */}
                <motion.div
                  className="NewHero-floatingCard"
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    duration: 4.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSlide.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="NewHero-floatingHeader">
                        <span className="NewHero-floatingTag">
                          {currentSlide.tag}
                        </span>
                        <span
                          className={`NewHero-floatingLiveBadge NewHero-badge-${currentSlide.badgeTheme}`}
                        >
                          <span className="NewHero-floatingPulseDot" />
                          {currentSlide.liveBadgeText}
                        </span>
                      </div>

                      <div className="NewHero-floatingBody">
                        <div className="NewHero-floatingIconSquircle">
                          <span className="material-symbols-outlined">
                            {currentSlide.icon}
                          </span>
                        </div>
                        <div className="NewHero-floatingText">
                          <p className="NewHero-floatingTitle">
                            {currentSlide.title}
                          </p>
                          <p className="NewHero-floatingSubtitle">
                            {currentSlide.subtitle}
                          </p>
                          <div className="NewHero-floatingPillRow">
                            {currentSlide.metrics.map((m, mIdx) => (
                              <span key={mIdx} className="NewHero-floatingPill">
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                        <motion.button
                          type="button"
                          className="NewHero-deployBtn"
                          onClick={() =>
                            handleOpenModal(currentSlide.deployRole)
                          }
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Deploy
                        </motion.button>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Slide Indicators & Auto-Timer Progress Bar */}
                  <div className="NewHero-indicatorsContainer">
                    <div className="NewHero-indicatorDots">
                      {heroSlides.map((_, dotIdx) => (
                        <button
                          key={dotIdx}
                          type="button"
                          className={`NewHero-indicatorDot ${dotIdx === currentSlideIndex ? 'active' : ''}`}
                          onClick={() => goToSlide(dotIdx)}
                          aria-label={`Go to slide ${dotIdx + 1}`}
                        />
                      ))}
                    </div>
                    {!isPaused && (
                      <div className="NewHero-progressBarWrapper">
                        <motion.div
                          key={currentSlideIndex}
                          className="NewHero-progressBarFill"
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{
                            duration: SLIDE_DURATION / 1000,
                            ease: 'linear',
                          }}
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>

          {/* Integrated Floating Talent Search Bar with Motion Reveal */}
          <motion.div
            className="NewHero-searchContainer"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.65,
              delay: 0.35,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <form className="NewHero-searchForm" onSubmit={handleSearchSubmit}>
              {/* Keyword / Role Field */}
              <div className="NewHero-searchField NewHero-searchFieldRole">
                <span className="material-symbols-outlined NewHero-searchIcon">
                  search
                </span>
                <div className="NewHero-inputBlock">
                  <label
                    htmlFor="hero-role-input"
                    className="NewHero-fieldLabel"
                  >
                    Role or Skill
                  </label>
                  <SkillSearchInput
                    id="hero-role-input"
                    className="NewHero-fieldInput"
                    wrapperClassName="NewHero-skillSearchWrap"
                    placeholder="e.g. SAP ABAP, AEM, Ledger..."
                    ariaLabel="Role or Skill"
                    value={roleInput}
                    onChange={(e) =>
                      setRoleInput(typeof e === 'string' ? e : e.target.value)
                    }
                    onSelect={(skill) => setRoleInput(skill)}
                  />
                </div>
              </div>

              {/* Location Selector */}
              <div className="NewHero-searchField NewHero-searchFieldLocation">
                <span className="material-symbols-outlined NewHero-searchIcon">
                  location_on
                </span>
                <div className="NewHero-inputBlock">
                  <label
                    htmlFor="hero-location-select"
                    className="NewHero-fieldLabel"
                  >
                    Location
                  </label>
                  <select
                    id="hero-location-select"
                    className="NewHero-fieldSelect"
                    aria-label="Location"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                  >
                    <option value="">
                      All Locations (India / US / Remote)
                    </option>
                    <option value="bangalore">Bangalore Hub</option>
                    <option value="remote">Remote / Borderless</option>
                    <option value="hyderabad">Hyderabad</option>
                    <option value="chennai">Chennai / Pune</option>
                    <option value="noida">Noida (HQ)</option>
                  </select>
                </div>
              </div>

              {/* Experience Selector */}
              <div className="NewHero-searchField NewHero-searchFieldExp">
                <span className="material-symbols-outlined NewHero-searchIcon">
                  layers
                </span>
                <div className="NewHero-inputBlock">
                  <label
                    htmlFor="hero-experience-select"
                    className="NewHero-fieldLabel"
                  >
                    Experience
                  </label>
                  <select
                    id="hero-experience-select"
                    className="NewHero-fieldSelect"
                    aria-label="Experience"
                    value={experienceInput}
                    onChange={(e) => setExperienceInput(e.target.value)}
                  >
                    <option value="">Any Seniority</option>
                    <option value="3-5">Mid-Senior (3 - 5 Years)</option>
                    <option value="8-12">
                      Lead / Specialist (8 - 12 Years)
                    </option>
                    <option value="15">
                      Staff / Principal Architect (15+ Years)
                    </option>
                  </select>
                </div>
              </div>

              {/* Search Submit Button */}
              <div className="NewHero-searchAction">
                <motion.button
                  type="submit"
                  className="NewHero-searchBtn"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <span className="material-symbols-outlined">search</span>
                  <span>Find Matches</span>
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Embedded Apply Modal for direct responsiveness */}
      <ApplyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        roleTitle={selectedRole}
      />

      {/* Enterprise Scoping Call Modal */}
      <ScopeCallModal
        isOpen={isScopeModalOpen}
        onClose={() => setIsScopeModalOpen(false)}
      />
    </>
  );
};

export default NewHero;
