"""Schemas for institution, branch, and user administration."""

import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class InstitutionResponse(BaseModel):
    """Institutional tenant details (API-002)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    status: str
    created_at: datetime
    updated_at: datetime


class BranchResponse(BaseModel):
    """Branch scope details (API-003)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    institution_id: uuid.UUID
    name: str
    code: str
    created_at: datetime
    updated_at: datetime


class UserRoleSummary(BaseModel):
    """Role summary embedded in user response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    code: str
    description: str


class UserBranchScope(BaseModel):
    """Branch scope assignment embedded in user response."""

    model_config = ConfigDict(from_attributes=True)

    branch_id: uuid.UUID
    branch_name: Optional[str] = None
    branch_code: Optional[str] = None
    scope: str


class UserSummaryResponse(BaseModel):
    """Institutional user profile summary (API-004)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    institution_id: uuid.UUID
    email: str
    full_name: str
    status: str
    roles: List[str]
    branches: List[UserBranchScope]
    created_at: datetime
    updated_at: datetime


class UserInviteRequest(BaseModel):
    """Payload to invite a new staff member to the institution (API-005)."""

    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    full_name: str = Field(..., min_length=2, max_length=255)
    roles: List[str] = Field(default_factory=lambda: ["LOAN_OFFICER"])
    branch_ids: List[uuid.UUID] = Field(default_factory=list)


class UpdateUserRolesRequest(BaseModel):
    """Payload to alter a user's role assignments and branch scopes (API-006)."""

    roles: List[str] = Field(..., min_length=1)
    branch_ids: Optional[List[uuid.UUID]] = None
