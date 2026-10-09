"""Schemas for asynchronous Data Import operations and jobs."""

import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field


class DataImportCreate(BaseModel):
    """Payload to initiate a bulk dataset import (API-021)."""

    dataset_type: str = Field(..., description="e.g. 'WEATHER', 'MARKET_PRICE', 'SATELLITE', 'BORROWER_PORTFOLIO'")
    source: str = Field(..., description="Data provider or file origin identifier")
    records_count: Optional[int] = Field(None, ge=1)
    metadata: Optional[Dict[str, Any]] = None


class DataImportResponse(BaseModel):
    """Job status and progress tracking representation (API-022)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    institution_id: Optional[uuid.UUID] = None
    type: str
    status: str
    idempotency_key: Optional[str] = None
    attempts: int = 0
    error_message: Optional[str] = None
    created_at: datetime
