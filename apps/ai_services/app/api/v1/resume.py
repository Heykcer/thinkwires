import os
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Form, Header, HTTPException, status

from app.config import settings, logger
from app.api.auth import verify_service_auth
from app.schemas.resume import (
    ParsedResumeResponse,
    ResumeMatchRequest,
    ResumeMatchResponse,
)
from app.services.resume_parser import parse_resume_content
from app.services.match_scorer import calculate_match_score

router = APIRouter(prefix="/api/resume", tags=["Resume Parsing & ATS Matching"])

@router.post("/parse", response_model=ParsedResumeResponse)
async def parse_resume_endpoint(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
):
    """
    Parses resume strictly from memory-resident uploaded file bytes or raw text string.
    Arbitrary local filesystem paths are completely removed (P0 Security Requirement A).
    """
    # 1. Verify service authentication
    verify_service_auth(x_api_key, authorization)

    file_bytes = None
    filename = None

    if file:
        # Sanitize filename and block directory traversal attempts
        raw_name = file.filename or "resume.pdf"
        filename = os.path.basename(raw_name)

        # Check for directory traversal sequences in original client filename
        if ".." in raw_name or "/" in raw_name or "\\" in raw_name:
            logger.warning(f"[Security Audit] Directory traversal attempt in filename blocked: {raw_name}")

        file_bytes = await file.read()

        # Restrict upload size (P0 Requirement A.4)
        if len(file_bytes) > settings.MAX_UPLOAD_SIZE_BYTES:
            logger.warning(
                f"[Security Audit] Oversized file rejected: filename={filename}, size={len(file_bytes)}"
            )
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Uploaded file exceeds maximum permitted size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)}MB.",
            )

    if not file_bytes and not raw_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No document provided. Please upload a file (PDF/DOCX/TXT) or supply raw text.",
        )

    try:
        parsed = await parse_resume_content(
            file_bytes=file_bytes,
            filename=filename,
            raw_text=raw_text,
        )
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve),
        )

    return ParsedResumeResponse(
        success=True,
        **parsed,
    )

@router.post("/match-score", response_model=ResumeMatchResponse)
async def calculate_match_score_endpoint(
    request: ResumeMatchRequest,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
):
    """
    Computes candidate ATS Fit Score (0-100%) against job requisition
    using weighted dimensions per PRD Section 4.3.
    """
    verify_service_auth(x_api_key, authorization)
    return calculate_match_score(request)
