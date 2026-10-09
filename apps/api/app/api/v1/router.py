"""API v1 master router aggregating domain endpoints."""

from fastapi import APIRouter
from app.api.v1.endpoints import auth, health

api_v1_router = APIRouter()

# Register endpoint sub-routers
api_v1_router.include_router(health.router)
api_v1_router.include_router(auth.router)
