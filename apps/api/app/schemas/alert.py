"""Pydantic schemas for Early Warning Alerts and Monitoring."""

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class AlertResponse(BaseModel):
    id: uuid.UUID
    institution_id: uuid.UUID
    assessment_id: Optional[uuid.UUID] = None
    rule_code: str
    severity: str = Field(..., description="INFO, WARNING, CRITICAL")
    message: str
    status: str = Field(..., description="ACTIVE, ACKNOWLEDGED, RESOLVED")
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class AlertUpdate(BaseModel):
    status: str = Field(
        ...,
        pattern="^(ACTIVE|ACKNOWLEDGED|RESOLVED)$",
        description="Target status for the alert",
    )
