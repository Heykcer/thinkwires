# ThinkWire Staffing and Solutions 🚀

ThinkWire is a complete platform that connects three core groups:

1. **Clients (Companies)**: Looking to hire temporary workers, full-time staff, or freelancers.
2. **Candidates (Job Seekers / Bench Staff)**: Professionals looking for work or currently on the internal company "bench."
3. **Internal Admins & Recruiters**: The management team matching candidates to jobs and overseeing the platform.

### ✨ Key Features

- **🤖 AI Screening Gatekeeper**: Auto-generates custom tests based on job descriptions.
- **📄 Resume Match Scorer**: Automatically reads resumes and generates a "Fit Score" (0-100%).
- **💼 Bench Management**: Tracks internal candidates between client projects to monitor costs and enable quick reassignment.
- **🎛️ Admin Control Panel (CMS)**: Allows non-developers to toggle platform features ON/OFF instantly and update website content without code changes.

---

## 🏗️ System Architecture (Monorepo)

This project uses a **Monorepo** structure powered by [Turborepo](https://turbo.build/). This means all our different applications live inside this single folder.

- 🌐 **Frontend** (`apps/frontend`): React 19 built with Vite.
- ⚙️ **Backend Core** (`apps/backend`): Node.js & Express API Gateway.
- 🧠 **AI Microservice** (`apps/ai_services`): Python FastAPI for AI generation and resume vector searches.
- 🗄️ **Databases**: PostgreSQL (with pgvector) and Redis.

---

## 🚀 Beginner-Friendly Setup Guide

Follow these steps to get the entire project running on your local computer. You don't need to be an expert to set this up!

### 1️⃣ Prerequisites (What you need installed)

Before starting, ensure you have downloaded and installed the following on your computer:

- [Node.js](https://nodejs.org/en) (Version 20 or higher) - _Required for the web apps._
- [Python](https://www.python.org/downloads/) (Version 3.12 or higher) - _Required for the AI service._
- [Docker Desktop](https://www.docker.com/products/docker-desktop) - _Required to run our databases easily._ **Make sure the Docker Desktop app is open and running in the background.**

### 2️⃣ Install Dependencies

Open your terminal (Command Prompt, PowerShell, or VS Code Terminal), navigate to this project folder, and run:

```bash
npm install
```

_(This will download all the necessary JavaScript libraries for the frontend and backend.)_

### 3️⃣ Start the Databases (PostgreSQL & Redis)

Instead of installing complex databases manually, we use Docker to spin them up instantly. Run:

```bash
docker compose up -d
```

_(This downloads and starts PostgreSQL and Redis securely in the background. The `-d` means it runs silently without locking up your terminal)._

### 4️⃣ Set Up Environment Variables (.env files)

For security, sensitive data (like API keys and Database URLs) are not saved in code. We have provided `.env.example` files as templates. You need to copy these templates and create actual `.env` files in four specific places:

**A. Root Folder (For Docker Databases):**

1. Copy `.env.example` in the root folder and rename the copy to `.env`.
2. Add your `OPENAI_API_KEY` and `JWT_SECRET`.

**B. Backend (`apps/backend`):**

1. Go to `apps/backend/`.
2. Copy `.env.example` and rename it to `.env`.
3. This file automatically points the backend to your local Docker PostgreSQL and Redis instances.

**C. AI Microservice (`apps/ai_services`):**

1. Go to `apps/ai_services/`.
2. Copy `.env.example` and rename it to `.env`.
3. Ensure your `OPENAI_API_KEY` is pasted here so the AI can function.

**D. Frontend (`apps/frontend`):**

1. Go to `apps/frontend/`.
2. Copy `.env.example` and rename it to `.env`.
3. This contains `VITE_API_URL=http://localhost:5000` to connect the React app to the Express backend.

### 5️⃣ Start the Entire Application

Now you are ready to launch! Run:

```bash
npm run dev
```

_(Turborepo will magically start the Frontend, Backend, and AI Microservice all at the same time!)_

---

## 📂 Folder Structure Guide

If you need to find where something is written, here is a quick map:

- **`/apps/frontend/`**: The visual website the user sees (React).
- **`/apps/backend/`**: The core server that handles user logins and saving data (Express).
- **`/apps/ai_services/`**: The AI brain that reads resumes and generates tests (Python).
- **`/docs/`**: Project documentation, including the full Product Requirements Document (PRD).
- **`docker-compose.yml`**: The blueprint that tells Docker how to run our databases.
- **`turbo.json`**: The rules for how Turborepo runs our apps together.

## 🧪 Running Tests

To ensure you haven't broken any code before saving, run the automated testing pipeline:

```bash
npm run test
```

## 🏗️ Individual Application Setup

While `npm run dev` at the root runs everything automatically, you may want to work on or test an application in isolation.

### 🌐 Frontend Setup (`apps/frontend`)

The React application runs using Vite.

1. Navigate to the frontend directory: `cd apps/frontend`
2. Install dependencies (if you haven't globally): `npm install`
3. Run the development server: `npm run dev`
4. **Access the App:** Open `http://localhost:5173` in your browser.
   _Note: The frontend expects the backend to be running on port 5000._

### ⚙️ Backend Core (`apps/backend`)

The Express API acts as the central gateway connecting the database and AI service to the frontend.

1. Navigate to the backend directory: `cd apps/backend`
2. Ensure you have copied `.env.example` to `.env`.
3. Run the development server: `npm run dev`
4. **Access the API:** The server will listen on `http://localhost:5000`.

### 🧠 AI Microservice (`apps/ai_services`)

This Python FastAPI service handles candidate screening assessment generation, weighted resume fit scoring, and vector search embeddings.

> 📖 **Full AI Documentation**: For detailed architecture, model specifications (GPT-4o & text-embedding-3-small), prompt strategies, offline mock mode, and Swagger schemas, see the [AI Services README](apps/ai_services/README.md).

1. Navigate to the AI service directory: `cd apps/ai_services`
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate` (or `.\venv\Scripts\Activate.ps1`)
   - Mac/Linux: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Copy environment template: `cp .env.example .env` (configure your `OPENAI_API_KEY`, or set `MOCK_INFERENCE=true` for offline testing)
6. Run the FastAPI server: `npm run dev` (or run `uvicorn main:app --reload --host 0.0.0.0 --port 8000`)
7. **Access the API Docs:** Open `http://localhost:8000/docs` in your browser to interact with the AI Swagger UI.

## 🛠️ Built With

- **Frontend**: React 19, Tailwind CSS, Shadcn UI
- **Backend**: Node.js, Express, Sequelize ORM
- **AI Service**: Python, FastAPI, OpenAI, LangChain
- **DevOps**: GitHub Actions, Docker, Turborepo, Husky
