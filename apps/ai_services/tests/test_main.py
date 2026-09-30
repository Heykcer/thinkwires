"""
Unit and Integration Tests for ThinkWire AI Microservice
=========================================================
Tests API endpoints, request validation, scoring logic, and assessment generation.
"""

import pytest
from fastapi.testclient import TestClient

# Import FastAPI application
try:
    from main import app
    client = TestClient(app)
except Exception:
    # Handle module resolution when tests are invoked from root directory
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from main import app
    client = TestClient(app)


def test_root_endpoint():
    """Verify service root returns welcome metadata and documentation path."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "ThinkWire AI Microservice"
    assert data["status"] == "online"
    assert data["documentation"] == "/docs"


def test_health_check():
    """Verify health check endpoint returns 200 OK and diagnostic indicators."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "thinkwire-ai-services"
    assert "uptime_seconds" in data
    assert "mock_mode" in data


def test_generate_assessment():
    """Verify screening assessment generator produces structured 10-question evaluation."""
    payload = {
        "job_title": "Senior Backend Node.js Engineer",
        "job_description": "Building high-throughput microservices using Express, PostgreSQL, Redis, and BullMQ.",
        "required_skills": ["Node.js", "Express", "PostgreSQL", "Redis"],
        "experience_level": "Senior",
        "num_questions": 10,
        "passing_threshold_percentage": 75
    }
    response = client.post("/api/v1/assessments/generate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["job_title"] == "Senior Backend Node.js Engineer"
    assert data["total_questions"] == 10
    assert data["passing_threshold_percentage"] == 75
    assert len(data["questions"]) == 10

    # Verify distribution of questions: 7 MCQs, 2 Situational, 1 Practical
    mcqs = [q for q in data["questions"] if q["type"] == "mcq"]
    situational = [q for q in data["questions"] if q["type"] == "situational"]
    practical = [q for q in data["questions"] if q["type"] == "practical"]

    assert len(mcqs) == 7
    assert len(situational) == 2
    assert len(practical) == 1

    # Check that MCQ options are populated
    for mcq in mcqs:
        assert mcq["options"] is not None
        assert len(mcq["options"]) == 4
        assert mcq["correct_answer"] in ["A", "B", "C", "D"]


def test_score_resume_top_match():
    """Verify resume scoring calculates high Fit Score and 'top_match' badge for strong candidates."""
    payload = {
        "resume_text": "Experienced Senior Software Engineer with 8 years in Node.js, Express, React, PostgreSQL, Docker, and Redis. Certified AWS Solutions Architect.",
        "job_description": "Looking for a Senior Software Engineer with 5+ years of Node.js, Express, React, PostgreSQL, and Docker experience.",
        "required_skills": ["Node.js", "Express", "React", "PostgreSQL", "Docker", "Redis"],
        "candidate_experience_years": 8.0,
        "required_experience_years": 5.0,
        "weights": {
            "technical_skills": 0.40,
            "experience_level": 0.30,
            "certifications": 0.20,
            "location_rate_fit": 0.10
        }
    }
    response = client.post("/api/v1/resumes/score", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["fit_score"] >= 80
    assert data["badge"] == "top_match"
    assert data["badge_color"] == "green"
    assert data["masked"] is False
    assert len(data["matched_skills"]) > 0
    assert "technical_skills" in data["breakdown"]


def test_score_resume_below_threshold():
    """Verify resume scoring triggers 'below_threshold' badge and masked=True when match is weak."""
    payload = {
        "resume_text": "Junior graphic designer with 1 year experience in Adobe Photoshop, Figma, and Canva.",
        "job_description": "Lead Rust Systems Architect with 10+ years in distributed systems, kernel development, and consensus protocols.",
        "required_skills": ["Rust", "Distributed Systems", "Raft", "Linux Kernel"],
        "candidate_experience_years": 1.0,
        "required_experience_years": 10.0
    }
    response = client.post("/api/v1/resumes/score", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["fit_score"] < 60
    assert data["badge"] == "below_threshold"
    assert data["badge_color"] == "gray"
    assert data["masked"] is True


def test_parse_resume():
    """Verify entity extraction parses skills, experience, and contact info."""
    payload = {
        "raw_text": "Jordan Lee\nEmail: jordan.lee@example.com\nPhone: (555) 123-4567\nSummary: 6 years experience in Python, FastAPI, Docker, and PostgreSQL."
    }
    response = client.post("/api/v1/resumes/parse", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["name"] == "Jordan Lee"
    assert data["email"] == "jordan.lee@example.com"
    assert "Python" in data["skills"]
    assert "FastAPI" in data["skills"]
    assert data["total_experience_years"] >= 5.0


def test_generate_embedding():
    """Verify vector embedding generation returns 1536-dimensional unit vector."""
    payload = {
        "text": "Full stack engineer specializing in React and Node.js microservices."
    }
    response = client.post("/api/v1/embeddings/generate", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["dimensions"] == 1536
    assert len(data["embedding"]) == 1536
    assert all(isinstance(v, float) for v in data["embedding"])


def test_validation_error_on_bad_payload():
    """Verify FastAPI automatically returns 422 Unprocessable Entity for invalid input."""
    # Missing required 'job_title'
    bad_payload = {
        "job_description": "Short"
    }
    response = client.post("/api/v1/assessments/generate", json=bad_payload)
    assert response.status_code == 422
