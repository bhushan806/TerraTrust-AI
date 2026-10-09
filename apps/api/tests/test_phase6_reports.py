"""Comprehensive tests for Phase 6 Credit Assessment Reporting, Export, and Job Tracking (API-032, API-033)."""

import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.rate_limit import login_rate_limiter
from app.models.assessment import CreditAssessment
from app.models.audit import AuditEvent
from app.models.borrower import Borrower
from app.models.crop_cycle import CropCycle
from app.models.job import Job


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
# 1. API-032: Create Assessment Report Tests
# ---------------------------------------------------------------------------

def test_create_assessment_report(seeded_client: TestClient, seeded_db_session: Session):
    """API-032: Generate credit memorandum report with snapshot consistency and regulatory gates."""
    headers = get_auth_headers(seeded_client, "officer@fin03.local")
    assessment_id = create_sample_assessment(seeded_client, seeded_db_session, headers)

    report_payload = {
        "format": "MARKDOWN",
        "include_scenarios": True,
        "include_explanations": True,
        "report_title": "Agricultural Credit Committee Memorandum",
    }

    res = seeded_client.post(
        f"/api/v1/assessments/{assessment_id}/reports",
        json=report_payload,
        headers=headers,
    )
    assert res.status_code == 201
    data = res.json()

    assert "report_id" in data
    assert data["assessment_id"] == assessment_id
    assert data["status"] == "COMPLETED"
    assert data["format"] == "MARKDOWN"
    assert "download_url" in data
    assert data["summary"] is not None

    summary = data["summary"]
    assert summary["repayment_probability_status"] == "NOT_AVAILABLE"
    assert "disclaimer" in summary
    assert "content" in data and len(data["content"]) > 100

    report_id = uuid.UUID(data["report_id"])

    # Verify Job record persisted in DB
    job = seeded_db_session.query(Job).filter(Job.id == report_id).first()
    assert job is not None
    assert job.type == "REPORT_GENERATION"
    assert job.status == "COMPLETED"

    # Verify Audit Event logged in DB
    audit = (
        seeded_db_session.query(AuditEvent)
        .filter(
            AuditEvent.object_type == "REPORT",
            AuditEvent.object_id == report_id,
            AuditEvent.action == "GENERATE_REPORT",
        )
        .first()
    )
    assert audit is not None


def test_create_report_nonexistent_assessment(seeded_client: TestClient):
    """API-032: Nonexistent assessment ID returns 404."""
    headers = get_auth_headers(seeded_client, "officer@fin03.local")
    res = seeded_client.post(
        f"/api/v1/assessments/{uuid.uuid4()}/reports",
        json={"format": "JSON"},
        headers=headers,
    )
    assert res.status_code == 404


# ---------------------------------------------------------------------------
# 2. API-033: Get Report Status and Download Tests
# ---------------------------------------------------------------------------

def test_get_report_status_and_download(seeded_client: TestClient, seeded_db_session: Session):
    """API-033: Retrieve report metadata and download raw report stream."""
    headers = get_auth_headers(seeded_client, "analyst@fin03.local")
    assessment_id = create_sample_assessment(seeded_client, seeded_db_session, headers)

    create_res = seeded_client.post(
        f"/api/v1/assessments/{assessment_id}/reports",
        json={"format": "MARKDOWN"},
        headers=headers,
    )
    assert create_res.status_code == 201
    report_id = create_res.json()["report_id"]

    # 1. Get status / JSON response
    status_res = seeded_client.get(f"/api/v1/reports/{report_id}", headers=headers)
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["report_id"] == report_id
    assert status_data["status"] == "COMPLETED"

    # 2. Download via query param (?download=true)
    stream_res = seeded_client.get(f"/api/v1/reports/{report_id}?download=true", headers=headers)
    assert stream_res.status_code == 200
    assert "Content-Disposition" in stream_res.headers
    assert "attachment" in stream_res.headers["Content-Disposition"]
    assert "Agricultural Credit Risk Assessment" in stream_res.text

    # 3. Direct download endpoint (/reports/{id}/download)
    direct_res = seeded_client.get(f"/api/v1/reports/{report_id}/download", headers=headers)
    assert direct_res.status_code == 200
    assert "Content-Disposition" in direct_res.headers
    assert "attachment" in direct_res.headers["Content-Disposition"]

    # 4. Nonexistent report returns 404
    bad_res = seeded_client.get(f"/api/v1/reports/{uuid.uuid4()}", headers=headers)
    assert bad_res.status_code == 404
