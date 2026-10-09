"""AI/ML Inference, Income Calculation, Credit Assessment, Scenarios, and Explanations Endpoints (API-024 to API-031)."""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Header, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_roles, verify_branch_access
from app.core.errors import NotFoundException
from app.core.logging import request_id_ctx
from app.core.permissions import (
    ROLE_INSTITUTION_ADMIN,
    ROLE_LOAN_OFFICER,
    ROLE_PLATFORM_OPERATOR,
    ROLE_RISK_ANALYST,
)
from app.models.assessment import CreditAssessment, RiskExplanation, ScenarioRun
from app.models.borrower import Borrower
from app.models.crop_cycle import CropCycle
from app.models.farm import Farm, Plot
from app.models.user import User
from app.schemas.assessment import (
    AssessmentCreateRequest,
    AssessmentHistoryItemResponse,
    AssessmentResponse,
    IncomeEstimateRequest,
    IncomeEstimateResponse,
    RiskExplanationResponse,
    ScenarioRunCreateRequest,
    ScenarioRunResponse,
    YieldInferenceRequest,
    YieldInferenceResponse,
)
from app.services.assessment_engine import create_credit_assessment
from app.services.income_calculator import calculate_farm_income
from app.services.ml_client import predict_crop_yield
from app.services.scenario_engine import run_scenario

router = APIRouter(tags=["AI/ML & Credit Assessments"])


# ---------------------------------------------------------------------------
# API-024: Yield Inference Service Interface
# ---------------------------------------------------------------------------
@router.post(
    "/yield-predictions",
    response_model=YieldInferenceResponse,
    operation_id="predictYield",
    summary="Predict Crop Yield",
    status_code=status.HTTP_201_CREATED,
)
def request_yield_prediction(
    request: Request,
    payload: YieldInferenceRequest,
    current_user: User = Depends(
        require_roles(ROLE_RISK_ANALYST, ROLE_LOAN_OFFICER, ROLE_INSTITUTION_ADMIN, ROLE_PLATFORM_OPERATOR)
    ),
    db: Session = Depends(get_db),
) -> YieldInferenceResponse:
    """Execute AI/ML physical crop yield estimation conforming to open contract schemas."""
    # Verify crop cycle exists and belongs to current institution
    crop_cycle = (
        db.query(CropCycle)
        .join(Plot, CropCycle.plot_id == Plot.id)
        .join(Farm, Plot.farm_id == Farm.id)
        .filter(
            CropCycle.id == payload.crop_cycle_id,
            Farm.institution_id == current_user.institution_id,
        )
        .first()
    )
    if not crop_cycle:
        raise NotFoundException(f"CropCycle {payload.crop_cycle_id} not found in current institution")

    response, _ = predict_crop_yield(db, payload, crop_cycle)
    return response


# ---------------------------------------------------------------------------
# API-025: Farm Income & Cash Flow Projection
# ---------------------------------------------------------------------------
@router.post(
    "/income-estimates",
    response_model=IncomeEstimateResponse,
    operation_id="calculateIncomeEstimate",
    summary="Calculate Farm Income Estimate",
    status_code=status.HTTP_201_CREATED,
)
def calculate_farm_income_estimate(
    request: Request,
    payload: IncomeEstimateRequest,
    current_user: User = Depends(
        require_roles(ROLE_LOAN_OFFICER, ROLE_RISK_ANALYST, ROLE_INSTITUTION_ADMIN)
    ),
    db: Session = Depends(get_db),
) -> IncomeEstimateResponse:
    """Calculate farm revenue, net income, and IADS from agronomic and price assumptions."""
    crop_cycle = (
        db.query(CropCycle)
        .join(Plot, CropCycle.plot_id == Plot.id)
        .join(Farm, Plot.farm_id == Farm.id)
        .filter(
            CropCycle.id == payload.crop_cycle_id,
            Farm.institution_id == current_user.institution_id,
        )
        .first()
    )
    if not crop_cycle:
        raise NotFoundException(f"CropCycle {payload.crop_cycle_id} not found in current institution")

    response, _ = calculate_farm_income(db, payload, crop_cycle)
    return response


# ---------------------------------------------------------------------------
# API-026: Create Credit Assessment Pipeline
# ---------------------------------------------------------------------------
@router.post(
    "/assessments",
    response_model=AssessmentResponse,
    operation_id="createCreditAssessment",
    summary="Create Credit Assessment",
    status_code=status.HTTP_201_CREATED,
)
def generate_credit_assessment(
    request: Request,
    payload: AssessmentCreateRequest,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    current_user: User = Depends(
        require_roles(ROLE_LOAN_OFFICER, ROLE_RISK_ANALYST, ROLE_INSTITUTION_ADMIN)
    ),
    db: Session = Depends(get_db),
) -> AssessmentResponse:
    """Generate a climate-aware credit assessment with immutable snapshot and PD regulatory gate."""
    req_id = request_id_ctx.get() or str(uuid.uuid4())
    response, _ = create_credit_assessment(
        db=db,
        request=payload,
        current_user=current_user,
        request_id=req_id,
        idempotency_key=idempotency_key,
    )
    return response


# ---------------------------------------------------------------------------
# API-027: Get Assessment By ID
# ---------------------------------------------------------------------------
@router.get(
    "/assessments/{assessment_id}",
    response_model=AssessmentResponse,
    operation_id="getCreditAssessment",
    summary="Get Credit Assessment",
)
def get_credit_assessment(
    assessment_id: uuid.UUID,
    current_user: User = Depends(
        require_roles(ROLE_LOAN_OFFICER, ROLE_RISK_ANALYST, ROLE_INSTITUTION_ADMIN)
    ),
    db: Session = Depends(get_db),
) -> AssessmentResponse:
    """Retrieve credit assessment details, status, snapshot, and regulatory gate."""
    assessment = (
        db.query(CreditAssessment)
        .filter(
            CreditAssessment.id == assessment_id,
            CreditAssessment.institution_id == current_user.institution_id,
        )
        .first()
    )
    if not assessment:
        raise NotFoundException(f"CreditAssessment {assessment_id} not found")

    # If borrower has branch, verify user branch access
    if assessment.borrower and assessment.borrower.branch_id:
        verify_branch_access(assessment.borrower.branch_id, current_user)

    return AssessmentResponse.model_validate(assessment)


# ---------------------------------------------------------------------------
# API-028: Run Climate Stress Scenario
# ---------------------------------------------------------------------------
@router.post(
    "/assessments/{assessment_id}/scenarios",
    response_model=ScenarioRunResponse,
    operation_id="runAssessmentScenario",
    summary="Run Assessment Climate Scenario",
    status_code=status.HTTP_201_CREATED,
)
def create_assessment_scenario_run(
    assessment_id: uuid.UUID,
    payload: ScenarioRunCreateRequest,
    current_user: User = Depends(
        require_roles(ROLE_RISK_ANALYST, ROLE_LOAN_OFFICER, ROLE_INSTITUTION_ADMIN)
    ),
    db: Session = Depends(get_db),
) -> ScenarioRunResponse:
    """Execute climate and price stress-testing perturbations against assessment baseline."""
    assessment = (
        db.query(CreditAssessment)
        .filter(
            CreditAssessment.id == assessment_id,
            CreditAssessment.institution_id == current_user.institution_id,
        )
        .first()
    )
    if not assessment:
        raise NotFoundException(f"CreditAssessment {assessment_id} not found")

    response, _ = run_scenario(db, assessment, payload)
    return response


# ---------------------------------------------------------------------------
# API-029: List Scenarios for Assessment
# ---------------------------------------------------------------------------
@router.get(
    "/assessments/{assessment_id}/scenarios",
    response_model=List[ScenarioRunResponse],
    operation_id="listAssessmentScenarios",
    summary="List Assessment Climate Scenarios",
)
def list_assessment_scenarios(
    assessment_id: uuid.UUID,
    current_user: User = Depends(
        require_roles(ROLE_RISK_ANALYST, ROLE_LOAN_OFFICER, ROLE_INSTITUTION_ADMIN)
    ),
    db: Session = Depends(get_db),
) -> List[ScenarioRunResponse]:
    """Retrieve all climate perturbation scenario runs associated with the assessment."""
    assessment = (
        db.query(CreditAssessment)
        .filter(
            CreditAssessment.id == assessment_id,
            CreditAssessment.institution_id == current_user.institution_id,
        )
        .first()
    )
    if not assessment:
        raise NotFoundException(f"CreditAssessment {assessment_id} not found")

    scenarios = (
        db.query(ScenarioRun)
        .filter(ScenarioRun.assessment_id == assessment_id)
        .order_by(ScenarioRun.created_at.desc())
        .all()
    )
    return [ScenarioRunResponse.model_validate(s) for s in scenarios]


# ---------------------------------------------------------------------------
# API-030: Get Risk Explanations for Assessment
# ---------------------------------------------------------------------------
@router.get(
    "/assessments/{assessment_id}/explanations",
    response_model=List[RiskExplanationResponse],
    operation_id="getAssessmentExplanations",
    summary="Get Assessment Risk Explanations",
)
def get_assessment_explanations(
    assessment_id: uuid.UUID,
    current_user: User = Depends(
        require_roles(ROLE_RISK_ANALYST, ROLE_LOAN_OFFICER, ROLE_INSTITUTION_ADMIN)
    ),
    db: Session = Depends(get_db),
) -> List[RiskExplanationResponse]:
    """Retrieve ranked risk driver contributions, directions, and regulatory caveats."""
    assessment = (
        db.query(CreditAssessment)
        .filter(
            CreditAssessment.id == assessment_id,
            CreditAssessment.institution_id == current_user.institution_id,
        )
        .first()
    )
    if not assessment:
        raise NotFoundException(f"CreditAssessment {assessment_id} not found")

    explanations = (
        db.query(RiskExplanation)
        .filter(RiskExplanation.assessment_id == assessment_id)
        .order_by(RiskExplanation.created_at.asc())
        .all()
    )
    return [RiskExplanationResponse.model_validate(e) for e in explanations]


# ---------------------------------------------------------------------------
# API-031: Get Borrower Assessment History
# ---------------------------------------------------------------------------
@router.get(
    "/borrowers/{borrower_id}/assessment-history",
    response_model=List[AssessmentHistoryItemResponse],
    operation_id="getBorrowerAssessmentHistory",
    summary="Get Borrower Assessment History",
)
def get_borrower_assessment_history(
    borrower_id: uuid.UUID,
    current_user: User = Depends(
        require_roles(ROLE_LOAN_OFFICER, ROLE_RISK_ANALYST, ROLE_INSTITUTION_ADMIN)
    ),
    db: Session = Depends(get_db),
) -> List[AssessmentHistoryItemResponse]:
    """Retrieve the immutable chronological assessment history for a borrower."""
    borrower = (
        db.query(Borrower)
        .filter(
            Borrower.id == borrower_id,
            Borrower.institution_id == current_user.institution_id,
        )
        .first()
    )
    if not borrower:
        raise NotFoundException(f"Borrower {borrower_id} not found")

    if borrower.branch_id:
        verify_branch_access(borrower.branch_id, current_user)

    assessments = (
        db.query(CreditAssessment)
        .filter(
            CreditAssessment.borrower_id == borrower_id,
            CreditAssessment.institution_id == current_user.institution_id,
        )
        .order_by(CreditAssessment.created_at.desc())
        .all()
    )
    return [AssessmentHistoryItemResponse.model_validate(a) for a in assessments]
