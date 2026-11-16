# ThinkWires Production Deployment & Infrastructure Guide

**Target Environment:** Docker, Kubernetes, AWS ECS, Render, Railway, Vercel  
**Architecture:** Monorepo (`apps/backend` Express Core, `apps/frontend` Vite React SPA, `apps/ai_services` FastAPI Microservice)  
**Security Posture:** 12-Factor Compliant, Non-Root Execution, Fail-Closed RBAC, Zero committed secrets  

---

## 1. Required & Optional Environment Variables

The ThinkWires backend validates environment integrity during boot (`validateBootEnvironment()`). In production mode (`NODE_ENV=production`), missing critical variables will halt boot immediately.

### 1.1. Core Security & Authentication

| Variable | Required | Description | Example / Recommendations |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | Target runtime environment | `production` |
| `PORT` | Yes | Port for Express API server | `5000` |
| `HOST` | No | Host bind address (defaults to `0.0.0.0`) | `0.0.0.0` |
| `JWT_SECRET` | Yes | Primary HMAC-SHA256 master signing key | 32+ char random string (e.g. `openssl rand -hex 32`) |
| `JWT_ADMIN_SECRET` / `ADMIN_JWT_SECRET` | Yes* | Separate cryptographic secret for admin tokens | 32+ char random string (derived if omitted in cloud) |
| `JWT_CANDIDATE_SECRET` / `CANDIDATE_JWT_SECRET` | Yes* | Separate cryptographic secret for candidate tokens | 32+ char random string (derived if omitted in cloud) |
| `ALLOWED_ORIGINS` | No | Comma-separated list of permitted CORS origins | `https://thinkwires.com,https://admin.thinkwires.com` |
| `COOKIE_SAME_SITE` | No | Cookie SameSite policy | `strict` or `lax` (default `lax`) |

### 1.2. Primary Databases

| Variable | Required | Description | Example / Notes |
| :--- | :--- | :--- | :--- |
| `MONGODB_URI` | Yes | Canonical Primary Document Store URI | `mongodb+srv://user:pass@cluster.mongodb.net/thinkwires?retryWrites=true&w=majority` |
| `DATABASE_URL` / `POSTGRES_URL` | No | PostgreSQL URI for relational telemetry | `postgresql://user:pass@host:5432/thinkwires` |
| `REDIS_URL` | No | Redis URI for session token revocations | `rediss://default:token@cluster.upstash.io:6379` |

### 1.3. Object Storage (AWS S3 & Cloudflare R2)

| Variable | Required | Description | Example / Notes |
| :--- | :--- | :--- | :--- |
| `STORAGE_DRIVER` | No | File persistence engine (`local` or `s3`) | `s3` (defaults to `s3` if `S3_BUCKET` is set) |
| `S3_BUCKET` | If S3 | Name of the cloud bucket | `thinkwires-production-resumes` |
| `S3_REGION` | If S3 | AWS Region or `auto` for Cloudflare R2 | `us-east-1` (or `auto`) |
| `S3_ENDPOINT` | If R2 | Custom S3 endpoint for Cloudflare R2 / MinIO | `https://<account_id>.r2.cloudflarestorage.com` |
| `S3_ACCESS_KEY_ID` | If S3 | IAM / R2 API Access Key ID | Set via cloud environment secret |
| `S3_SECRET_ACCESS_KEY` | If S3 | IAM / R2 API Secret Access Key | Set via cloud environment secret |
| `CDN_DOMAIN` | No | Custom CDN domain for public file URLs | `cdn.thinkwires.com` |

### 1.4. AI Microservice Integration

| Variable | Required | Description | Example / Notes |
| :--- | :--- | :--- | :--- |
| `AI_SERVICE_URL` | No | Internal URI for FastAPI Microservice | `http://ai_services:8000` (Docker) or `http://localhost:8000` |
| `AI_SERVICE_API_KEY` | Yes | Shared secret for inter-service authentication | 32+ char random string |
| `OPENAI_API_KEY` | Optional | OpenAI API key for AI evaluations | Configured in AI service container |

### 1.5. Initial Bootstrap & Superadmin Setup

| Variable | Required | Description | Example / Security Rules |
| :--- | :--- | :--- | :--- |
| `ALLOW_PRODUCTION_SEED` | No | Explicit opt-in to bootstrap superadmin in prod | `true` (only on initial launch) |
| `INITIAL_SUPERADMIN_EMAIL` | If Seeding | Email for root administrator | `superadmin@thinkwires.com` |
| `INITIAL_SUPERADMIN_PASSWORD` | If Seeding | High-entropy initial password | Min 16 chars with upper, lower, number, symbol |

---

## 2. Docker & Container Orchestration

### 2.1. Building Container Images

#### Backend & Frontend Bundle:
```bash
docker build -t thinkwires-core:latest -f Dockerfile .
```

#### AI Services Microservice:
```bash
docker build -t thinkwires-ai:latest -f apps/ai_services/Dockerfile apps/ai_services
```

### 2.2. Running Multi-Container Stack (Docker Compose)

Copy `.env.example` to `.env` and configure real secrets:
```bash
cp .env.example .env
```

Start all services in detached mode:
```bash
docker-compose up -d --build
```

Verify service status:
```bash
docker-compose ps
```

---

## 3. Observability & SRE Health Probes

ThinkWires implements standard SRE probes:

### 3.1. Liveness Probe (`GET /healthz`)
- **Purpose:** Indicates whether the Node.js / Python event loops are unblocked and accepting sockets.
- **Port:** `5000` (Backend) / `8000` (AI Service).
- **HTTP Code:** `200 OK`.
- **Orchestrator Action:** If probe times out or fails 3 times, container runtime restarts the pod.

### 3.2. Readiness Probe (`GET /ready`)
- **Purpose:** Verifies deep operational readiness of backing datastores (MongoDB Atlas, PostgreSQL, Redis).
- **HTTP Codes:**
  - `200 OK`: Primary MongoDB datastore is connected and active.
  - `503 Service Unavailable`: Primary MongoDB datastore is disconnected. Traffic is instantly removed from this replica.

---

## 4. Database Migrations

### 4.1. Inspecting Migration Status
```bash
node apps/backend/src/migrations/runner.js status
```

### 4.2. Executing Pending Migrations
```bash
node apps/backend/src/migrations/runner.js up
```

### 4.3. Rolling Back Most Recent Batch
```bash
node apps/backend/src/migrations/runner.js down
```

---

## 5. Rollback & Disaster Recovery Procedures

1. **Application Rollback:**
   - Deploy previous container image tag (e.g. `thinkwires-core:v1.0.0`).
   - Run `node apps/backend/src/migrations/runner.js down` if a database schema rollback is required.
2. **Database Outage Fail-Closed Behavior:**
   - In production, write mutations return HTTP 503 instead of persisting in-memory.
   - Front-end displays graceful retry notice without losing form state.
