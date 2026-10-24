import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import config from '../configs/dotenv.js';

import Employee from '../models/employee.mongo.model.js';
import Candidate from '../models/candidate.mongo.model.js';
import Client from '../models/client.mongo.model.js';
import JobRequirement from '../models/job.mongo.model.js';
import Placement from '../models/placement.mongo.model.js';
import Page from '../models/page.mongo.model.js';
import Article from '../models/article.mongo.model.js';
import Media from '../models/media.mongo.model.js';
import Announcement from '../models/announcement.mongo.model.js';
import Activity from '../models/activity.mongo.model.js';
import UserMongo from '../models/user.mongo.model.js';
import { User as UserPg } from '../models/user.model.js';
import { sequelize } from '../configs/db.js';
import { connectMongoDB } from '../configs/mongodb.js';
import { hashPassword } from '../utils/auth.util.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const seedDatabase = async () => {
  const adminSeedFilePath = path.join(__dirname, 'adminSeedData.json');
  const mockSeedFilePath = path.join(__dirname, 'mockData.json');

  const adminData = JSON.parse(fs.readFileSync(adminSeedFilePath, 'utf8'));
  const mockData = fs.existsSync(mockSeedFilePath)
    ? JSON.parse(fs.readFileSync(mockSeedFilePath, 'utf8'))
    : {};

  // Bootstrap initial Superadmin if none exists
  const adminEmail = (
    process.env.INITIAL_SUPERADMIN_EMAIL || 'superadmin@thinkwires.com'
  )
    .toLowerCase()
    .trim();
  const adminPassword =
    process.env.INITIAL_SUPERADMIN_PASSWORD || 'ThinkWires@Admin2026!';
  const defaultHashedPassword = await hashPassword(adminPassword);

  if (mongoose.connection.readyState === 1) {
    const existingAdmin = await UserMongo.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await UserMongo.create({
        name: 'Super Admin',
        email: adminEmail,
        password: defaultHashedPassword,
        role: 'superadmin',
        designation: 'Superadmin',
        isActive: true,
      });
      console.log(`✅ [MongoDB] Initial Superadmin bootstrapped: ${adminEmail}`);
    } else {
      console.log(`ℹ️ [MongoDB] Superadmin account present: ${adminEmail}`);
    }
  }

  // Dual-mode: sync PostgreSQL User table if connected
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    const existingPgAdmin = await UserPg.findOne({ where: { email: adminEmail } });
    if (!existingPgAdmin) {
      await UserPg.create({
        name: 'Super Admin',
        email: adminEmail,
        password: defaultHashedPassword,
        role: 'superadmin',
        designation: 'Superadmin',
        isActive: true,
      });
      console.log(`✅ [PostgreSQL] Initial Superadmin bootstrapped: ${adminEmail}`);
    } else {
      console.log(`ℹ️ [PostgreSQL] Superadmin account present: ${adminEmail}`);
    }
  } catch (pgErr) {
    console.log(`ℹ️ [PostgreSQL] User table bootstrap bypassed: ${pgErr.message}`);
  }

  for (const cli of adminData.clients || []) {
    await Client.findOneAndUpdate(
      { companyName: cli.companyName },
      { ...cli },
      { upsert: true, new: true }
    );
  }

  for (const plc of adminData.placements || []) {
    await Placement.findOneAndUpdate(
      {
        candidateOrEmployeeName: plc.candidateOrEmployeeName,
        clientName: plc.clientName,
      },
      { ...plc },
      { upsert: true, new: true }
    );
  }

  // Employees & Internal Staff
  for (const emp of adminData.employees || []) {
    await Employee.findOneAndUpdate(
      { email: emp.email },
      { ...emp },
      { upsert: true, new: true }
    );
  }

  // Job Postings & Requirements
  for (const job of adminData.jobs || []) {
    await JobRequirement.findOneAndUpdate(
      { title: job.title, client: job.client },
      { ...job, jobId: job.id },
      { upsert: true, new: true }
    );
  }

  // Pre-vetted Talent Cloud Candidates
  const candidateScores = {
    'deepak.verma@example.com': 94,
    'shalini.m@example.com': 91,
    'aditya.rao@example.com': 97,
    'meera.joshi@example.com': 89,
    'gaurav.b@example.com': 95,
    'swati.d@example.com': 93,
    'naveen.c@example.com': 72,
    'zara.williams@example.com': 90,
  };

  for (const cand of adminData.candidates || []) {
    const score = candidateScores[cand.email] || 90;
    const isPassing = score >= 75;
    const text = [
      ...(cand.technicalSkills || []),
      cand.currentRole || '',
    ]
      .join(' ')
      .toLowerCase();

    let detectedSpecialty = 'Systems & Distributed';
    if (/pytorch|llm|genai|langchain|rag|openai|transformer|nlp|prompt|diffusion/i.test(text)) {
      detectedSpecialty = 'GenAI & LLMs';
    } else if (/aws|azure|gcp|kubernetes|docker|devops|terraform|ansible|helm|cloud|istio/i.test(text)) {
      detectedSpecialty = 'Cloud & DevOps';
    } else if (/sap|abap|hana|fico|erp|enterprise|salesforce/i.test(text)) {
      detectedSpecialty = 'SAP & Enterprise';
    } else if (/sql|data|etl|snowflake|databricks|spark|analytics|hadoop|pandas|bi/i.test(text)) {
      detectedSpecialty = 'Data & Analytics';
    }

    const rubric = {
      systemDesign: Math.min(100, Math.round(score * 1.02)),
      codeQuality: Math.min(100, Math.round(score * 0.98)),
      liveDebugging: Math.min(100, Math.round(score * 1.01)),
      communication: 96,
    };

    const dossier = {
      rubric,
      evaluatorNotes:
        cand.notes ||
        `Cleared ThinkWires technical screening assessment (${score}%). Verified for immediate enterprise client syndication.`,
      specialty: detectedSpecialty,
      verificationChecks: {
        identity: 'Verified via ThinkWires Identity Guard',
        technicalDepth: `Cleared Screening Assessment (${score}%)`,
        backgroundAudit: 'Cleared & Authenticated',
      },
    };

    await Candidate.findOneAndUpdate(
      { email: cand.email.toLowerCase().trim() },
      {
        name: cand.name,
        email: cand.email.toLowerCase().trim(),
        password: defaultHashedPassword,
        phone: cand.phone || '',
        currentRole: cand.currentRole || 'Software Engineer',
        technicalSkills: cand.technicalSkills || [],
        experience: cand.experience || 5,
        expectedSalary: cand.expectedSalary || '$65 - $80',
        resumeUrl: cand.resumeUrl || '',
        bio: cand.notes || '',
        status: cand.status || 'Applied',
        workMode: isPassing ? 'On-Bench' : 'Full-Time Looking',
        isVetted: isPassing,
        specialty: detectedSpecialty,
        assessmentScore: score,
        vettingScore: score,
        noticePeriod: isPassing ? 'Immediate' : '30 Days',
        rubric: isPassing ? rubric : null,
        dossier: isPassing ? dossier : null,
      },
      { upsert: true, new: true }
    );
  }

  // 7. Articles & Editorial (from both adminSeedData and mockData articles)
  if (Array.isArray(adminData.articles)) {
    for (const art of adminData.articles) {
      await Article.findOneAndUpdate(
        { slug: art.slug },
        { ...art },
        { upsert: true, new: true }
      );
    }
  }

  if (mockData.featuredArticleData) {
    const feat = mockData.featuredArticleData;
    const featSlug = 'beyond-the-code-data-science-ai-engine-india';
    await Article.findOneAndUpdate(
      { slug: featSlug },
      {
        title: feat.title,
        slug: featSlug,
        articleId: feat.id || 'featured-flagship-1',
        summary: feat.excerpt || feat.primaryFinding || '',
        excerpt: feat.excerpt || '',
        body: feat.excerpt || '',
        featured: true,
        badge: 'Flagship Analysis',
        badgeBg: '#dbeafe',
        badgeColor: '#1e40af',
        categories: feat.categories || [],
        primaryFinding: feat.primaryFinding || '',
        author: feat.author || { name: 'Research & Advisory Team' },
        publishedAt: feat.publishedAt || 'Sep 16, 2026',
        readTime: feat.readTime || '12 min read',
        category: feat.category || 'AI & Data Science',
        status: 'published',
      },
      { upsert: true, new: true }
    );
  }

  if (Array.isArray(mockData.articlesData)) {
    for (const art of mockData.articlesData) {
      const artSlug =
        art.slug ||
        art.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      await Article.findOneAndUpdate(
        { slug: artSlug },
        {
          title: art.title,
          slug: artSlug,
          articleId: art.id,
          summary: art.excerpt || '',
          excerpt: art.excerpt || '',
          body: art.excerpt || '',
          featured: Boolean(art.featured),
          badge: art.badge || '',
          badgeBg: art.badgeBg || '',
          badgeColor: art.badgeColor || '',
          subCategory: art.subCategory || '',
          telemetry: art.telemetry || null,
          author: art.author || { name: 'ThinkWires Editorial' },
          category: art.category || 'Market Report',
          publishedAt: art.publishedAt || new Date().toISOString(),
          readTime: art.readTime || '5 min read',
          status: 'published',
        },
        { upsert: true, new: true }
      );
    }
  }

  // 8. CMS Pages (Complete website sections from mockData + admin pages)
  const fullPages = [
    {
      title: 'Home',
      slug: 'home',
      category: 'Core Website',
      content:
        'ThinkWires enterprise-grade IT manpower supply and workforce advisory.',
      metaTitle: 'ThinkWires — Tech Staffing & Borderless Engineering Squads',
      metaDescription:
        'Deploy top engineering talent and compliant global workforce infrastructure.',
      data: {
        techStack: mockData.initialTechStack || [],
        stats: mockData.statsData || {},
        industries: mockData.industriesData || [],
        process: mockData.processData || [],
        capabilities: mockData.capabilitiesData || [],
        reports: mockData.reportsData || [],
        benefits: mockData.benefitsData || [],
        faqs: mockData.faqsData || [],
        researchers: mockData.researchersData || [],
      },
      status: 'published',
    },
    {
      title: 'About Us',
      slug: 'about',
      category: 'Core Website',
      content:
        'Founded in 2022 as a premier workforce advisor and staffing aggregator.',
      metaTitle: 'About ThinkWires — Global Tech Talent Advisory',
      metaDescription:
        'Connecting high-growth enterprises with specialized engineering talent.',
      data: mockData.aboutData || {},
      status: 'published',
    },
    {
      title: 'Contact Us',
      slug: 'contact',
      category: 'Core Website',
      content:
        'Connect with ThinkWires Staffing Directors across India, USA, and Canada.',
      metaTitle: 'Contact ThinkWires — Global Office Locations & Inquiries',
      metaDescription:
        'Get in touch for enterprise tech staffing and talent augmentation.',
      data: mockData.contactData || {},
      status: 'published',
    },
    {
      title: 'Talent Bench',
      slug: 'bench',
      category: 'Talent Services',
      content:
        'On-demand pre-vetted senior software engineers ready for immediate deployment.',
      metaTitle: 'Talent Bench — Pre-Vetted Immediate Deployment Engineers',
      metaDescription:
        'Access top 1% engineering talent across India ready for sub-48-hour onboarding.',
      data: mockData.benchData || {},
      status: 'published',
    },
    {
      title: 'Global Payroll',
      slug: 'services-payroll',
      category: 'Workforce Services',
      content:
        'Compliant multi-currency payroll administration across borderless tech hubs.',
      metaTitle: 'Global Payroll Management — ThinkWires',
      metaDescription: 'Streamlined international tech payroll infrastructure.',
      data: mockData.payrollData || {},
      status: 'published',
    },
    {
      title: 'Employer of Record (EOR)',
      slug: 'services-eor',
      category: 'Workforce Services',
      content:
        'Compliant international employment without setting up local legal entities.',
      metaTitle: 'Employer of Record (EOR) — ThinkWires',
      metaDescription:
        'Hire legally anywhere in India and North America without subsidiary overhead.',
      data: mockData.eorData || {},
      status: 'published',
    },
    {
      title: 'IT Staff Augmentation',
      slug: 'services-staff-augmentation',
      category: 'Workforce Services',
      content:
        'Scale engineering squads rapidly with verified contract talent.',
      metaTitle: 'IT Staff Augmentation — ThinkWires',
      metaDescription:
        'High-velocity technical team extension with strict SLAs.',
      data: mockData.staffAugmentationData || {},
      status: 'published',
    },
    {
      title: 'Permanent Staffing',
      slug: 'services-permanent-staffing',
      category: 'Workforce Services',
      content:
        'Direct-hire technical recruiting and executive leadership search.',
      metaTitle: 'Permanent Staffing & Executive Search — ThinkWires',
      metaDescription:
        'Targeted executive search for mission-critical engineering roles.',
      data: mockData.permanentStaffingData || {},
      status: 'published',
    },
    {
      title: 'Find Talent',
      slug: 'find-talent',
      category: 'Client Portal',
      content:
        'Submit specialized engineering requisitions with 5-hour SLA response.',
      metaTitle: 'Hire Top Tech Talent — ThinkWires',
      metaDescription:
        'Post engineering requisitions and get matching candidate profiles within hours.',
      data: mockData.findTalentData || {},
      status: 'published',
    },
    {
      title: 'Candidate Portal',
      slug: 'candidate-portal',
      category: 'Candidate Experience',
      content:
        'Manage applications, track interviews, and submit monthly timesheets.',
      metaTitle: 'Candidate Portal — ThinkWires',
      metaDescription:
        'Candidate dashboard for timesheets, career tracking, and onboarding.',
      data: mockData.candidatePortalData || {},
      status: 'published',
    },
    {
      title: 'Industries We Serve',
      slug: 'industries',
      category: 'Core Website',
      content:
        'Specialized talent delivery across Fintech, Healthtech, SaaS, and Enterprise AI.',
      metaTitle: 'Industry Talent Corridors — ThinkWires',
      metaDescription: 'Domain-specialized tech recruitment pipelines.',
      data: mockData.industriesPageData || {},
      status: 'published',
    },
  ];

  // Merge admin pages as well
  if (Array.isArray(adminData.pages)) {
    for (const p of adminData.pages) {
      if (!fullPages.some((fp) => fp.slug === p.slug)) {
        fullPages.push(p);
      }
    }
  }

  for (const pg of fullPages) {
    await Page.findOneAndUpdate(
      { slug: pg.slug },
      { ...pg },
      { upsert: true, new: true }
    );
  }

  for (const med of adminData.media || []) {
    await Media.findOneAndUpdate(
      { fileUrl: med.fileUrl },
      { ...med },
      { upsert: true, new: true }
    );
  }

  for (const ann of adminData.announcements || []) {
    await Announcement.findOneAndUpdate(
      { title: ann.title },
      { ...ann },
      { upsert: true, new: true }
    );
  }

  for (const act of adminData.activities || []) {
    await Activity.findOneAndUpdate(
      { action: act.action, description: act.description },
      { ...act },
      { upsert: true, new: true }
    );
  }

  console.log('Database successfully seeded.');
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  connectMongoDB()
    .then(async () => {
      console.log('Connected to MongoDB, starting seeding...');
      await seedDatabase();
      await mongoose.disconnect();
      try {
        await sequelize.close();
      } catch (_) {}
      console.log('Seeding finished, all database connections closed.');
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(
        '❌ MongoDB connection failed during standalone seed execution:',
        err.message
      );
      console.log(
        'ℹ️ Please verify that MONGODB_URI is reachable in your .env file.'
      );
      try {
        await sequelize.close();
      } catch (_) {}
      process.exit(1);
    });
}
