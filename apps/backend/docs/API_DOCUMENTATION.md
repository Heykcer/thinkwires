# 📡 ThinkWire Backend API Gateway — Endpoint Documentation

This document details every REST API endpoint exposed by the **ThinkWire Backend API Gateway (`apps/backend`)**. It serves as the primary technical contract for the **Frontend (React)** and **AI (FastAPI)** engineering teams.

---

## 📋 Table of Contents

1. [API Architecture & Conventions](#1-api-architecture--conventions)
2. [Authentication & Authorization (RBAC)](#2-authentication--authorization-rbac)
3. [Base URLs & Interactive Documentation](#3-base-urls--interactive-documentation)
4. [Standard Envelope Formats](#4-standard-envelope-formats)
5. [System & Health Diagnostics](#5-system--health-diagnostics)
6. [Authentication Endpoints (`/api/v1/auth`)](#6-authentication-endpoints-apiv1auth)
7. [Job Requisitions Endpoints (`/api/v1/jobs`)](#7-job-requisitions-endpoints-apiv1jobs)
8. [Candidate & Talent Pool Endpoints (`/api/v1/candidates`)](#8-candidate--talent-pool-endpoints-apiv1candidates)
9. [Bench Management Endpoints (`/api/v1/bench`)](#9-bench-management-endpoints-apiv1bench)
10. [AI Microservice Proxy (`/api/v1/ai`)](#10-ai-microservice-proxy-apiv1ai)
11. [Admin CMS & Feature Flags (`/api/v1/admin`)](#11-admin-cms--feature-flags-apiv1admin)
12. [HTTP Status & Error Codes Matrix](#12-http-status--error-codes-matrix)

---

## 1. API Architecture & Conventions

- **Protocol**: HTTP/1.1 over TLS (Production), Plain HTTP (Local Development).
- **Transport Format**: All payloads and responses are encoded in `application/json; charset=utf-8`.
- **API Versioning**: URL path prefixing `/api/v1/`.
- **Soft Deletion**: Records support soft deletes (`deletedAt != null`) to maintain compliance and historical audit trails.
- **Pagination**: Default pagination is page-based using query params: `?page=1&limit=10`.

---

## 2. Authentication & Authorization (RBAC)

The API utilizes **JSON Web Tokens (JWT)** passed via the standard HTTP `Authorization` header:

```http
Authorization: Bearer <your_jwt_token>
```

### Role-Based Access Control (RBAC) Hierarchy

| Role        | Description                      | Permissions                                                               |
| :---------- | :------------------------------- | :------------------------------------------------------------------------ |
| `candidate` | Job seeker or bench engineer     | Manage personal profile, apply for jobs, take AI screening assessments.   |
| `client`    | Corporate employer hiring talent | Post job requisitions, view candidates & fit scores, schedule interviews. |
| `recruiter` | Internal talent operations staff | Match candidates, view bench talent, schedule assessments.                |
| `admin`     | Internal super-administrator     | Full system access, feature flags toggle, financial BI analytics.         |

> 💡 **Developer Bypass / Quick Test Tokens**: During local development, the backend accepts the following mock tokens without requiring database login:
>
> - `Authorization: Bearer dev-admin-token` (Grants `admin` privileges)
> - `Authorization: Bearer dev-client-token` (Grants `client` privileges)
> - `Authorization: Bearer dev-candidate-token` (Grants `candidate` privileges)

---

## 3. Base URLs & Interactive Documentation

| Environment           | Base URL                         | Interactive Swagger Docs                                           |
| :-------------------- | :------------------------------- | :----------------------------------------------------------------- |
| **Local Development** | `http://localhost:5000`          | [`http://localhost:5000/api/docs`](http://localhost:5000/api/docs) |
| **Docker Compose**    | `http://backend:5000`            | `http://localhost:5000/api/docs`                                   |
| **Production**        | `https://api.thinkwire.internal` | `https://api.thinkwire.internal/api/docs`                          |

- **OpenAPI 3.0.0 Specification JSON**: Available directly at `GET http://localhost:5000/api/docs/swagger.json`.
- **Postman Collection**: Located at `apps/backend/docs/thinkwires_backend.postman_collection.json`.

---

## 4. Standard Envelope Formats

### Standard Success Response

```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The provided email address is already registered.",
    "details": null
  }
}
```

---

## 5. System & Health Diagnostics

### 5.1 Service Health Check

Returns operational metrics for the Express server and connected dependencies.

- **Method**: `GET`
- **Path**: `/health` (or `/api/v1/health`)
- **Auth**: None (Public)

#### Response (`200 OK`):

```json
{
  "status": "healthy",
  "service": "thinkwire-backend",
  "version": "1.0.0",
  "environment": "development",
  "timestamp": "2026-10-01T10:30:00.000Z",
  "dependencies": {
    "postgres": "connected",
    "redis": "connected",
    "ai_service": "available"
  }
}
```

#### cURL Example:

```bash
curl -X GET http://localhost:5000/health
```

---

## 6. Authentication Endpoints (`/api/v1/auth`)

### 6.1 Register User Account

Creates a new user profile.

- **Method**: `POST`
- **Path**: `/api/v1/auth/register`
- **Auth**: None (Public)
- **Headers**: `Content-Type: application/json`

#### Request Payload:

```json
{
  "email": "jordan.lee@example.com",
  "password": "SecurePassword123!",
  "firstName": "Jordan",
  "lastName": "Lee",
  "role": "candidate"
}
```

#### Response (`201 Created`):

```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "usr-k8j12x9",
    "email": "jordan.lee@example.com",
    "firstName": "Jordan",
    "lastName": "Lee",
    "role": "candidate",
    "isActive": true,
    "createdAt": "2026-10-01T10:31:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "ref_k8j12x9",
    "expiresIn": "7d"
  }
}
```

### 6.2 Authenticate & Obtain Tokens

- **Method**: `POST`
- **Path**: `/api/v1/auth/login`
- **Auth**: None (Public)

#### Request Payload:

```json
{
  "email": "admin@thinkwire.internal",
  "password": "AdminPass123!"
}
```

#### Response (`200 OK`):

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "usr-admin-01",
    "email": "admin@thinkwire.internal",
    "role": "admin"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "ref_90df21a",
    "expiresIn": "7d"
  }
}
```

### 6.3 Get Authenticated Profile

- **Method**: `GET`
- **Path**: `/api/v1/auth/me`
- **Auth**: Required (`Bearer <token>`)

#### Response (`200 OK`):

```json
{
  "success": true,
  "user": {
    "id": "usr-admin-01",
    "email": "admin@thinkwire.internal",
    "role": "admin"
  }
}
```

---

## 7. Job Requisitions Endpoints (`/api/v1/jobs`)

### 7.1 List Jobs (Paginated)

- **Method**: `GET`
- **Path**: `/api/v1/jobs`
- **Auth**: None (Public for active jobs)
- **Query Parameters**:
  - `page` (integer, default: 1): Page index
  - `limit` (integer, default: 10): Results per page
  - `search` (string): Keyword matching job title or skills
  - `engagementMode` (string): `full_time`, `contract`, `freelance`, `bench`

#### Response (`200 OK`):

```json
{
  "success": true,
  "data": [
    {
      "id": "c56a4180-65aa-42ec-a945-5fd21dec0538",
      "title": "Senior Full Stack React/Node Engineer",
      "company": "ThinkWire Enterprise Labs",
      "description": "Lead the architecture of real-time talent routing and AI vector pipelines.",
      "requiredSkills": ["React", "Node.js", "Express", "PostgreSQL", "Docker"],
      "requiredExperienceYears": 5,
      "engagementMode": "full_time",
      "budgetMin": 130000,
      "budgetMax": 165000,
      "status": "open",
      "createdAt": "2026-10-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

### 7.2 Create Job Requisition

- **Method**: `POST`
- **Path**: `/api/v1/jobs`
- **Auth**: Required (`admin`, `client`)

#### Request Payload:

```json
{
  "title": "Cloud Native Kubernetes Architect",
  "company": "FinTech Velocity",
  "description": "Lead container infrastructure on AWS EKS with ArgoCD.",
  "requiredSkills": ["Kubernetes", "AWS", "Terraform", "Docker"],
  "requiredExperienceYears": 6,
  "engagementMode": "contract",
  "budgetMin": 150000,
  "budgetMax": 180000
}
```

#### Response (`201 Created`):

```json
{
  "success": true,
  "message": "Job requisition created successfully",
  "job": {
    "id": "job-k8j34a1",
    "title": "Cloud Native Kubernetes Architect",
    "status": "open",
    "createdAt": "2026-10-01T10:35:00.000Z"
  }
}
```

---

## 8. Candidate & Talent Pool Endpoints (`/api/v1/candidates`)

### 8.1 List Candidates

- **Method**: `GET`
- **Path**: `/api/v1/candidates`
- **Auth**: Required (`admin`, `client`, `recruiter`)
- **Query Parameters**:
  - `benchStatus`: Filter by `on_bench`, `active`, `assigned`
  - `skill`: Filter by technical skill (e.g. `Node.js`, `React`)

#### Response (`200 OK`):

```json
{
  "success": true,
  "data": [
    {
      "id": "d47ac10b-58cc-4372-a567-0e02b2c3d479",
      "fullName": "Jordan Lee",
      "title": "Senior Backend Specialist",
      "skills": ["Node.js", "Express", "PostgreSQL", "Docker", "Redis"],
      "totalExperienceYears": 6,
      "engagementMode": "bench",
      "benchStatus": "on_bench",
      "hourlyRate": 85,
      "createdAt": "2026-10-01T10:00:00.000Z"
    }
  ],
  "pagination": { "total": 1, "page": 1, "limit": 10, "totalPages": 1 }
}
```

---

## 9. Bench Management Endpoints (`/api/v1/bench`)

### 9.1 Get Bench Overview & Financial Burn Rate

Monitors internal engineers awaiting client placement and aggregate daily overhead.

- **Method**: `GET`
- **Path**: `/api/v1/bench`
- **Auth**: Required (`admin`, `recruiter`)

#### Response (`200 OK`):

```json
{
  "success": true,
  "summary": {
    "totalOnBench": 2,
    "totalAssigned": 1,
    "totalDailyBurn": 1370,
    "averageDaysOnBench": 8.5
  },
  "benchCandidates": [
    {
      "id": "bnch-01",
      "candidateId": "d47ac10b-58cc-4372-a567-0e02b2c3d479",
      "name": "Jordan Lee",
      "primarySkill": "Full Stack Node/React",
      "benchStatus": "on_bench",
      "benchSince": "2026-09-19T10:00:00.000Z",
      "dailyCost": 650,
      "currentClientProject": null
    }
  ]
}
```

### 9.2 Assign Bench Talent to Requisition

- **Method**: `POST`
- **Path**: `/api/v1/bench/assign`
- **Auth**: Required (`admin`, `recruiter`)

#### Request Payload:

```json
{
  "candidateId": "d47ac10b-58cc-4372-a567-0e02b2c3d479",
  "jobId": "c56a4180-65aa-42ec-a945-5fd21dec0538",
  "startDate": "2026-10-15",
  "billingRate": 110
}
```

#### Response (`200 OK`):

```json
{
  "success": true,
  "message": "Bench talent assigned to requisition successfully.",
  "assignment": {
    "id": "bnch-01",
    "benchStatus": "assigned",
    "currentClientProject": "c56a4180-65aa-42ec-a945-5fd21dec0538",
    "billingRate": 110
  }
}
```

---

## 10. AI Microservice Proxy (`/api/v1/ai`)

These endpoints act as a resilient circuit-breaker gateway to the Python FastAPI microservice (`apps/ai_services`).

### 10.1 Generate Assessment Questions

- **Method**: `POST`
- **Path**: `/api/v1/ai/generate-assessment`
- **Auth**: Required (`Bearer <token>`)

#### Request Payload:

```json
{
  "job_title": "Full Stack React/Node Developer",
  "job_description": "Building modern web applications with React 19 and Express.",
  "required_skills": ["React", "Node.js", "PostgreSQL"],
  "passing_threshold_percentage": 80
}
```

#### Response (`200 OK`):

```json
{
  "success": true,
  "assessment": {
    "assessment_id": "asm-k8j44d2",
    "job_title": "Full Stack React/Node Developer",
    "passing_threshold_percentage": 80,
    "total_questions": 10,
    "questions": [ ... ]
  }
}
```

### 10.2 Score Candidate Resume

- **Method**: `POST`
- **Path**: `/api/v1/ai/score-resume`
- **Auth**: Required (`Bearer <token>`)

#### Request Payload:

```json
{
  "resume_text": "Jordan Lee\nSenior Full Stack Developer with 6 years experience in Node.js, Express, React, and PostgreSQL.",
  "job_description": "Seeking Senior Engineer with 5+ years experience building web applications.",
  "required_skills": ["Node.js", "React", "PostgreSQL"],
  "candidate_experience_years": 6.0,
  "required_experience_years": 5.0
}
```

#### Response (`200 OK`):

```json
{
  "success": true,
  "score": {
    "candidate_name": "Jordan Lee",
    "overall_fit_score": 92.0,
    "badge_tier": "Top Match",
    "breakdown": {
      "technical_skills": {
        "score_percentage": 95.0,
        "weight": 0.4,
        "weighted_contribution": 38.0
      },
      "experience_level": {
        "score_percentage": 90.0,
        "weight": 0.3,
        "weighted_contribution": 27.0
      },
      "certifications": {
        "score_percentage": 85.0,
        "weight": 0.2,
        "weighted_contribution": 17.0
      },
      "location_rate_fit": {
        "score_percentage": 100.0,
        "weight": 0.1,
        "weighted_contribution": 10.0
      }
    },
    "matched_skills": ["Node.js", "React", "PostgreSQL"],
    "missing_skills": [],
    "executive_summary": "Candidate demonstrates strong alignment with core requirements. Recommended for immediate interview."
  }
}
```

---

## 11. Admin CMS & Feature Flags (`/api/v1/admin`)

### 11.1 List Dynamic Feature Flags

- **Method**: `GET`
- **Path**: `/api/v1/admin/feature-flags`
- **Auth**: Public or Bearer token

#### Response (`200 OK`):

```json
{
  "success": true,
  "flags": [
    {
      "key": "ai_screening_gatekeeper",
      "name": "AI Screening Gatekeeper",
      "isEnabled": true,
      "targetRole": "all"
    },
    {
      "key": "resume_match_scorer",
      "name": "Resume Match Scorer",
      "isEnabled": true,
      "targetRole": "client"
    },
    {
      "key": "bench_management",
      "name": "Bench Management",
      "isEnabled": true,
      "targetRole": "admin"
    },
    {
      "key": "stripe_invoicing",
      "name": "Stripe Billing & Invoicing",
      "isEnabled": false,
      "targetRole": "client"
    }
  ]
}
```

---

## 12. HTTP Status & Error Codes Matrix

| HTTP Status        | Code Identifier                        | Description                                                | Remediation                                                   |
| :----------------- | :------------------------------------- | :--------------------------------------------------------- | :------------------------------------------------------------ |
| `200 OK`           | —                                      | Request succeeded normally.                                | None.                                                         |
| `201 Created`      | —                                      | Resource created successfully.                             | Check returned resource ID.                                   |
| `400 Bad Request`  | `VALIDATION_ERROR`                     | Request body or query parameters failed schema validation. | Inspect error message and correct payload fields.             |
| `401 Unauthorized` | `UNAUTHORIZED` / `INVALID_TOKEN`       | Missing, malformed, or expired Bearer token.               | Re-authenticate via `/api/v1/auth/login` to obtain new token. |
| `403 Forbidden`    | `FORBIDDEN`                            | Authenticated user lacks the required RBAC role.           | Request elevated permissions or switch user account.          |
| `404 Not Found`    | `RESOURCE_NOT_FOUND` / `JOB_NOT_FOUND` | Target resource does not exist or has been soft-deleted.   | Verify resource ID in path parameter.                         |
| `500 Server Error` | `INTERNAL_SERVER_ERROR`                | Unhandled runtime exception in service or controller.      | Check server logs in console.                                 |
