# Thinkwires Staffing and Workforce Solutions

Thinkwires is an enterprise technical manpower supply, global staffing, and talent management platform connecting three primary ecosystems:

1. **Clients (Enterprises & Startups)**: Sourcing pre-vetted engineering talent, managing staff augmentation, payroll outsourcing, and Employer of Record (EOR) operations.
2. **Candidates (Job Seekers & Bench Talent)**: Browsing technical mandates, applying with resumes, agreeing to Terms & Conditions and Privacy Policies, tracking application pipelines, taking proctored screening assessments, and maintaining professional profiles.
3. **Internal Admins & Recruiters**: Operating an ATS (Applicant Tracking System), managing bench staff utilization and daily cost overhead, reviewing AI candidate fit scores and assessments, and administering public web content via an integrated Content Management System (CMS).

---

## Project Documentation Hub

| Document                                               | Primary Audience            | Scope and Contents                                                                                                                                               |
| ------------------------------------------------------ | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [**docs/FrontendDocs.md**](docs/FrontendDocs.md)       | Frontend Engineers & Agents | React 19 architecture, Vite proxy, Redux Toolkit slices, routing inventory, design tokens, Three.js canvas, and auth state.                                      |
| [**docs/BackendDocs.md**](docs/BackendDocs.md)         | Backend Engineers & Agents  | Express 5 API Gateway, dual-persistence (PostgreSQL + MongoDB Atlas), connection resilience, in-memory fallback, rate limiting, and complete REST API reference. |
| [**docs/Ai_ServicesDocs.md**](docs/Ai_ServicesDocs.md) | AI Engineers & Agents       | Python FastAPI microservice, PDF link annotation parsing, ATS match scorer, assessment generator, and automated test grader.                                     |
| [**docs/adminPanel.md**](docs/adminPanel.md)           | Admins, Ops & Agents        | 15 Admin & CMS views, Recharts financial analytics, 6-stage ATS Kanban, RBAC persona switcher, candidate tracking, and live preview editors.                     |
| [**docs/PRD.md**](docs/PRD.md)                         | Product Managers & Leads    | Product Requirements Document, business KPIs, legal compliance, screening test specifications, and platform roadmap.                                             |
| [**docs/Design.md**](docs/Design.md)                   | Designers & Developers      | Design aesthetic rules, color tokens, typography scales, glassmorphism specs, and UI guidelines.                                                                 |

---

## System Architecture (Turborepo Monorepo)

The repository is managed via **Turborepo** (`apps/*` workspaces) providing isolated development across web, API, and machine learning services:

```
thinkwires/
├── apps/
│   ├── frontend/         # React 19 + Vite + Redux Toolkit (Port 5173)
│   ├── backend/          # Node.js + Express 5 Core API Gateway (Port 5000)
│   └── ai_services/      # Python 3.12 + FastAPI Microservice (Port 8000)
├── docs/                 # Consolidated documentation suite (Frontend, Backend, AI, Admin, PRD, Design)
├── package.json          # Root orchestration & unified scripts
└── turbo.json            # Turborepo task pipeline configuration
```

```
                               ┌────────────────────────────────────────────────┐
                               │           Browser / Client Applications         │
                               └───────────────────────┬────────────────────────┘
                                                       │
                      ┌────────────────────────────────┴────────────────────────────────┐
                      │ HTTP / REST                                                     │ HTTP / REST
                      ▼                                                                 ▼
      ┌──────────────────────────────┐                                  ┌──────────────────────────────┐
      │   React 19 Frontend (5173)   │ ────(Vite Reverse Proxy /api)───▶│   Express 5 Backend (5000)   │
      │   - Public Marketing Pages   │                                  │   - JWT Cookie Auth & RBAC   │
      │   - Protected Candidate App  │                                  │   - Candidate Portal Routes  │
      │   - Admin Dashboard & CMS    │                                  │   - Admin & CMS Controllers  │
      └──────────────────────────────┘                                  └───────────────┬──────────────┘
                                                                                        │
                                        ┌───────────────────────────────────────────────┼──────────────────────────────┐
                                        │                                               │                              │
                                        ▼                                               ▼                              ▼
                         ┌─────────────────────────────┐                 ┌─────────────────────────────┐┌─────────────────────────────┐
                         │   PostgreSQL (Sequelize)    │                 │     MongoDB (Mongoose)      ││   FastAPI AI Service (8000) │
                         │   - Neon Cloud Database     │                 │     - Atlas Document Store  ││   - Resume Vector Scorer    │
                         │   - Relational Structures   │                 │     - CMS & Candidate ATS   ││   - AI Test Gatekeeper      │
                         └──────────────┬──────────────┘                 └──────────────┬──────────────┘└─────────────────────────────┘
                                        │                                               │
                                        └───────────────────────┬───────────────────────┘
                                                                │ (Graceful Non-Blocking Fallback)
                                                                ▼
                                                 ┌─────────────────────────────┐
                                                 │   In-Memory Mock Fallback   │
                                                 │   (mockData / adminSeeds)   │
                                                 └─────────────────────────────┘
```

---

## Key Platform Features

- **AI Screening Gatekeeper**: Auto-generates proctored screening assessments matched to job requirements, evaluating technical answers and submitting scores.
- **Resume Match Scorer & Annotation Parser**: Semantic comparison of applicant resumes against requisitions to generate a **Fit Score (0-100%)**, extracting structured profile links (LinkedIn, GitHub, portfolio) directly from PDF annotations and textual content.
- **Job Application Workflow**:
  - Enforces authenticated candidate submissions.
  - Requires explicit consent to **Terms & Conditions** (`/terms-of-service`) and **Privacy Policy** (`/privacy-policy`).
  - Pre-fills editable candidate details from existing profiles or newly parsed resumes.
  - Allows candidates to view, monitor, and withdraw their applications.
- **Bench Management**: Monitors internal unassigned engineers on payroll, tracks daily cost overhead, and enables single-click deployment to client projects.
- **Admin Control Panel & CMS**: 15 integrated modules for ATS recruitment, candidate intake synchronization, client billing, staff directories, and live website CMS (pages, blog, media, SEO, announcements).
- **Resilient Dual-Persistence**:
  - **PostgreSQL**: Relational entities and schema migrations.
  - **MongoDB Atlas**: Document storage with connection pooling (`family: 4`, `maxIdleTimeMS`, `heartbeatFrequencyMS`, `serverSelectionTimeoutMS`) and an active reconnection supervisor preventing idle connection drops.
  - **In-Memory Fallback**: Automatic failover ensuring development, testing, and UI preview workflows remain operational when remote databases are temporarily unreachable.

---

## Quickstart Setup Guide

### 1. Prerequisites

- **Node.js** (v20.x or higher)
- **Python** (v3.12.x or higher)
- **Git**

### 2. Install Dependencies

You can install all JavaScript workspace dependencies and the Python AI microservice requirements in a single command from the root:

```bash
# Complete setup: installs npm dependencies across all workspaces + sets up Python venv & requirements.txt
npm run setup
# or
npm run install:all
```

Alternatively, install dependencies individually from the root:

```bash
# Install npm dependencies across all workspaces (apps/*)
npm install

# Install Python requirements.txt for the AI microservice into venv
npm run install:requirements

# Or install individual app dependencies directly from root:
npm run install:frontend
npm run install:backend
```

### 3. Configure Environment Variables

Template files are provided in the root and in each application directory:

```bash
# 1. Master root environment
cp .env.example .env

# 2. Backend environment
cp apps/backend/.env.example apps/backend/.env

# 3. Frontend environment
cp apps/frontend/.env.example apps/frontend/.env

# 4. AI microservice environment
cp apps/ai_services/.env.example apps/ai_services/.env
```

#### Core Backend `.env` Keys:

```ini
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/thinkwire_db
JWT_SECRET=your_secure_random_jwt_secret
AI_SERVICE_URL=http://localhost:8000
```

### 4. Set Up AI Microservice (Python Virtual Environment)

You can automatically set up the virtual environment and dependencies for your operating system (Windows, Linux, macOS) by running:

```bash
npm run setup:ai
```

Alternatively, set it up manually:

**Windows (PowerShell / Command Prompt):**

```powershell
cd apps/ai_services
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
cd ../..
```

**Linux / macOS (Bash / Zsh):**

```bash
cd apps/ai_services
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ../..
```

### 5. Launch the Monorepo Development Environment

Run the root Turborepo development script:

```bash
npm run dev
```

Turborepo will concurrently launch:

- **Frontend Application**: [`http://localhost:5173`](http://localhost:5173)
- **Express Core API**: [`http://localhost:5000`](http://localhost:5000)
- **FastAPI AI Microservice**: [`http://localhost:8000`](http://localhost:8000) (Interactive Swagger docs: [`http://localhost:8000/docs`](http://localhost:8000/docs))

---

## Monorepo Scripts Reference

All primary operations can be executed from the root directory:

| Command                  | Action                                                                       |
| ------------------------ | ---------------------------------------------------------------------------- |
| `npm run dev`            | Runs Frontend, Backend, and AI Service concurrently in persistent watch mode |
| `npm run build`          | Builds production-optimized artifacts across all workspaces via Turborepo    |
| `npm run lint`           | Runs ESLint analysis across apps                                             |
| `npm run format`         | Auto-formats code using Prettier                                             |
| `npm run format:check`   | Verifies code adherence to Prettier formatting standards                     |
| `npm run migrate`        | Executes pending database migrations (`apps/backend`)                        |
| `npm run migrate:status` | Checks database migration status                                             |
| `npm run migrate:down`   | Rolls back the latest database migration                                     |

---

## Detailed Directory Map

```
thinkwires/
├── apps/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── admin/            # 15 Admin & CMS management modules (CandidatesView, JobsView, etc.)
│   │   │   ├── components/       # Reusable components (GlobalJobApplicationForm, Navbar, Footer, etc.)
│   │   │   ├── pages/            # Public, Auth, Candidate portal, and Legal pages
│   │   │   ├── store/            # Redux Toolkit store & 13 domain slices
│   │   │   ├── index.css         # Design tokens, ApplyModal styles, & responsive layouts
│   │   │   └── App.jsx           # React Router v7 routes & code-splitting
│   │   └── vite.config.js        # Vite config with /api reverse proxy to localhost:5000
│   │
│   ├── backend/
│   │   ├── src/
│   │   │   ├── configs/          # Database (PostgreSQL, MongoDB Atlas) & env loaders
│   │   │   ├── controllers/      # Auth, Candidate Portal, and Admin controllers
│   │   │   ├── middlewares/      # JWT auth, RBAC permissions, Multer uploads
│   │   │   ├── migrations/       # Version-controlled schema migrations
│   │   │   ├── models/           # Mongoose Schema definitions (JobApplication, Candidate, etc.)
│   │   │   ├── routes/           # REST endpoints (/api/auth, /api/candidate, /api/admin)
│   │   │   ├── seeds/            # Demo data fixtures & seed runners
│   │   │   ├── utils/            # Recruitment email utility (SMTP), logger, and auth helpers
│   │   │   ├── app.js            # Express app configuration & middlewares
│   │   │   └── server.js         # Non-blocking server bootstrap & connection monitor
│   │   └── uploads/              # Local disk storage for candidate resume uploads (.gitignore protected)
│   │
│   └── ai_services/
│       ├── main.py               # FastAPI application entry point
│       ├── requirements.txt      # FastAPI, pypdf, httpx dependencies
│       ├── tests/                # Automated pytest test suites
│       ├── app/                  # Modular package (config, schemas, services, api/v1)
│       └── venv/                 # Python virtual environment
│
├── docs/                         # Platform & Microservice Documentation
│   ├── adminPanel.md             # Admin Panel & CMS manual
│   ├── Ai_ServicesDocs.md        # Comprehensive AI Microservice architecture & API guide
│   ├── BackendDocs.md            # Detailed backend developer & agent guide
│   ├── Design.md                 # Design system, tokens, and aesthetic specifications
│   ├── FrontendDocs.md           # Detailed frontend developer & agent guide
│   └── PRD.md                    # Platform Product Requirements Document
├── package.json                  # Turborepo root configuration
└── turbo.json                    # Turborepo pipeline tasks
```

---

## Contribution & Coding Standards

1. **Branching Strategy**: Branch from `master` with descriptive prefixes: `feature/your-feature`, `bugfix/issue-description`, or `chore/cleanup`.
2. **Conventional Commits**: Format commit messages cleanly:
   - `feat: added candidate terms agreement checkbox`
   - `fix: resolved mongodb atlas auto reconnection drop`
   - `docs: updated readme and environment configuration`
3. **Frontend Rules**: Adhere to CSS design tokens in `index.css`. Maintain accessibility, semantic labels, and responsive layouts.
4. **Backend Rules**: Maintain non-blocking database connections, resilient in-memory fallbacks, and comprehensive input validation.
5. **Aesthetics & Messaging**: Keep interfaces clean and professional without decorative emojis in system logs, alerts, or UI components.
