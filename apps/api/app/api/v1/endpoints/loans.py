"""Loan Applications, Repayment Schedules, and Repayment Events endpoints."""

import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_db, require_roles, verify_branch_access
from app.core.errors import ConflictException, NotFoundException
from app.core.logging import request_id_ctx
from app.core.permissions import ROLE_INSTITUTION_ADMIN, ROLE_LOAN_OFFICER, ROLE_RISK_ANALYST
from app.models.borrower import Borrower
from app.models.loan import Loan, LoanApplication, RepaymentEvent, RepaymentSchedule
from app.models.user import User
from app.repositories.audit_repo import log_audit_event
from app.schemas.loan import (
    LoanApplicationCreate,
    LoanApplicationResponse,
    RepaymentEventCreate,
    RepaymentEventResponse,
    RepaymentScheduleCreate,
    RepaymentScheduleItemResponse,
)

router = APIRouter(tags=["Loans & Repayments"])


@router.post(
    "/loan-applications",
    response_model=LoanApplicationResponse,
    operation_id="createLoanApplication",
    summary="Create LoanApplication",
    status_code=status.HTTP_201_CREATED,
)
def create_loan_application(
    request: Request,
    payload: LoanApplicationCreate,
    current_user: User = Depends(require_roles(ROLE_LOAN_OFFICER, ROLE_INSTITUTION_ADMIN)),
    db: Session = Depends(get_db),
) -> LoanApplicationResponse:
    """Submit a loan application linked to a borrower (API-016)."""
    borrower = (
        db.query(Borrower)
        .filter(Borrower.id == payload.borrower_id, Borrower.institution_id == current_user.institution_id)
        .first()
    )
    if not borrower:
        raise NotFoundException("Borrower does not exist")

    if borrower.branch_id:
        verify_branch_access(borrower.branch_id, current_user)

    application = LoanApplication(
        institution_id=current_user.institution_id,
        borrower_id=payload.borrower_id,
        branch_id=borrower.branch_id,
        amount=payload.amount,
        currency=payload.currency,
        purpose=payload.purpose,
        status="SUBMITTED",
        submitted_at=datetime.now(timezone.utc),
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    req_id = getattr(request.state, "request_id", None) or request_id_ctx.get() or "unknown"
    log_audit_event(
        db=db,
        institution_id=current_user.institution_id,
        action="LOAN_APPLICATION_CREATED",
        object_type="loan_application",
        object_id=application.id,
        request_id=req_id,
        actor_id=current_user.id,
        metadata={"amount": float(application.amount), "purpose": application.purpose},
    )

    return LoanApplicationResponse.model_validate(application)


@router.get(
    "/loan-applications/{application_id}",
    response_model=LoanApplicationResponse,
    operation_id="getLoanApplication",
    summary="Get LoanApplication",
    status_code=status.HTTP_200_OK,
)
def get_loan_application(
    application_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LoanApplicationResponse:
    """Retrieve loan application by UUID (API-017)."""
    app = (
        db.query(LoanApplication)
        .filter(
            LoanApplication.id == application_id,
            LoanApplication.institution_id == current_user.institution_id,
        )
        .first()
    )
    if not app:
        raise NotFoundException("Loan application not found")

    borrower = db.query(Borrower).filter(Borrower.id == app.borrower_id).first()
    if borrower and borrower.branch_id:
        verify_branch_access(borrower.branch_id, current_user)

    return LoanApplicationResponse.model_validate(app)


@router.post(
    "/loans/{loan_id}/repayment-schedules",
    response_model=List[RepaymentScheduleItemResponse],
    operation_id="createRepaymentSchedule",
    summary="Create RepaymentSchedule",
    status_code=status.HTTP_201_CREATED,
)
def create_repayment_schedule(
    loan_id: uuid.UUID,
    payload: RepaymentScheduleCreate,
    request: Request,
    current_user: User = Depends(require_roles(ROLE_LOAN_OFFICER, ROLE_INSTITUTION_ADMIN)),
    db: Session = Depends(get_db),
) -> List[RepaymentScheduleItemResponse]:
    """Generate or update versioned repayment schedule for an active loan (API-018)."""
    loan = (
        db.query(Loan)
        .filter(Loan.id == loan_id, Loan.institution_id == current_user.institution_id)
        .first()
    )
    if not loan:
        raise NotFoundException("Loan record not found")

    existing = (
        db.query(RepaymentSchedule)
        .filter(RepaymentSchedule.loan_id == loan.id, RepaymentSchedule.version == payload.version)
        .first()
    )
    if existing:
        raise ConflictException(f"Repayment schedule version {payload.version} already exists")

    created_items = []
    for item in payload.installments:
        amount_due = item.amount_due if item.amount_due is not None else (item.principal_component + item.interest_component)
        sched = RepaymentSchedule(
            loan_id=loan.id,
            version=payload.version,
            installment_number=item.installment_number,
            due_date=item.due_date,
            amount_due=amount_due,
            principal_component=item.principal_component,
            interest_component=item.interest_component,
            currency=item.currency,
        )
        db.add(sched)
        created_items.append(sched)

    db.commit()

    req_id = getattr(request.state, "request_id", None) or request_id_ctx.get() or "unknown"
    log_audit_event(
        db=db,
        institution_id=current_user.institution_id,
        action="REPAYMENT_SCHEDULE_CREATED",
        object_type="loan",
        object_id=loan.id,
        request_id=req_id,
        actor_id=current_user.id,
        metadata={"version": payload.version, "installments_count": len(payload.installments)},
    )

    return [RepaymentScheduleItemResponse.model_validate(item) for item in created_items]


@router.post(
    "/loans/{loan_id}/repayment-events",
    response_model=RepaymentEventResponse,
    operation_id="createRepaymentEvent",
    summary="Create RepaymentEvent",
    status_code=status.HTTP_201_CREATED,
)
def create_repayment_event(
    loan_id: uuid.UUID,
    payload: RepaymentEventCreate,
    request: Request,
    current_user: User = Depends(require_roles(ROLE_LOAN_OFFICER, ROLE_INSTITUTION_ADMIN)),
    db: Session = Depends(get_db),
) -> RepaymentEventResponse:
    """Record an installment payment against an active loan (API-019)."""
    loan = (
        db.query(Loan)
        .filter(Loan.id == loan_id, Loan.institution_id == current_user.institution_id)
        .first()
    )
    if not loan:
        raise NotFoundException("Loan record not found")

    existing_ref = (
        db.query(RepaymentEvent)
        .filter(RepaymentEvent.loan_id == loan.id, RepaymentEvent.source_id == payload.source_id)
        .first()
    )
    if existing_ref:
        raise ConflictException(
            f"Repayment event with source_id '{payload.source_id}' already recorded"
        )

    event = RepaymentEvent(
        loan_id=loan.id,
        schedule_id=payload.schedule_id,
        paid_at=datetime.now(timezone.utc),
        amount_paid=payload.amount_paid,
        currency=payload.currency,
        status="COMPLETED",
        source_id=payload.source_id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    req_id = getattr(request.state, "request_id", None) or request_id_ctx.get() or "unknown"
    log_audit_event(
        db=db,
        institution_id=current_user.institution_id,
        action="REPAYMENT_EVENT_RECORDED",
        object_type="repayment_event",
        object_id=event.id,
        request_id=req_id,
        actor_id=current_user.id,
        metadata={"amount": float(event.amount_paid), "source_id": event.source_id},
    )

    return RepaymentEventResponse.model_validate(event)
