/**
 * Centralized Careers Page Data for ThinkWires
 * Contains official career articles, official benefits, culture pillars, and job filter options.
 */

export const OFFICIAL_CAREER_BLOGS = [
  {
    id: 'blog-wellness',
    slug: 'supporting-employee-wellness-and-work-life-balance',
    title: 'Supporting Employee Wellness and Work-Life Balance',
    category: 'Wellness & Culture',
    date: 'Sep 14, 2026',
    readTime: '4 min read',
    excerpt:
      'Sustainable high performance depends on feeling healthy, respected, and empowered to deliver world-class engineering without burnout.',
    content: `At ThinkWires, we believe that world-class software engineering cannot exist in an environment of constant burnout. High performance is sustainable only when our people feel physically, mentally, and emotionally supported.

Our wellness architecture centers around three core principles:
1. Flexible Overlap Schedules: Rather than enforcing rigid clock-in times, our pods establish core collaboration windows that accommodate family commitments, health routines, and individual peak-productivity hours.
2. Mental Health & Ergonomics: We provide comprehensive healthcare coverage that includes mental wellness consultations, confidential counseling support, and ergonomic workspace allowances for remote and hybrid engineers.
3. Psychological Safety: True work-life balance starts with trust. We encourage transparent communication where taking personal time off is normalized, supported by peers, and celebrated as healthy discipline.`,
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80',
    tags: ['Work-Life Balance', 'Mental Health', 'Flexible Hours'],
  },
  {
    id: 'blog-classroom-career',
    slug: 'from-classroom-to-career-empowering-talent',
    title: 'From Classroom to Career — Empowering Talent, Enabling Futures',
    category: 'Campus & Early Careers',
    date: 'Jun 28, 2026',
    readTime: '5 min read',
    excerpt:
      'Recap of ThinkWires landmark hiring drive, selecting high-potential graduate talent across Cloud, AI, and Full-Stack cohorts.',
    content: `Bridging the gap between academic theory and enterprise production is one of our proudest initiatives at ThinkWires. Through our multi-campus recruitment and mentorship drives, we identify top engineering graduates across universities and fast-track their transition into production environments.

Key highlights of our campus cohort programs:
- Immersive Bootcamps: 90 days of hands-on pairing with Senior Solutions Architects on real-world cloud architectures (AWS, Azure, GCP) and modern frontend platforms.
- Structured Peer Mentorship: Every new graduate is paired with a dedicated Staff Engineer for continuous code reviews, architectural discussions, and career path navigation.
- Real Enterprise Exposure: Rather than sandbox assignments, graduates contribute to live client delivery pods, telemetry vetting pipelines, and production systems within their first quarter.`,
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80',
    tags: ['Campus Hiring', 'Mentorship', 'Tech Bootcamps'],
  },
  {
    id: 'blog-yoga-health',
    slug: 'thinkwires-celebrates-international-health-and-yoga-day',
    title: 'ThinkWires Technology Celebrates International Health & Yoga Day',
    category: 'Workplace Health',
    date: 'Jun 21, 2026',
    readTime: '3 min read',
    excerpt:
      'Mindfulness, ergonomic posture, and collective health: how our engineering pods celebrated wellness and mental clarity together.',
    content: `Sitting at desks for hours solving distributed system puzzles can take a toll on physical wellness. On International Health & Yoga Day, our teams across Noida, Bangalore, and distributed locations gathered for a live guided mindfulness and yoga session.

Focus areas included:
- Desk Ergonomics: Practical stretches and posture correction routines designed specifically for software developers and knowledge workers.
- Breathwork & Focus: Guided Pranayama and mindfulness exercises to relieve stress, enhance concentration, and promote sustained cognitive clarity.
- Active Lifestyle Commitments: Launching our internal walking challenges, step milestones, and team sports days to keep movement a daily priority.`,
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=900&q=80',
    tags: ['Yoga Day', 'Ergonomics', 'Community Wellness'],
  },
  {
    id: 'blog-life-at-tw',
    slug: 'life-at-thinkwires',
    title: 'Life at ThinkWires',
    category: 'Culture & Innovation',
    date: 'May 18, 2026',
    readTime: '6 min read',
    excerpt:
      'Inside our multidisciplinary hubs: an honest look at how our consultants, architects, and recruiters collaborate across global corridors.',
    content: `What is it actually like to build your career at ThinkWires? It is an environment built for individuals who thrive on autonomy, continuous learning, and cross-functional teamwork.

Our daily cadence brings together technical recruiters, enterprise architects, and engineering leads into tight-knit pods. We eliminate bureaucratic red tape:
- Flat Hierarchy: Direct access to founders, practice heads, and executive leadership without layers of middle management.
- Transparent Metrics: Promotion milestones, client delivery outcomes, and performance benchmarks are clearly documented and accessible.
- Global Collaboration: Daily pairing with engineering counterparts in the United States, Canada, and Europe, giving our team genuine cross-border expertise.`,
    image: '/images/about-philosophy.jpg',
    tags: ['Workplace Culture', 'Flat Hierarchy', 'Global Teams'],
  },
  {
    id: 'blog-csr',
    slug: 'csr-initiatives',
    title: 'CSR Initiatives',
    category: 'Social Responsibility',
    date: 'Apr 22, 2026',
    readTime: '4 min read',
    excerpt:
      'Our roadmap to 1,000 planted trees, local community healthcare camps, and youth digital literacy drives in rural communities.',
    content: `True success is measured by the positive footprint we leave in our communities. Through ThinkWires CSR programs, our employees actively participate in purposeful community initiatives beyond our technical consulting work.

Current active initiatives:
- 1,000-Tree Reforestation Roadmap: Ongoing plantation campaigns in urban green belts and degraded community zones to promote ecological sustainability.
- Regional Health & Diagnostic Camps: Sponsoring routine check-ups, eye clinics, and essential medicine distribution for underserved families.
- Digital Literacy Drives: Donating refurbished computer systems and conducting introductory coding and digital skills workshops for rural schools.`,
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=900&q=80',
    tags: ['CSR', 'Tree Plantation', 'Digital Literacy'],
  },
  {
    id: 'blog-benefits-perks',
    slug: 'benefits-and-perks-at-thinkwires',
    title: 'Benefits & Perks at ThinkWires',
    category: 'Total Rewards',
    date: 'Mar 10, 2026',
    readTime: '5 min read',
    excerpt:
      'From comprehensive medical insurance and statutory PF to gratuity and global career mobility: our commitment to rewarding great engineering.',
    content: `We believe great engineers deserve transparent, reliable, and holistic compensation that safeguards their financial security and career progression.

Our comprehensive total rewards package includes:
- Top-Tier Medical Insurance: Family coverage including spouse, children, and parents with cashless hospitalization across leading networks.
- Provident Fund (PF) & Statutory Gratuity: Consistent statutory contributions ensuring long-term retirement and tenure security.
- Internal Job Opportunities (IJP): First priority given to internal team members for promotion into new technology practices and leadership vacancies.
- Certification Sponsorship: 100% reimbursed fees for approved AWS, Azure, GCP, Kubernetes, and specialized technical credentials.`,
    image: '/images/about-hero.jpg',
    tags: ['Health Insurance', 'PF & Gratuity', 'Internal Mobility'],
  },
];

export const OFFICIAL_BENEFITS = [
  {
    id: 'benefit-medical',
    title: 'Medical Coverage',
    category: 'Health & Protection',
    description:
      'Comprehensive family medical insurance, including cashless hospitalization, maternity coverage, and periodic diagnostic check-ups.',
    icon: 'shield',
    badge: 'Comprehensive Plan',
  },
  {
    id: 'benefit-pf',
    title: 'Provident Fund (PF)',
    category: 'Financial Security',
    description:
      'Statutory Employee Provident Fund (EPF) contributions matched diligently to build structured long-term retirement savings.',
    icon: 'vault',
    badge: 'Statutory Compliance',
  },
  {
    id: 'benefit-gratuity',
    title: 'Gratuity Benefits',
    category: 'Tenure Recognition',
    description:
      'Statutory gratuity provisions structured to reward sustained dedication and loyalty throughout your journey with ThinkWires.',
    icon: 'award',
    badge: 'Long-Term Value',
  },
  {
    id: 'benefit-ijp',
    title: 'Internal Job Opportunities (IJP)',
    category: 'Career Mobility',
    description:
      'Priority consideration for lateral transitions, specialized technology pod vacancies, and cross-border leadership roles.',
    icon: 'trending',
    badge: 'Merit-Based Progression',
  },
  {
    id: 'benefit-training',
    title: 'Training & Certifications',
    category: 'Skill Growth',
    description:
      '100% reimbursed fees for Tier-1 cloud credentials (AWS, Azure, GCP), AI/ML masterclasses, and enterprise architecture workshops.',
    icon: 'graduation',
    badge: 'Sponsored Upskilling',
  },
  {
    id: 'benefit-recognition',
    title: 'Recognition & Spot Awards',
    category: 'Performance Culture',
    description:
      'Quarterly excellence honors, delivery milestone bonuses, peer appreciation awards, and transparent merit appraisals.',
    icon: 'star',
    badge: 'Spot Bonuses',
  },
  {
    id: 'benefit-leaves',
    title: 'Generous Leave Benefits',
    category: 'Work-Life Agility',
    description:
      'Paid annual leaves, maternal and paternal care leaves, bereavement support, and flexible recharge days for personal balance.',
    icon: 'calendar',
    badge: 'Flexible PTO',
  },
  {
    id: 'benefit-activities',
    title: 'Team Activities & Offsites',
    category: 'Community & Culture',
    description:
      'Annual technology retreats, hackathons, sports tournaments, festive celebrations, and quarterly team pod dinners.',
    icon: 'users',
    badge: 'Social Connection',
  },
];

export const CULTURE_PILLARS = [
  {
    id: 'culture-teamwork',
    title: 'Teamwork & Connected Pods',
    tag: 'Collaboration',
    description:
      'Multidisciplinary squads where developers, recruiters, and architects collaborate without silos or rigid administrative barriers.',
    bullets: ['Cross-functional squads', 'Daily standup syncs', 'Transparent communication'],
  },
  {
    id: 'culture-tech',
    title: 'Modern Technology & High Standards',
    tag: 'Engineering Excellence',
    description:
      'Deep immersion in cloud-native platforms, AI telemetry pipelines, automated CI/CD testing, and resilient distributed systems.',
    bullets: ['AWS, Azure & GCP', 'Clean code reviews', 'Zero-downtime standards'],
  },
  {
    id: 'culture-growth',
    title: 'Professional Development & Mentorship',
    tag: 'Career Velocity',
    description:
      'Structured pathways from associate engineer to principal consultant, supported by executive coaching and hands-on client exposure.',
    bullets: ['Dedicated mentors', 'Bi-weekly tech talks', '100% sponsored certs'],
  },
  {
    id: 'culture-wellbeing',
    title: 'Employee Well-being & Psychological Safety',
    tag: 'Sustainable Performance',
    description:
      'A respectful, empathetic culture that values work-life harmony, flexible schedules, and open dialogue over high-pressure burnout.',
    bullets: ['Flexible work hours', 'Ergonomic stipends', 'Empathetic leadership'],
  },
  {
    id: 'culture-global',
    title: 'Global Delivery & Borderless Impact',
    tag: 'International Corridors',
    description:
      'Bridging Indian delivery centers with tier-one enterprises across the US and Canada, offering direct international experience.',
    bullets: ['US/Canada mandates', 'Cross-border mobility', 'Multi-region delivery'],
  },
];
