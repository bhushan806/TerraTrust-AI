"""Health check and readiness endpoints (API-034)."""

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session
from app.config import get_settings
from app.db.session import check_db_connectivity, get_db
from app.schemas.common import HealthResponse

router = APIRouter(tags=["MVP", "Health"])
settings = get_settings()


@router.get(
    "/health/ready",
    response_model=HealthResponse,
    operation_id="readinessCheck",
    summary="Readiness check",
    responses={
        200: {"description": "Service is ready to handle traffic"},
        503: {"description": "Service dependencies are unavailable"},
    },
)
def readiness_check(
    response: Response,
    db: Session = Depends(get_db),
) -> HealthResponse:
    """Readiness probe for platform orchestrator / load balancers (API-034)."""
    db_ok = check_db_connectivity(db=db)
    if not db_ok:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return HealthResponse(
            status="degraded",
            environment=settings.APP_ENV,
            version="0.1.0",
            database="disconnected",
        )

    return HealthResponse(
        status="ok",
        environment=settings.APP_ENV,
        version="0.1.0",
        database="connected",
    )


@router.get(
    "/health/live",
    response_model=HealthResponse,
    summary="Liveness check",
)
def liveness_check() -> HealthResponse:
    """Liveness probe verifying that the application process is running."""
    return HealthResponse(
        status="ok",
        environment=settings.APP_ENV,
        version="0.1.0",
        database="unknown",
    )
