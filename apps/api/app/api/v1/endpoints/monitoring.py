"""Monitoring, Alerts, and Data Source Health Endpoints (API-D03, API-D04, API-D08)."""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_roles
from app.core.errors import NotFoundException
from app.core.logging import request_id_ctx
from app.core.permissions import (
    ROLE_INSTITUTION_ADMIN,
    ROLE_LOAN_OFFICER,
    ROLE_PLATFORM_OPERATOR,
    ROLE_RISK_ANALYST,
)
from app.models.assessment import Alert, CreditAssessment
from app.models.governance import DataSource
from app.models.user import User
from app.schemas.alert import AlertResponse, AlertUpdate
from app.schemas.assessment import AssessmentResponse
from app.schemas.data_source import DataSourceResponse
from app.services.alert_engine import evaluate_risk_alerts
from app.services.job_worker import process_pending_jobs, trigger_dynamic_reassessment

router = APIRouter(tags=["Monitoring & Early Warning Alerts"])


# ---------------------------------------------------------------------------
# API-D03: List Scoped Early Warning Alerts
# ---------------------------------------------------------------------------
@router.get(
    "/alerts",
    response_model=List[AlertResponse],
    operation_id="listAlerts",
    summary="List Scoped Alerts",
)
def list_alerts(
    alert_status: Optional[str] = Query(default=None, alias="status", description="Filter by status (ACTIVE, ACKNOWLEDGED, RESOLVED)"),
    current_user: User = Depends(
        require_roles(ROLE_LOAN_OFFICER, ROLE_RISK_ANALYST, ROLE_INSTITUTION_ADMIN, ROLE_PLATFORM_OPERATOR)
    ),
    db: Session = Depends(get_db),
) -> List[AlertResponse]:
    """Retrieve active or filtered early-warning risk alerts scoped to institution."""
    query = db.query(Alert).filter(Alert.institution_id == current_user.institution_id)
    if alert_status:
        query = query.filter(Alert.status == alert_status.upper())

    alerts = query.order_by(Alert.created_at.desc()).all()
    return [AlertResponse.model_validate(a) for a in alerts]


# ---------------------------------------------------------------------------
# API-D04: Acknowledge or Resolve Alert
# ---------------------------------------------------------------------------
@router.patch(
    "/alerts/{alert_id}",
    response_model=AlertResponse,
    operation_id="updateAlertStatus",
    summary="Update Alert Status",
)
def update_alert_status(
    alert_id: uuid.UUID,
    payload: AlertUpdate,
    current_user: User = Depends(
        require_roles(ROLE_LOAN_OFFICER, ROLE_RISK_ANALYST, ROLE_INSTITUTION_ADMIN)
    ),
    db: Session = Depends(get_db),
) -> AlertResponse:
    """Acknowledge or resolve an early-warning alert."""
    alert = (
        db.query(Alert)
        .filter(Alert.id == alert_id, Alert.institution_id == current_user.institution_id)
        .first()
    )
    if not alert:
        raise NotFoundException(f"Alert {alert_id} not found")

    alert.status = payload.status
    if payload.status == "RESOLVED":
        alert.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)
    return AlertResponse.model_validate(alert)


# ---------------------------------------------------------------------------
# API-D08: List Registered Data Sources & Health
# ---------------------------------------------------------------------------
@router.get(
    "/data-sources",
    response_model=List[DataSourceResponse],
    operation_id="listDataSources",
    summary="List Registered Data Sources",
)
def list_data_sources(
    current_user: User = Depends(
        require_roles(ROLE_LOAN_OFFICER, ROLE_RISK_ANALYST, ROLE_INSTITUTION_ADMIN, ROLE_PLATFORM_OPERATOR)
    ),
    db: Session = Depends(get_db),
) -> List[DataSourceResponse]:
    """List registered meteorological, satellite, and market data sources with status."""
    sources = db.query(DataSource).order_by(DataSource.name.asc()).all()
    return [DataSourceResponse.model_validate(s) for s in sources]


# ---------------------------------------------------------------------------
# Background Job Execution Trigger
# ---------------------------------------------------------------------------
@router.post(
    "/jobs/run-pending",
    operation_id="runPendingBackgroundJobs",
    summary="Execute Pending Background Jobs",
)
def run_pending_jobs(
    max_jobs: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(
        require_roles(ROLE_INSTITUTION_ADMIN, ROLE_PLATFORM_OPERATOR)
    ),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Trigger processing of pending background queue jobs (data imports, reports, reassessments)."""
    return process_pending_jobs(db, max_jobs=max_jobs)


# ---------------------------------------------------------------------------
# F17: Dynamic Reassessment Trigger
# ---------------------------------------------------------------------------
@router.post(
    "/assessments/{assessment_id}/dynamic-trigger",
    response_model=AssessmentResponse,
    operation_id="triggerDynamicReassessment",
    summary="Trigger Dynamic Reassessment",
    status_code=status.HTTP_201_CREATED,
)
def trigger_reassessment_endpoint(
    assessment_id: uuid.UUID,
    reason: str = Query(default="DYNAMIC_MONITORING", description="Reason for dynamic reassessment trigger"),
    request: Request = None,
    current_user: User = Depends(
        require_roles(ROLE_RISK_ANALYST, ROLE_LOAN_OFFICER, ROLE_INSTITUTION_ADMIN)
    ),
    db: Session = Depends(get_db),
) -> AssessmentResponse:
    """Trigger dynamic automated reassessment upon new climate or price observations (F17)."""
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

    snapshot = assessment.snapshot_json or {}
    crop_cycle_id_str = snapshot.get("crop_cycle", {}).get("id")
    if not crop_cycle_id_str:
        raise NotFoundException("CropCycle reference not found in assessment snapshot")

    req_id = request_id_ctx.get() or str(uuid.uuid4())
    new_assessment = trigger_dynamic_reassessment(
        db=db,
        borrower_id=assessment.borrower_id,
        crop_cycle_id=uuid.UUID(crop_cycle_id_str),
        reason=reason,
        actor_user=current_user,
        request_id=req_id,
    )
    return AssessmentResponse.model_validate(new_assessment)
