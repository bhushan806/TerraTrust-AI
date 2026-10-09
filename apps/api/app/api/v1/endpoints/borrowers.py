"""Borrower management endpoints conforming to FIN-03 specifications."""

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_db, require_roles, verify_branch_access
from app.core.errors import ConflictException, NotFoundException
from app.core.logging import request_id_ctx
from app.core.permissions import ROLE_INSTITUTION_ADMIN, ROLE_LOAN_OFFICER, ROLE_RISK_ANALYST
from app.models.borrower import Borrower
from app.models.institution import Branch
from app.models.user import User
from app.repositories.audit_repo import log_audit_event
from app.schemas.borrower import (
    BorrowerCreate,
    BorrowerListResponse,
    BorrowerResponse,
    BorrowerUpdate,
)

router = APIRouter(prefix="/borrowers", tags=["Borrowers"])


@router.get(
    "",
    response_model=BorrowerListResponse,
    operation_id="listBorrowers",
    summary="List Borrowers",
    status_code=status.HTTP_200_OK,
)
def list_borrowers(
    search: Optional[str] = Query(None, description="Search by name or external ref"),
    branch_id: Optional[uuid.UUID] = Query(None, description="Filter by branch"),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BorrowerListResponse:
    """Search and filter borrowers within institutional scope (API-007)."""
    query = db.query(Borrower).filter(Borrower.institution_id == current_user.institution_id)

    if branch_id:
        verify_branch_access(branch_id, current_user)
        query = query.filter((Borrower.branch_id == branch_id) | (Borrower.branch_id.is_(None)))

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Borrower.display_name.ilike(search_term))
            | (Borrower.external_ref.ilike(search_term))
            | (Borrower.contact_phone.ilike(search_term))
        )

    total = query.count()
    items = query.order_by(Borrower.created_at.desc()).offset(offset).limit(limit).all()

    return BorrowerListResponse(
        items=[BorrowerResponse.model_validate(b) for b in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post(
    "",
    response_model=BorrowerResponse,
    operation_id="createBorrower",
    summary="Create Borrower",
    status_code=status.HTTP_201_CREATED,
)
def create_borrower(
    request: Request,
    payload: BorrowerCreate,
    current_user: User = Depends(require_roles(ROLE_LOAN_OFFICER, ROLE_INSTITUTION_ADMIN)),
    db: Session = Depends(get_db),
) -> BorrowerResponse:
    """Register a new borrower profile (API-008)."""
    verify_branch_access(payload.branch_id, current_user)

    branch = (
        db.query(Branch)
        .filter(Branch.id == payload.branch_id, Branch.institution_id == current_user.institution_id)
        .first()
    )
    if not branch:
        raise NotFoundException("Assigned branch does not exist in institution")

    existing = (
        db.query(Borrower)
        .filter(
            Borrower.institution_id == current_user.institution_id,
            Borrower.external_ref == payload.external_ref,
        )
        .first()
    )
    if existing:
        raise ConflictException(f"Borrower with external_ref '{payload.external_ref}' already exists")

    borrower = Borrower(
        institution_id=current_user.institution_id,
        branch_id=payload.branch_id,
        external_ref=payload.external_ref,
        display_name=payload.display_name,
        contact_phone=payload.contact_phone,
        contact_email=payload.contact_email,
        status="ACTIVE",
    )
    db.add(borrower)
    db.commit()
    db.refresh(borrower)

    req_id = getattr(request.state, "request_id", None) or request_id_ctx.get() or "unknown"
    log_audit_event(
        db=db,
        institution_id=current_user.institution_id,
        action="BORROWER_CREATED",
        object_type="borrower",
        object_id=borrower.id,
        request_id=req_id,
        actor_id=current_user.id,
        metadata={"external_ref": borrower.external_ref, "branch_id": str(borrower.branch_id)},
    )

    return BorrowerResponse.model_validate(borrower)


@router.get(
    "/{borrower_id}",
    response_model=BorrowerResponse,
    operation_id="getBorrower",
    summary="Get Borrower",
    status_code=status.HTTP_200_OK,
)
def get_borrower(
    borrower_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BorrowerResponse:
    """Retrieve borrower profile by UUID (API-009)."""
    borrower = (
        db.query(Borrower)
        .filter(
            Borrower.id == borrower_id,
            Borrower.institution_id == current_user.institution_id,
        )
        .first()
    )
    if not borrower:
        raise NotFoundException("Borrower not found")

    if borrower.branch_id:
        verify_branch_access(borrower.branch_id, current_user)
    return BorrowerResponse.model_validate(borrower)


@router.patch(
    "/{borrower_id}",
    response_model=BorrowerResponse,
    operation_id="updateBorrower",
    summary="Update Borrower",
    status_code=status.HTTP_200_OK,
)
def update_borrower(
    borrower_id: uuid.UUID,
    payload: BorrowerUpdate,
    request: Request,
    current_user: User = Depends(require_roles(ROLE_LOAN_OFFICER, ROLE_INSTITUTION_ADMIN)),
    db: Session = Depends(get_db),
) -> BorrowerResponse:
    """Update mutable details of a borrower (API-010)."""
    borrower = (
        db.query(Borrower)
        .filter(
            Borrower.id == borrower_id,
            Borrower.institution_id == current_user.institution_id,
        )
        .first()
    )
    if not borrower:
        raise NotFoundException("Borrower not found")

    if borrower.branch_id:
        verify_branch_access(borrower.branch_id, current_user)

    if payload.display_name is not None:
        borrower.display_name = payload.display_name
    if payload.contact_phone is not None:
        borrower.contact_phone = payload.contact_phone
    if payload.contact_email is not None:
        borrower.contact_email = payload.contact_email
    if payload.status is not None:
        borrower.status = payload.status

    db.commit()
    db.refresh(borrower)

    req_id = getattr(request.state, "request_id", None) or request_id_ctx.get() or "unknown"
    log_audit_event(
        db=db,
        institution_id=current_user.institution_id,
        action="BORROWER_UPDATED",
        object_type="borrower",
        object_id=borrower.id,
        request_id=req_id,
        actor_id=current_user.id,
    )

    return BorrowerResponse.model_validate(borrower)
