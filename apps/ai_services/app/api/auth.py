from fastapi import Header, HTTPException, status
from typing import Optional
from app.config import settings, logger

def verify_service_auth(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
):
    """
    Validates inter-service authentication token between backend and AI microservice
    when AI_SERVICE_API_KEY is configured (P0 Security Requirement A & P1 Requirement 7).
    """
    expected_key = settings.AI_SERVICE_API_KEY
    if not expected_key:
        return  # In dev/test with no key configured, proceed

    token = x_api_key
    if not token and authorization:
        parts = authorization.split(" ")
        token = parts[1] if len(parts) == 2 and parts[0].lower() == "bearer" else authorization

    if not token or token.strip() != expected_key:
        logger.warning("[Security Alert] Unauthorized AI microservice request rejected.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid or missing AI service API key.",
        )
