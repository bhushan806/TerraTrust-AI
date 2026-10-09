"""Comprehensive tests for Phase 4 Core Business Modules and REST APIs."""

import datetime
from datetime import date, timezone
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.rate_limit import login_rate_limiter
from app.models.borrower import Borrower
from app.models.crop_cycle import CropCycle
from app.models.farm import Farm, Plot
from app.models.institution import Branch, Institution
from app.models.loan import Loan, LoanApplication
from app.models.market import MarketPrice
from app.models.observation import ClimateObservation, SatelliteObservation, SoilMoisture
from app.models.user import User


def get_auth_headers(client: TestClient, email: str = "officer@fin03.local") -> dict:
    """Helper to authenticate and return authorization headers."""
    login_rate_limiter.reset()
    res = client.post("/api/v1/auth/login", json={"email": email, "password": "password123"})
    assert res.status_code == 200
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------
# 1. Tenancy & User Administration (API-002 to API-006)
# ---------------------------------------------------------


def test_get_current_institution(seeded_client: TestClient):
    """API-002: Verify current institution profile retrieval."""
    headers = get_auth_headers(seeded_client, "officer@fin03.local")
    res = seeded_client.get("/api/v1/institutions/current", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Apex Rural Development Bank"
    assert data["status"] == "ACTIVE"


def test_list_branches(seeded_client: TestClient):
    """API-003: Verify listing of scoped branches."""
    headers = get_auth_headers(seeded_client, "analyst@fin03.local")
    res = seeded_client.get("/api/v1/branches", headers=headers)
    assert res.status_code == 200
    branches = res.json()
    assert len(branches) >= 2
    codes = [b["code"] for b in branches]
    assert "BR-SOL-01" in codes
    assert "BR-NSK-01" in codes


def test_list_users_authorization(seeded_client: TestClient):
    """API-004: Verify institution admin access and loan officer rejection."""
    officer_headers = get_auth_headers(seeded_client, "officer@fin03.local")
    res_forbidden = seeded_client.get("/api/v1/users", headers=officer_headers)
    assert res_forbidden.status_code == 403

    admin_headers = get_auth_headers(seeded_client, "admin@fin03.local")
    res_ok = seeded_client.get("/api/v1/users", headers=admin_headers)
    assert res_ok.status_code == 200
    users = res_ok.json()
    assert len(users) >= 3


def test_invite_user_and_update_roles(seeded_client: TestClient, seeded_db_session: Session):
    """API-005 & API-006: Invite user and update roles."""
    admin_headers = get_auth_headers(seeded_client, "admin@fin03.local")

    branch = seeded_db_session.query(Branch).filter_by(code="BR-SOL-01").first()
    assert branch is not None

    invite_payload = {
        "email": "new.officer@fin03.local",
        "full_name": "Kavita Patil",
        "roles": ["LOAN_OFFICER"],
        "branch_ids": [str(branch.id)],
    }
    invite_res = seeded_client.post("/api/v1/users/invitations", json=invite_payload, headers=admin_headers)
    assert invite_res.status_code == 201
    user_data = invite_res.json()
    user_id = user_data["id"]
    assert user_data["email"] == "new.officer@fin03.local"
    assert "LOAN_OFFICER" in user_data["roles"]

    dup_res = seeded_client.post("/api/v1/users/invitations", json=invite_payload, headers=admin_headers)
    assert dup_res.status_code == 409

    update_payload = {
        "roles": ["LOAN_OFFICER", "RISK_ANALYST"],
    }
    patch_res = seeded_client.patch(f"/api/v1/users/{user_id}/roles", json=update_payload, headers=admin_headers)
    assert patch_res.status_code == 200
    updated_data = patch_res.json()
    assert "RISK_ANALYST" in updated_data["roles"]
    assert "LOAN_OFFICER" in updated_data["roles"]


# ---------------------------------------------------------
# 2. Borrower Management (API-007 to API-010)
# ---------------------------------------------------------


def test_borrower_crud_lifecycle(seeded_client: TestClient, seeded_db_session: Session):
    """API-007, API-008, API-009, API-010: Borrower operations."""
    officer_headers = get_auth_headers(seeded_client, "officer@fin03.local")

    branch = seeded_db_session.query(Branch).filter_by(code="BR-SOL-01").first()

    # 1. Create borrower
    borrower_payload = {
        "branch_id": str(branch.id),
        "external_ref": "CUST-9999",
        "display_name": "Sunil Gaikwad",
        "contact_phone": "+919876543299",
        "contact_email": "sunil@example.com",
    }
    create_res = seeded_client.post("/api/v1/borrowers", json=borrower_payload, headers=officer_headers)
    assert create_res.status_code == 201
    borrower_data = create_res.json()
    borrower_id = borrower_data["id"]
    assert borrower_data["display_name"] == "Sunil Gaikwad"
    assert borrower_data["external_ref"] == "CUST-9999"

    # Duplicate external_ref returns 409
    dup_res = seeded_client.post("/api/v1/borrowers", json=borrower_payload, headers=officer_headers)
    assert dup_res.status_code == 409

    # 2. Get borrower by ID
    get_res = seeded_client.get(f"/api/v1/borrowers/{borrower_id}", headers=officer_headers)
    assert get_res.status_code == 200
    assert get_res.json()["external_ref"] == "CUST-9999"

    # 3. Update borrower
    patch_payload = {"contact_phone": "+919999999999", "status": "ACTIVE"}
    patch_res = seeded_client.patch(f"/api/v1/borrowers/{borrower_id}", json=patch_payload, headers=officer_headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["contact_phone"] == "+919999999999"

    # 4. Search and list borrowers
    list_res = seeded_client.get("/api/v1/borrowers?search=Sunil", headers=officer_headers)
    assert list_res.status_code == 200
    items = list_res.json()["items"]
    assert len(items) >= 1
    assert items[0]["display_name"] == "Sunil Gaikwad"


# ---------------------------------------------------------
# 3. Farms & Crop Cycles (API-011 to API-015)
# ---------------------------------------------------------


def test_farm_and_crop_cycle_lifecycle(seeded_client: TestClient, seeded_db_session: Session):
    """API-011 to API-015: Farm, plots, and crop cycle creation and validation."""
    officer_headers = get_auth_headers(seeded_client, "officer@fin03.local")

    borrower = seeded_db_session.query(Borrower).first()
    assert borrower is not None

    # 1. Invalid plot area arithmetic (plots area > total area)
    invalid_farm_payload = {
        "borrower_id": str(borrower.id),
        "name": "Invalid Farm",
        "area_value": 2.0,
        "plots": [
            {"name": "Plot A", "area_value": 1.5},
            {"name": "Plot B", "area_value": 1.5},
        ],
    }
    invalid_res = seeded_client.post("/api/v1/farms", json=invalid_farm_payload, headers=officer_headers)
    assert invalid_res.status_code == 422

    # 2. Create valid farm with 2 plots
    valid_farm_payload = {
        "borrower_id": str(borrower.id),
        "name": "Shree Ganesh Agro",
        "area_value": 4.5,
        "latitude": 17.6599,
        "longitude": 75.9064,
        "village": "South Solapur",
        "district": "Solapur",
        "state": "Maharashtra",
        "plots": [
            {"name": "North Field", "area_value": 2.5, "soil_type": "Black Soil"},
            {"name": "South Field", "area_value": 2.0, "soil_type": "Loamy"},
        ],
    }
    farm_res = seeded_client.post("/api/v1/farms", json=valid_farm_payload, headers=officer_headers)
    assert farm_res.status_code == 201
    farm_data = farm_res.json()
    farm_id = farm_data["id"]
    assert len(farm_data["plots"]) == 2

    # 3. List farms
    list_res = seeded_client.get(f"/api/v1/farms?borrower_id={borrower.id}", headers=officer_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 4. Get farm details
    get_res = seeded_client.get(f"/api/v1/farms/{farm_id}", headers=officer_headers)
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Shree Ganesh Agro"

    # 5. Invalid crop cycle (harvest before sowing)
    invalid_crop_payload = {
        "crop_code": "SOYBEAN",
        "season": "Kharif",
        "sowing_date": "2026-06-15",
        "expected_harvest_date": "2026-05-15",
        "area_value": 2.5,
    }
    invalid_crop_res = seeded_client.post(
        f"/api/v1/farms/{farm_id}/crop-cycles", json=invalid_crop_payload, headers=officer_headers
    )
    assert invalid_crop_res.status_code == 422

    # 6. Valid crop cycle
    crop_payload = {
        "crop_code": "SOYBEAN",
        "season": "Kharif",
        "sowing_date": "2026-06-15",
        "expected_harvest_date": "2026-10-15",
        "area_value": 2.5,
        "status": "GROWING",
    }
    crop_res = seeded_client.post(
        f"/api/v1/farms/{farm_id}/crop-cycles", json=crop_payload, headers=officer_headers
    )
    assert crop_res.status_code == 201
    cycle_id = crop_res.json()["id"]

    # 7. Get crop cycle
    get_cycle_res = seeded_client.get(f"/api/v1/crop-cycles/{cycle_id}", headers=officer_headers)
    assert get_cycle_res.status_code == 200
    assert get_cycle_res.json()["crop_code"] == "SOYBEAN"


# ---------------------------------------------------------
# 4. Loans & Repayments (API-016 to API-019)
# ---------------------------------------------------------


def test_loans_and_repayments_lifecycle(seeded_client: TestClient, seeded_db_session: Session):
    """API-016 to API-019: Loan application, repayment schedules, and repayment events."""
    officer_headers = get_auth_headers(seeded_client, "officer@fin03.local")

    borrower = seeded_db_session.query(Borrower).first()
    loan = seeded_db_session.query(Loan).first()
    assert borrower is not None
    assert loan is not None

    # 1. Create loan application
    app_payload = {
        "borrower_id": str(borrower.id),
        "amount": 150000.0,
        "currency": "INR",
        "purpose": "Kharif seasonal crop cultivation and drip irrigation equipment",
    }
    app_res = seeded_client.post("/api/v1/loan-applications", json=app_payload, headers=officer_headers)
    assert app_res.status_code == 201
    app_id = app_res.json()["id"]
    assert app_res.json()["status"] == "SUBMITTED"

    # 2. Get loan application
    get_app_res = seeded_client.get(f"/api/v1/loan-applications/{app_id}", headers=officer_headers)
    assert get_app_res.status_code == 200
    assert get_app_res.json()["amount"] == 150000.0

    # 3. Create repayment schedule
    schedule_payload = {
        "version": 2,
        "installments": [
            {
                "installment_number": 1,
                "due_date": "2026-11-15",
                "principal_component": 50000.0,
                "interest_component": 3500.0,
            },
            {
                "installment_number": 2,
                "due_date": "2026-12-15",
                "principal_component": 50000.0,
                "interest_component": 2500.0,
            },
        ],
    }
    sched_res = seeded_client.post(
        f"/api/v1/loans/{loan.id}/repayment-schedules", json=schedule_payload, headers=officer_headers
    )
    assert sched_res.status_code == 201
    installments = sched_res.json()
    assert len(installments) == 2
    installment_id = installments[0]["id"]

    # Duplicate version returns 409
    dup_sched_res = seeded_client.post(
        f"/api/v1/loans/{loan.id}/repayment-schedules", json=schedule_payload, headers=officer_headers
    )
    assert dup_sched_res.status_code == 409

    # 4. Record repayment event
    repay_payload = {
        "schedule_id": installment_id,
        "amount_paid": 53500.0,
        "source_id": "CBS-TXN-998877",
    }
    repay_res = seeded_client.post(
        f"/api/v1/loans/{loan.id}/repayment-events", json=repay_payload, headers=officer_headers
    )
    assert repay_res.status_code == 201
    assert repay_res.json()["amount_paid"] == 53500.0

    # Duplicate source_id returns 409
    dup_repay_res = seeded_client.post(
        f"/api/v1/loans/{loan.id}/repayment-events", json=repay_payload, headers=officer_headers
    )
    assert dup_repay_res.status_code == 409


# ---------------------------------------------------------
# 5. Observations & Market Prices (API-020, API-023)
# ---------------------------------------------------------


def test_observations_and_market_prices(seeded_client: TestClient, seeded_db_session: Session):
    """API-020 & API-023: Environmental time-series and market prices."""
    officer_headers = get_auth_headers(seeded_client, "officer@fin03.local")

    plot = seeded_db_session.query(Plot).first()
    assert plot is not None
    crop_cycle = seeded_db_session.query(CropCycle).filter(CropCycle.plot_id == plot.id).first()
    assert crop_cycle is not None

    # Seed an observation
    obs = ClimateObservation(
        plot_id=plot.id,
        variable_code="RAINFALL",
        value=25.4,
        unit="mm",
        observed_at=datetime.datetime.now(timezone.utc),
        source_id="IMD_GRID",
    )
    seeded_db_session.add(obs)

    # Seed market price
    price = MarketPrice(
        commodity_code="SOYBEAN",
        variety_grade="Yellow",
        market_id="SOLAPUR_APMC",
        price_value=4850.0,
        currency="INR",
        unit="quintal",
        observed_at=datetime.datetime.now(timezone.utc),
        source_id="Agmarknet",
    )
    seeded_db_session.add(price)
    seeded_db_session.commit()

    # 1. Get observations
    obs_res = seeded_client.get(f"/api/v1/crop-cycles/{crop_cycle.id}/observations", headers=officer_headers)
    assert obs_res.status_code == 200
    data = obs_res.json()
    assert len(data["climate"]) >= 1
    assert data["climate"][0]["value"] == 25.4

    # 2. Get market prices
    market_res = seeded_client.get("/api/v1/market-prices?commodity=SOYBEAN", headers=officer_headers)
    assert market_res.status_code == 200
    prices = market_res.json()
    assert len(prices) >= 1
    assert prices[0]["commodity_code"] == "SOYBEAN"
    assert prices[0]["price_value"] == 4850.0


# ---------------------------------------------------------
# 6. Async Data Imports (API-021, API-022)
# ---------------------------------------------------------


def test_async_data_import_lifecycle(seeded_client: TestClient):
    """API-021 & API-022: Data import queuing and status polling with idempotency."""
    analyst_headers = get_auth_headers(seeded_client, "analyst@fin03.local")

    idempotency_key = f"key-{uuid.uuid4()}"
    import_payload = {
        "dataset_type": "WEATHER",
        "source": "IMD Gridded Weather 0.25deg",
        "records_count": 500,
    }

    # 1. Post import request
    headers = {**analyst_headers, "Idempotency-Key": idempotency_key}
    post_res = seeded_client.post("/api/v1/data-imports", json=import_payload, headers=headers)
    assert post_res.status_code == 202
    job_data = post_res.json()
    job_id = job_data["id"]
    assert job_data["status"] == "QUEUED"
    assert job_data["type"] == "IMPORT_WEATHER"

    # 2. Idempotent retry returns same job
    retry_res = seeded_client.post("/api/v1/data-imports", json=import_payload, headers=headers)
    assert retry_res.status_code == 202
    assert retry_res.json()["id"] == job_id

    # 3. Poll job status
    poll_res = seeded_client.get(f"/api/v1/data-imports/{job_id}", headers=analyst_headers)
    assert poll_res.status_code == 200
    assert poll_res.json()["id"] == job_id
    assert poll_res.json()["status"] in ["QUEUED", "RUNNING", "COMPLETED"]
