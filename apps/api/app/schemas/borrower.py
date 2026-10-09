"""Borrower profile schemas conforming to domain models and PII constraints."""

import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class BorrowerCreate(BaseModel):
    """Payload to create a new borrower record (API-008)."""

    branch_id: uuid.UUID
    external_ref: str = Field(..., min_length=2, max_length=100)
    display_name: str = Field(..., min_length=1, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=50)
    contact_email: Optional[str] = Field(None, max_length=255)


class BorrowerUpdate(BaseModel):
    """Payload to update an existing borrower record (API-010)."""

    display_name: Optional[str] = Field(None, min_length=1, max_length=255)
    contact_phone: Optional[str] = Field(None, max_length=50)
    contact_email: Optional[str] = Field(None, max_length=255)
    status: Optional[str] = Field(None, max_length=50)


class BorrowerResponse(BaseModel):
    """Detailed borrower profile representation (API-009)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    institution_id: uuid.UUID
    branch_id: Optional[uuid.UUID] = None
    external_ref: str
    display_name: str
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime


class BorrowerListResponse(BaseModel):
    """Paginated list of borrower records (API-007)."""

    items: List[BorrowerResponse]
    total: int
    limit: int
    offset: int
