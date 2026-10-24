/**
 * Fallback corporate and leadership dataset for ThinkWires About and Advisory pages.
 * Used when MongoDB connection is cold or CMS pages have not yet been seeded.
 */
export const aboutDataset = {
  company: {
    name: 'ThinkWires',
    founded: 2022,
    headquarters:
      'Plot No. 20, Block H-1/A, Sector 63, Noida, Uttar Pradesh 201301',
    locations: ['India', 'USA', 'Canada'],
    eyebrow: 'ABOUT THINKWIRES',
    headline: 'Connecting Global Ambition with Exceptional Tech Talent.',
    subheading:
      'Founded in 2022 as a premier workforce advisor and staffing aggregator, ThinkWires connects high-growth enterprises with specialized engineering talent and compliant Employer of Record (EOR) infrastructure across India, the US, and Canada.',
    heroImage: '/images/about-hero.jpg',
    heroImageAlt: 'ThinkWires Global Technology Talent Delivery Network',
    overview: {
      eyebrow: 'COMPANY OVERVIEW',
      title: 'Architecting High-Velocity Engineering Squads for Global Scale',
      summary:
        'ThinkWires was established in 2022 to dismantle the structural bottlenecks of traditional IT staffing. Operating across high-demand tech corridors in India, the United States, and Canada, we combine the domain depth of an executive search firm with the rapid scalability of an aggregator ecosystem.',
      mission:
        'To engineer frictionless, compliant, and hyper-targeted talent pipelines that enable technology leaders to build and scale world-class software teams without borders.',
      pillars: [
        {
          title: 'Architectural Vetting',
          description:
            'Every engineering profile is evaluated beyond the CV through deep system design benchmarks, code telemetry, and domain-specific delivery audits.',
        },
        {
          title: 'SLA-Driven Velocity',
          description:
            'Our aggregator engine delivers verified, interview-ready candidate dossiers within 5 business hours of intake, drastically reducing time-to-hire.',
        },
        {
          title: 'Zero-Risk Compliance',
          description:
            'Full Employer of Record (EOR) indemnification, cross-border payroll, IP assignments, and multi-jurisdictional labor law compliance from day one.',
        },
      ],
    },
  },
  stats: [
    {
      id: 'profile-delivery',
      value: '5h',
      numericValue: 5,
      unit: 'h',
      label: 'First Curated Profiles',
      subLabel: 'Proprietary intake & matching SLA',
      accent: 'blue',
    },
    {
      id: 'time-to-hire',
      value: '7d',
      numericValue: 7,
      unit: 'd',
      label: 'Time-to-Hire Target',
      subLabel: 'End-to-end interview to contract',
      accent: 'green',
    },
    {
      id: 'executive-experience',
      value: '100+',
      numericValue: 100,
      unit: 'Yrs',
      label: 'Combined Executive Experience',
      subLabel: 'Cross-border enterprise leadership depth',
      accent: 'blue',
    },
    {
      id: 'statutory-compliance',
      value: '100%',
      numericValue: 100,
      unit: '%',
      label: 'Statutory Compliance',
      subLabel: 'EOR & cross-border governance assurance',
      accent: 'green',
    },
  ],
  aggregatorModel: {
    eyebrow: 'STRATEGIC ADVANTAGE',
    heading: 'The ThinkWires Aggregator Model',
    description:
      'Traditional recruitment agencies bottleneck on internal databases. ThinkWires functions as an enterprise staffing aggregator orchestrating a high-velocity ecosystem of verified partner agencies, independent specialists, and automated compliance pipelines.',
    cards: [
      {
        id: 'agg-1',
        icon: 'clock',
        title: 'Rapid Profile Delivery (5 Hours)',
        description:
          'Proprietary matching algorithms search verified repositories to deliver pre-screened, job-fit candidate dossiers within 5 working hours of intake.',
        detail:
          'Guaranteed sub-5-hour SLA response with benchmarked technical scorecards.',
      },
      {
        id: 'agg-2',
        icon: 'layers',
        title: 'Full-Stack Tech & Enterprise ERP',
        description:
          'Specialized domain depth spanning SAP ABAP/HANA, Adobe Experience Manager (AEM), Teamcenter PLM, Kubernetes/DevOps, and Generative AI frameworks.',
        detail:
          'Pre-vetted engineering squads ready for immediate deployment into enterprise stacks.',
      },
      {
        id: 'agg-3',
        icon: 'shield',
        title: 'Compliance and EOR Infrastructure',
        description:
          'Complete Employer of Record (EOR) indemnification. We manage local statutory payroll, benefits, strict IP NDA assignments, and multi-jurisdiction tax withholding.',
        detail:
          'Bulletproof legal governance covering Indian statutory mandates, US W2/1099, and Canadian labor regulations.',
      },
      {
        id: 'agg-4',
        icon: 'network',
        title: 'Agile Subcontractor Network',
        description:
          'A curated network of certified boutique recruitment partners providing instant surge capacity without inflating fixed operational overhead.',
        detail:
          'Elastic scaling framework enabling enterprises to mobilize specialized benches on demand.',
      },
    ],
  },
  philosophy: {
    eyebrow: 'OUR PHILOSOPHY',
    heading: '"Recruitment is Not Transactional; It is Architectural."',
    description:
      'At ThinkWires, we reject the legacy headhunter pattern of resume-dumping. We treat every client intake as an engineering brief. From understanding the nuances of microservices architectures to navigating localized tax laws in Ontario or California, our teams engineer frictionless, compliant talent conduits.',
    image: '/images/about-philosophy.jpg',
    imageAlt: 'ThinkWires executive strategic advisory session',
    metrics: [
      {
        id: 'metric-1',
        value: '98.4%',
        label: 'Contract Retention Rate',
      },
      {
        id: 'metric-2',
        value: '< 48 hrs',
        label: 'Candidate Interview Turnaround',
      },
    ],
  },
  leadership: [
    {
      id: 'leader-001',
      name: 'Naziya Husain',
      designation: 'Founder Member',
      experience: '14+ Years',
      initials: 'NH',
      bio: 'With over 14 years in recruitment, headhunting, talent mapping, and end-to-end manpower solutions, Naziya has successfully steered complex mandates across KPOs, top-tier management consulting firms, and fast-scaling digital startups.',
      expertise: [
        'Talent Mapping',
        'Executive Headhunting',
        'Manpower Solutions',
        'KPO Mandates',
      ],
      image: null,
      linkedin: null,
    },
    {
      id: 'leader-002',
      name: 'Anju Balyan',
      designation: 'Co-Founder & Associate Executive Director',
      experience: '17+ Years',
      initials: 'AB',
      bio: 'Enthusiastic enterprise HR leader with 17 years aligning HR initiatives with tier-one business priorities. Specialist in shared services environments, transitions, legal frameworks, ERP rollouts, and HR automation systems.',
      expertise: [
        'Enterprise HR Architecture',
        'Shared Services',
        'ERP Transitions',
        'Labor Frameworks',
      ],
      image: null,
      linkedin: null,
    },
    {
      id: 'leader-003',
      name: 'Ananya Mehta',
      designation: 'Chief Executive Officer (CEO)',
      experience: '15+ Years',
      initials: 'AM',
      bio: 'Dedicated to building teams that drive real business velocity. Expert in strategic talent research, executive search, deep candidate evaluation beyond CVs, and structuring high-trust leadership placements for global scale.',
      expertise: [
        'Executive Search',
        'Organizational Scaling',
        'Strategic Sourcing',
        'Talent Evaluation',
      ],
      image: null,
      linkedin: null,
    },
    {
      id: 'leader-004',
      name: 'Arjun Verma',
      designation: 'Chief People & Marketing Officer (CPO & CMO)',
      experience: '20+ Years',
      initials: 'AV',
      bio: 'A 20+-year veteran at the intersection of talent acquisition, organizational culture, and brand positioning. Focused on solving why high-growth enterprises struggle to hire and how elite culture transforms product velocity.',
      expertise: [
        'People Strategy',
        'Employer Branding',
        'Talent Acquisition',
        'Culture Architecture',
      ],
      image: null,
      linkedin: null,
    },
    {
      id: 'leader-005',
      name: 'Meera Iyer',
      designation:
        'Senior Director - Global Head of TA Operations & HR Services',
      experience: '18+ Years',
      initials: 'MI',
      bio: 'Strategic Talent Acquisition and HR Operations executive who has built scalable, technology-driven recruitment frameworks across enterprise leaders including BlackRock, Microsoft, IBM, Ameriprise, and Infosys. Ensures institutional governance, risk mitigation, compliance, and flawless multi-region operations.',
      expertise: [
        'Global Delivery Operations',
        'Risk Mitigation',
        'EOR Compliance',
        'Operational Integrity',
      ],
      priorEnterprises: [
        'BlackRock',
        'Microsoft',
        'IBM',
        'Infosys',
        'Ameriprise',
      ],
      image: null,
      linkedin: null,
    },
  ],
  milestones: [
    {
      id: 'milestone-2022',
      year: '2022',
      tag: 'Foundation',
      title: 'Foundation',
      description:
        'Founded in Noida with a core team dedicated to borderless recruitment, pioneering an agency aggregator network that delivers verified profiles in under 5 hours.',
      status: 'completed',
    },
    {
      id: 'milestone-2023',
      year: '2023',
      tag: 'Practice Alignment',
      title: 'Growth and Practice Alignment',
      description:
        'Unit economics break-even achieved. Launched specialized talent practices across SAP ABAP/HANA, Cloud/DevOps, and Enterprise Salesforce consulting.',
      status: 'completed',
    },
    {
      id: 'milestone-2024',
      year: '2024',
      tag: 'Cross-Border Expansion',
      title: 'Cross-Border Expansion',
      description:
        'Inaugurated dedicated talent corridors into the United States and Canada. Rolled out comprehensive Employer of Record (EOR) and global payroll management.',
      status: 'completed',
    },
  ],
  roadmap: [
    {
      id: 'roadmap-2026',
      timeframe: '2026+',
      tag: 'Planned Roadmap',
      title: 'AI-Powered Delivery & Telemetry Vetting',
      description:
        'Automated code telemetry vetting, generative talent search matching, and sub-48-hour global deployment pipelines across AI and PLM systems.',
      status: 'planned',
    },
  ],
  methodology: [
    {
      step: '01',
      title: 'Discovery & Technical Scoping',
      description:
        'We initiate with an executive discovery session. We evaluate tech stack nuances, project deadlines, budgetary constraints, and candidate seniority to draft exact success metrics.',
      deliverable: 'Technical Requirement Specification & Delivery Scope',
    },
    {
      step: '02',
      title: 'Precision Pre-Vetted Matching (<5 Hours)',
      description:
        'Our aggregator engine coordinates across our specialized subcontractor network to deliver tested, pre-interviewed candidate dossiers within five working hours.',
      deliverable: 'Pre-Screened Candidate Dossiers & Technical Rubrics',
    },
    {
      step: '03',
      title: 'Onboarding & Governance',
      description:
        'Seamless offer negotiation, local statutory contract issuance via EOR, compliant equipment provisioning, and ongoing governance tracking ensure long-term retention.',
      deliverable: 'Full EOR Indemnification & Ongoing Performance Governance',
    },
  ],
  contact: {
    headline: 'Ready to Build Your High-Velocity Engineering Squad?',
    description:
      'Book a 20-minute workforce strategy consultation with our staffing directors to audit your technical requirements and receive benchmark rates for India and North America.',
    headquarters: {
      title: 'Global Corporate Headquarters',
      address:
        'Plot No. 20, Block H-1/A, Sector 63, Noida, Uttar Pradesh 201301',
    },
    phones: ['+91 (120) 450-8800', '+91 89205 55626'],
    email: 'connect@thinkwires.com',
    hours: 'Monday - Friday: 9:00 AM - 7:00 PM IST (EST/PST Overlap Supported)',
  },
};
