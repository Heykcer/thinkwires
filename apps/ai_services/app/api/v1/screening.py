from fastapi import APIRouter
from typing import Dict, Any, Optional
from pydantic import BaseModel
from app.schemas.screening import (
    GenerateAssessmentRequest,
    EvaluateAssessmentRequest,
    EvaluateAssessmentResponse,
)
from app.services.test_generator import generate_screening_test
from app.services.test_evaluator import evaluate_screening_test
from app.services.dossier_evaluator import evaluate_candidate_dossier

router = APIRouter(prefix="/api/screening", tags=["AI Screening Assessments"])

class EvaluateCandidateRequest(BaseModel):
    candidate_data: Dict[str, Any] = {}
    job_data: Dict[str, Any] = {}
    recruiter_notes: Optional[str] = ""

@router.post("/generate-test")
async def generate_screening_test_endpoint(request: GenerateAssessmentRequest):
    """
    Generates a proctored 10-Question Technical Assessment tailored to the
    job requisition and candidate profile per PRD Section 4.2.
    """
    return generate_screening_test(request)

@router.post("/evaluate-test", response_model=EvaluateAssessmentResponse)
async def evaluate_screening_test_endpoint(request: EvaluateAssessmentRequest):
    """
    Evaluates candidate assessment responses, grades MCQs deterministically,
    evaluates scenarios & code, and renders gatekeeper admission decision.
    """
    return evaluate_screening_test(request)

@router.post("/evaluate-candidate")
async def evaluate_candidate_endpoint(request: EvaluateCandidateRequest):
    """
    Evaluates candidate strictly against requirements using the 6-factor weighted rubric.
    """
    return evaluate_candidate_dossier(
        request.candidate_data,
        request.job_data,
        request.recruiter_notes or "",
    )
