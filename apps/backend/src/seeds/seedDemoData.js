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
    process.env.INITIAL_SUPERADMIN_PASSWORD || 'Thinkwires@Admin2026!';
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
      console.log(`[MongoDB] Initial Superadmin bootstrapped: ${adminEmail}`);
    } else {
      console.log(`[MongoDB] Superadmin account present: ${adminEmail}`);
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
      console.log(`[PostgreSQL] Initial Superadmin bootstrapped: ${adminEmail}`);
    } else {
      console.log(`[PostgreSQL] Superadmin account present: ${adminEmail}`);
    }
  } catch (pgErr) {
    console.log(`[PostgreSQL] User table bootstrap bypassed: ${pgErr.message}`);
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
          author: art.author || { name: 'Thinkwires Editorial' },
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
        'Thinkwires enterprise-grade IT manpower supply and workforce advisory.',
      metaTitle: 'Thinkwires — Tech Staffing & Borderless Engineering Squads',
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
      metaTitle: 'About Thinkwires — Global Tech Talent Advisory',
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
        'Connect with Thinkwires Staffing Directors across India, USA, and Canada.',
      metaTitle: 'Contact Thinkwires — Global Office Locations & Inquiries',
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
      metaTitle: 'Global Payroll Management — Thinkwires',
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
      metaTitle: 'Employer of Record (EOR) — Thinkwires',
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
      metaTitle: 'IT Staff Augmentation — Thinkwires',
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
      metaTitle: 'Permanent Staffing & Executive Search — Thinkwires',
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
      metaTitle: 'Hire Top Tech Talent — Thinkwires',
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
      metaTitle: 'Candidate Portal — Thinkwires',
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
      metaTitle: 'Industry Talent Corridors — Thinkwires',
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
        '[MongoDB] Connection failed during standalone seed execution:',
        err.message
      );
      console.log(
        '[MongoDB] Please verify that MONGODB_URI is reachable in your .env file.'
      );
      try {
        await sequelize.close();
      } catch (_) {}
      process.exit(1);
    });
}
