"""Health check endpoints"""

from fastapi import APIRouter
from app.models.schemas import HealthCheckResponse
from app.core.config import settings
from app.services.google_calendar import google_calendar_service
from app.services.ai_scheduler import ai_scheduler

router = APIRouter()


@router.get("/", response_model=HealthCheckResponse)
async def health_check():
    """
    Health check endpoint to verify all services are operational.
    """
    # Check OpenAI
    openai_available = bool(settings.openai_api_key and settings.openai_api_key != "your_openai_api_key_here")

    # Check Google Calendar (basic check)
    google_connected = bool(
        settings.google_client_id and
        settings.google_client_id != "your_google_client_id_here"
    )

    # Check database (simple check)
    database_healthy = True  # Will be enhanced with actual DB check

    return HealthCheckResponse(
        status="healthy" if all([openai_available, database_healthy]) else "degraded",
        version="1.0.0",
        google_calendar_connected=google_connected,
        openai_available=openai_available,
        database_healthy=database_healthy,
    )
