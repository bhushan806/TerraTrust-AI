"""FIN-03 FastAPI Application Entrypoint."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_v1_router
from app.config import get_settings
from app.core.errors import register_error_handlers
from app.core.logging import setup_logging
from app.core.middleware import RequestIdMiddleware

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager for startup and shutdown routines."""
    # Startup: configure logging
    setup_logging(log_level=settings.LOG_LEVEL)
    yield
    # Shutdown routines if any


def create_app() -> FastAPI:
    """FastAPI application factory."""
    app = FastAPI(
        title="FIN-03 Agricultural Climate-Aware Credit Risk API",
        version="1.0.0",
        description="Decision-support system for climate-aware agricultural credit risk assessment.",
        openapi_url="/api/v1/openapi.json",
        docs_url="/api/v1/docs",
        redoc_url="/api/v1/redoc",
        lifespan=lifespan,
    )

    # Middleware: Request ID and correlation
    app.add_middleware(RequestIdMiddleware)

    # Middleware: CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Response-Time-Ms"],
    )

    # Exception Handlers conforming to error envelope schema
    register_error_handlers(app)

    # ML Crop Yield Prediction Router (TerraTrust Model)
    from app.api.v1.endpoints.predict_yield import router as predict_router
    app.include_router(predict_router)
    app.include_router(predict_router, prefix="/api/v1")

    # Router Mounting
    app.include_router(api_v1_router, prefix="/api/v1")

    # Convenience root health check
    @app.get("/health", tags=["Health"], include_in_schema=False)
    def root_health():
        return {"status": "ok", "app": settings.APP_NAME, "version": "1.0.0"}

    # Redirect /docs to /api/v1/docs
    @app.get("/docs", include_in_schema=False)
    def docs_redirect():
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url="/api/v1/docs")

    return app


app = create_app()
