from fastapi import APIRouter
from app.config import settings

router = APIRouter(tags=["Health & Status"])

@router.get("/")
def get_service_status():
    """Returns microservice health, version, and route catalog."""
    return {
        "status": "online",
        "service": settings.APP_TITLE,
        "version": settings.APP_VERSION,
        "openai_configured": settings.is_openai_configured,
        "llm_configured": settings.is_llm_configured,
        "active_llm_providers": settings.active_llm_providers,
        "endpoints": [
            "POST /api/resume/parse",
            "POST /api/resume/match-score",
            "POST /api/screening/generate-test",
            "POST /api/screening/evaluate-test",
        ],
    }

@router.get("/health")
def health_check():
    """Lightweight Kubernetes / container liveness probe."""
    return {"status": "healthy"}
