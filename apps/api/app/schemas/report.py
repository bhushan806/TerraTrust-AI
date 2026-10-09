"""Pydantic schemas for Assessment Report Generation and Export (API-032, API-033)."""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ReportCreateRequest(BaseModel):
    format: str = Field(
        default="JSON",
        description="Desired export format: JSON, MARKDOWN, PDF, or HTML",
    )
    include_scenarios: bool = Field(
        default=True,
        description="Whether to include climate stress scenario comparisons",
    )
    include_explanations: bool = Field(
        default=True,
        description="Whether to include risk factor attribution matrix",
    )
    report_title: Optional[str] = Field(
        default="Agricultural Credit Risk Assessment Memorandum",
        description="Custom title for the generated memorandum",
    )


class ReportSummary(BaseModel):
    title: str
    institution_name: str
    borrower_name: str
    external_ref: str
    crop_code: str
    season: Optional[str] = None
    planted_area: float
    area_unit: str
    predicted_yield_kg_ha: float
    dscr: Optional[float] = None
    risk_band: Optional[str] = None
    repayment_probability_status: str = "NOT_AVAILABLE"
    disclaimer: str
    scenarios_evaluated_count: int = 0
    explanations_count: int = 0


class ReportResponse(BaseModel):
    report_id: uuid.UUID
    assessment_id: uuid.UUID
    institution_id: uuid.UUID
    status: str = Field(..., description="QUEUED, RUNNING, COMPLETED, FAILED")
    format: str
    download_url: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    summary: Optional[Dict[str, Any]] = None
    content: Optional[str] = None

    model_config = {"from_attributes": True}
