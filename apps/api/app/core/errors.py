"""Standardized error handling conforming to API Error Envelope schema."""

import logging
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.logging import request_id_ctx
from app.schemas.common import ErrorBody, ErrorEnvelope

logger = logging.getLogger(__name__)


class APIException(Exception):
    """Base application exception for explicit API error responses."""

    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: Optional[List[Dict[str, Any]]] = None,
    ):
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details


class NotFoundException(APIException):
    def __init__(self, message: str = "Resource not found", details: Optional[List[Dict[str, Any]]] = None):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            code="NOT_FOUND",
            message=message,
            details=details,
        )


class UnauthorizedException(APIException):
    def __init__(self, message: str = "Authentication required", details: Optional[List[Dict[str, Any]]] = None):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="UNAUTHENTICATED",
            message=message,
            details=details,
        )


class ForbiddenException(APIException):
    def __init__(self, message: str = "Access forbidden", details: Optional[List[Dict[str, Any]]] = None):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            code="FORBIDDEN",
            message=message,
            details=details,
        )


class ValidationException(APIException):
    def __init__(self, message: str = "Validation failed", details: Optional[List[Dict[str, Any]]] = None):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="VALIDATION_ERROR",
            message=message,
            details=details,
        )


class ConflictException(APIException):
    def __init__(self, message: str = "Resource state conflict", details: Optional[List[Dict[str, Any]]] = None):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            code="CONFLICT",
            message=message,
            details=details,
        )


class RateLimitException(APIException):
    def __init__(
        self,
        message: str = "Rate limit exceeded. Please try again later.",
        details: Optional[List[Dict[str, Any]]] = None,
    ):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            code="TOO_MANY_REQUESTS",
            message=message,
            details=details,
        )


def build_error_response(
    status_code: int,
    code: str,
    message: str,
    details: Optional[List[Dict[str, Any]]] = None,
    request_id: Optional[str] = None,
) -> JSONResponse:
    """Construct a standardized JSONResponse with ErrorEnvelope payload."""
    req_id = request_id or request_id_ctx.get()
    envelope = ErrorEnvelope(
        error=ErrorBody(
            code=code,
            message=message,
            request_id=req_id,
            details=details,
        )
    )
    return JSONResponse(
        status_code=status_code,
        content=envelope.model_dump(exclude_none=True),
        headers={"X-Request-ID": req_id},
    )


def register_error_handlers(app: FastAPI) -> None:
    """Register custom exception handlers with FastAPI application."""

    @app.exception_handler(APIException)
    async def api_exception_handler(request: Request, exc: APIException) -> JSONResponse:
        req_id = getattr(request.state, "request_id", request_id_ctx.get())
        logger.warning(
            "APIException: %s | code=%s status=%d",
            exc.message,
            exc.code,
            exc.status_code,
        )
        return build_error_response(
            status_code=exc.status_code,
            code=exc.code,
            message=exc.message,
            details=exc.details,
            request_id=req_id,
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        req_id = getattr(request.state, "request_id", request_id_ctx.get())
        formatted_details = []
        for error in exc.errors():
            formatted_details.append(
                {
                    "loc": [str(loc_item) for loc_item in error.get("loc", [])],
                    "msg": error.get("msg", "Invalid value"),
                    "type": error.get("type", "value_error"),
                }
            )
        logger.info("RequestValidationError on %s: %s", request.url.path, formatted_details)
        return build_error_response(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="VALIDATION_ERROR",
            message="Request could not be validated",
            details=formatted_details,
            request_id=req_id,
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        req_id = getattr(request.state, "request_id", request_id_ctx.get())
        code_map = {
            400: "INVALID_REQUEST",
            401: "UNAUTHENTICATED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            405: "METHOD_NOT_ALLOWED",
            409: "CONFLICT",
            429: "TOO_MANY_REQUESTS",
            503: "SERVICE_UNAVAILABLE",
        }
        code = code_map.get(exc.status_code, "HTTP_ERROR")
        return build_error_response(
            status_code=exc.status_code,
            code=code,
            message=str(exc.detail),
            request_id=req_id,
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        req_id = getattr(request.state, "request_id", request_id_ctx.get())
        logger.error(
            "Unhandled exception processing request %s: %s",
            request.url.path,
            str(exc),
            exc_info=True,
        )
        return build_error_response(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_ERROR",
            message="An unexpected internal server error occurred",
            request_id=req_id,
        )
