# 🧠 ThinkWire AI Microservice

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=FastAPI&logoColor=white)](https://fastapi.tiangolo.com)
[![Python Version](https://img.shields.io/badge/Python-3.12%20%7C%203.13-blue.svg?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o%20%7C%20Embeddings-412991.svg?style=flat&logo=openai&logoColor=white)](https://platform.openai.com/)
[![pgvector](https://img.shields.io/badge/PostgreSQL-pgvector-336791.svg?style=flat&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg?style=flat)](<>)

The **ThinkWire AI Microservice** is a dedicated, decoupled Python FastAPI service powering automated candidate screening evaluations, metric-driven resume fit scoring, semantic vector embeddings, and entity parsing for the ThinkWire Staffing and Solutions platform.

---

## 📋 Table of Contents

1. [Architecture & System Context](#-architecture--system-context)
2. [Hardware & OS Requirements](#-hardware--os-requirements)
3. [Quickstart Setup Guide](#-quickstart-setup-guide)
   - [Virtual Environment Setup (venv & conda)](#1-virtual-environment-setup)
   - [Installing Dependencies](#2-install-dependencies)
   - [Configuring Environment Variables (.env)](#3-configure-environment-variables)
   - [Launching the Service](#4-launch-the-service)
   - [Docker Deployment](#5-running-with-docker)
4. [AI Model Documentation](#-ai-model-documentation)
   - [Models Inventory](#models-inventory)
   - [Prompt Engineering & Prompt Structures](#prompt-engineering--prompt-structures)
   - [Downloading Local / Open-Weight Models](#downloading-local--open-weight-models)
5. [API Endpoint Documentation](#-api-endpoint-documentation)
   - [Interactive Swagger UI & ReDoc](#interactive-swagger-ui--redoc)
   - [Health & Diagnostics (`GET /health`)](#1-health-check--get-health)
   - [Assessment Generator (`POST /api/v1/assessments/generate`)](#2-ai-screening-assessment-generator)
   - [Resume Fit Scorer (`POST /api/v1/resumes/score`)](#3-resume-fit-scorer)
   - [Resume Text Parser (`POST /api/v1/resumes/parse`)](#4-resume-text-parser)
   - [Vector Embedding Inference (`POST /api/v1/embeddings/generate`)](#5-vector-embedding-generator)
6. [Backend Integration Guide (Express / Node.js)](#-backend-integration-guide-express--nodejs)
7. [Running Test Inferences](#-running-test-inferences)
8. [Testing & Contribution Guidelines](#-testing--contribution-guidelines)

---

## 🏗️ Architecture & System Context

The AI service operates as an autonomous microservice within the ThinkWire monorepo. It interfaces with the Node.js Express API Gateway and the database layer through two decoupled integration patterns:

```
+-----------------------------------------------------------------------------------+
|                            React 19 Frontend (Vite)                               |
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

1. **AI Screening Gatekeeper**: Auto-generates a 10-question evaluation (7 Multiple Choice, 2 Situational Scenarios, 1 Practical Exercise) tailored to specific job requisitions.
2. **Resume Match Scorer**: Evaluates resumes against job descriptions using weighted scoring criteria to compute a **Fit Score (0–100%)** and visual badge tier (`Top Match`, `Moderate Match`, `Below Threshold`).
3. **Vector Embeddings**: Computes 1536-dimensional dense embeddings stored in PostgreSQL using `pgvector` distance operators (`<->`) for rapid semantic candidate matching.
4. **Resilience & Offline Simulation**: Provides an integrated mock inference engine (`MOCK_INFERENCE=true`), allowing frontend and backend developers to onboard and test workflows without requiring live OpenAI API credentials.

---

## 💻 Hardware & OS Requirements

### Hardware Specifications

| Component      | Minimum Requirements (Cloud API Mode)             | Recommended (Local Open Weights / LLM)                                                        |
| :------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------- |
| **CPU**        | 2 cores (Intel/AMD x86_64 or Apple Silicon ARM64) | 8+ cores                                                                                      |
| **RAM**        | 4 GB                                              | 16 GB - 32 GB                                                                                 |
| **GPU / VRAM** | Not required (Inference handled by OpenAI APIs)   | NVIDIA GPU with **CUDA 12.0+** and **8 GB – 16 GB VRAM** (for local Llama 3 8B or Mistral 7B) |
| **Disk Space** | 2 GB free disk space                              | 20 GB free disk space (to store local weight checkpoints)                                     |

> **Note on CUDA & GPUs**: If you are using cloud providers (OpenAI / Hugging Face Inference API), **no dedicated GPU or CUDA setup is needed**. A standard laptop running Windows, macOS, or Linux will run this service smoothly. If you choose to host models locally, install [NVIDIA CUDA Toolkit 12.x](https://developer.nvidia.com/cuda-downloads) and ensure `torch` with CUDA support is installed.

### Operating System & System-Level Dependencies

The AI microservice compiles native C/C++ extensions for `asyncpg` (PostgreSQL driver) and PDF parsing libraries:

#### 🐧 Debian / Ubuntu Linux:

```bash
sudo apt-get update
sudo apt-get install -y build-essential libpq-dev python3-dev
```

#### 🍎 macOS (Homebrew):

```bash
brew install postgresql libpq
```

#### 🪟 Windows:

- Ensure **Python 3.12+** is installed with the _"Add Python to PATH"_ option checked.
- If compiling native wheels, install the [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (select "Desktop development with C++"). Pre-built wheels for `asyncpg` and `httptools` install automatically under standard pip on Windows.

---

## 🚀 Quickstart Setup Guide

Follow these steps sequentially to set up and run the service locally.

### 1. Virtual Environment Setup

Always run Python applications in an isolated virtual environment to avoid dependency collisions.

#### Option A: Using Standard `venv` (Recommended)

**On Windows (PowerShell):**

```powershell
# Navigate to the AI service directory
cd apps\ai_services

# Create the virtual environment named 'venv'
python -m venv venv

# Activate the virtual environment
.\venv\Scripts\Activate.ps1

# (If PowerShell blocks script execution, run: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser)
```

**On Windows (Command Prompt `cmd`):**

```cmd
cd apps\ai_services
python -m venv venv
venv\Scripts\activate.bat
```

**On macOS / Linux (bash/zsh):**

```bash
cd apps/ai_services
python3 -m venv venv
source venv/bin/activate
```

#### Option B: Using `conda` / `miniconda`

```bash
# Create a dedicated conda environment with Python 3.12
conda create -n thinkwire-ai python=3.12 -y

# Activate the conda environment
conda activate thinkwire-ai

# Navigate to the AI service directory
cd apps/ai_services
```

---

### 2. Install Dependencies

Once your virtual environment is active, ensure `pip` is up to date and install all dependencies:

```bash
# Upgrade pip to the latest release
python -m pip install --upgrade pip

# Install required Python packages
pip install -r requirements.txt
```

Verify the installation:

```bash
python -c "import fastapi, uvicorn, pydantic; print('Dependencies successfully verified!')"
```

---

### 3. Configure Environment Variables

Create your local `.env` file by copying the provided `.env.example` template:

**Windows (PowerShell):**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**

```bash
cp .env.example .env
```

Open `.env` in your editor and configure the variables:

```ini
# ==============================================================================
# ThinkWire AI Microservice Configuration
# ==============================================================================
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development
LOG_LEVEL=info

# --- LLM API Keys ---
# Required for live GPT-4o test generation and text-embedding-3-small
# Get your key at: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL_ASSESSMENT=gpt-4o
OPENAI_MODEL_EMBEDDING=text-embedding-3-small

# Optional: Hugging Face Token (if downloading gated weights or using HF Inference)
# Get your token at: https://huggingface.co/settings/tokens
HUGGINGFACE_API_KEY=hf_your_huggingface_token_here

# --- Offline / Mock Mode ---
# Set to 'true' to run deterministic local inferences without consuming OpenAI tokens!
# Perfect for frontend/backend developers who don't have an OpenAI key.
MOCK_INFERENCE=false

# --- Database & Cache ---
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/thinkwire_db
REDIS_URL=redis://localhost:6379
```

---

### 4. Launch the Service

You can start the development server using either `uvicorn` directly or via `npm`:

#### Method A: Direct Uvicorn (with hot reload)

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Method B: Via NPM (Monorepo standard)

```bash
npm run dev
```

The server will initialize:

```text
============================================================
🚀 ThinkWire AI Microservice starting up...
   Environment:    development
   OpenAI Config:  Configured
   Mock Mode:      False
   Swagger Docs:   http://localhost:8000/docs
============================================================
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

---

### 5. Running with Docker

If you prefer containerized deployment, run the AI microservice using Docker:

#### Build and run standalone container:

```bash
# Build the Docker image
docker build -t thinkwire-ai-services -f Dockerfile .

# Run the container mapping port 8000
docker run -p 8000:8000 --env-file .env thinkwire-ai-services
```

#### Run with full stack via Docker Compose:

From the repository root:

```bash
# Spin up PostgreSQL (with pgvector), Redis, and the AI Microservice
docker compose up -d postgres redis ai_services
```

---

## 🤖 AI Model Documentation

### Models Inventory

| Model Name                              | Provider             | Purpose in ThinkWire                                                                                       | Dimensions / Parameters        | Latency (p90) | Cost / Token Limit                         |
| :-------------------------------------- | :------------------- | :--------------------------------------------------------------------------------------------------------- | :----------------------------- | :------------ | :----------------------------------------- |
| **`gpt-4o`**                            | OpenAI               | Generating 10-question custom screening tests; multi-factor resume reasoning                               | Multimodal LLM (~128k context) | ~1.5s - 2.8s  | $2.50 / 1M input, $10.00 / 1M output       |
| **`gpt-4o-mini`** (Alternative)         | OpenAI               | Lightweight high-speed candidate assessment & quick scoring                                                | Small LLM (~128k context)      | ~0.6s - 1.2s  | $0.15 / 1M input, $0.60 / 1M output        |
| **`text-embedding-3-small`**            | OpenAI               | Computing resume and job requisition vector embeddings for PostgreSQL `pgvector` similarity search (`<->`) | 1536 dense float dimensions    | ~120ms        | $0.02 / 1M tokens (8,191 max input tokens) |
| **`all-MiniLM-L6-v2`** (Local/Offline)  | Hugging Face / SBERT | On-premise local embedding fallback when internet connectivity or API keys are unavailable                 | 384 dense float dimensions     | ~15ms (CPU)   | Free / Open-source Apache 2.0              |
| **`bge-small-en-v1.5`** (Local/Offline) | BAAI / Hugging Face  | State-of-the-art retrieval benchmark embedding model for local pgvector indexing                           | 384 dense float dimensions     | ~22ms (CPU)   | Free / Open-source MIT                     |

---

### Prompt Engineering & Prompt Structures

To eliminate hallucinations, guarantee valid JSON parsing, and uphold rigorous hiring standards, the AI service enforces strict prompt scaffolding:

#### 1. Screening Assessment Generation Prompt Structure

```text
[SYSTEM PROMPT]
You are a Staff Technical Assessment Architect and Lead Psychometrician at ThinkWire Staffing.
Your objective is to generate an uncompromising, fair, and technically rigorous 10-question screening test.
You MUST output strictly valid JSON conforming to the AssessmentGenerateResponse schema. Do not output markdown codeblocks or conversational filler.

Rules:
1. Exactly 7 Multiple Choice Questions (MCQ): Each must have exactly 4 plausible options (A, B, C, D) with exactly one unequivocally correct answer. Questions must evaluate real-world trade-offs, architecture, and edge cases, not trivial syntax recall.
2. Exactly 2 Situational Scenarios: Real-world production crisis scenarios (e.g. distributed deadlocks, schema migrations, latency degradation) assessing root cause isolation and mitigation.
3. Exactly 1 Practical Coding/Architecture Exercise: An actionable implementation problem with measurable grading rubrics.
4. Rubrics: Provide explicit scoring guidelines (0-10 points) per question.

[USER PROMPT]
Requisition Title: {job_title}
Seniority Level: {experience_level}
Required Core Skills: {required_skills}
Passing Score Threshold: {passing_threshold_percentage}%
Requisition Details: {job_description}
```

#### 2. Resume Fit Scoring Prompt Structure & Algorithm

The system applies a hybrid deterministic + LLM scoring calculation:

$$\text{Fit Score} = \frac{W_{\text{tech}} \cdot S_{\text{tech}} + W_{\text{exp}} \cdot S_{\text{exp}} + W_{\text{cert}} \cdot S_{\text{cert}} + W_{\text{loc}} \cdot S_{\text{loc}}}{W_{\text{total}}}$$

- **Technical Skills Match ($W\_{\text{tech}} = 40\%$)**: Exact and semantic intersection of candidate technical proficiencies with job requisition requirements.
- **Experience Level Alignment ($W\_{\text{exp}} = 30\%$)**: Verified years of hands-on experience scaled against target job seniority.
- **Certifications & Education ($W\_{\text{cert}} = 20\%$)**: Professional accreditations (AWS, Azure, GCP, PMP, CISSP) and relevant academic degrees.
- **Location & Availability Fit ($W\_{\text{loc}} = 10\%$)**: Timezone overlap, remote/hybrid compatibility, and hourly rate constraints.

#### Visual Match Badge Classification:

| Fit Score Range | Match Badge Tier  | Badge Color Token | Client Feed Masking       | Action Trigger                                            |
| :-------------- | :---------------- | :---------------- | :------------------------ | :-------------------------------------------------------- |
| **80% – 100%**  | `top_match`       | 🟢 Green          | Visible (Top of pipeline) | Fast-track interview scheduling button enabled            |
| **60% – 79%**   | `moderate_match`  | 🟡 Yellow         | Visible                   | Recruiter manual review recommended                       |
| **< 60%**       | `below_threshold` | ⚪ Gray           | **Masked / Hidden**       | Hidden from client view to maintain high pipeline quality |

---

### Downloading Local / Open-Weight Models

For developers building without an active internet connection or in environments with strict data privacy guidelines, ThinkWire includes a dedicated model weight downloader:

```bash
# Download default embedding model (sentence-transformers/all-MiniLM-L6-v2)
python scripts/download_models.py --model embedding-default

# Download high-accuracy BAAI retrieval embeddings
python scripts/download_models.py --model embedding-high-accuracy

# Download lightweight local instruction LLM
python scripts/download_models.py --model llm-lightweight

# Download with an explicit Hugging Face token (for gated repositories)
python scripts/download_models.py --model meta-llama/Meta-Llama-3-8B-Instruct --token hf_yourTokenHere
```

Downloaded model checkpoints are saved into `apps/ai_services/models_cache/` and can be loaded offline.

---

## 📡 API Endpoint Documentation

FastAPI auto-generates comprehensive interactive documentation based on OpenAPI 3.1.0 standards.

### Interactive Swagger UI & ReDoc

- **Interactive Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **OpenAPI Raw JSON Specification**: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

---

### 1. Health Check (`GET /health`)

Validates service status, uptime, active environment, and whether mock mode is engaged. Used by Docker healthchecks, Kubernetes liveness probes, and backend circuit breakers.

- **Method**: `GET`
- **Path**: `/health`
- **Response Status**: `200 OK`

#### Example Response:

```json
{
  "status": "healthy",
  "service": "thinkwire-ai-services",
  "environment": "development",
  "version": "1.0.0",
  "uptime_seconds": 342.12,
  "mock_mode": false,
  "openai_configured": true
}
```

---

### 2. AI Screening Assessment Generator

Generates a customized, proctored 10-question evaluation tailored to the job description.

- **Method**: `POST`
- **Path**: `/api/v1/assessments/generate`
- **Headers**: `Content-Type: application/json`

#### Request Payload:

```json
{
  "job_title": "Senior Backend Node.js Engineer",
  "job_description": "We are seeking a Senior Backend Engineer with 5+ years of experience in Node.js, Express, PostgreSQL, Redis, and BullMQ. Responsibilities include building scalable REST APIs and handling database optimization.",
  "required_skills": ["Node.js", "Express", "PostgreSQL", "Redis", "Docker"],
  "experience_level": "Senior",
  "num_questions": 10,
  "passing_threshold_percentage": 75
}
```

#### Response (`200 OK`):

```json
{
  "assessment_id": "asm-1727702400-a1b2c3d4",
  "job_title": "Senior Backend Node.js Engineer",
  "total_questions": 10,
  "time_limit_minutes": 30,
  "passing_threshold_percentage": 75,
  "anti_cheat_enabled": true,
  "created_at": "2026-09-30T10:00:00Z",
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "question": "Regarding Core Architecture & Principles of Node.js for a Senior Senior Backend Node.js Engineer: Which of the following approaches represents the industry-standard best practice?",
      "options": [
        {
          "key": "A",
          "text": "Implement strict input sanitization, automated connection pooling, and structured error boundaries."
        },
        {
          "key": "B",
          "text": "Disable caching layers to simplify transaction rollbacks."
        },
        {
          "key": "C",
          "text": "Rely solely on client-side state validation without backend verification."
        },
        {
          "key": "D",
          "text": "Hardcode connection strings in environment scripts."
        }
      ],
      "correct_answer": "A",
      "rubric": "Award 10 points for selecting option A, which enforces zero-trust validation and connection efficiency.",
      "points": 10
    },
    {
      "id": 8,
      "type": "situational",
      "question": "[Scenario: High-Traffic Latency Spike] During a peak traffic surge, the Senior Backend Node.js Engineer service experiences elevated latency and Redis connection exhaustion. How would you diagnose, isolate, and remediate the bottleneck?",
      "options": null,
      "correct_answer": "Expected answer should identify connection pooling limits, slow query logging, blue-green deployment, and multi-version database migrations.",
      "rubric": "Score 0-10 points: 4 pts for systematic root cause analysis, 3 pts for architectural remediation, 3 pts for monitoring & alerting recommendations.",
      "points": 10
    },
    {
      "id": 10,
      "type": "practical",
      "question": "Implement a high-performance, rate-limited caching wrapper or middleware for Node.js that rejects excess requests with HTTP 429 and logs structured JSON telemetry.",
      "options": null,
      "correct_answer": "Candidate must provide clean, syntactically correct code utilizing token bucket/sliding window algorithms, structured logging, and robust exception handling.",
      "rubric": "Score 0-10 points: 4 pts for functional correctness and edge-case handling, 3 pts for code readability and modularity, 3 pts for optimal time/space complexity.",
      "points": 10
    }
  ]
}
```

---

### 3. Resume Fit Scorer

Scores a candidate's resume against job requirements, applies weighted category metrics, generates an overall **Fit Score (0–100%)**, and determines badge tier and masking status.

- **Method**: `POST`
- **Path**: `/api/v1/resumes/score`
- **Headers**: `Content-Type: application/json`

#### Request Payload:

```json
{
  "resume_text": "Alex Johnson. Senior Software Engineer with 7 years of experience in Node.js, Express, React, PostgreSQL, Redis, and Docker. Led architectural migration to microservices, reducing p99 latency by 35%. AWS Certified Solutions Architect.",
  "job_description": "Looking for a Senior Backend Engineer with 5+ years of experience in Node.js, Express, PostgreSQL, Redis, and Docker.",
  "required_skills": [
    "Node.js",
    "Express",
    "PostgreSQL",
    "Redis",
    "Docker",
    "AWS"
  ],
  "candidate_experience_years": 7.0,
  "required_experience_years": 5.0,
  "weights": {
    "technical_skills": 0.4,
    "experience_level": 0.3,
    "certifications": 0.2,
    "location_rate_fit": 0.1
  }
}
```

#### Response (`200 OK`):

```json
{
  "fit_score": 96,
  "badge": "top_match",
  "badge_color": "green",
  "masked": false,
  "breakdown": {
    "technical_skills": {
      "score_percentage": 100.0,
      "weight": 0.4,
      "weighted_contribution": 40.0,
      "summary": "Matched 6 of 6 target skills."
    },
    "experience_level": {
      "score_percentage": 100.0,
      "weight": 0.3,
      "weighted_contribution": 30.0,
      "summary": "Experience evaluated at 7.0 years vs 5.0 required."
    },
    "certifications": {
      "score_percentage": 80.0,
      "weight": 0.2,
      "weighted_contribution": 16.0,
      "summary": "Recognized credentials and education matched against prerequisites."
    },
    "location_rate_fit": {
      "score_percentage": 90.0,
      "weight": 0.1,
      "weighted_contribution": 9.0,
      "summary": "Candidate availability aligns with requested timezones and engagement parameters."
    }
  },
  "matched_skills": [
    "Node.js",
    "Express",
    "PostgreSQL",
    "Redis",
    "Docker",
    "AWS"
  ],
  "missing_skills": [],
  "executive_summary": "Candidate achieved an overall Fit Score of 96%. Demonstrates strong alignment in Node.js, Express, PostgreSQL. Recommended for immediate interview scheduling.",
  "scored_at": "2026-09-30T10:05:00Z"
}
```

---

### 4. Resume Text Parser

Extracts structured candidate profile data from unstructured resume text.

- **Method**: `POST`
- **Path**: `/api/v1/resumes/parse`
- **Headers**: `Content-Type: application/json`

#### Request Payload:

```json
{
  "raw_text": "Jordan Lee\nEmail: jordan.lee@example.com\nPhone: (555) 234-5678\nSummary: 6 years experience in Python, FastAPI, Docker, and PostgreSQL. Built scalable vector pipelines."
}
```

#### Response (`200 OK`):

```json
{
  "name": "Jordan Lee",
  "email": "jordan.lee@example.com",
  "phone": "(555) 234-5678",
  "skills": ["Python", "FastAPI", "Docker", "PostgreSQL"],
  "total_experience_years": 6.0,
  "education": ["Bachelor of Science in Computer Science or Equivalent"],
  "certifications": [],
  "summary": "Extracted profile for Jordan Lee demonstrating proficiency in Python, FastAPI, Docker, PostgreSQL."
}
```

---

### 5. Vector Embedding Generator

Generates a dense 1536-dimensional vector embedding for semantic search in PostgreSQL using `pgvector`.

- **Method**: `POST`
- **Path**: `/api/v1/embeddings/generate`
- **Headers**: `Content-Type: application/json`

#### Request Payload:

```json
{
  "text": "Full stack engineer specializing in Node.js, Express, React, PostgreSQL, and pgvector semantic retrieval.",
  "model": "text-embedding-3-small"
}
```

#### Response (`200 OK`):

```json
{
  "model": "text-embedding-3-small",
  "dimensions": 1536,
  "embedding": [
    0.023412,
    -0.015243,
    0.048911,
    "... 1533 more floating point values ..."
  ]
}
```

---

## 🔗 Backend Integration Guide (Express / Node.js)

Backend developers can consume the AI Microservice from the Express gateway using `axios` with standard timeout and retry policies:

```javascript
// apps/backend/src/services/aiService.js
import axios from 'axios';

const AI_BASE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const aiClient = axios.create({
  baseURL: AI_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Scores a candidate resume against a job requisition.
 */
export async function scoreCandidateResume(
  resumeText,
  jobDescription,
  requiredSkills,
  experienceYears
) {
  try {
    const response = await aiClient.post('/api/v1/resumes/score', {
      resume_text: resumeText,
      job_description: jobDescription,
      required_skills: requiredSkills,
      candidate_experience_years: experienceYears,
      weights: {
        technical_skills: 0.4,
        experience_level: 0.3,
        certifications: 0.2,
        location_rate_fit: 0.1,
      },
    });
    return response.data;
  } catch (error) {
    console.error(
      '[AI_SERVICE_ERROR] Failed to score resume:',
      error?.response?.data || error.message
    );
    throw new Error('AI Resume scoring service currently unavailable');
  }
}

/**
 * Generates vector embedding for semantic search in pgvector.
 */
export async function generateEmbedding(text) {
  const response = await aiClient.post('/api/v1/embeddings/generate', { text });
  return response.data.embedding;
}
```

---

## 🧪 Running Test Inferences

A new developer can verify their installation and run a test inference immediately using any of the following tools:

### Option 1: Via cURL (Command Line)

```bash
# Test 1: Service Health Check
curl -X GET http://localhost:8000/health

# Test 2: Generate Screening Assessment
curl -X POST http://localhost:8000/api/v1/assessments/generate \
  -H "Content-Type: application/json" \
  -d '{
    "job_title": "Full Stack React/Node Developer",
    "job_description": "Building modern web applications with React 19 and Express.",
    "required_skills": ["React", "Node.js", "TypeScript"],
    "passing_threshold_percentage": 80
  }'

# Test 3: Score a Resume
curl -X POST http://localhost:8000/api/v1/resumes/score \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "Full stack engineer with 5 years in React, Node.js, and TypeScript.",
    "job_description": "Seeking React and Node.js engineer with 4+ years experience.",
    "required_skills": ["React", "Node.js", "TypeScript"],
    "candidate_experience_years": 5.0,
    "required_experience_years": 4.0
  }'
```

### Option 2: Via Windows PowerShell (`Invoke-RestMethod`)

```powershell
# Health check test
Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get

# Resume score inference
$body = @{
    resume_text = "Senior Software Engineer with 6 years building distributed Node.js APIs and PostgreSQL backends."
    job_description = "Senior Engineer needed for high throughput Node.js API development."
    required_skills = @("Node.js", "PostgreSQL", "Docker")
    candidate_experience_years = 6.0
    required_experience_years = 5.0
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/api/v1/resumes/score" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body
```

### Option 3: Via Python Test Script

```python
import httpx

with httpx.Client(base_url="http://localhost:8000") as client:
    # 1. Health check
    health = client.get("/health").json()
    print("Health Status:", health["status"])

    # 2. Score candidate
    payload = {
        "resume_text": "Alex, 6 years experience with Node.js, Express, PostgreSQL, and Docker.",
        "job_description": "Looking for Node.js Backend Engineer with 5+ years experience.",
        "required_skills": ["Node.js", "PostgreSQL", "Docker"],
        "candidate_experience_years": 6.0,
        "required_experience_years": 5.0
    }
    result = client.post("/api/v1/resumes/score", json=payload).json()
    print(f"Fit Score: {result['fit_score']}% ({result['badge']})")
```

### Option 4: Interactive Browser UI

Open **[http://localhost:8000/docs](http://localhost:8000/docs)** in any browser, click on `/api/v1/resumes/score`, click **Try it out**, click **Execute**, and inspect the live JSON response!

---

## 🛠️ Testing & Contribution Guidelines

### Running Automated PyTest Suite

Ensure your virtual environment is active, then execute tests from the `apps/ai_services` directory:

```bash
# Run all tests
pytest

# Run tests with verbose output
pytest -v

# Run with test coverage report
pytest --cov=. tests/
```

### Python Coding Standards

To maintain clean and robust production code:

- **PEP 8 Compliance**: Follow standard Python style guidelines.
- **Type Annotations**: All function signatures must include comprehensive Python type hints (`typing` / `pydantic`).
- **Docstrings**: Public functions and endpoints must maintain clear docstrings detailing arguments, returns, and exceptions.
- **Code Formatting**: Format code using `black` and sort imports using `isort`:
  ```bash
  pip install black isort flake8
  black .
  isort .
  flake8 . --max-line-length=120
  ```
- **CI/CD Integration**: Every pull request triggers GitHub Actions Stage 3 (`FastAPI AI Service Tests`), running the full test suite across Python 3.12. Ensure all tests pass before opening a PR!

---

## 👥 Need Help or Found an Issue?

- For backend integration questions, open an issue or connect on the internal `#dev-backend` channel.
- To request changes to prompt structures or scoring weight heuristics, consult the [ThinkWire PRD](../../docs/PRD.md).
