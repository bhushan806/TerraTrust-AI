"""Comprehensive tests for Phase 7 Background Workers, Dynamic Monitoring, and Early Warning Alerts."""

import uuid
from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.rate_limit import login_rate_limiter
from app.models.assessment import Alert, CreditAssessment
from app.models.borrower import Borrower
from app.models.crop_cycle import CropCycle
from app.models.governance import DataSource
from app.models.job import Job
from app.services.alert_engine import evaluate_risk_alerts


def get_auth_headers(client: TestClient, email: str = "officer@fin03.local") -> dict:
    """Helper to authenticate and return authorization headers."""
    login_rate_limiter.reset()
    res = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def create_sample_assessment(client: TestClient, seeded_db_session: Session, headers: dict) -> str:
    """Helper to generate a baseline credit assessment."""
    borrower = seeded_db_session.query(Borrower).first()
    crop_cycle = seeded_db_session.query(CropCycle).first()
    res = client.post(
        "/api/v1/assessments",
        json={"borrower_id": str(borrower.id), "crop_cycle_id": str(crop_cycle.id)},
        headers=headers,
    )
    assert res.status_code == 201
    return res.json()["id"]


# ---------------------------------------------------------------------------
# 1. Early Warning Alerts & Threshold Evaluation (O04, API-D03, API-D04)
# ---------------------------------------------------------------------------

def test_early_warning_alert_evaluation_and_listing(seeded_client: TestClient, seeded_db_session: Session):
    """API-D03: Test automatic early warning alert generation and listing."""
    headers = get_auth_headers(seeded_client, "analyst@fin03.local")
    assessment_id = create_sample_assessment(seeded_client, seeded_db_session, headers)
    assessment = seeded_db_session.query(CreditAssessment).filter(CreditAssessment.id == uuid.UUID(assessment_id)).first()

    # Artificially set a tight DSCR (1.1) to trigger alert
    assessment.dscr = 1.1
    seeded_db_session.commit()

    created_alerts = evaluate_risk_alerts(seeded_db_session, assessment)
    assert len(created_alerts) > 0

    # Query GET /api/v1/alerts
    res = seeded_client.get("/api/v1/alerts", headers=headers)
    assert res.status_code == 200
    alerts = res.json()
    assert len(alerts) > 0

    alert_codes = [a["rule_code"] for a in alerts]
    assert "FIN_DSCR_TIGHT" in alert_codes or "AGRO_YIELD_DEFICIT" in alert_codes


def test_alert_status_update_workflow(seeded_client: TestClient, seeded_db_session: Session):
    """API-D04: Test acknowledging and resolving an early warning alert."""
    headers = get_auth_headers(seeded_client, "officer@fin03.local")
    borrower = seeded_db_session.query(Borrower).first()

    # Create an alert manually
    alert = Alert(
        id=uuid.uuid4(),
        institution_id=borrower.institution_id,
        rule_code="TEST_HAZARD_ALERT",
        severity="WARNING",
        message="Manual test climate hazard notification",
        status="ACTIVE",
    )
    seeded_db_session.add(alert)
    seeded_db_session.commit()

    # 1. Acknowledge
    ack_res = seeded_client.patch(
        f"/api/v1/alerts/{alert.id}",
        json={"status": "ACKNOWLEDGED"},
        headers=headers,
    )
    assert ack_res.status_code == 200
    assert ack_res.json()["status"] == "ACKNOWLEDGED"

    # 2. Resolve
    res_res = seeded_client.patch(
        f"/api/v1/alerts/{alert.id}",
        json={"status": "RESOLVED"},
        headers=headers,
    )
    assert res_res.status_code == 200
    assert res_res.json()["status"] == "RESOLVED"
    assert res_res.json()["resolved_at"] is not None


# ---------------------------------------------------------------------------
# 2. Data Sources Registry & Governance (O08, API-D08)
# ---------------------------------------------------------------------------

def test_list_data_sources(seeded_client: TestClient):
    """API-D08: List registered meteorological, satellite, and market providers."""
    headers = get_auth_headers(seeded_client, "analyst@fin03.local")
    res = seeded_client.get("/api/v1/data-sources", headers=headers)
    assert res.status_code == 200
    sources = res.json()
    assert len(sources) >= 3
    names = [s["name"] for s in sources]
    assert any("IMD" in n for n in names)
    assert any("Sentinel" in n for n in names)
    assert any("AGMARKNET" in n for n in names)


# ---------------------------------------------------------------------------
# 3. Asynchronous Job Worker Execution Engine
# ---------------------------------------------------------------------------

def test_background_job_worker_execution(seeded_client: TestClient, seeded_db_session: Session):
    """Test background queue processing of pending jobs."""
    admin_headers = get_auth_headers(seeded_client, "admin@fin03.local")
    borrower = seeded_db_session.query(Borrower).first()

    # Enqueue a dummy data import job
    job = Job(
        id=uuid.uuid4(),
        institution_id=borrower.institution_id,
        type="DATA_IMPORT",
        status="QUEUED",
        payload_json={"filename": "weather_data.csv", "rows": [1, 2, 3]},
        attempts=0,
        available_at=datetime.now(timezone.utc),
    )
    seeded_db_session.add(job)
    seeded_db_session.commit()

    # Trigger worker execution
    worker_res = seeded_client.post("/api/v1/jobs/run-pending?max_jobs=10", headers=admin_headers)
    assert worker_res.status_code == 200
    stats = worker_res.json()
    assert stats["processed_jobs"] >= 1

    # Verify job status updated to COMPLETED in DB
    seeded_db_session.refresh(job)
    assert job.status == "COMPLETED"
    assert job.completed_at is not None
    assert job.result_json is not None


# ---------------------------------------------------------------------------
# 4. F17: Dynamic Reassessment Trigger
# ---------------------------------------------------------------------------

def test_dynamic_reassessment_trigger(seeded_client: TestClient, seeded_db_session: Session):
    """F17: Test dynamic automated reassessment upon environmental or price update."""
    headers = get_auth_headers(seeded_client, "analyst@fin03.local")
    assessment_id = create_sample_assessment(seeded_client, seeded_db_session, headers)

    res = seeded_client.post(
        f"/api/v1/assessments/{assessment_id}/dynamic-trigger?reason=MONSOON_DEFICIT_UPDATE",
        headers=headers,
    )
    assert res.status_code == 201
    data = res.json()

    assert data["result_type"] == "REASSESSMENT"
    assert data["trigger_reason"] == "MONSOON_DEFICIT_UPDATE"
    assert data["repayment_probability"] is None
    assert data["pd_status"] == "NOT_AVAILABLE"
