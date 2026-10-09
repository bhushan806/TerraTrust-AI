"""Asynchronous Data Import endpoints."""

import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Header, Request, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_db, require_roles
from app.core.errors import NotFoundException
from app.core.logging import request_id_ctx
from app.core.permissions import ROLE_INSTITUTION_ADMIN, ROLE_PLATFORM_OPERATOR, ROLE_RISK_ANALYST
from app.models.job import Job
from app.models.user import User
from app.repositories.audit_repo import log_audit_event
from app.schemas.data_import import DataImportCreate, DataImportResponse

router = APIRouter(prefix="/data-imports", tags=["Data Ingestion & Jobs"])


@router.post(
    "",
    response_model=DataImportResponse,
    operation_id="createDataImport",
    summary="Create DataImport",
    status_code=status.HTTP_202_ACCEPTED,
)
def create_data_import(
    payload: DataImportCreate,
    request: Request,
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
    current_user: User = Depends(
        require_roles(ROLE_RISK_ANALYST, ROLE_INSTITUTION_ADMIN, ROLE_PLATFORM_OPERATOR)
    ),
    db: Session = Depends(get_db),
) -> DataImportResponse:
    """Queue an asynchronous data import pipeline task (API-021)."""
    if idempotency_key:
        existing = (
            db.query(Job)
            .filter(
                Job.institution_id == current_user.institution_id,
                Job.idempotency_key == idempotency_key,
            )
            .first()
        )
        if existing:
            return DataImportResponse.model_validate(existing)

    job = Job(
        institution_id=current_user.institution_id,
        type=f"IMPORT_{payload.dataset_type.upper()}",
        status="QUEUED",
        idempotency_key=idempotency_key,
        payload_json={"dataset_type": payload.dataset_type, "source": payload.source},
        available_at=datetime.now(timezone.utc),
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    req_id = getattr(request.state, "request_id", None) or request_id_ctx.get() or "unknown"
    log_audit_event(
        db=db,
        institution_id=current_user.institution_id,
        action="DATA_IMPORT_QUEUED",
        object_type="job",
        object_id=job.id,
        request_id=req_id,
        actor_id=current_user.id,
        metadata={"dataset_type": payload.dataset_type, "source": payload.source},
    )

    return DataImportResponse.model_validate(job)


@router.get(
    "/{job_id}",
    response_model=DataImportResponse,
    operation_id="getDataImport",
    summary="Get DataImport",
    status_code=status.HTTP_200_OK,
)
def get_data_import_status(
    job_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DataImportResponse:
    """Retrieve execution status of an async data import job (API-022)."""
    job = (
        db.query(Job)
        .filter(Job.id == job_id, Job.institution_id == current_user.institution_id)
        .first()
    )
    if not job:
        raise NotFoundException("Data import job not found")

    return DataImportResponse.model_validate(job)
