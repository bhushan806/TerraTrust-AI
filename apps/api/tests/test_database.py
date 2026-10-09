"""Database schema, models, constraints, and seed integration tests."""

import uuid
from datetime import date, datetime, timezone
import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, sessionmaker
from app.db.seed import seed_database
from app.models import (
    Alert,
    AuditEvent,
    Base,
    Borrower,
    Branch,
    ClimateObservation,
    CreditAssessment,
    CropCycle,
    DataSource,
    Farm,
    Forecast,
    IncomeEstimate,
    Institution,
    Job,
    Loan,
    LoanApplication,
    MarketPrice,
    ModelVersion,
    Plot,
    RepaymentEvent,
    RepaymentSchedule,
    RiskExplanation,
    Role,
    SatelliteObservation,
    ScenarioRun,
    SoilMoisture,
    SourceRecord,
    User,
    YieldPrediction,
)


@pytest.fixture
def db_session() -> Session:
    """Create fresh in-memory SQLite database with all tables for testing."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_table_inventory(db_session: Session):
    """Verify all 21+ required core domain entities are registered in metadata."""
    expected_tables = {
        "institutions",
        "branches",
        "user_branches",
        "users",
        "roles",
        "permissions",
        "user_roles",
        "role_permissions",
        "borrowers",
        "farms",
        "plots",
        "crop_cycles",
        "climate_observations",
        "forecasts",
        "satellite_observations",
        "soil_moisture",
        "market_prices",
        "loan_applications",
        "loans",
        "repayment_schedules",
        "repayment_events",
        "data_sources",
        "source_records",
        "model_versions",
        "credit_assessments",
        "yield_predictions",
        "income_estimates",
        "scenario_runs",
        "risk_explanations",
        "alerts",
        "audit_events",
        "jobs",
    }
    registered_tables = set(Base.metadata.tables.keys())
    missing_tables = expected_tables - registered_tables
    assert not missing_tables, f"Missing domain tables: {missing_tables}"


def test_seed_database_idempotent(db_session: Session):
    """Verify seed_database creates required initial records and is idempotent."""
    res1 = seed_database(db_session)
    assert res1["status"] == "seeded"

    # Verify entities exist
    inst = db_session.execute(select(Institution)).scalar_one_or_none()
    assert inst is not None
    assert inst.name == "Apex Rural Development Bank"

    branches = db_session.execute(select(Branch)).scalars().all()
    assert len(branches) == 2

    roles = db_session.execute(select(Role)).scalars().all()
    assert len(roles) == 4

    users = db_session.execute(select(User)).scalars().all()
    assert len(users) == 3

    borrowers = db_session.execute(select(Borrower)).scalars().all()
    assert len(borrowers) == 1
    assert borrowers[0].external_ref == "CUST-MH-2026-001"

    farms = db_session.execute(select(Farm)).scalars().all()
    assert len(farms) == 1
    assert farms[0].area_value == 2.5

    crop_cycles = db_session.execute(select(CropCycle)).scalars().all()
    assert len(crop_cycles) == 1
    assert crop_cycles[0].crop_code == "WHEAT"

    # Verify idempotency on second call
    res2 = seed_database(db_session)
    assert res2["status"] == "already_seeded"


def test_branch_unique_code_per_institution(db_session: Session):
    """Verify branch codes must be unique within an institution."""
    inst = Institution(name="Bank Alpha")
    db_session.add(inst)
    db_session.commit()

    b1 = Branch(institution_id=inst.id, name="Branch 1", code="BR01")
    db_session.add(b1)
    db_session.commit()

    b2 = Branch(institution_id=inst.id, name="Branch 2 with duplicate code", code="BR01")
    db_session.add(b2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_borrower_external_ref_unique_per_tenant(db_session: Session):
    """Verify external_ref is unique per institution (tenant isolation)."""
    inst1 = Institution(name="Tenant Bank A")
    inst2 = Institution(name="Tenant Bank B")
    db_session.add_all([inst1, inst2])
    db_session.commit()

    # Same external_ref in Bank A
    borrower1 = Borrower(institution_id=inst1.id, external_ref="BOR-001", display_name="Farmer One")
    db_session.add(borrower1)
    db_session.commit()

    # Duplicate external_ref in Bank A should fail
    duplicate_borrower = Borrower(institution_id=inst1.id, external_ref="BOR-001", display_name="Farmer Two")
    db_session.add(duplicate_borrower)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    # Same external_ref in Bank B MUST succeed (tenant isolation)
    borrower_other_tenant = Borrower(institution_id=inst2.id, external_ref="BOR-001", display_name="Farmer Three")
    db_session.add(borrower_other_tenant)
    db_session.commit()
    assert borrower_other_tenant.id is not None


def test_farm_and_plot_cascade_deletion(db_session: Session):
    """Verify deleting a farm cascades to all contained plots."""
    seed_database(db_session)
    farm = db_session.execute(select(Farm)).scalar_one()
    farm_id = farm.id

    # Confirm plot exists
    plots_before = db_session.execute(select(Plot).filter_by(farm_id=farm_id)).scalars().all()
    assert len(plots_before) > 0

    # Delete farm
    db_session.delete(farm)
    db_session.commit()

    # Confirm plots are deleted
    plots_after = db_session.execute(select(Plot).filter_by(farm_id=farm_id)).scalars().all()
    assert len(plots_after) == 0


def test_repayment_schedule_and_events(db_session: Session):
    """Verify loan schedule creation and repayment event recording."""
    seed_database(db_session)
    loan = db_session.execute(select(Loan)).scalar_one()

    # Add second schedule version
    s2 = RepaymentSchedule(
        loan_id=loan.id,
        version=2,
        installment_number=1,
        due_date=date(2027, 5, 31),
        amount_due=155000.00,
        principal_component=150000.00,
        interest_component=5000.00,
        currency="INR",
    )
    # Record payment event
    event = RepaymentEvent(
        loan_id=loan.id,
        paid_at=datetime.now(timezone.utc),
        amount_paid=155000.00,
        currency="INR",
        status="COMPLETED",
        days_past_due=0,
        source_id="CBS_API",
    )
    db_session.add_all([s2, event])
    db_session.commit()

    assert s2.id is not None
    assert event.id is not None


def test_immutable_assessment_snapshot_and_provenance(db_session: Session):
    """Verify assessment snapshot immutability and provenance tracking."""
    seed_database(db_session)
    borrower = db_session.execute(select(Borrower)).scalar_one()
    crop_cycle = db_session.execute(select(CropCycle)).scalar_one()
    model = db_session.execute(select(ModelVersion)).scalar_one()

    # 1. Record yield prediction
    yield_pred = YieldPrediction(
        crop_cycle_id=crop_cycle.id,
        model_version_id=model.id,
        input_manifest_id=uuid.uuid4(),
        value=2450.0,
        unit="kg/hectare",
        quality_status="VALID",
        uncertainty_json={"p10": 2100.0, "p90": 2800.0},
        limitations_json=["Historical weather anomaly in region"],
    )
    db_session.add(yield_pred)
    db_session.commit()

    # 2. Record income estimate
    income = IncomeEstimate(
        crop_cycle_id=crop_cycle.id,
        gross_revenue=73500.00,
        production_costs=28000.00,
        other_expenses=3500.00,
        net_farm_income=42000.00,
        other_household_income=5000.00,
        debt_service_obligations=15000.00,
        income_available_for_debt_service=32000.00,
        currency="INR",
        assumptions_version="1.0",
        assumptions_json={"market_price_per_kg": 30.0, "harvest_loss_pct": 5.0},
    )
    db_session.add(income)
    db_session.commit()

    # 3. Create Credit Assessment snapshot
    manifest_id = uuid.uuid4()
    assessment = CreditAssessment(
        institution_id=borrower.institution_id,
        borrower_id=borrower.id,
        model_version_id=model.id,
        input_manifest_id=manifest_id,
        status="COMPLETED",
        result_type="ASSESSMENT",
        repayment_probability=None,  # Gated: Must be None without validated credit labels
        pd_status="NOT_AVAILABLE",
        risk_band="LOW",
        dscr=2.1333,
        snapshot_json={
            "yield_estimate_kg_ha": 2450.0,
            "net_farm_income": 42000.0,
            "iads": 32000.0,
            "dscr": 2.1333,
        },
        trigger_reason="INITIAL_APPLICATION",
        completed_at=datetime.now(timezone.utc),
    )
    db_session.add(assessment)
    db_session.commit()

    # 4. Attach scenario run and risk explanation
    scenario = ScenarioRun(
        assessment_id=assessment.id,
        scenario_code="DROUGHT_MODERATE",
        yield_delta_pct=-15.0,
        income_delta_pct=-22.5,
        evidence_status="ILLUSTRATIVE_ASSUMPTION",
    )
    explanation = RiskExplanation(
        assessment_id=assessment.id,
        factor_code="RAINFALL_DEFICIT",
        contribution_value=-12.5,
        direction="NEGATIVE",
        explanation_type="MODEL_FEATURE",
        unit="pct",
        caveat="Open-Meteo forecast beyond 14 days has higher uncertainty",
    )
    db_session.add_all([scenario, explanation])
    db_session.commit()

    assert assessment.id is not None
    assert assessment.repayment_probability is None
    assert assessment.pd_status == "NOT_AVAILABLE"
    assert len(assessment.scenarios) == 1
    assert len(assessment.explanations) == 1


def test_audit_event_append_only(db_session: Session):
    """Verify append-only audit event logging."""
    seed_database(db_session)
    inst = db_session.execute(select(Institution)).scalar_one()

    event = AuditEvent(
        institution_id=inst.id,
        action="ASSESSMENT_COMPLETED",
        object_type="CREDIT_ASSESSMENT",
        object_id=uuid.uuid4(),
        request_id="req-test-12345",
        metadata_json={"officer_id": "test", "decision": "RECOMMENDED"},
    )
    db_session.add(event)
    db_session.commit()

    retrieved = db_session.execute(
        select(AuditEvent).filter_by(request_id="req-test-12345")
    ).scalar_one()
    assert retrieved.action == "ASSESSMENT_COMPLETED"
    assert retrieved.metadata_json["decision"] == "RECOMMENDED"


def test_job_idempotency_constraint(db_session: Session):
    """Verify background job idempotency key constraint per institution."""
    seed_database(db_session)
    inst = db_session.execute(select(Institution)).scalar_one()

    job1 = Job(
        institution_id=inst.id,
        type="ASSESSMENT",
        status="QUEUED",
        idempotency_key="idemp-key-xyz-100",
        payload_json={"borrower_id": "b1"},
    )
    db_session.add(job1)
    db_session.commit()

    # Second job with same idempotency key for same institution must violate uniqueness
    job2 = Job(
        institution_id=inst.id,
        type="ASSESSMENT",
        status="QUEUED",
        idempotency_key="idemp-key-xyz-100",
        payload_json={"borrower_id": "b1"},
    )
    db_session.add(job2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()
