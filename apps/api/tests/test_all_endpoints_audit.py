"""Exhaustive Audit and Verification Suite covering 100% of API endpoints in FIN-03 Backend."""

import uuid
from datetime import date
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.rate_limit import login_rate_limiter
from app.models.borrower import Borrower
from app.models.crop_cycle import CropCycle
from app.models.farm import Farm
from app.models.loan import Loan


def get_token(client: TestClient, email: str) -> str:
    login_rate_limiter.reset()
    res = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]


def test_exhaustive_all_endpoints_audit(seeded_client: TestClient, seeded_db_session: Session):
    """Systematically execute, inspect, and validate all 43 registered API endpoints in the backend."""
    officer_token = get_token(seeded_client, "officer@fin03.local")
    analyst_token = get_token(seeded_client, "analyst@fin03.local")
    admin_token = get_token(seeded_client, "admin@fin03.local")

    officer_h = {"Authorization": f"Bearer {officer_token}"}
    analyst_h = {"Authorization": f"Bearer {analyst_token}"}
    admin_h = {"Authorization": f"Bearer {admin_token}"}

    # -------------------------------------------------------------
    # 1. Health Endpoints
    # -------------------------------------------------------------
    r_live = seeded_client.get("/api/v1/health/live")
    assert r_live.status_code == 200
    assert r_live.json()["status"] == "ok"

    r_ready = seeded_client.get("/api/v1/health/ready")
    assert r_ready.status_code == 200
    assert r_ready.json()["database"] == "connected"

    # -------------------------------------------------------------
    # 2. Authentication Endpoints
    # -------------------------------------------------------------
    r_me = seeded_client.get("/api/v1/auth/me", headers=officer_h)
    assert r_me.status_code == 200
    assert r_me.json()["email"] == "officer@fin03.local"

    r_logout = seeded_client.post("/api/v1/auth/logout", headers=officer_h)
    assert r_logout.status_code == 200

    # -------------------------------------------------------------
    # 3. Institutions, Branches & Users
    # -------------------------------------------------------------
    r_inst = seeded_client.get("/api/v1/institutions/current", headers=officer_h)
    assert r_inst.status_code == 200
    inst_id = r_inst.json()["id"]

    r_branches = seeded_client.get("/api/v1/branches", headers=officer_h)
    assert r_branches.status_code == 200
    branch_id = r_me.json()["branches"][0]["branch_id"]

    r_users = seeded_client.get("/api/v1/users", headers=admin_h)
    assert r_users.status_code == 200
    user_id = r_users.json()[0]["id"]

    r_invite = seeded_client.post(
        "/api/v1/users/invitations",
        json={
            "email": f"audit_new_{uuid.uuid4().hex[:6]}@example.com",
            "full_name": "Audit Test User",
            "roles": ["LOAN_OFFICER"],
            "branch_ids": [branch_id],
        },
        headers=admin_h,
    )
    assert r_invite.status_code == 201

    r_roles = seeded_client.patch(
        f"/api/v1/users/{user_id}/roles",
        json={"roles": ["LOAN_OFFICER", "RISK_ANALYST"]},
        headers=admin_h,
    )
    assert r_roles.status_code == 200

    # -------------------------------------------------------------
    # 4. Borrowers
    # -------------------------------------------------------------
    ext_ref = f"BORR-AUDIT-{uuid.uuid4().hex[:6]}"
    r_create_borr = seeded_client.post(
        "/api/v1/borrowers",
        json={
            "branch_id": branch_id,
            "external_ref": ext_ref,
            "display_name": "Audit Farmer",
            "contact_phone": "+91-9800012345",
        },
        headers=officer_h,
    )
    assert r_create_borr.status_code == 201
    borrower_id = r_create_borr.json()["id"]

    r_list_borr = seeded_client.get("/api/v1/borrowers", headers=officer_h)
    assert r_list_borr.status_code == 200

    r_get_borr = seeded_client.get(f"/api/v1/borrowers/{borrower_id}", headers=officer_h)
    assert r_get_borr.status_code == 200
    assert r_get_borr.json()["display_name"] == "Audit Farmer"

    r_patch_borr = seeded_client.patch(
        f"/api/v1/borrowers/{borrower_id}",
        json={"display_name": "Audit Farmer Updated"},
        headers=officer_h,
    )
    assert r_patch_borr.status_code == 200
    assert r_patch_borr.json()["display_name"] == "Audit Farmer Updated"

    # -------------------------------------------------------------
    # 5. Farms & Crop Cycles
    # -------------------------------------------------------------
    r_create_farm = seeded_client.post(
        "/api/v1/farms",
        json={
            "borrower_id": borrower_id,
            "name": "Audit Test Farm",
            "area_value": 3.0,
            "area_unit": "hectare",
            "latitude": 17.65,
            "longitude": 75.90,
            "plots": [
                {"name": "Audit Plot 1", "area_value": 2.0, "area_unit": "hectare", "soil_type": "Clay"},
                {"name": "Audit Plot 2", "area_value": 1.0, "area_unit": "hectare", "soil_type": "Loam"},
            ],
        },
        headers=officer_h,
    )
    assert r_create_farm.status_code == 201
    farm_id = r_create_farm.json()["id"]
    plot_id = r_create_farm.json()["plots"][0]["id"]

    r_list_farms = seeded_client.get(f"/api/v1/farms?borrower_id={borrower_id}", headers=officer_h)
    assert r_list_farms.status_code == 200

    r_get_farm = seeded_client.get(f"/api/v1/farms/{farm_id}", headers=officer_h)
    assert r_get_farm.status_code == 200

    r_create_cycle = seeded_client.post(
        f"/api/v1/farms/{farm_id}/crop-cycles",
        json={
            "plot_id": plot_id,
            "crop_code": "SOYBEAN",
            "variety": "JS-335",
            "season": "KHARIF",
            "sowing_date": "2026-06-15",
            "expected_harvest_date": "2026-10-15",
            "area_value": 2.0,
            "area_unit": "hectare",
            "irrigation_type": "CANAL",
            "status": "GROWING",
        },
        headers=officer_h,
    )
    assert r_create_cycle.status_code == 201
    cycle_id = r_create_cycle.json()["id"]

    r_get_cycle = seeded_client.get(f"/api/v1/crop-cycles/{cycle_id}", headers=officer_h)
    assert r_get_cycle.status_code == 200
    assert r_get_cycle.json()["crop_code"] == "SOYBEAN"

    # -------------------------------------------------------------
    # 6. Loans & Repayments
    # -------------------------------------------------------------
    r_loan_app = seeded_client.post(
        "/api/v1/loan-applications",
        json={
            "borrower_id": borrower_id,
            "amount": 200000.0,
            "currency": "INR",
            "purpose": "Fertilizer and seasonal inputs",
        },
        headers=officer_h,
    )
    assert r_loan_app.status_code == 201
    app_id = r_loan_app.json()["id"]

    r_get_app = seeded_client.get(f"/api/v1/loan-applications/{app_id}", headers=officer_h)
    assert r_get_app.status_code == 200

    # Retrieve existing seeded loan for schedule & event test
    existing_loan = seeded_db_session.query(Loan).first()
    r_sched = seeded_client.post(
        f"/api/v1/loans/{existing_loan.id}/repayment-schedules",
        json={
            "version": 2,
            "installments": [
                {
                    "installment_number": 1,
                    "due_date": "2027-05-15",
                    "principal_component": 150000.0,
                    "interest_component": 7500.0,
                    "amount_due": 157500.0,
                    "currency": "INR",
                }
            ],
        },
        headers=officer_h,
    )
    assert r_sched.status_code == 201

    r_event = seeded_client.post(
        f"/api/v1/loans/{existing_loan.id}/repayment-events",
        json={
            "amount_paid": 50000.0,
            "currency": "INR",
            "source_id": f"NEFT-AUDIT-{uuid.uuid4().hex[:8]}",
        },
        headers=officer_h,
    )
    assert r_event.status_code == 201

    # -------------------------------------------------------------
    # 7. Observations & Market Prices
    # -------------------------------------------------------------
    r_obs = seeded_client.get(f"/api/v1/crop-cycles/{cycle_id}/observations", headers=officer_h)
    assert r_obs.status_code == 200

    r_prices = seeded_client.get("/api/v1/market-prices", headers=officer_h)
    assert r_prices.status_code == 200

    # -------------------------------------------------------------
    # 8. Data Imports
    # -------------------------------------------------------------
    r_import = seeded_client.post(
        "/api/v1/data-imports",
        json={"dataset_type": "weather", "source": "IMD_OBSERVATION_IMPORT"},
        headers=admin_h,
    )
    assert r_import.status_code == 202
    job_id = r_import.json()["id"]

    r_get_import = seeded_client.get(f"/api/v1/data-imports/{job_id}", headers=admin_h)
    assert r_get_import.status_code == 200

    # -------------------------------------------------------------
    # 9. AI/ML Inference & Income Estimates
    # -------------------------------------------------------------
    r_yield = seeded_client.post(
        "/api/v1/yield-predictions",
        json={
            "crop_cycle_id": cycle_id,
            "target": "yield_per_area",
            "prediction_horizon": {"start": "2026-06-15", "end": "2026-10-15"},
            "features": {"ndvi_mean": 0.58, "soil_moisture": 0.28},
        },
        headers=analyst_h,
    )
    assert r_yield.status_code == 201
    assert r_yield.json()["value"] > 0

    r_income = seeded_client.post(
        "/api/v1/income-estimates",
        json={
            "crop_cycle_id": cycle_id,
            "predicted_yield_per_area": 1800.0,
            "expected_price_per_unit": 45.0,
            "production_costs": 25000.0,
            "other_household_income": 12000.0,
        },
        headers=officer_h,
    )
    assert r_income.status_code == 201
    assert r_income.json()["income_available_for_debt_service"] > 0

    # -------------------------------------------------------------
    # 10. Credit Assessments & Policy Enforcement
    # -------------------------------------------------------------
    r_assess = seeded_client.post(
        "/api/v1/assessments",
        json={"borrower_id": borrower_id, "crop_cycle_id": cycle_id},
        headers=officer_h,
    )
    assert r_assess.status_code == 201
    assess_data = r_assess.json()
    assessment_id = assess_data["id"]

    # Critical regulatory check:
    assert assess_data["repayment_probability"] is None
    assert assess_data["pd_status"] == "NOT_AVAILABLE"

    r_get_assess = seeded_client.get(f"/api/v1/assessments/{assessment_id}", headers=officer_h)
    assert r_get_assess.status_code == 200
    assert r_get_assess.json()["repayment_probability"] is None

    # -------------------------------------------------------------
    # 11. Climate Scenarios & Explanations
    # -------------------------------------------------------------
    r_scen = seeded_client.post(
        f"/api/v1/assessments/{assessment_id}/scenarios",
        json={"scenario_code": "DROUGHT_SEVERE", "yield_delta_pct": -0.35},
        headers=analyst_h,
    )
    assert r_scen.status_code == 201

    r_list_scen = seeded_client.get(f"/api/v1/assessments/{assessment_id}/scenarios", headers=analyst_h)
    assert r_list_scen.status_code == 200
    assert len(r_list_scen.json()) >= 1

    r_exp = seeded_client.get(f"/api/v1/assessments/{assessment_id}/explanations", headers=analyst_h)
    assert r_exp.status_code == 200
    assert len(r_exp.json()) >= 4

    r_hist = seeded_client.get(f"/api/v1/borrowers/{borrower_id}/assessment-history", headers=officer_h)
    assert r_hist.status_code == 200
    assert len(r_hist.json()) >= 1

    # -------------------------------------------------------------
    # 12. Assessment Reports & Exports
    # -------------------------------------------------------------
    r_rep = seeded_client.post(
        f"/api/v1/assessments/{assessment_id}/reports",
        json={"format": "MARKDOWN"},
        headers=officer_h,
    )
    assert r_rep.status_code == 201
    report_id = r_rep.json()["report_id"]

    r_get_rep = seeded_client.get(f"/api/v1/reports/{report_id}", headers=officer_h)
    assert r_get_rep.status_code == 200

    r_dl_rep = seeded_client.get(f"/api/v1/reports/{report_id}/download", headers=officer_h)
    assert r_dl_rep.status_code == 200
    assert "Agricultural Credit Risk Assessment" in r_dl_rep.text

    # -------------------------------------------------------------
    # 13. Alerts & Dynamic Monitoring
    # -------------------------------------------------------------
    r_dyn = seeded_client.post(
        f"/api/v1/assessments/{assessment_id}/dynamic-trigger?reason=AUDIT_TRIGGER",
        headers=analyst_h,
    )
    assert r_dyn.status_code == 201
    assert r_dyn.json()["result_type"] == "REASSESSMENT"

    r_alerts = seeded_client.get("/api/v1/alerts", headers=officer_h)
    assert r_alerts.status_code == 200

    if r_alerts.json():
        first_alert_id = r_alerts.json()[0]["id"]
        r_patch_alert = seeded_client.patch(
            f"/api/v1/alerts/{first_alert_id}",
            json={"status": "RESOLVED"},
            headers=officer_h,
        )
        assert r_patch_alert.status_code == 200
        assert r_patch_alert.json()["status"] == "RESOLVED"

    # -------------------------------------------------------------
    # 14. Data Sources & Background Worker Execution
    # -------------------------------------------------------------
    r_ds = seeded_client.get("/api/v1/data-sources", headers=analyst_h)
    assert r_ds.status_code == 200
    assert len(r_ds.json()) >= 3

    r_worker = seeded_client.post("/api/v1/jobs/run-pending?max_jobs=10", headers=admin_h)
    assert r_worker.status_code == 200
    assert "processed_jobs" in r_worker.json()
