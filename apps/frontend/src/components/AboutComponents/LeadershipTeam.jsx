import React from 'react';
import SectionBadge from '../common/SectionBadge';
import ScrollReveal from '../common/ScrollReveal';

const DEFAULT_MEMBERS = [
  {
    id: 'leader-1',
    initials: 'NH',
    avatarVariant: 'primary-fixed',
    image: '/images/team/naziya-husain.jpg',
    badgeText: '14+ Yrs Exp',
    badgeDotColor: 'cobalt',
    name: 'Naziya Husain',
    role: 'Founder Member',
    bio: 'With over 14 years in recruitment, headhunting, talent mapping, and end-to-end manpower solutions, Naziya has successfully steered complex mandates across KPOs, top-tier management consulting firms, and fast-scaling digital startups.',
    footerTag: 'Talent Mapping & Manpower',
    linkedinUrl: 'https://www.linkedin.com/company/thinkwires-technology',
    colSpan: 1,
  },
  {
    id: 'leader-2',
    initials: 'AB',
    avatarVariant: 'secondary-container',
    image: '/images/team/anju-balyan.jpg',
    badgeText: '17+ Yrs Exp',
    badgeDotColor: 'cobalt',
    name: 'Anju Balyan',
    role: 'Co-Founder & Associate Executive Director',
    bio: 'Enthusiastic enterprise HR leader with 17 years aligning HR initiatives with tier-one business priorities. Specialist in shared services environments, transitions, legal frameworks, ERP rollouts, and HR automation systems.',
    footerTag: 'ERP Implementations & Ops',
    linkedinUrl: 'https://www.linkedin.com/company/thinkwires-technology',
    colSpan: 1,
  },
  {
    id: 'leader-3',
    initials: 'AM',
    avatarVariant: 'tertiary-fixed',
    image: '/images/team/ananya-mehta.jpg',
    badgeText: 'Executive Search',
    badgeDotColor: 'emerald',
    name: 'Ananya Mehta',
    role: 'Chief Executive Officer (CEO)',
    bio: 'Dedicated to building teams that drive real business velocity. Expert in strategic talent research, executive search, deep candidate evaluation beyond CVs, and structuring high-trust leadership placements for global scale.',
    footerTag: 'Strategic Sourcing & Growth',
    linkedinUrl: 'https://www.linkedin.com/company/thinkwires-technology',
    colSpan: 1,
  },
  {
    id: 'leader-4',
    initials: 'AV',
    avatarVariant: 'surface-high',
    image: '/images/team/arjun-verma.jpg',
    badgeText: '20+ Yrs Exp',
    badgeDotColor: 'cobalt',
    name: 'Arjun Verma',
    role: 'Chief People & Marketing Officer (CPO & CMO)',
    bio: 'A 20-year veteran at the intersection of talent acquisition, organizational culture, and brand positioning. Focused on solving why high-growth enterprises struggle to hire and how elite culture transforms product velocity.',
    footerTag: 'People Strategy & Brand',
    linkedinUrl: 'https://www.linkedin.com/company/thinkwires-technology',
  },
  {
    id: 'leader-5',
    initials: 'MI',
    avatarVariant: 'primary-container',
    image: '/images/team/meera-iyer.jpg',
    badgeText: 'Global TA & Ops',
    badgeDotColor: 'emerald',
    companies: ['BlackRock', 'Microsoft', 'IBM', 'Infosys'],
    name: 'Meera Iyer',
    role: 'Senior Director - Global Head of TA Operations & HR Services',
    bio: 'Strategic Talent Acquisition and HR Operations executive who has built scalable, technology-driven recruitment frameworks across enterprise leaders including BlackRock, Microsoft, IBM, Ameriprise, and Infosys. Ensures institutional governance, risk mitigation, compliance, and flawless multi-region operations.',
    footerTag: 'Global Delivery Operations & Risk Governance',
    linkedinUrl: 'https://www.linkedin.com/company/thinkwires-technology',
  },
];

const LeadershipTeam = ({ data }) => {
  const {
    eyebrow = 'EXECUTIVE GOVERNANCE',
    heading = 'Meet Our Leadership Team',
    subheading = 'Driving cross-border vision, recruitment architecture, and operational integrity across global tech corridors.',
    members = [],
  } = data || {};

  // Map incoming data to Stitch structure while ensuring exact 5-person 3+2 layout
  const resolvedMembers =
    members && members.length > 0
      ? members.map((m, idx) => {
          const def = DEFAULT_MEMBERS[idx] || {};
          return {
            ...def,
            ...m,
            name: m.name || def.name,
            role: m.designation || m.role || def.role,
            initials: m.initials || m.avatar?.value || def.initials,
            image: m.image || def.image,
            bio: m.bio || def.bio,
            badgeText: m.badge?.text || def.badgeText,
            companies: m.companies || def.companies,
            footerTag: m.footerTag || def.footerTag,
          };
        })
      : DEFAULT_MEMBERS;

  return (
    <section
      id="leadership"
      className="LeadershipTeam-section"
      aria-label="Executive Leadership Governance"
    >
      <div className="LeadershipTeam-container">
        {/* Header */}
        <div className="LeadershipTeam-header">
          <SectionBadge
            text={eyebrow}
            icon={
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />
          <h2 className="LeadershipTeam-title">{heading}</h2>
          <p className="LeadershipTeam-subtitle">{subheading}</p>
        </div>

        {/* 3 + 2 Balanced Centered Layout */}
        <div className="LeadershipTeam-grid">
          {resolvedMembers.map((member, idx) => {
            return (
              <ScrollReveal
                key={member.id || idx}
                direction="up"
                delay={idx * 0.08}
                distance={35}
                className="LeadershipTeam-cardCol"
              >
                <div className="LeadershipTeam-card">
                  {/* Card Header: Avatar & Experience Badge */}
                  <div className="LeadershipTeam-cardHeader">
                    <div
                      className={`LeadershipTeam-avatar LeadershipTeam-avatar--${member.avatarVariant || 'primary-fixed'}`}
                    >
                      {member.image ? (
                        <img
                          src={member.image}
                          alt={member.name}
                          className="LeadershipTeam-avatarImg"
                          loading="lazy"
                        />
                      ) : (
                        member.initials
                      )}
                    </div>

                    {member.badgeText && (
                      <span className="LeadershipTeam-expBadge">
                        <span
                          className={`LeadershipTeam-expDot ${member.badgeDotColor === 'emerald' ? 'bg-emerald-accent' : 'bg-cobalt-bright'}`}
                        />
                        <span>{member.badgeText}</span>
                      </span>
                    )}

                    {member.companies && member.companies.length > 0 && (
                      <div className="LeadershipTeam-companyPills">
                        {member.companies.map((comp, cIdx) => (
                          <span
                            key={cIdx}
                            className="LeadershipTeam-companyPill"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Name and Title */}
                  <div className="LeadershipTeam-meta">
                    <h3 className="LeadershipTeam-name">{member.name}</h3>
                    <span className="LeadershipTeam-designation">
                      {member.role}
                    </span>
                  </div>

                  {/* Bio */}
                  <p className="LeadershipTeam-bio">{member.bio}</p>

                  {/* Card Footer: Domain Tag & LinkedIn Link */}
                  <div className="LeadershipTeam-cardFooter">
                    <span className="LeadershipTeam-footerTagText">
                      {member.footerTag}
                    </span>
                    <a
                      href={
                        member.linkedinUrl ||
                        'https://www.linkedin.com/company/thinkwires-technology'
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="LeadershipTeam-socialLink"
                      aria-label={`${member.name} LinkedIn Profile`}
                    >
                      <span className="LeadershipTeam-socialIcon">in</span>
                    </a>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LeadershipTeam;
