/**
 * Centralized Team, Benefits, Culture & Career Blogs Data for Thinkwires
 * Provides structured employee profiles, authentic career blogs, and culture assets.
 */

export const TEAM_DEPARTMENTS = [
  { id: 'all', label: 'All Team' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'recruitment', label: 'HR & Recruitment' },
  { id: 'operations', label: 'Operations' },
  { id: 'marketing', label: 'Marketing' },
];

export const TEAM_MEMBERS = [
  {
    id: 'emp-ananya-mehta',
    name: 'Ananya Mehta',
    designation: 'Chief Executive Officer (CEO)',
    department: 'leadership',
    departmentLabel: 'Leadership',
    image: '/images/team/ananya-mehta.jpg',
    avatarFallback: 'AM',
    shortIntro:
      'Steering cross-border organizational growth, executive talent strategies, and institutional vision for enterprise clients worldwide.',
    bio: 'Dedicated to building teams that drive real business velocity. Expert in strategic talent research, executive search, deep candidate evaluation beyond CVs, and structuring high-trust leadership placements for global scale.',
    expertise: [
      'Executive Search',
      'Organizational Scaling',
      'Strategic Sourcing',
      'Talent Evaluation',
    ],
    experienceYears: '15+ Years',
    location: 'Noida Hub & Global Corridors',
    linkedin: 'https://linkedin.com/company/thinkwires',
  },
  {
    id: 'emp-anju-balyan',
    name: 'Anju Balyan',
    designation: 'Co-Founder & Associate Executive Director',
    department: 'leadership',
    additionalDepartments: ['recruitment'],
    departmentLabel: 'Leadership & HR Architecture',
    image: '/images/team/anju-balyan.jpg',
    avatarFallback: 'AB',
    shortIntro:
      'Architecting enterprise human resource systems, organizational compliance, and scalable talent governance frameworks.',
    bio: 'Enthusiastic enterprise HR leader with 17 years aligning HR initiatives with tier-one business priorities. Specialist in shared services environments, transitions, legal frameworks, ERP rollouts, and HR automation systems.',
    expertise: [
      'Enterprise HR Architecture',
      'Shared Services',
      'ERP Transitions',
      'Labor Frameworks',
    ],
    experienceYears: '17+ Years',
    location: 'Noida HQ',
    linkedin: 'https://linkedin.com/company/thinkwires',
  },
  {
    id: 'emp-arjun-verma',
    name: 'Arjun Verma',
    designation: 'Chief People & Marketing Officer (CPO & CMO)',
    department: 'marketing',
    additionalDepartments: ['leadership', 'recruitment'],
    departmentLabel: 'People Strategy & Brand',
    image: '/images/team/arjun-verma.jpg',
    avatarFallback: 'AV',
    shortIntro:
      'Bridging elite workplace culture, talent acquisition velocity, and global brand positioning across international technology markets.',
    bio: 'A 20+-year veteran at the intersection of talent acquisition, organizational culture, and brand positioning. Focused on solving why high-growth enterprises struggle to hire and how elite culture transforms product velocity.',
    expertise: [
      'People Strategy',
      'Employer Branding',
      'Talent Acquisition',
      'Culture Architecture',
    ],
    experienceYears: '20+ Years',
    location: 'Global Corridors',
    linkedin: 'https://linkedin.com/company/thinkwires',
  },
  {
    id: 'emp-meera-iyer',
    name: 'Meera Iyer',
    designation: 'Senior Director - Global Head of TA Operations & HR Services',
    department: 'operations',
    additionalDepartments: ['recruitment'],
    departmentLabel: 'Global Operations & TA',
    image: '/images/team/meera-iyer.jpg',
    avatarFallback: 'MI',
    shortIntro:
      'Directing international delivery operations, risk mitigation frameworks, and scalable recruitment execution across tier-one tech enterprises.',
    bio: 'Strategic Talent Acquisition and HR Operations executive who has built scalable, technology-driven recruitment frameworks across enterprise leaders including BlackRock, Microsoft, IBM, Ameriprise, and Infosys. Ensures institutional governance, risk mitigation, compliance, and flawless multi-region operations.',
    expertise: [
      'Global Delivery Operations',
      'Risk Mitigation',
      'EOR Compliance',
      'Operational Integrity',
    ],
    experienceYears: '18+ Years',
    location: 'India, US & Canada Corridors',
    linkedin: 'https://linkedin.com/company/thinkwires',
  },
  {
    id: 'emp-naziya-husain',
    name: 'Naziya Husain',
    designation: 'Founder Member',
    department: 'leadership',
    departmentLabel: 'Founding Member & Search',
    image: '/images/team/naziya-husain.jpg',
    avatarFallback: 'NH',
    shortIntro:
      'Pioneering Thinkwires recruitment architecture, executive headhunting methodologies, and specialized talent mapping across consulting sectors.',
    bio: 'With over 14 years in recruitment, headhunting, talent mapping, and end-to-end manpower solutions, Naziya has successfully steered complex mandates across KPOs, top-tier management consulting firms, and fast-scaling digital startups.',
    expertise: [
      'Talent Mapping',
      'Executive Headhunting',
      'Manpower Solutions',
      'KPO Mandates',
    ],
    experienceYears: '14+ Years',
    location: 'Noida Hub',
    linkedin: 'https://linkedin.com/company/thinkwires',
  },
  {
    id: 'emp-vikram-rao',
    name: 'Vikramaditya Rao',
    designation: 'Lead Solutions Architect & Cloud Practice Head',
    department: 'engineering',
    departmentLabel: 'Engineering & Architecture',
    image: null,
    avatarFallback: 'VR',
    shortIntro:
      'Guiding distributed cloud architectures, serverless telemetry vetting, and modern full-stack engineering standards.',
    bio: 'Specialist in enterprise cloud transformations across AWS, Azure, and Google Cloud Platform. Leads cross-functional architecture reviews, code telemetry auditing, and rapid pod deployments for scalable software systems.',
    expertise: [
      'Cloud Architecture',
      'Kubernetes & Microservices',
      'Telemetry Vetting',
      'Distributed Systems',
    ],
    experienceYears: '12+ Years',
    location: 'Engineering Pods',
    linkedin: 'https://linkedin.com/company/thinkwires',
  },
  {
    id: 'emp-pooja-sharma',
    name: 'Pooja Sharma',
    designation: 'Director of Technical Talent Acquisition',
    department: 'recruitment',
    departmentLabel: 'HR & Technical Talent',
    image: null,
    avatarFallback: 'PS',
    shortIntro:
      'Curating specialized technical talent pipelines in AI, Machine Learning, SAP HANA, and Enterprise DevOps.',
    bio: 'Dedicated to candidate-centric engagement and rigorous technical screening. Manages agile sourcing pods to ensure Fortune 500 engineering teams receive validated candidate dossiers in record turnaround times.',
    expertise: [
      'Tech Talent Mapping',
      'Niche Skill Sourcing',
      'Candidate Experience',
      'Agile Pod Management',
    ],
    experienceYears: '10+ Years',
    location: 'Talent Corridors',
    linkedin: 'https://linkedin.com/company/thinkwires',
  },
  {
    id: 'emp-devendra-singh',
    name: 'Devendra Singh',
    designation: 'Principal DevOps & Infrastructure Engineer',
    department: 'engineering',
    departmentLabel: 'DevOps & Reliability',
    image: null,
    avatarFallback: 'DS',
    shortIntro:
      'Building robust CI/CD automation pipelines, zero-downtime infrastructure frameworks, and developer productivity tooling.',
    bio: 'Passionate about reliable software engineering and developer velocity. Oversees internal engineering automation, cloud cost optimization, and telemetry frameworks across multi-region production clusters.',
    expertise: [
      'DevOps Automation',
      'Terraform & IaC',
      'CI/CD Pipelines',
      'Container Orchestration',
    ],
    experienceYears: '9+ Years',
    location: 'Tech Hub',
    linkedin: 'https://linkedin.com/company/thinkwires',
  },
];

export const EMPLOYEE_BENEFITS = [
  {
    id: 'ben-health',
    title: 'Comprehensive Health & Wellness',
    tag: 'Whole-Person Care',
    description:
      'Premium family healthcare coverage, periodic wellness retreats, and regular mental health support workshops that value sustainable success over burnout.',
    icon: 'shield',
    badge: '100% Covered',
  },
  {
    id: 'ben-global',
    title: 'Global Client Footprint',
    tag: 'Borderless Impact',
    description:
      'Collaborate directly with engineering counterparts in Silicon Valley, Toronto, New York, and European tech corridors without relocation friction.',
    icon: 'globe',
    badge: '3 Continents',
  },
  {
    id: 'ben-upskilling',
    title: 'Continuous Tech Upskilling',
    tag: 'Skill Mastery',
    description:
      'Sponsorship for Tier-1 cloud certifications (AWS, Azure, GCP), GenAI hackathons, and enterprise solution architecture workshops.',
    icon: 'graduation',
    badge: 'Paid Certifications',
  },
  {
    id: 'ben-agility',
    title: 'Work-Life Agility',
    tag: 'Flexibility First',
    description:
      'Choose from completely remote, hybrid, or on-site modes. Flexible overlap schedules tailored to your individual family needs.',
    icon: 'laptop',
    badge: 'Remote & Hybrid',
  },
  {
    id: 'ben-career',
    title: 'Transparent Career Pathing',
    tag: 'Merit-Based Growth',
    description:
      'Bi-annual performance evaluations, direct promotions to Staff/Principal engineering cohorts, and clear payroll progression charts.',
    icon: 'trending',
    badge: 'Bi-Annual Reviews',
  },
  {
    id: 'ben-csr',
    title: 'Impact & Social Purpose',
    tag: 'Community Value',
    description:
      'Join our CSR initiatives: village children educational support, healthcare drives, and tree planting programs that empower local communities.',
    icon: 'heart',
    badge: '1,000+ Trees',
  },
];

export const CAREER_BLOGS = [
  {
    id: 'blog-wellness',
    date: 'Sep 12, 2026',
    category: 'Wellness & Culture',
    readTime: '5 min read',
    title: 'Supporting Employee Wellness and Work-Life Balance in Distributed Teams',
    snippet:
      'Sustainable high performance depends on feeling healthy, respected, and empowered to deliver world-class code without burnout. Discover our frameworks for mental health, flexible overlap hours, and family wellness retreats.',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    link: '/blog',
  },
  {
    id: 'blog-campus',
    date: 'Jun 23, 2026',
    category: 'Campus Drive & Learning',
    readTime: '4 min read',
    title: 'From Classroom to Career: Empowering 250+ Next-Gen Tech Graduates',
    snippet:
      'Recap of ThinkWires landmark hiring drive in Dehradun, selecting high-potential graduate talent across Cloud and Full-Stack cohorts with comprehensive mentorship and architectural bootcamps.',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
    link: '/blog',
  },
  {
    id: 'blog-csr',
    date: 'May 04, 2026',
    category: 'CSR & Sustainability',
    readTime: '6 min read',
    title: 'CSR & Environmental Sustainability: Our Roadmap to 1,000 Planted Trees',
    snippet:
      'Learn how our team combines cutting-edge engineering consulting with purposeful community initiatives in healthcare, rural student tech tutoring, and our milestone tree plantation campaigns.',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80',
    link: '/blog',
  },
  {
    id: 'blog-interview',
    date: 'Aug 15, 2026',
    category: 'Career Tips & Advice',
    readTime: '5 min read',
    title: 'Mastering Technical Architecture Reviews: Career Tips for Cloud & DevOps Engineers',
    snippet:
      'Practical advice from ThinkWires solution architects on demonstrating real-world problem-solving, telemetry vetting, and cross-functional communication during technical assessments.',
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=80',
    link: '/blog',
  },
];

export const CULTURE_THEMES = [
  {
    id: 'collaboration',
    title: 'Collaboration',
    badge: 'Cross-Functional Pods',
    locationTag: 'Cross-Functional Pods • Daily Syncs',
    tagline: 'People from different disciplines working together to solve real-world challenges.',
    description:
      'Our multidisciplinary pods connect technical architects, talent specialists, and client leads. We prioritize mutual accountability, open architectural debates, and daily knowledge sharing over rigid organizational hierarchies.',
    highlights: ['Multi-disciplinary Pods', 'Daily Standups & Syncs', 'No-Silo Architecture'],
    metrics: [
      { label: 'Pods', value: 'Multi-Disc' },
      { label: 'Sync Cadence', value: 'Daily' },
      { label: 'Rating', value: '4.9 ★' },
    ],
    footerLabel: 'Core Pillar 01',
    footerValue: 'Zero Silos',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    aspect: 'wide',
  },
  {
    id: 'tech-innovation',
    title: 'Technology & Innovation',
    badge: 'Modern Engineering',
    locationTag: 'Modern Engineering • Cloud & AI',
    tagline: 'Working with modern technologies and building meaningful digital solutions.',
    description:
      'From cloud-native microservices and AI-driven telemetry vetting to enterprise ERP systems, we provide our engineers with modern tooling, automated pipelines, and freedom to experiment with cutting-edge tech stacks.',
    highlights: ['AI & Cloud Pipelines', 'Open Code Audits', 'Zero-Debt Engineering'],
    metrics: [
      { label: 'Stack', value: 'Cloud-Native' },
      { label: 'Pipelines', value: 'Zero-Debt' },
      { label: 'Rating', value: '4.95 ★' },
    ],
    footerLabel: 'Core Pillar 02',
    footerValue: 'Code Audits',
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80',
    aspect: 'portrait',
  },
  {
    id: 'learning',
    title: 'Continuous Learning',
    badge: 'Skill Mastery',
    locationTag: 'Skill Mastery • Architecture',
    tagline: 'Encouraging technical development, knowledge sharing, and professional growth.',
    description:
      'We invest in our people through technical certification sponsorships, internal hackathons, architecture masterclasses, and hands-on exposure to high-scale international enterprise deployments.',
    highlights: ['Certification Sponsorships', 'Bi-weekly Tech Talks', 'Mentorship Programs'],
    metrics: [
      { label: 'Sponsorship', value: '100% Cost' },
      { label: 'Tech Talks', value: 'Bi-Weekly' },
      { label: 'Rating', value: '4.9 ★' },
    ],
    footerLabel: 'Core Pillar 03',
    footerValue: 'Certifications',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    aspect: 'standard',
  },
  {
    id: 'global-perspectives',
    title: 'Global Perspectives',
    badge: 'Borderless Delivery',
    locationTag: 'Borderless Delivery • IN, US, CA',
    tagline: 'Collaborating across India, USA, and Canada.',
    description:
      'Our team bridges established tech centers in India with forward-looking corporate mandates in North America. Team members gain direct international exposure and master cross-border client delivery standards.',
    highlights: ['Cross-Border Corridors', 'Global Client Exposure', 'EOR & International Mobility'],
    metrics: [
      { label: 'Corridors', value: '3 Nations' },
      { label: 'Coverage', value: 'Follow-Sun' },
      { label: 'Rating', value: '4.85 ★' },
    ],
    footerLabel: 'Core Pillar 04',
    footerValue: 'Cross-Border',
    image: '/images/about-philosophy.jpg',
    aspect: 'standard',
  },
  {
    id: 'community-csr',
    title: 'Community & CSR',
    badge: 'Social Impact',
    locationTag: 'Social Impact • Sustainability',
    tagline: 'Supporting social initiatives, community education, and environmental sustainability.',
    description:
      'We believe high-performing companies must create real community value. Our teams actively lead local health camps, student tech tutoring, and long-term environmental campaigns like our 1,000-tree reforestation drive.',
    highlights: ['1,000+ Trees Planted', 'Healthcare Outreach Camps', 'Youth Tech Literacy'],
    metrics: [
      { label: 'Trees', value: '1,000+' },
      { label: 'Outreach', value: 'Quarterly' },
      { label: 'Rating', value: '5.0 ★' },
    ],
    footerLabel: 'Core Pillar 05',
    footerValue: 'Sustainability',
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=1200&q=80',
    aspect: 'wide',
  },
];

export const EMPLOYEE_EXPERIENCE_ITEMS = [
  {
    id: 'exp-collab-env',
    title: 'Collaborative Working Environment',
    tag: 'Autonomy & Trust',
    description:
      'We cultivate a high-trust, low-bureaucracy atmosphere where individuals have the autonomy to make architectural decisions and lead client interactions with full peer support.',
    bullets: [
      'Flat decision-making structures with direct leadership accessibility',
      'Open physical and digital collaboration spaces',
      'Psychological safety to experiment and propose bold solutions',
    ],
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80',
    stat: '98%',
    statLabel: 'Team Satisfaction Index',
    reverse: false,
  },
  {
    id: 'exp-tech-exposure',
    title: 'Technical Exposure & Modern Tooling',
    tag: 'Production Mastery',
    description:
      'Engineers at Thinkwires work directly on mission-critical enterprise systems, multi-cloud platforms, and AI-enabled talent architectures that handle enterprise scale.',
    bullets: [
      'Modern tech stacks across AWS, Azure, GCP, Kubernetes, and React',
      'Automated telemetry vetting and code review benchmarks',
      'Real-world exposure to complex enterprise digital transformations',
    ],
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=900&q=80',
    stat: '100%',
    statLabel: 'Cloud-Native Practices',
    reverse: true,
  },
  {
    id: 'exp-growth-support',
    title: 'Continuous Learning & Career Mobility',
    tag: 'Career Velocity',
    description:
      'Whether you are refining your leadership acumen or deepening domain expertise in distributed systems, Thinkwires provides structured pathways for continuous upward progression.',
    bullets: [
      'Dedicated learning budgets for advanced certifications and courses',
      'Executive and peer mentorship paired with each role',
      'Transparent milestones for promotion and merit-based recognition',
    ],
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80',
    stat: '2.5x',
    statLabel: 'Average Upskilling Velocity',
    reverse: false,
  },
];

// ============================================================================
// GALLERY_ITEMS: Life in Pictures Photo Grid Configuration
// Easily swap image URLs, titles, categories, and captions as needed.
// Categories: 'Office', 'Events', 'Team Outings', 'Celebrations'
// ============================================================================
export const GALLERY_ITEMS = [
  // --- Slot 0 to 7: Featured Noir Editorial Grid ---
  {
    id: 1,
    title: 'Thinkwires Global Delivery Floor',
    category: 'Office',
    caption: 'Our modern production floor driving 24/7 client operations, workforce solutions, and tech delivery.',
    src: '/images/gallery/operation-floor.jpg',
    featured: true,
  },
  {
    id: 2,
    title: 'Diwali Festival of Lights Celebration',
    category: 'Celebrations',
    caption: 'Colleagues dressed in festive ethnic attire coming together to celebrate Diwali at Thinkwires.',
    src: '/images/gallery/diwali-celebration.jpg',
    featured: false,
  },
  {
    id: 3,
    title: 'Talent Upskilling & Technology Training Batch',
    category: 'Office',
    caption: 'Classroom learning, technical deep-dives, and hands-on enablement for emerging workforce talent.',
    src: '/images/gallery/training-batch.jpg',
    featured: false,
  },
  {
    id: 4,
    title: 'Employee Engagement & Culture Activities',
    category: 'Team Outings',
    caption: 'Fun team bonding activities, collaborative problem-solving, and culture games organized by ER.',
    src: '/images/gallery/er-engagement.jpg',
    featured: false,
  },
  {
    id: 5,
    title: 'Cultural Festival Gathering & Sweets',
    category: 'Celebrations',
    caption: 'Honoring diverse cultural milestones, festive traditions, and joyful team camaraderie across departments.',
    src: '/images/gallery/festival-celebration.jpg',
    featured: true,
  },
  {
    id: 6,
    title: 'New Hire Batch Induction & Welcome',
    category: 'Office',
    caption: 'Welcoming our new cohort of talented professionals to the global Thinkwires family.',
    src: '/images/gallery/onboarding-batch.jpg',
    featured: false,
  },
  {
    id: 7,
    title: 'Children’s Day Workplace Festivities',
    category: 'Celebrations',
    caption: 'Celebrating Children’s Day with warmth, creativity, and cheerful moments across the office.',
    src: '/images/gallery/childrens-day.jpg',
    featured: false,
  },
  {
    id: 8,
    title: 'Diwali Workspace Rangoli & Illumination',
    category: 'Celebrations',
    caption: 'Handcrafted traditional rangoli, festive lights, and vibrant holiday cheer illuminating our workspace.',
    src: '/images/gallery/diwali-decor.jpg',
    featured: true,
  },
  // --- Slot 8 to 15: Extended Gallery Collection ---
  {
    id: 9,
    title: 'Creative Team Building & Group Challenges',
    category: 'Team Outings',
    caption: 'Energizing group activities, teamwork exercises, and cross-functional camaraderie.',
    src: '/images/gallery/fun-activity-group.jpg',
    featured: false,
  },
  {
    id: 10,
    title: 'Outdoor Team Bonding & Weekend Fun',
    category: 'Team Outings',
    caption: 'Colleagues enjoying outdoor team building, recreational games, and relaxed weekend bonding.',
    src: '/images/gallery/fun-activity-outdoor.jpg',
    featured: false,
  },
  {
    id: 11,
    title: 'Campus Safety & Fire Drill Protocol',
    category: 'Events',
    caption: 'Ensuring comprehensive employee safety, emergency evacuation preparedness, and workplace health.',
    src: '/images/gallery/fire-drill.jpg',
    featured: false,
  },
  {
    id: 12,
    title: 'ER Team Feedback & Suggestion Forum',
    category: 'Events',
    caption: 'Interactive Employee Relations forum encouraging open feedback, team dialogue, and continuous improvement.',
    src: '/images/gallery/er-suggestion-activity.jpg',
    featured: false,
  },
  {
    id: 13,
    title: 'Batch Documentation & Operational Verification',
    category: 'Office',
    caption: 'Completing project onboarding, talent credentialing, and compliance documentation with precision.',
    src: '/images/gallery/batch-documentation.jpg',
    featured: false,
  },
  {
    id: 14,
    title: 'Operations Hub & Project Execution',
    category: 'Office',
    caption: 'Engineers, recruiters, and account managers collaborating closely on international enterprise deliverables.',
    src: '/images/gallery/operation-hub.jpg',
    featured: false,
  },
  {
    id: 15,
    title: 'Skill Development & Technical Cohort',
    category: 'Office',
    caption: 'Specialized batch training sessions strengthening enterprise cloud capabilities and modern toolchains.',
    src: '/images/gallery/training-batch-5.jpg',
    featured: false,
  },
  {
    id: 16,
    title: 'Interactive Knowledge Transfer & Mentorship',
    category: 'Office',
    caption: 'Senior engineering leads facilitating interactive knowledge sharing and peer code reviews.',
    src: '/images/gallery/training-session.jpg',
    featured: false,
  },
];
