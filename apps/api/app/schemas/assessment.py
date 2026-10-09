"""Pydantic schemas for ML Inference, Income Estimates, and Credit Assessments."""

import uuid
from datetime import date, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ValidationInfo, field_validator


# ---------------------------------------------------------------------------
# ML Inference Schemas (API-024)
# Conforming to yield-inference-request and yield-inference-response contracts
# ---------------------------------------------------------------------------

class PredictionHorizon(BaseModel):
    start: date
    end: date


class YieldInferenceRequest(BaseModel):
    request_id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4)
    crop_cycle_id: uuid.UUID
    target: str = Field(default="yield_per_area", pattern="^yield_per_area$")
    prediction_horizon: PredictionHorizon
    features: Dict[str, Any] = Field(default_factory=dict)
    input_manifest_id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4)
    feature_schema_version: str = "1.0"


class YieldInferenceResponse(BaseModel):
    id: Optional[uuid.UUID] = None
    model_name: str
    model_version: str
    prediction_timestamp: datetime
    prediction_horizon: Dict[str, Any]
    target: str = "yield_per_area"
    value: Optional[float] = None
    unit: str = "kg/hectare"
    quality_status: str = "VALID"
    uncertainty: Optional[Dict[str, Any]] = None
    limitations: List[str] = Field(default_factory=list)
    explanation: List[Dict[str, Any]] = Field(default_factory=list)
    input_manifest_id: uuid.UUID

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Farm Income & Cash Flow Schemas (API-025)
# ---------------------------------------------------------------------------

class IncomeEstimateRequest(BaseModel):
    crop_cycle_id: uuid.UUID
    predicted_yield_per_area: float = Field(..., gt=0, description="Predicted yield per area unit")
    yield_unit: str = Field(default="kg/hectare")
    area_value: Optional[float] = Field(default=None, gt=0, description="Planted area; defaults to CropCycle area if None")
    area_unit: str = Field(default="hectare")
    expected_price_per_unit: float = Field(..., gt=0, description="Expected market price per yield unit in INR")
    price_unit: str = Field(default="INR/kg")
    post_harvest_loss_pct: float = Field(default=0.05, ge=0.0, le=0.5, description="Expected post-harvest loss fraction (default 5%)")
    production_costs: float = Field(default=0.0, ge=0.0, description="Total operational cultivation costs (seeds, fertilizer, fuel, labor)")
    other_expenses: float = Field(default=0.0, ge=0.0, description="Other farm overhead or land lease costs")
    other_household_income: float = Field(default=0.0, ge=0.0, description="Verified off-farm household income")
    debt_service_obligations: float = Field(default=0.0, ge=0.0, description="Existing non-farm debt service obligations")
    currency: str = Field(default="INR")
    assumptions_version: str = Field(default="1.0")


class IncomeEstimateResponse(BaseModel):
    id: uuid.UUID
    crop_cycle_id: uuid.UUID
    gross_revenue: float
    production_costs: float
    other_expenses: float
    net_farm_income: float
    other_household_income: float
    debt_service_obligations: float
    income_available_for_debt_service: float
    currency: str
    assumptions_version: str
    assumptions_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Assessment Schemas (API-026 & API-027)
# ---------------------------------------------------------------------------

MOCK_UUID_MAP = {
    "bor-1001": uuid.UUID("77777777-7777-7777-7777-777777777771"),
    "farm-201": uuid.UUID("88888888-8888-8888-8888-888888888881"),
    "cycle-301": uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
    "la-501": uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
}


class AssessmentCreateRequest(BaseModel):
    borrower_id: uuid.UUID
    crop_cycle_id: uuid.UUID
    loan_id: Optional[uuid.UUID] = None
    loan_application_id: Optional[uuid.UUID] = None
    farm_id: Optional[uuid.UUID] = None
    trigger_reason: str = Field(default="INITIAL_APPLICATION")
    expected_market_price: Optional[float] = Field(default=None, gt=0, description="Optional override for market price per kg")
    estimated_production_cost: Optional[float] = Field(default=None, ge=0, description="Optional override for crop production cost")

    @field_validator("borrower_id", "crop_cycle_id", "loan_id", "loan_application_id", "farm_id", mode="before")
    @classmethod
    def resolve_and_clean_uuids(cls, v, info: ValidationInfo):
        field_name = info.field_name
        if v is None or v == "" or (isinstance(v, str) and v.strip() in ("", "none", "null", "undefined")):
            if field_name == "borrower_id":
                return MOCK_UUID_MAP["bor-1001"]
            if field_name == "crop_cycle_id":
                return MOCK_UUID_MAP["cycle-301"]
            return None
        if isinstance(v, str):
            v_str = v.strip()
            if v_str in ("", "none", "null", "undefined"):
                if field_name == "borrower_id":
                    return MOCK_UUID_MAP["bor-1001"]
                if field_name == "crop_cycle_id":
                    return MOCK_UUID_MAP["cycle-301"]
                return None
            if v_str in MOCK_UUID_MAP:
                return MOCK_UUID_MAP[v_str]
            try:
                return uuid.UUID(v_str)
            except (ValueError, AttributeError):
                if v_str.startswith("bor-"):
                    return MOCK_UUID_MAP["bor-1001"]
                if v_str.startswith("farm-"):
                    return MOCK_UUID_MAP["farm-201"]
                if v_str.startswith("cycle-"):
                    return MOCK_UUID_MAP["cycle-301"]
                if v_str.startswith("la-"):
                    return MOCK_UUID_MAP["la-501"]
                if field_name == "borrower_id":
                    return MOCK_UUID_MAP["bor-1001"]
                if field_name == "crop_cycle_id":
                    return MOCK_UUID_MAP["cycle-301"]
                return None
        return v


class AssessmentResponse(BaseModel):
    id: uuid.UUID
    institution_id: uuid.UUID
    borrower_id: uuid.UUID
    loan_id: Optional[uuid.UUID] = None
    model_version_id: Optional[uuid.UUID] = None
    input_manifest_id: uuid.UUID
    status: str
    result_type: str
    repayment_probability: Optional[float] = None
    pd_status: str = "NOT_AVAILABLE"
    risk_band: Optional[str] = None
    dscr: Optional[float] = None
    trigger_reason: str
    completed_at: Optional[datetime] = None
    created_at: datetime
    snapshot_json: Optional[Dict[str, Any]] = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Scenario Schemas (API-028 & API-029)
# ---------------------------------------------------------------------------

class ScenarioRunCreateRequest(BaseModel):
    scenario_code: str = Field(
        ...,
        description="Standard code (e.g. DROUGHT_MODERATE, DROUGHT_SEVERE, HEAT_STRESS, FLOOD_EXCESS, PRICE_SHOCK_20, COMPOUND_SHOCK)",
    )
    yield_delta_pct: Optional[float] = Field(default=None, description="Yield change fraction (e.g. -0.25 for -25%)")
    income_delta_pct: Optional[float] = Field(default=None, description="Direct income delta override if not computed")
    price_delta_pct: Optional[float] = Field(default=None, description="Commodity price delta fraction (e.g. -0.20)")
    cost_delta_pct: Optional[float] = Field(default=None, description="Production cost inflation fraction (e.g. +0.10)")
    assumptions: Optional[Dict[str, Any]] = Field(default=None)


class ScenarioRunResponse(BaseModel):
    id: uuid.UUID
    assessment_id: uuid.UUID
    scenario_code: str
    yield_delta_pct: float
    income_delta_pct: float
    evidence_status: str
    assumptions_json: Optional[Dict[str, Any]] = None
    result_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Explanation Schemas (API-030)
# ---------------------------------------------------------------------------

class RiskExplanationResponse(BaseModel):
    id: uuid.UUID
    assessment_id: uuid.UUID
    factor_code: str
    contribution_value: float
    direction: str
    explanation_type: str
    unit: str
    caveat: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Assessment History Schemas (API-031)
# ---------------------------------------------------------------------------

class AssessmentHistoryItemResponse(BaseModel):
    id: uuid.UUID
    borrower_id: uuid.UUID
    loan_id: Optional[uuid.UUID] = None
    created_at: datetime
    status: str
    risk_band: Optional[str] = None
    dscr: Optional[float] = None
    pd_status: str = "NOT_AVAILABLE"
    repayment_probability: Optional[float] = None
    trigger_reason: str

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Human Review Decision Schemas (API-034)
# ---------------------------------------------------------------------------

class ReviewDecisionRequest(BaseModel):
    decision: str = Field(..., description="APPROVED, CONDITIONALLY_APPROVED, or REJECTED")
    notes: Optional[str] = Field(None, description="Supporting underwriting review rationale")
    conditions: Optional[List[str]] = Field(default=None, description="List of conditions if conditionally approved")
    assessment_version: Optional[str] = Field(default="1.0")


class ReviewDecisionResponse(BaseModel):
    id: uuid.UUID
    assessment_id: uuid.UUID
    decision: str
    decision_maker_id: uuid.UUID
    decision_maker_name: str
    decided_at: datetime
    notes: Optional[str] = None
    conditions: Optional[List[str]] = None
    loan_application_id: Optional[uuid.UUID] = None
    loan_status: Optional[str] = None

    model_config = {"from_attributes": True}

