"""Authentication and user profile schemas conforming to FIN-03 contracts."""

import uuid
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    """User credentials payload for obtaining an access token."""

    email: str = Field(
        ...,
        pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
        description="User corporate/institution email address",
    )
    password: str = Field(..., min_length=6, description="User password")


class OfficerRegisterRequest(BaseModel):
    """Payload to register a new loan officer."""

    full_name: str = Field(..., min_length=2, max_length=255)
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    password: str = Field(..., min_length=8)
    institution_id: Optional[uuid.UUID] = None
    branch_id: Optional[uuid.UUID] = None


class FarmerRegisterRequest(BaseModel):
    """Payload to register a new farmer via phone."""

    display_name: str = Field(..., min_length=2, max_length=255)
    contact_phone: str = Field(..., min_length=10, max_length=50)
    password: str = Field(..., min_length=6)


class FarmerLoginRequest(BaseModel):
    """Farmer credentials payload for obtaining an access token."""

    contact_phone: str = Field(..., min_length=10, max_length=50)
    password: str = Field(..., min_length=6)


class UserBranchSummary(BaseModel):
    """Branch scope granted to user."""

    model_config = ConfigDict(from_attributes=True)

    branch_id: uuid.UUID
    branch_name: str
    branch_code: str
    scope: str


class UserProfileResponse(BaseModel):
    """Authenticated user profile representation (API-001 /auth/me)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str
    status: str
    institution_id: uuid.UUID
    institution_name: str
    roles: List[str]
    permissions: List[str]
    branches: List[UserBranchSummary]


class TokenResponse(BaseModel):
    """OAuth2 / JWT bearer token response."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int = 28800
    user: UserProfileResponse


def build_user_profile(user: object) -> UserProfileResponse:
    """Build UserProfileResponse from User ORM model."""
    role_codes = [r.code for r in getattr(user, "roles", [])]
    perm_codes = sorted(
        list(
            {
                p.code
                for r in getattr(user, "roles", [])
                for p in getattr(r, "permissions", [])
            }
        )
    )
    branch_summaries = []
    for ub in getattr(user, "user_branches", []):
        branch = getattr(ub, "branch", None)
        branch_summaries.append(
            UserBranchSummary(
                branch_id=ub.branch_id,
                branch_name=branch.name if branch else "",
                branch_code=branch.code if branch else "",
                scope=ub.scope,
            )
        )

    institution = getattr(user, "institution", None)
    inst_name = institution.name if institution else "Default Institution"

    return UserProfileResponse(
        id=getattr(user, "id"),
        email=getattr(user, "email"),
        full_name=getattr(user, "full_name"),
        status=getattr(user, "status"),
        institution_id=getattr(user, "institution_id"),
        institution_name=inst_name,
        roles=role_codes,
        permissions=perm_codes,
        branches=branch_summaries,
    )
