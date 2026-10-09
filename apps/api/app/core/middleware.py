"""Middleware for request ID injection, correlation, and response timing."""

import time
import uuid
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.core.logging import request_id_ctx


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Middleware ensuring every request has a correlated X-Request-ID."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Honor client provided X-Request-ID if provided, else generate UUID4
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        token = request_id_ctx.set(request_id)

        # Store in request state for downstream handlers
        request.state.request_id = request_id

        start_time = time.perf_counter()
        try:
            response = await call_next(request)
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Response-Time-Ms"] = f"{duration_ms:.2f}"
            return response
        finally:
            request_id_ctx.reset(token)
