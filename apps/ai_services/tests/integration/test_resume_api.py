import io

def test_parse_resume_api_with_raw_text(client, sample_resume_text):
    res = client.post("/api/resume/parse", data={"raw_text": sample_resume_text})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["first_name"] == "Alex"
    assert data["last_name"] == "Rivera"
    assert "alex.rivera@cloudscale.io" in data["email"]
    assert "Kubernetes" in data["skills"]
    assert "AWS" in data["skills"]
    assert data["total_experience_years"] >= 5.0

def test_parse_resume_api_with_pdf_upload(client, create_sample_pdf):
    pdf_bytes = create_sample_pdf(pages=2)
    files = {"file": ("resume.pdf", io.BytesIO(pdf_bytes), "application/pdf")}
    res = client.post("/api/resume/parse", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "candidate_name" in data

def test_match_score_api_success(client, mock_open_requisition):
    res = client.post("/api/resume/match-score", json=mock_open_requisition)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["fit_score"] >= 80
    assert data["fit_badge"] == "Top Match"
    assert data["category"] == "green"
    assert "Kubernetes" in data["matched_skills"]
    assert "AWS" in data["matched_skills"]
    assert len(data["strengths"]) > 0

def test_match_score_api_validation_error_missing_title(client):
    # job_title is required in ResumeMatchRequest
    payload = {
        "required_skills": ["Go", "Kubernetes"],
    }
    res = client.post("/api/resume/match-score", json=payload)
    assert res.status_code == 422  # Unprocessable Entity
    error_detail = res.json()["detail"]
    assert any("job_title" in str(err) for err in error_detail)

def test_parse_resume_rejects_arbitrary_file_path_parameter(client):
    """
    P0 Security Requirement A: Verifies that passing a file_path form parameter does NOT
    read or return arbitrary local files such as /etc/passwd or .env.
    """
    res = client.post("/api/resume/parse", data={"file_path": "/etc/passwd"})
    # Since file_path parameter is removed from API, either 400 (no document provided) or 200 without reading file_path
    if res.status_code == 200:
        assert "/etc/passwd" not in res.json().get("raw_text", "")
        assert "root:" not in res.json().get("raw_text", "")
    else:
        assert res.status_code == 400

def test_parse_resume_rejects_forged_file_signature(client):
    """
    P0 Security Requirement A.3: Verifies that uploading an executable or forged file claiming
    to be a PDF is rejected with HTTP 400.
    """
    fake_pdf = b"MZ\x90\x00\x03\x00\x00\x00This is a Windows executable binary disguised as a PDF."
    files = {"file": ("malicious.pdf", io.BytesIO(fake_pdf), "application/pdf")}
    res = client.post("/api/resume/parse", files=files)
    assert res.status_code == 400
    assert "Invalid document" in res.json()["detail"]

def test_parse_resume_rejects_oversized_upload(client):
    """
    P0 Security Requirement A.4: Verifies upload size limit enforcement.
    """
    oversized = b"%PDF-1.4\n" + b"0" * (11 * 1024 * 1024)  # 11MB
    files = {"file": ("huge.pdf", io.BytesIO(oversized), "application/pdf")}
    res = client.post("/api/resume/parse", files=files)
    assert res.status_code == 413
    assert "exceeds maximum permitted size" in res.json()["detail"]

def test_parse_resume_rejects_unauthorized_request(client, monkeypatch):
    """
    P0 Security Requirement A.5: Verifies that when AI_SERVICE_API_KEY is configured,
    requests without the key are rejected with HTTP 401.
    """
    from app.config import settings
    monkeypatch.setattr(settings, "AI_SERVICE_API_KEY", "super-secret-service-key-2026")

    # Request without key
    res = client.post("/api/resume/parse", data={"raw_text": "Software Engineer with React experience."})
    assert res.status_code == 401

    # Request with valid key
    res_valid = client.post(
        "/api/resume/parse",
        data={"raw_text": "Software Engineer with React experience."},
        headers={"X-API-Key": "super-secret-service-key-2026"},
    )
    assert res_valid.status_code == 200
