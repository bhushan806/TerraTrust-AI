"""Deterministic seed data for local development and integration tests."""

import uuid
from datetime import date, datetime, timezone
from sqlalchemy.orm import Session
from app.models.assessment import CreditAssessment, YieldPrediction
from app.models.borrower import Borrower
from app.models.crop_cycle import CropCycle
from app.models.farm import Farm, Plot
from app.models.governance import DataSource, ModelVersion
from app.models.institution import Branch, Institution, UserBranch
from app.models.loan import Loan, LoanApplication, RepaymentSchedule
from app.models.user import Permission, Role, User


def seed_database(db: Session) -> dict:
    """Populate database with deterministic initial data if empty."""
    # Check if already seeded
    existing_inst = db.query(Institution).filter_by(name="Apex Rural Development Bank").first()
    if existing_inst:
        return {"status": "already_seeded", "institution_id": str(existing_inst.id)}

    # 1. Institution & Branches
    institution = Institution(
        id=uuid.UUID("11111111-1111-1111-1111-111111111111"),
        name="Apex Rural Development Bank",
        status="ACTIVE",
    )
    branch_solapur = Branch(
        id=uuid.UUID("22222222-2222-2222-2222-222222222221"),
        institution=institution,
        name="Solapur South Branch",
        code="BR-SOL-01",
    )
    branch_nashik = Branch(
        id=uuid.UUID("22222222-2222-2222-2222-222222222222"),
        institution=institution,
        name="Nashik Central Branch",
        code="BR-NSK-01",
    )
    db.add_all([institution, branch_solapur, branch_nashik])

    # 2. Roles & Permissions
    roles = {
        "LOAN_OFFICER": Role(
            id=uuid.UUID("33333333-3333-3333-3333-333333333331"),
            code="LOAN_OFFICER",
            description="Frontline loan origination, farm profiling, and review report generation",
        ),
        "RISK_ANALYST": Role(
            id=uuid.UUID("33333333-3333-3333-3333-333333333332"),
            code="RISK_ANALYST",
            description="Credit risk underwriting, scenario evaluation, and model validation",
        ),
        "INSTITUTION_ADMIN": Role(
            id=uuid.UUID("33333333-3333-3333-3333-333333333333"),
            code="INSTITUTION_ADMIN",
            description="Branch and user management, data import health oversight",
        ),
        "PLATFORM_OPERATOR": Role(
            id=uuid.UUID("33333333-3333-3333-3333-333333333334"),
            code="PLATFORM_OPERATOR",
            description="Infrastructure, model deployment, and system observability",
        ),
    }
    db.add_all(list(roles.values()))

    # 3. Default Users (Real bcrypt hash for 'password123')
    from app.core.security import hash_password
    default_password_hash = hash_password("password123")

    user_officer = User(
        id=uuid.UUID("44444444-4444-4444-4444-444444444441"),
        institution=institution,
        email="officer@fin03.local",
        full_name="Rajesh Sharma (Loan Officer)",
        hashed_password=default_password_hash,
        status="ACTIVE",
        roles=[roles["LOAN_OFFICER"]],
    )
    user_analyst = User(
        id=uuid.UUID("44444444-4444-4444-4444-444444444442"),
        institution=institution,
        email="analyst@fin03.local",
        full_name="Priya Deshmukh (Risk Analyst)",
        hashed_password=default_password_hash,
        status="ACTIVE",
        roles=[roles["RISK_ANALYST"]],
    )
    user_admin = User(
        id=uuid.UUID("44444444-4444-4444-4444-444444444443"),
        institution=institution,
        email="admin@fin03.local",
        full_name="Vikram Joshi (Admin)",
        hashed_password=default_password_hash,
        status="ACTIVE",
        roles=[roles["INSTITUTION_ADMIN"]],
    )
    db.add_all([user_officer, user_analyst, user_admin])

    # Assign branch scope
    ub1 = UserBranch(
        id=uuid.uuid4(),
        user=user_officer,
        branch=branch_solapur,
        scope="BRANCH_READ_WRITE",
    )
    db.add(ub1)

    # 4. Registered Data Sources
    source_weather = DataSource(
        id=uuid.UUID("55555555-5555-5555-5555-555555555551"),
        name="IMD Weather Observations",
        type="WEATHER",
        terms_uri="https://mausam.imd.gov.in/",
        license_ref="Government Open Data License - India",
        status="ACTIVE",
        owner="India Meteorological Department",
    )
    source_sentinel = DataSource(
        id=uuid.UUID("55555555-5555-5555-5555-555555555552"),
        name="Copernicus Sentinel-2 MSI",
        type="SATELLITE",
        terms_uri="https://dataspace.copernicus.eu/",
        license_ref="Copernicus Open Access License",
        status="ACTIVE",
        owner="European Space Agency",
    )
    source_market = DataSource(
        id=uuid.UUID("55555555-5555-5555-5555-555555555553"),
        name="AGMARKNET Mandi Portal",
        type="MARKET",
        terms_uri="https://agmarknet.gov.in/",
        license_ref="Ministry of Agriculture & Farmers Welfare",
        status="ACTIVE",
        owner="Directorate of Marketing & Inspection",
    )
    db.add_all([source_weather, source_sentinel, source_market])

    # 5. Promoted Baseline ML Model Version
    model_baseline = ModelVersion(
        id=uuid.UUID("66666666-6666-6666-6666-666666666661"),
        name="crop-yield-baseline",
        version="0.1.0-demo",
        artifact_uri="./artifacts/demo-model.joblib",
        checksum="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        feature_schema_version="1.0",
        metrics_json={"mae": 142.5, "rmse": 185.0, "unit": "kg/hectare"},
        status="PROMOTED",
        approved_at=datetime.now(timezone.utc),
    )
    db.add(model_baseline)

    # 6. Sample Borrower
    borrower = Borrower(
        id=uuid.UUID("77777777-7777-7777-7777-777777777771"),
        institution=institution,
        branch=branch_solapur,
        external_ref="CUST-MH-2026-001",
        display_name="Ramesh Patil",
        contact_phone="+91-9822012345",
        contact_email="ramesh.patil@example.farm",
        status="ACTIVE",
    )
    db.add(borrower)

    # 7. Sample Farm & Plot
    farm = Farm(
        id=uuid.UUID("88888888-8888-8888-8888-888888888881"),
        institution=institution,
        borrower=borrower,
        name="Patil Farmholding",
        latitude=17.6599,
        longitude=75.9064,
        area_value=2.5,
        area_unit="hectare",
        village="Kumbhari",
        district="Solapur",
        state="Maharashtra",
        status="ACTIVE",
    )
    plot = Plot(
        id=uuid.UUID("99999999-9999-9999-9999-999999999991"),
        farm=farm,
        name="Plot A - North Field",
        area_value=1.5,
        area_unit="hectare",
        soil_type="Medium Black Soil",
    )
    db.add_all([farm, plot])

    # 8. Sample Crop Cycle
    crop_cycle = CropCycle(
        id=uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        plot=plot,
        crop_code="WHEAT",
        variety="Lokwan",
        season="RABI",
        sowing_date=date(2026, 11, 1),
        expected_harvest_date=date(2027, 3, 15),
        area_value=1.5,
        area_unit="hectare",
        irrigation_type="CANAL",
        irrigation_reliability="HIGH",
        status="GROWING",
    )
    db.add(crop_cycle)

    # 9. Sample Loan Application & Loan
    loan_app = LoanApplication(
        id=uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        institution=institution,
        borrower=borrower,
        branch=branch_solapur,
        amount=150000.00,
        currency="INR",
        purpose="Crop cultivation inputs (seeds, fertilizer, diesel)",
        status="APPROVED",
    )
    loan = Loan(
        id=uuid.UUID("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        application=loan_app,
        institution=institution,
        borrower=borrower,
        principal=150000.00,
        currency="INR",
        interest_rate=0.0700,
        start_date=date(2026, 11, 1),
        end_date=date(2027, 4, 30),
        repayment_frequency="BULLET_HARVEST",
        status="ACTIVE",
    )
    schedule = RepaymentSchedule(
        id=uuid.UUID("dddddddd-dddd-dddd-dddd-dddddddddddd"),
        loan=loan,
        version=1,
        installment_number=1,
        due_date=date(2027, 4, 30),
        amount_due=155250.00,
        principal_component=150000.00,
        interest_component=5250.00,
        currency="INR",
    )
    db.add_all([loan_app, loan, schedule])

    db.commit()
    return {
        "status": "seeded",
        "institution_id": str(institution.id),
        "borrower_id": str(borrower.id),
        "farm_id": str(farm.id),
        "crop_cycle_id": str(crop_cycle.id),
        "loan_id": str(loan.id),
    }
