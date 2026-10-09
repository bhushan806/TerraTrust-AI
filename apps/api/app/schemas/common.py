"""Shared schemas and API models conforming to FIN-03 contracts."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class ErrorBody(BaseModel):
    """Inner error payload required by packages/contracts/schemas/error.schema.json."""

    model_config = ConfigDict(extra="forbid")

    code: str = Field(..., description="Machine-readable error code")
    message: str = Field(..., description="Human-readable error description")
    request_id: str = Field(..., description="Correlated request identifier")
    details: Optional[List[Dict[str, Any]]] = Field(
        default=None, description="Optional validation or context details"
    )


class ErrorEnvelope(BaseModel):
    """Standardized API Error Envelope conforming to JSON Schema."""

    model_config = ConfigDict(extra="forbid")

    error: ErrorBody


class HealthResponse(BaseModel):
    """System health and readiness check response model."""

    status: str = Field("ok", description="Health status (ok, degraded, down)")
    environment: str = Field(..., description="Application environment (local, prod, etc.)")
    version: str = Field(..., description="API Version")
    database: str = Field("connected", description="Database connectivity status")
