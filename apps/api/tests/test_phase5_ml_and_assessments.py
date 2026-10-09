"""Comprehensive tests for Phase 5 AI/ML Inference, Income Calculation, Credit Assessments, Scenarios, and Explanations (API-024 to API-031)."""

import uuid
from datetime import date
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.rate_limit import login_rate_limiter
from app.models.assessment import (
    CreditAssessment,
    IncomeEstimate,
    RiskExplanation,
    ScenarioRun,
    YieldPrediction,
)
from app.models.audit import AuditEvent
from app.models.borrower import Borrower
from app.models.crop_cycle import CropCycle
from app.models.institution import Institution
from app.models.user import User


def get_auth_headers(client: TestClient, email: str = "analyst@fin03.local") -> dict:
    """Helper to authenticate and return authorization headers."""
    login_rate_limiter.reset()
    res = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# 1. API-024: Yield Inference Service Interface Tests
# ---------------------------------------------------------------------------

def test_yield_prediction_contract_and_inference(seeded_client: TestClient, seeded_db_session: Session):
    """API-024: Test ML crop-yield inference contract compliance and DB persistence."""
    headers = get_auth_headers(seeded_client, "analyst@fin03.local")
    crop_cycle = seeded_db_session.query(CropCycle).filter(CropCycle.crop_code == "WHEAT").first()
    assert crop_cycle is not None

    req_payload = {
        "crop_cycle_id": str(crop_cycle.id),
        "target": "yield_per_area",
        "prediction_horizon": {
            "start": "2026-11-01",
            "end": "2027-03-15",
        },
        "features": {
            "ndvi_mean": 0.62,
            "soil_moisture": 0.30,
            "rainfall_deficit_pct": 0.05,
        },
        "feature_schema_version": "1.0",
    }

    res = seeded_client.post("/api/v1/yield-predictions", json=req_payload, headers=headers)
    assert res.status_code == 201
    data = res.json()

    # Verify response schema contract
    assert data["target"] == "yield_per_area"
    assert data["unit"] == "kg/hectare"
    assert data["quality_status"] == "VALID"
    assert data["value"] > 0
    assert "model_name" in data
    assert "model_version" in data
    assert "prediction_timestamp" in data
    assert "uncertainty" in data
    assert data["uncertainty"]["method"] == "conformal_residual_quantile"
    assert len(data["limitations"]) > 0
    assert len(data["explanation"]) > 0

    # Verify DB persistence
    pred_db = seeded_db_session.query(YieldPrediction).filter(YieldPrediction.id == uuid.UUID(data["id"])).first()
    assert pred_db is not None
    assert float(pred_db.value) == data["value"]


def test_yield_prediction_nonexistent_cycle(seeded_client: TestClient):
    """API-024: Nonexistent crop cycle returns 404."""
    headers = get_auth_headers(seeded_client, "analyst@fin03.local")
    req_payload = {
        "crop_cycle_id": str(uuid.uuid4()),
        "target": "yield_per_area",
        "prediction_horizon": {"start": "2026-11-01", "end": "2027-03-15"},
        "features": {},
    }
    res = seeded_client.post("/api/v1/yield-predictions", json=req_payload, headers=headers)
    assert res.status_code == 404


# ---------------------------------------------------------------------------
# 2. API-025: Farm Income & Cash Flow Projection Tests
# ---------------------------------------------------------------------------

def test_farm_income_estimation_arithmetic(seeded_client: TestClient, seeded_db_session: Session):
    """API-025: Test deterministic farm income and IADS calculation with unit accuracy."""
    headers = get_auth_headers(seeded_client, "officer@fin03.local")
    crop_cycle = seeded_db_session.query(CropCycle).filter(CropCycle.crop_code == "WHEAT").first()
    assert crop_cycle is not None

    req_payload = {
        "crop_cycle_id": str(crop_cycle.id),
        "predicted_yield_per_area": 3200.0,
        "yield_unit": "kg/hectare",
        "area_value": 2.0,
        "area_unit": "hectare",
        "expected_price_per_unit": 25.0,
        "price_unit": "INR/kg",
        "post_harvest_loss_pct": 0.05,
        "production_costs": 35000.0,
        "other_expenses": 5000.0,
        "other_household_income": 10000.0,
        "debt_service_obligations": 0.0,
        "currency": "INR",
        "assumptions_version": "1.0",
    }

    # Expected math:
    # total_yield = 3200.0 * 2.0 = 6400.0 kg
    # saleable_yield = 6400.0 * 0.95 = 6080.0 kg
    # gross_revenue = 6080.0 * 25.0 = 152000.0 INR
    # net_farm_income = 152000.0 - 35000.0 - 5000.0 = 112000.0 INR
    # IADS = 112000.0 + 10000.0 - 0.0 = 122000.0 INR

    res = seeded_client.post("/api/v1/income-estimates", json=req_payload, headers=headers)
    assert res.status_code == 201
    data = res.json()

    assert data["gross_revenue"] == 152000.0
    assert data["net_farm_income"] == 112000.0
    assert data["income_available_for_debt_service"] == 122000.0
    assert data["currency"] == "INR"

    # Verify DB persistence
    inc_db = seeded_db_session.query(IncomeEstimate).filter(IncomeEstimate.id == uuid.UUID(data["id"])).first()
    assert inc_db is not None
    assert float(inc_db.gross_revenue) == 152000.0
    assert float(inc_db.income_available_for_debt_service) == 122000.0


# ---------------------------------------------------------------------------
# 3. API-026: Climate-Aware Credit Assessment Pipeline Tests
# ---------------------------------------------------------------------------

def test_credit_assessment_pipeline_and_regulatory_gate(seeded_client: TestClient, seeded_db_session: Session):
    """API-026: Test assessment generation, DSCR, and STRICT REGULATORY GATE (repayment_probability = None, pd_status = NOT_AVAILABLE)."""
    headers = get_auth_headers(seeded_client, "officer@fin03.local")
    borrower = seeded_db_session.query(Borrower).filter(Borrower.external_ref == "CUST-MH-2026-001").first()
    crop_cycle = seeded_db_session.query(CropCycle).filter(CropCycle.crop_code == "WHEAT").first()
    assert borrower is not None and crop_cycle is not None

    req_payload = {
        "borrower_id": str(borrower.id),
        "crop_cycle_id": str(crop_cycle.id),
        "trigger_reason": "INITIAL_APPLICATION",
        "expected_market_price": 26.0,
        "estimated_production_cost": 30000.0,
    }

    res = seeded_client.post("/api/v1/assessments", json=req_payload, headers=headers)
    assert res.status_code == 201
    data = res.json()

    # 1. MANDATORY REGULATORY GOVERNANCE GATE ASSERTION
    assert data["repayment_probability"] is None, "CRITICAL: Repayment probability must be strictly null without validated labels!"
    assert data["pd_status"] == "NOT_AVAILABLE", "CRITICAL: pd_status must be NOT_AVAILABLE!"

    # 2. Financial Metrics & Status
    assert data["status"] == "COMPLETED"
    assert data["result_type"] == "ASSESSMENT"
    assert data["risk_band"] in ("LOW", "MEDIUM", "HIGH", "SEVERE")
    assert data["dscr"] is not None and data["dscr"] > 0
    assert data["snapshot_json"] is not None
    assert "income_estimate" in data["snapshot_json"]
    assert "repayment_probability_gate" in data["snapshot_json"]

    assessment_id = uuid.UUID(data["id"])

    # 3. Verify Explanations automatically generated (F16)
    explanations = seeded_db_session.query(RiskExplanation).filter(RiskExplanation.assessment_id == assessment_id).all()
    assert len(explanations) >= 4
    codes = [e.factor_code for e in explanations]
    assert "FIN_DSCR_CAPACITY" in codes
    assert "AGRO_YIELD_PERFORMANCE" in codes
    assert "CLIMATE_DROUGHT_EXPOSURE" in codes

    # 4. Verify Audit Event logged (O06)
    audit = (
        seeded_db_session.query(AuditEvent)
        .filter(
            AuditEvent.object_type == "CREDIT_ASSESSMENT",
            AuditEvent.object_id == assessment_id,
            AuditEvent.action == "CREATE_ASSESSMENT",
        )
        .first()
    )
    assert audit is not None


def test_credit_assessment_idempotency(seeded_client: TestClient, seeded_db_session: Session):
    """API-026: Idempotent assessment creation with Idempotency-Key header returns identical record."""
    headers = get_auth_headers(seeded_client, "analyst@fin03.local")
    headers["Idempotency-Key"] = "IDEM-TEST-ALPHA-001"

    borrower = seeded_db_session.query(Borrower).first()
    crop_cycle = seeded_db_session.query(CropCycle).first()

    req_payload = {
        "borrower_id": str(borrower.id),
        "crop_cycle_id": str(crop_cycle.id),
        "trigger_reason": "INITIAL_APPLICATION",
    }

    # First call
    res1 = seeded_client.post("/api/v1/assessments", json=req_payload, headers=headers)
    assert res1.status_code == 201
    id1 = res1.json()["id"]

    # Second call with exact same Idempotency-Key
    res2 = seeded_client.post("/api/v1/assessments", json=req_payload, headers=headers)
    assert res2.status_code == 201
    id2 = res2.json()["id"]

    # Must return the same assessment resource
    assert id1 == id2


# ---------------------------------------------------------------------------
# 4. API-027: Assessment Retrieval Tests
# ---------------------------------------------------------------------------

def test_get_assessment_by_id(seeded_client: TestClient, seeded_db_session: Session):
    """API-027: Scoped retrieval of assessment and verification of null PD."""
    headers = get_auth_headers(seeded_client, "officer@fin03.local")
    borrower = seeded_db_session.query(Borrower).first()
    crop_cycle = seeded_db_session.query(CropCycle).first()

    create_res = seeded_client.post(
        "/api/v1/assessments",
        json={"borrower_id": str(borrower.id), "crop_cycle_id": str(crop_cycle.id)},
        headers=headers,
    )
    assert create_res.status_code == 201
    assessment_id = create_res.json()["id"]

    get_res = seeded_client.get(f"/api/v1/assessments/{assessment_id}", headers=headers)
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["id"] == assessment_id
    assert data["repayment_probability"] is None
    assert data["pd_status"] == "NOT_AVAILABLE"

    # Nonexistent ID returns 404
    bad_res = seeded_client.get(f"/api/v1/assessments/{uuid.uuid4()}", headers=headers)
    assert bad_res.status_code == 404


# ---------------------------------------------------------------------------
# 5. API-028 & API-029: Climate Stress-Testing Scenarios Tests
# ---------------------------------------------------------------------------

def test_climate_stress_scenario_execution_and_listing(seeded_client: TestClient, seeded_db_session: Session):
    """API-028 & API-029: Run climate stress scenarios (DROUGHT_SEVERE, HEAT_STRESS) and list runs."""
    headers = get_auth_headers(seeded_client, "analyst@fin03.local")
    borrower = seeded_db_session.query(Borrower).first()
    crop_cycle = seeded_db_session.query(CropCycle).first()

    # Create baseline assessment
    create_res = seeded_client.post(
        "/api/v1/assessments",
        json={"borrower_id": str(borrower.id), "crop_cycle_id": str(crop_cycle.id)},
        headers=headers,
    )
    assessment_id = create_res.json()["id"]

    # 1. Run DROUGHT_SEVERE scenario (API-028)
    scenario_req = {
        "scenario_code": "DROUGHT_SEVERE",
        "yield_delta_pct": -0.35,
        "cost_delta_pct": 0.10,
    }
    scen_res = seeded_client.post(
        f"/api/v1/assessments/{assessment_id}/scenarios",
        json=scenario_req,
        headers=headers,
    )
    assert scen_res.status_code == 201
    scen_data = scen_res.json()
    assert scen_data["scenario_code"] == "DROUGHT_SEVERE"
    assert scen_data["yield_delta_pct"] == -0.35
    assert scen_data["evidence_status"] == "EVIDENCE_BACKED"
    assert scen_data["result_json"]["stressed_dscr"] is not None

    # 2. Run HEAT_STRESS scenario
    scen_res2 = seeded_client.post(
        f"/api/v1/assessments/{assessment_id}/scenarios",
        json={"scenario_code": "HEAT_STRESS"},
        headers=headers,
    )
    assert scen_res2.status_code == 201

    # 3. List scenarios (API-029)
    list_res = seeded_client.get(f"/api/v1/assessments/{assessment_id}/scenarios", headers=headers)
    assert list_res.status_code == 200
    scenarios = list_res.json()
    assert len(scenarios) >= 2
    codes = [s["scenario_code"] for s in scenarios]
    assert "DROUGHT_SEVERE" in codes
    assert "HEAT_STRESS" in codes


# ---------------------------------------------------------------------------
# 6. API-030: Risk Explanations Retrieval Tests
# ---------------------------------------------------------------------------

def test_risk_explanations_retrieval(seeded_client: TestClient, seeded_db_session: Session):
    """API-030: Retrieve ranked risk driver factor contributions and caveats."""
    headers = get_auth_headers(seeded_client, "analyst@fin03.local")
    borrower = seeded_db_session.query(Borrower).first()
    crop_cycle = seeded_db_session.query(CropCycle).first()

    create_res = seeded_client.post(
        "/api/v1/assessments",
        json={"borrower_id": str(borrower.id), "crop_cycle_id": str(crop_cycle.id)},
        headers=headers,
    )
    assessment_id = create_res.json()["id"]

    res = seeded_client.get(f"/api/v1/assessments/{assessment_id}/explanations", headers=headers)
    assert res.status_code == 200
    explanations = res.json()
    assert len(explanations) >= 4

    for exp in explanations:
        assert "factor_code" in exp
        assert "contribution_value" in exp
        assert exp["direction"] in ("POSITIVE", "NEGATIVE", "NEUTRAL")
        assert exp["explanation_type"] in ("MODEL_FEATURE", "OBSERVED_FACT", "SCENARIO_DELTA")
        assert "unit" in exp
        assert exp["caveat"] is not None


# ---------------------------------------------------------------------------
# 7. API-031: Borrower Assessment History Timeline Tests
# ---------------------------------------------------------------------------

def test_borrower_assessment_history_timeline(seeded_client: TestClient, seeded_db_session: Session):
    """API-031: Verify immutable chronological assessment history for borrower."""
    headers = get_auth_headers(seeded_client, "officer@fin03.local")
    borrower = seeded_db_session.query(Borrower).first()
    crop_cycle = seeded_db_session.query(CropCycle).first()

    # Create 2 assessments with different trigger reasons
    seeded_client.post(
        "/api/v1/assessments",
        json={"borrower_id": str(borrower.id), "crop_cycle_id": str(crop_cycle.id), "trigger_reason": "INITIAL_APPLICATION"},
        headers=headers,
    )
    seeded_client.post(
        "/api/v1/assessments",
        json={"borrower_id": str(borrower.id), "crop_cycle_id": str(crop_cycle.id), "trigger_reason": "MONITORING_REASSESSMENT"},
        headers=headers,
    )

    res = seeded_client.get(f"/api/v1/borrowers/{borrower.id}/assessment-history", headers=headers)
    assert res.status_code == 200
    history = res.json()
    assert len(history) >= 2

    # Verify order is chronological descending
    timestamps = [h["created_at"] for h in history]
    assert timestamps == sorted(timestamps, reverse=True)

    # Verify every historical item respects regulatory PD gate
    for item in history:
        assert item["repayment_probability"] is None
        assert item["pd_status"] == "NOT_AVAILABLE"
