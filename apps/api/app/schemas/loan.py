"""Schemas for Loan Applications, Schedules, and Repayments."""

import uuid
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class LoanApplicationCreate(BaseModel):
    """Payload to submit a new loan application (API-016)."""

    borrower_id: Optional[uuid.UUID] = None
    amount: float = Field(..., gt=0.0, description="Requested principal amount")
    currency: str = Field(default="INR", max_length=10)
    purpose: str = Field(..., min_length=3, max_length=255)


class LoanApplicationStatusUpdate(BaseModel):
    """Payload to update loan application review status."""

    status: str = Field(..., max_length=50, description="New status (e.g. SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED)")
    notes: Optional[str] = None


class LoanApplicationResponse(BaseModel):
    """Loan application profile representation (API-017)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    institution_id: uuid.UUID
    borrower_id: uuid.UUID
    branch_id: Optional[uuid.UUID] = None
    amount: float
    currency: str
    purpose: str
    status: str
    submitted_at: datetime
    created_at: datetime
    updated_at: datetime
    borrower_name: Optional[str] = None
    borrower_phone: Optional[str] = None


class RepaymentScheduleItemCreate(BaseModel):
    """Single installment definition."""

    installment_number: int = Field(..., ge=1)
    due_date: date
    principal_component: float = Field(..., ge=0.0)
    interest_component: float = Field(..., ge=0.0)
    amount_due: Optional[float] = None
    currency: str = Field(default="INR", max_length=10)


class RepaymentScheduleCreate(BaseModel):
    """Payload to create a new version of the repayment schedule (API-018)."""

    version: int = Field(default=1, ge=1)
    installments: List[RepaymentScheduleItemCreate] = Field(..., min_length=1)


class RepaymentScheduleItemResponse(BaseModel):
    """Single installment schedule details."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    loan_id: uuid.UUID
    version: int
    installment_number: int
    due_date: date
    amount_due: float
    principal_component: float
    interest_component: float
    currency: str
    created_at: datetime


class RepaymentEventCreate(BaseModel):
    """Payload to record a repayment event (API-019)."""

    schedule_id: Optional[uuid.UUID] = None
    amount_paid: float = Field(..., gt=0.0)
    currency: str = Field(default="INR", max_length=10)
    source_id: str = Field(..., min_length=3, max_length=100)


class RepaymentEventResponse(BaseModel):
    """Recorded repayment event details."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    loan_id: uuid.UUID
    schedule_id: Optional[uuid.UUID] = None
    paid_at: datetime
    amount_paid: float
    currency: str
    status: str
    source_id: str
    created_at: datetime
