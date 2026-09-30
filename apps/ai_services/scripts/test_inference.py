"""
ThinkWire AI Services - Local Inference Smoke Test Script
==========================================================
Executes test inferences against the ThinkWire AI service endpoints.
Can test against in-memory FastAPI app or against a live running server (http://localhost:8000).

Usage:
    python scripts/test_inference.py
    python scripts/test_inference.py --live
"""

import sys
import json
import argparse
from pathlib import Path

# Add parent directory to path so main can be imported
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def run_smoke_test(use_live_server: bool = False, base_url: str = "http://localhost:8000"):
    print("=" * 70)
    print("[AI] ThinkWire AI Services - Inference Smoke Test")
    print("=" * 70)

    if use_live_server:
        import httpx
        client = httpx.Client(base_url=base_url, timeout=10.0)
        print(f"[*] Testing against LIVE server at: {base_url}\n")
    else:
        from main import app
        from fastapi.testclient import TestClient
        client = TestClient(app)
        print("[*] Testing directly via FastAPI TestClient (in-process)\n")

    # 1. Health Probe
    print("[1] Probing /health ...")
    health_resp = client.get("/health")
    assert health_resp.status_code == 200, f"Health check failed: {health_resp.text}"
    health = health_resp.json()
    print(f"    Status:      {health.get('status')}")
    print(f"    Environment: {health.get('environment')}")
    print(f"    Uptime:      {health.get('uptime_seconds')}s")
    print(f"    Mock Mode:   {health.get('mock_mode')}")
    print("    --> Health probe PASSED [OK]\n")

    # 2. Screening Assessment Generation
    print("[2] Generating 10-Question Screening Assessment (/api/v1/assessments/generate) ...")
    assessment_payload = {
        "job_title": "Senior Backend Node.js Engineer",
        "job_description": "We are seeking a Senior Backend Engineer to architect high-throughput APIs with Node.js, Express, PostgreSQL, and Redis.",
        "required_skills": ["Node.js", "Express", "PostgreSQL", "Redis"],
        "experience_level": "Senior",
        "num_questions": 10,
        "passing_threshold_percentage": 75
    }
    asm_resp = client.post("/api/v1/assessments/generate", json=assessment_payload)
    assert asm_resp.status_code == 200, f"Assessment generation failed: {asm_resp.text}"
    asm = asm_resp.json()
    print(f"    Assessment ID:   {asm.get('assessment_id')}")
    print(f"    Total Questions: {asm.get('total_questions')}")
    print(f"    Sample Question: {asm['questions'][0]['question'][:80]}...")
    print(f"    Anti-cheat:      {asm.get('anti_cheat_enabled')}")
    print("    --> Assessment generation PASSED [OK]\n")

    # 3. Resume Match Scoring
    print("[3] Scoring Candidate Resume against Requisition (/api/v1/resumes/score) ...")
    resume_payload = {
        "resume_text": "Alex Johnson. Senior Software Engineer with 7 years experience building distributed backends in Node.js, Express, PostgreSQL, and Docker. AWS Certified Solutions Architect.",
        "job_description": "Looking for Senior Backend Engineer with 5+ years experience in Node.js, Express, PostgreSQL, and Docker.",
        "required_skills": ["Node.js", "Express", "PostgreSQL", "Docker", "AWS"],
        "candidate_experience_years": 7.0,
        "required_experience_years": 5.0,
        "weights": {
            "technical_skills": 0.40,
            "experience_level": 0.30,
            "certifications": 0.20,
            "location_rate_fit": 0.10
        }
    }
    score_resp = client.post("/api/v1/resumes/score", json=resume_payload)
    assert score_resp.status_code == 200, f"Resume scoring failed: {score_resp.text}"
    score = score_resp.json()
    print(f"    Fit Score:       {score.get('fit_score')}%")
    print(f"    Badge:           {score.get('badge')} ({score.get('badge_color')})")
    print(f"    Masked Feed:     {score.get('masked')}")
    print(f"    Matched Skills:  {score.get('matched_skills')}")
    print(f"    Summary:         {score.get('executive_summary')}")
    print("    --> Resume scoring PASSED [OK]\n")

    # 4. Dense Vector Embedding
    print("[4] Generating Dense Vector Embedding (/api/v1/embeddings/generate) ...")
    embed_payload = {
        "text": "Full stack engineer specializing in Node.js, Express, React, and pgvector.",
        "model": "text-embedding-3-small"
    }
    embed_resp = client.post("/api/v1/embeddings/generate", json=embed_payload)
    assert embed_resp.status_code == 200, f"Embedding generation failed: {embed_resp.text}"
    embed = embed_resp.json()
    print(f"    Model Used:      {embed.get('model')}")
    print(f"    Dimensions:      {embed.get('dimensions')}")
    print(f"    Vector Sample:   {embed['embedding'][:3]} ... [{len(embed['embedding'])} total floats]")
    print("    --> Vector embedding PASSED [OK]\n")

    print("=" * 70)
    print("[SUCCESS] ALL INFERENCE SMOKE TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run ThinkWire AI Service inference smoke tests.")
    parser.add_argument("--live", action="store_true", help="Test against live HTTP server at localhost:8000")
    parser.add_argument("--url", default="http://localhost:8000", help="Base URL for live server")
    args = parser.parse_args()

    run_smoke_test(use_live_server=args.live, base_url=args.url)
