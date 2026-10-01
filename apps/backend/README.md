# ⚙️ ThinkWire Backend Core API Gateway

[![Express](https://img.shields.io/badge/Express-5.x-black.svg?style=flat&logo=express)](https://expressjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20%20%7C%2022-339933.svg?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-336791.svg?style=flat&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![Redis](https://img.shields.io/badge/Redis-7.x-DC382D.svg?style=flat&logo=redis&logoColor=white)](https://redis.io/)
[![OpenAPI 3.0](https://img.shields.io/badge/OpenAPI-3.0-85EA2D.svg?style=flat&logo=openapiinitiative&logoColor=black)](http://localhost:5000/api/docs)
[![JWT](https://img.shields.io/badge/Auth-JWT%20Bearer-000000.svg?style=flat&logo=jsonwebtokens)](https://jwt.io/)

The **ThinkWire Backend API Gateway** is the central orchestrator of the ThinkWire Staffing and Solutions platform. It handles user authentication, Role-Based Access Control (RBAC), job requisitions, candidate onboarding, bench talent management, client billing, CMS feature flags, and proxy routing to the Python FastAPI AI Microservice.

---

## 📋 Table of Contents

1. [System Architecture & System Context](#1-system-architecture--system-context)
2. [Architecture Overview & Separation of Concerns](#2-architecture-overview--separation-of-concerns)
3. [Authentication & Authorization Flow (RBAC)](#3-authentication--authorization-flow-rbac)
4. [Quickstart Setup Guide](#4-quickstart-setup-guide)
   - [Prerequisites](#prerequisites)
   - [1. Install Dependencies](#1-install-dependencies)
   - [2. Configure Environment Variables (.env)](#2-configure-environment-variables-env)
   - [3. Start the Backend Server](#3-start-the-backend-server)
5. [Database Setup & Management (PostgreSQL & Redis)](#5-database-setup--management-postgresql--redis)
   - [Starting Databases via Docker Compose](#starting-databases-via-docker-compose)
   - [Running Database Migrations](#running-database-migrations)
   - [Database Seeding & Mock Data Generation](#database-seeding--mock-data-generation)
   - [Production Safety Protocol](#production-safety-protocol)
   - [Soft Deletes Strategy (`paranoid: true`)](#soft-deletes-strategy-paranoid-true)
6. [Required Environment Variables Reference](#6-required-environment-variables-reference)
7. [API Documentation & Interactive Swagger UI](#7-api-documentation--interactive-swagger-ui)
   - [Interactive Swagger UI](#interactive-swagger-ui)
   - [Postman Collection](#postman-collection)
   - [API Endpoint Directory](#api-endpoint-directory)
8. [Testing Guide](#8-testing-guide)
9. [Contribution Guidelines](#9-contribution-guidelines)
   - [Coding Standards & Formatting](#coding-standards--formatting)
   - [Git Branching Strategy](#git-branching-strategy)
   - [Conventional Commit Format](#conventional-commit-format)

---

## 1. System Architecture & System Context

The Backend API Gateway sits at the center of the ThinkWire monorepo architecture. It decouples the React 19 Frontend from internal persistence layers and the dedicated Python FastAPI AI Microservice:

```
+-----------------------------------------------------------------------------------+
|                            React 19 Frontend (Port 5173)                          |
+-----------------------------------------+-----------------------------------------+
                                          |
                              (HTTP / REST / WebSockets)
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                        Express.js API Gateway (Port 5000)                         |
|                 (Authentication, RBAC, Billing, CMS, Feature Flags)                |
+--------------------+---------------------------------------------+----------------+
                     |                                             |
   (Async Jobs via Redis / BullMQ)                     (Sync Circuit-Breaker REST)
                     |                                             |
                     v                                             v
+------------------------------------+             +--------------------------------+
|        Redis (Port 6379)           | <---------> |   FastAPI AI Service (:8000)   |
|   (Task Queues, Flag Matrix)       |             |   (GPT-4o, pgvector Embeddings)|
+------------------------------------+             +---------------+----------------+
                                                                   |
                                                      (Vector Similarity Search)
                                                                   |
                                                                   v
                                                   +--------------------------------+
                                                   | PostgreSQL + pgvector (:5432)  |
                                                   +--------------------------------+
```

### Core Business Responsibilities:

1. **Authentication Gateway**: Issues and verifies JSON Web Tokens (JWT) for Candidates, Clients, Recruiters, and Admins.
2. **Requisition & Candidate Routing**: Handles CRUD operations and pagination for job postings and candidate profiles.
3. **Bench Talent Tracking**: Monitors unassigned internal talent, computing daily burn costs and managing client redeployment.
4. **AI Gateway Proxy**: Orchestrates calls to the FastAPI microservice for AI test generation (`/api/v1/assessments/generate`) and resume fit scoring (`/api/v1/resumes/score`).
5. **CMS & Feature Flags**: Maintains dynamic feature toggles in Redis for instant UI feature activation without deployments.

---

## 2. Architecture Overview & Separation of Concerns

The backend follows an enterprise **Layered Architecture (Routes → Middlewares → Controllers → Services → Models)**, strictly enforcing separation of concerns:

```
apps/backend/
├── .env.example                       # Documented environment template
├── Dockerfile                         # Container build definition
├── package.json                       # Scripts and dependencies
├── README.md                          # Backend documentation guide
├── docs/
│   ├── API_DOCUMENTATION.md           # Exhaustive endpoint reference
│   └── thinkwires_backend.postman_collection.json # Ready-to-import Postman collection
├── src/
│   ├── app.js                         # Express app configuration & middlewares
│   ├── server.js                      # Server startup, port binding & graceful shutdown
│   ├── config/                        # Database, Redis & environment configuration
│   │   └── environment.js             # Centralized config with defaults
│   ├── controllers/                   # Request extraction, validation & HTTP responses
│   │   ├── auth.controller.js         # Login, register & session handlers
│   │   ├── job.controller.js          # Job requisition HTTP handlers
│   │   ├── candidate.controller.js    # Candidate querying handlers
│   │   ├── bench.controller.js        # Bench talent & financial burn rate handlers
│   │   └── ai.controller.js           # AI screening & resume scoring proxy handlers
│   ├── docs/
│   │   └── swagger.json               # OpenAPI 3.0.0 Specification
│   ├── middlewares/                   # Cross-cutting concerns
│   │   ├── auth.middleware.js         # JWT token verification & RBAC guard
│   │   ├── errorHandler.middleware.js # Standardized JSON error response handler
│   │   └── requestLogger.middleware.js# HTTP request duration logger
│   ├── routes/                        # Route mapping and sub-routers
│   │   ├── index.js                   # Root API v1 router aggregator
│   │   ├── auth.routes.js             # Authentication routes
│   │   ├── job.routes.js              # Job routes
│   │   ├── candidate.routes.js        # Candidate routes
│   │   ├── bench.routes.js            # Bench routes
│   │   └── ai.routes.js               # AI proxy routes
│   └── services/                      # Pure business logic & database/AI calls
│       ├── auth.service.js            # Token generation & credential validation
│       ├── job.service.js             # Job filtering & pagination logic
│       ├── bench.service.js           # Bench talent tracking & burn calculations
│       └── aiProxy.service.js         # Resilient HTTP client for FastAPI AI service
└── tests/
    └── api.test.js                    # Automated endpoint test suite (Node test runner)
```

### Architectural Tiers Explained:

- **Routes (`src/routes/`)**: Map incoming HTTP URLs and methods to specific controllers and apply route-specific middlewares (such as auth guards). Routes contain no business logic.
- **Controllers (`src/controllers/`)**: Handle the HTTP transport layer. They extract request parameters (`req.body`, `req.query`, `req.params`), trigger the corresponding service, and return standard HTTP status codes (`200`, `201`, `400`, `404`).
- **Services (`src/services/`)**: Contain pure business logic, database transactions, calculations, and integrations with external microservices (FastAPI AI and Redis). Services are transport-agnostic and can be unit tested without mocking HTTP request objects.
- **Middlewares (`src/middlewares/`)**: Intercept requests to perform cross-cutting operations: JWT verification, RBAC authorization, request logging, and centralized error catching.
- **Config (`src/config/`)**: Centralizes environment variables, default parameters, and database pool configurations.

---

## 3. Authentication & Authorization Flow (RBAC)

ThinkWire implements a stateless **JSON Web Token (JWT)** authentication architecture with **Role-Based Access Control (RBAC)**.

### Authentication Flow Diagram:

```
[ Frontend / Client ]                 [ Express Gateway ]                 [ Database / Auth Service ]
        |                                      |                                       |
        |  1. POST /api/v1/auth/login          |                                       |
        |  { email, password }                 |                                       |
        |------------------------------------->|                                       |
        |                                      |  2. Validate User & Password Hash     |
        |                                      |-------------------------------------->|
        |                                      |<--------------------------------------|
        |                                      |  3. Generate JWT (userId, role, exp)  |
        |  4. 200 OK                           |                                       |
        |  { accessToken, refreshToken, user } |                                       |
        |<-------------------------------------|                                       |
        |                                      |                                       |
        |  5. GET /api/v1/bench                |                                       |
        |  Header: Authorization: Bearer <JWT> |                                       |
        |------------------------------------->|                                       |
        |                                      |  6. verifyToken Middleware:           |
        |                                      |     Verify signature & decode payload |
        |                                      |  7. authorizeRoles('admin'):          |
        |                                      |     Check if user.role in allowed list|
        |  8. 200 OK (Bench Data)              |                                       |
        |<-------------------------------------|                                       |
```

### Role Access Matrix:

| Endpoint                      | Method | `candidate` | `client` | `recruiter` | `admin` |
| :---------------------------- | :----: | :---------: | :------: | :---------: | :-----: |
| `/api/v1/auth/register`       | `POST` |     ✅      |    ✅    |     ❌      |   ❌    |
| `/api/v1/auth/login`          | `POST` |     ✅      |    ✅    |     ✅      |   ✅    |
| `/api/v1/auth/me`             | `GET`  |     ✅      |    ✅    |     ✅      |   ✅    |
| `/api/v1/jobs`                | `GET`  | ✅ (Public) |    ✅    |     ✅      |   ✅    |
| `/api/v1/jobs`                | `POST` |     ❌      |    ✅    |     ❌      |   ✅    |
| `/api/v1/candidates`          | `GET`  |     ❌      |    ✅    |     ✅      |   ✅    |
| `/api/v1/bench`               | `GET`  |     ❌      |    ❌    |     ✅      |   ✅    |
| `/api/v1/bench/assign`        | `POST` |     ❌      |    ❌    |     ✅      |   ✅    |
| `/api/v1/ai/*`                | `POST` |     ✅      |    ✅    |     ✅      |   ✅    |
| `/api/v1/admin/feature-flags` | `GET`  | ✅ (Public) |    ✅    |     ✅      |   ✅    |

### Quick Test Developer Tokens:

For rapid onboarding and frontend testing without going through registration, the gateway accepts these simulated developer tokens:

- `Authorization: Bearer dev-admin-token` ➔ Grants **admin** role.
- `Authorization: Bearer dev-client-token` ➔ Grants **client** role.
- `Authorization: Bearer dev-candidate-token` ➔ Grants **candidate** role.

---

## 4. Quickstart Setup Guide

### Prerequisites

Ensure you have the following installed on your machine:

- **Node.js**: Version 20.x or 22.x LTS ([Download Node.js](https://nodejs.org/))
- **Docker Desktop**: ([Download Docker](https://www.docker.com/products/docker-desktop)) — Required for PostgreSQL and Redis.

---

### 1. Install Dependencies

From the repository root or the `apps/backend` directory:

```bash
# From workspace root:
npm install

# OR from apps/backend directory:
cd apps/backend
npm install
```

---

### 2. Configure Environment Variables (.env)

The backend provides a comprehensive `.env.example` template:

```bash
cd apps/backend
cp .env.example .env
```

_(On Windows PowerShell: `Copy-Item .env.example .env`)_

Review the `.env` file. By default, it connects to PostgreSQL at `localhost:5432` and Redis at `localhost:6379`.

---

### 3. Start the Backend Server

To launch the backend in **development mode** (with native hot-reloading):

```bash
npm run dev
```

You will see the startup banner:

```
======================================================
🚀 ThinkWire Backend API Gateway is LIVE
======================================================
🌐 Server Address   : http://localhost:5000
📖 Swagger API Docs : http://localhost:5000/api/docs
📄 OpenAPI Spec JSON: http://localhost:5000/api/docs/swagger.json
🩺 Health Check     : http://localhost:5000/health
🌍 Environment      : development
🤖 AI Microservice  : http://localhost:8000
======================================================
```

To run in **production mode**:

```bash
npm start
```

---

## 5. Database Setup & Management (PostgreSQL & Redis)

### Starting Databases via Docker Compose

ThinkWire utilizes **PostgreSQL 16** with the **`pgvector`** extension and **Redis 7**. Spin them up with Docker:

```bash
# Run from repository root:
docker compose up -d postgres redis
```

Verify that the containers are healthy:

```bash
docker ps
```

You should see `thinkwire-postgres` (port `5432`) and `thinkwire-redis` (port `6379`) running.

---

### Running Database Migrations

Database tables are managed via Sequelize ORM migrations. To execute pending migrations against your PostgreSQL instance:

```bash
npm run db:migrate
```

_(Or via Sequelize CLI: `npx sequelize-cli db:migrate`)_

This creates the core schema:

- `Users`: Stores account credentials, email, and RBAC role.
- `Candidates`: Stores resumes, experience, hourly rates, and `pgvector` embeddings.
- `Jobs`: Stores client job postings, required skills, and budget ranges.
- `Applications`: Tracks candidate submissions, AI Fit Scores, and screening results.
- `FeatureFlags`: Stores dynamic platform toggles.

---

### Database Seeding & Mock Data Generation

To populate your database with realistic mock data (50 candidate profiles, 10 client job requisitions, and default admin accounts):

```bash
npm run db:seed
```

_(Or via Sequelize CLI: `npx sequelize-cli db:seed:all`)_

Default seed credentials:

- **Admin**: `admin@thinkwire.internal` / `AdminPass123!`
- **Client**: `client@thinkwire.internal` / `ClientPass123!`
- **Candidate**: `candidate@thinkwire.internal` / `CandidatePass123!`

---

### Production Safety Protocol

> ⚠️ **CRITICAL SAFETY GUARD**: Seeding scripts must strictly verify the environment before execution to prevent accidental data loss in staging or production:
>
> ```javascript
> if (process.env.NODE_ENV === 'production') {
>   console.error(
>     '[FATAL] Database seeding is permanently disabled in production.'
>   );
>   process.exit(1);
> }
> ```
>
> Additionally, the production PostgreSQL database user role must be configured without `DROP` or `TRUNCATE` permissions.

---

### Soft Deletes Strategy (`paranoid: true`)

All core business models (Users, Jobs, Candidates, Applications) enforce Sequelize soft deletion:

- When an entity is deleted, Sequelize updates the `deletedAt` timestamp instead of issuing a SQL `DELETE`.
- Query methods (`findAll`, `findOne`) automatically append `WHERE "deletedAt" IS NULL`.
- This guarantees data recoverability and complies with enterprise compliance audit requirements.

---

## 6. Required Environment Variables Reference

| Variable                | Type   | Default Value                                              | Description                                               |  Required?   |
| :---------------------- | :----- | :--------------------------------------------------------- | :-------------------------------------------------------- | :----------: |
| `PORT`                  | Number | `5000`                                                     | Port for the Express HTTP server                          |   Optional   |
| `HOST`                  | String | `0.0.0.0`                                                  | Host interface to bind (`0.0.0.0` for Docker)             |   Optional   |
| `NODE_ENV`              | String | `development`                                              | Runtime environment (`development`, `test`, `production`) | Recommended  |
| `LOG_LEVEL`             | String | `info`                                                     | Logging verbosity (`debug`, `info`, `warn`, `error`)      |   Optional   |
| `DATABASE_URL`          | String | `postgres://postgres:postgres@localhost:5432/thinkwire_db` | PostgreSQL connection URI                                 | **Required** |
| `DB_POOL_MIN`           | Number | `2`                                                        | Minimum active database pool connections                  |   Optional   |
| `DB_POOL_MAX`           | Number | `10`                                                       | Maximum active database pool connections                  |   Optional   |
| `REDIS_URL`             | String | `redis://localhost:6379`                                   | Redis connection URI for caching and BullMQ queues        | **Required** |
| `AI_SERVICE_URL`        | String | `http://localhost:8000`                                    | Base URL of Python FastAPI AI Microservice                | **Required** |
| `AI_SERVICE_TIMEOUT_MS` | Number | `10000`                                                    | Timeout in ms for synchronous calls to AI microservice    |   Optional   |
| `JWT_SECRET`            | String | _(dev string)_                                             | High-entropy secret key used for signing JWTs             | **Required** |
| `JWT_EXPIRES_IN`        | String | `7d`                                                       | Lifespan of access tokens (`1h`, `24h`, `7d`)             |   Optional   |
| `CORS_ORIGIN`           | String | `http://localhost:5173,http://localhost:3000`              | Comma-separated allowed frontend origins                  |   Optional   |
| `STRIPE_SECRET_KEY`     | String | _(placeholder)_                                            | Secret key for Stripe client billing & invoices           |   Optional   |
| `RESEND_API_KEY`        | String | _(placeholder)_                                            | API key for transactional email delivery                  |   Optional   |

---

## 7. API Documentation & Interactive Swagger UI

### Interactive Swagger UI

The backend includes a built-in interactive **Swagger UI** that requires no external tools or plugins.

Open your browser and navigate to:
👉 **[`http://localhost:5000/api/docs`](http://localhost:5000/api/docs)**

Features:

- Visual browsing of all endpoints categorized by tag.
- Full request and response JSON schemas.
- Interactive "Try it out" feature to execute requests against your live backend.
- Authorize modal to test with Bearer tokens (`dev-admin-token`, etc.).

---

### Postman Collection

For API testing in Postman or Insomnia:

1. Locate the file: [`apps/backend/docs/thinkwires_backend.postman_collection.json`](docs/thinkwires_backend.postman_collection.json).
2. Open Postman ➔ Click **Import** ➔ Select the JSON file.
3. Pre-configured environment variables `{{base_url}}` and `{{token}}` are included.

---

### API Endpoint Directory

For exhaustive request/response schemas and cURL examples, see [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md).

| Category       | Method | Endpoint                         | Description                                 |    Auth Required     |
| :------------- | :----: | :------------------------------- | :------------------------------------------ | :------------------: |
| **System**     | `GET`  | `/health`                        | Server health & dependencies check          |          No          |
| **System**     | `GET`  | `/api/docs`                      | Interactive Swagger UI documentation        |          No          |
| **System**     | `GET`  | `/api/docs/swagger.json`         | Raw OpenAPI 3.0.0 JSON specification        |          No          |
| **Auth**       | `POST` | `/api/v1/auth/register`          | Register new candidate or client account    |          No          |
| **Auth**       | `POST` | `/api/v1/auth/login`             | Authenticate and obtain JWT access tokens   |          No          |
| **Auth**       | `GET`  | `/api/v1/auth/me`                | Fetch authenticated user profile            |     Bearer Token     |
| **Jobs**       | `GET`  | `/api/v1/jobs`                   | Fetch paginated job listings with filters   |          No          |
| **Jobs**       | `GET`  | `/api/v1/jobs/:id`               | Fetch details of a single job requisition   |          No          |
| **Jobs**       | `POST` | `/api/v1/jobs`                   | Create a new job requisition                |  `client`, `admin`   |
| **Candidates** | `GET`  | `/api/v1/candidates`             | Query talent pool by skill and bench status |  `client`, `admin`   |
| **Bench**      | `GET`  | `/api/v1/bench`                  | Monitor unassigned bench talent & burn rate | `admin`, `recruiter` |
| **Bench**      | `POST` | `/api/v1/bench/assign`           | Assign bench engineer to client project     | `admin`, `recruiter` |
| **AI Proxy**   | `POST` | `/api/v1/ai/generate-assessment` | Proxy test generation to AI microservice    |     Bearer Token     |
| **AI Proxy**   | `POST` | `/api/v1/ai/score-resume`        | Proxy resume fit scoring to AI microservice |     Bearer Token     |
| **Admin**      | `GET`  | `/api/v1/admin/feature-flags`    | Fetch real-time feature flag matrix         |   Public / Bearer    |

---

## 8. Testing Guide

The backend uses Node.js's native test runner for ultra-fast, zero-dependency testing.

To execute the test suite:

```bash
npm test
```

### Writing New API Tests:

Add tests under `apps/backend/tests/`:

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';

test('Sample Job Endpoint Test', async () => {
  const server = app.listen(0);
  const port = server.address().port;

  const res = await fetch(`http://127.0.0.1:${port}/api/v1/jobs`);
  assert.equal(res.status, 200);

  server.close();
});
```

---

## 9. Contribution Guidelines

### Coding Standards & Formatting

To maintain codebase health and consistency across the monorepo:

1. **JavaScript ES Modules**: Use standard `import` and `export` statements (`"type": "module"`).
2. **Naming Conventions**:
   - Files: `kebab-case.category.js` (e.g., `auth.controller.js`, `job.service.js`).
   - Classes: `PascalCase` (e.g., `JobService`, `AuthController`).
   - Functions & Variables: `camelCase` (e.g., `generateAssessment`, `totalDailyBurn`).
3. **Automated Formatting**:
   Before committing, run Prettier:
   ```bash
   npm run format
   ```

---

### Git Branching Strategy

All new development must be performed on feature branches branched from `feature` or `master`:

- Feature branches: `feature/issue-<number>` (e.g., `feature/issue-09`)
- Bugfix branches: `fix/issue-<number>`

---

### Conventional Commit Format

All commit messages must adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short description> (#issue-number)

[optional body]
```

#### Allowed Types:

- `feat`: A new user-facing feature.
- `fix`: A bug fix.
- `docs`: Documentation changes only (e.g., README, API docs).
- `refactor`: Code changes that neither fix a bug nor add a feature.
- `test`: Adding or correcting tests.
- `chore`: Changes to build scripts, configurations, or dependencies.

#### Example Commit Messages:

```bash
git commit -m "docs(backend): add setup guide, architecture overview, and swagger docs (#09)"
git commit -m "feat(backend): implement bench talent cost tracking endpoint (#09)"
```

---

## 📄 License & Maintainers

- **License**: Proprietary — ThinkWire Staffing and Solutions
- **Primary Maintainer**: ThinkWire Backend Engineering Team (`engineering@thinkwire.internal`)
