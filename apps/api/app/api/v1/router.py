"""API v1 master router aggregating domain endpoints."""

from fastapi import APIRouter
from app.api.v1.endpoints import (
    assessments,
    auth,
    borrowers,
    farms,
    health,
    imports,
    institutions,
    loans,
    observations,
)

api_v1_router = APIRouter()

# Register endpoint sub-routers
api_v1_router.include_router(health.router)
api_v1_router.include_router(auth.router)
api_v1_router.include_router(institutions.router)
api_v1_router.include_router(borrowers.router)
api_v1_router.include_router(farms.router)
api_v1_router.include_router(loans.router)
api_v1_router.include_router(observations.router)
api_v1_router.include_router(imports.router)
api_v1_router.include_router(assessments.router)

