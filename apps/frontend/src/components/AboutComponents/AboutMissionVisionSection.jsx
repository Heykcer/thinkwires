import React from 'react';
import { Link } from 'react-router-dom';

/**
 * AboutMissionVisionSection
 * Comprehensive implementation of Thinkwires:
 * 1. Mission & Vision Section
 * 2. Core Values Section
 * 3. Individual Core Values
 * 4. Code of Conduct Section
 * 5. Professional Closing Section
 * Content sourced verbatim from "Mission & Vision of Company.docx"
 */

const CORE_VALUES = [
  {
    id: 'innovation',
    number: '01',
    name: 'Freedom to Innovate',
    subtitle: 'Innovation That Drives Progress',
    icon: 'lightbulb',
    iconModifier: 'innovation',
    description:
      'At Thinkwires, innovation inspires us to challenge conventional thinking, explore new possibilities, and embrace emerging technologies. We encourage creative ideas and forward-thinking solutions that address evolving business needs. By continuously learning, adapting, and improving, we empower our people and clients to stay ahead in a rapidly changing world.',
  },
  {
    id: 'excellence',
    number: '02',
    name: 'Passion to Excel',
    subtitle: 'Passion to Excel',
    icon: 'trending_up',
    iconModifier: 'excellence',
    description:
      'At Thinkwires, we approach every challenge with enthusiasm, determination, and a commitment to excellence. We strive to exceed expectations, embrace new opportunities, and deliver meaningful results for our clients and partners. Our passion for continuous improvement drives us to innovate, overcome challenges, and achieve shared success.',
  },
  {
    id: 'collaboration',
    number: '03',
    name: 'Success Through Collaboration',
    subtitle: 'For One Another',
    icon: 'groups',
    iconModifier: 'collaboration',
    description:
      'At Thinkwires, we believe great achievements begin with working together. We foster a culture of teamwork, mutual respect, and shared responsibility, where diverse ideas and skills come together to create meaningful solutions. By supporting one another, sharing knowledge, and building strong partnerships, we achieve common goals and create lasting value for our employees, clients, and business partners.',
  },
  {
    id: 'trust',
    number: '04',
    name: 'Trust Through Integrity',
    subtitle: 'We Build Trust Through Our Actions',
    icon: 'verified_user',
    iconModifier: 'trust',
    description:
      'At Thinkwires, we believe trust is earned through honesty, consistency, and accountability. We honor our commitments, communicate transparently, and treat every relationship with respect. By demonstrating integrity in our actions and delivering on our promises, we build lasting partnerships with our employees, clients, and business associates.',
  },
];

const CONDUCT_PILLARS = [
  {
    title: 'Honesty & Transparency',
    desc: 'Communicating clearly, providing factual disclosures, and ensuring all candidate vetting and client engagements remain strictly open and transparent.',
    icon: 'visibility',
  },
  {
    title: 'Accountability & Compliance',
    desc: 'Honoring commitments across global tax, payroll, and Employer of Record (EOR) statutory regulations in India, the US, and Canada.',
    icon: 'gavel',
  },
  {
    title: 'Mutual Respect & Inclusion',
    desc: 'Creating an equitable workplace and talent community where diverse ideas, technical backgrounds, and global perspectives are actively embraced.',
    icon: 'diversity_3',
  },
  {
    title: 'Excellence in Action',
    desc: 'Adhering to strict professional ethics, client data protection, non-disclosure agreements, and continuous quality delivery across every placement.',
    icon: 'verified',
  },
];

const AboutMissionVisionSection = () => {
  return (
    <div className="TW-AboutMV-wrapper">
      {/* ========================================================= */}
      {/* 1. MISSION & VISION SECTION */}
      {/* ========================================================= */}
      <section
        id="mission-vision"
        className="TW-AboutMV-mvSection"
        aria-label="Thinkwires Mission and Vision"
      >
        <div className="TW-AboutMV-container">
          <div className="TW-AboutMV-header">
            <div className="TW-AboutMV-badge">
              <span className="TW-AboutMV-badgeDot" />
              <span>PURPOSE &amp; HORIZON</span>
            </div>

            <h2 className="TW-AboutMV-mainTitle">
              Our Vision &amp; Mission
            </h2>

            <p className="TW-AboutMV-tagline">
              Thinkwires — People. Technology. Progress.
            </p>

            <p className="TW-AboutMV-introPara">
              Our Vision and Mission define our purpose and guide everything we
              do at Thinkwires. With a clear strategy and a commitment to
              excellence, we transform our goals into meaningful outcomes for
              our clients, partners, employees, and communities.
            </p>
          </div>

          {/* Two-Column Clean Cards for Mission & Vision */}
          <div className="TW-AboutMV-dualGrid">
            {/* Vision Card */}
            <article className="TW-AboutMV-card TW-AboutMV-card--vision">
              <div className="TW-AboutMV-cardTopStripe" />
              <div>
                <div className="TW-AboutMV-iconWrap">
                  <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
                    visibility
                  </span>
                </div>
                <span className="TW-AboutMV-cardLabel">
                  OUR COMMON VISION
                </span>
                <h3 className="TW-AboutMV-cardTitle">
                  Creating Value for a Better Tomorrow
                </h3>
                <p className="TW-AboutMV-cardSub">
                  Our Inspiration / Our Aspiration / Our Emotional Connection
                </p>
                <p className="TW-AboutMV-cardDesc">
                  We envision a future where people, technology and opportunities
                  come together to create sustainable growth and a lasting
                  positive impact.
                </p>
              </div>

              <div className="TW-AboutMV-cardFooter">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  auto_awesome
                </span>
                <span>Connecting People, Technology and Possibilities</span>
              </div>
            </article>

            {/* Mission Card */}
            <article className="TW-AboutMV-card TW-AboutMV-card--mission">
              <div className="TW-AboutMV-cardTopStripe" />
              <div>
                <div className="TW-AboutMV-iconWrap">
                  <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
                    track_changes
                  </span>
                </div>
                <span className="TW-AboutMV-cardLabel">
                  OUR COMMON MISSION
                </span>
                <h3 className="TW-AboutMV-cardTitle">
                  Our Technologies. Your Solutions. Powered by the Passion of Our People.
                </h3>
                <p className="TW-AboutMV-cardSub">
                  Our Passion / Our Connection
                </p>
                <p className="TW-AboutMV-cardDesc">
                  We deliver innovative solutions and build strong partnerships
                  by connecting the right talent with the right opportunities,
                  helping businesses grow and succeed.
                </p>
              </div>

              <div className="TW-AboutMV-cardFooter">
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  bolt
                </span>
                <span>Agile Talent Conduits Across Continents</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2 & 3. CORE VALUES SECTION & INDIVIDUAL VALUES */}
      {/* ========================================================= */}
      <section
        id="core-values"
        className="TW-AboutMV-valuesSection"
        aria-label="Thinkwires Core Values"
      >
        <div className="TW-AboutMV-container">
          <div className="TW-AboutMV-header" style={{ marginBottom: '2.5rem' }}>
            <div className="TW-AboutMV-badge">
              <span className="TW-AboutMV-badgeDot" />
              <span>STRONG VALUES. MEANINGFUL IMPACT.</span>
            </div>

            <h2 className="TW-AboutMV-mainTitle">
              Our Four Core Values
            </h2>

            <p className="TW-AboutMV-introPara">
              At Thinkwires, we believe that strong values are the foundation of
              lasting success. Our core values shape our culture, guide our
              decisions, and define how we work with our employees, clients, and
              business partners.
            </p>
            <p className="TW-AboutMV-introPara" style={{ marginTop: '0.85rem' }}>
              Innovation, Excellence, Collaboration, and Trust are at the heart
              of everything we do. These principles inspire us to embrace new
              ideas, pursue outstanding results, support one another, and build
              relationships grounded in integrity.
            </p>
          </div>

          {/* 4 Values Cards Grid */}
          <div className="TW-AboutMV-valuesGrid">
            {CORE_VALUES.map((val) => (
              <div key={val.id} className="TW-AboutMV-valueCard">
                <div
                  className={`TW-AboutMV-valIconBox TW-AboutMV-valIcon--${val.iconModifier}`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>
                    {val.icon}
                  </span>
                </div>

                <span className="TW-AboutMV-valNum">
                  Value {val.number}
                </span>

                <h3 className="TW-AboutMV-valTitle">
                  {val.name}
                </h3>

                <p className="TW-AboutMV-valSub">
                  {val.subtitle}
                </p>

                <p className="TW-AboutMV-valDesc">
                  {val.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. CODE OF CONDUCT SECTION */}
      {/* ========================================================= */}
      <section
        id="code-of-conduct"
        className="TW-AboutMV-conductSection"
        aria-label="Thinkwires Code of Conduct"
      >
        <div className="TW-AboutMV-container">
          {/* Hero Banner Card */}
          <div className="TW-AboutMV-conductHeroCard">
            <div className="TW-AboutMV-conductGlow" />

            <div className="TW-AboutMV-conductHeroBadge">
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                shield
              </span>
              <span>ETHICS &amp; GOVERNANCE</span>
            </div>

            <h2 className="TW-AboutMV-conductHeroTitle">
              Our Code of Conduct — Integrity in Every Action
            </h2>

            <p className="TW-AboutMV-conductHeroIntro">
              At Thinkwires, our Code of Conduct reflects our core values of
              Innovation, Excellence, Collaboration, and Trust. It guides us to
              act with honesty, integrity, and accountability in every decision
              and interaction.
            </p>

            <p className="TW-AboutMV-conductHeroClosing">
              By adhering to ethical standards, applicable laws, and company
              policies, we foster a culture of transparency and mutual respect.
              Together, we turn our values into action, strengthen
              relationships, and create lasting value for a better tomorrow.
            </p>
          </div>

          {/* Four Principles Grid */}
          <div className="TW-AboutMV-conductGrid">
            {CONDUCT_PILLARS.map((item, idx) => (
              <div key={idx} className="TW-AboutMV-conductItem">
                <div className="TW-AboutMV-conductIcon">
                  <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
                    {item.icon}
                  </span>
                </div>
                <h4 className="TW-AboutMV-conductItemTitle">{item.title}</h4>
                <p className="TW-AboutMV-conductItemDesc">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. PROFESSIONAL CLOSING SECTION */}
      {/* ========================================================= */}
      <section className="TW-AboutMV-closingSection" aria-label="Closing summary">
        <div className="TW-AboutMV-container">
          <div className="TW-AboutMV-closingCard">
            <span className="TW-AboutMV-closingTagline">
              PEOPLE. TECHNOLOGY. PROGRESS.
            </span>
            <h3 className="TW-AboutMV-closingHeading">
              Building a Future Where Talent Knows Zero Borders
            </h3>
            <p className="TW-AboutMV-closingText">
              We believe that when people share a common purpose and are guided
              by strong values, they can create innovative solutions, deliver
              meaningful outcomes, and build a better future together.
            </p>
            <div className="TW-AboutMV-closingButtons">
              <Link to="/contact" className="TW-AboutMV-btnPrimary">
                <span>Partner With Thinkwires</span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  arrow_forward
                </span>
              </Link>
              <Link to="/bench" className="TW-AboutMV-btnSecondary">
                <span>Explore Bench Pool</span>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  groups
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutMissionVisionSection;

