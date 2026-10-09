"""Institution, Branch, and User management endpoints."""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session, joinedload
from app.api.deps import get_current_user, get_db, require_roles
from app.core.errors import ConflictException, NotFoundException
from app.core.logging import request_id_ctx
from app.core.permissions import (
    ROLE_INSTITUTION_ADMIN,
    ROLE_LOAN_OFFICER,
    ROLE_PLATFORM_OPERATOR,
    ROLE_RISK_ANALYST,
)
from app.core.security import hash_password
from app.models.institution import Branch, Institution, UserBranch
from app.models.user import Role, User
from app.repositories.audit_repo import log_audit_event
from app.schemas.institution import (
    BranchResponse,
    InstitutionResponse,
    UpdateUserRolesRequest,
    UserBranchScope,
    UserInviteRequest,
    UserSummaryResponse,
)

router = APIRouter(tags=["Tenancy & Administration"])


@router.get(
    "/institutions/current",
    response_model=InstitutionResponse,
    operation_id="getCurrentInstitution",
    summary="Get CurrentInstitution",
    status_code=status.HTTP_200_OK,
)
def get_current_institution(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> InstitutionResponse:
    """Retrieve tenant details for the authenticated user's institution (API-002)."""
    institution = db.query(Institution).filter(Institution.id == current_user.institution_id).first()
    if not institution:
        raise NotFoundException("Institution record not found")
    return InstitutionResponse.model_validate(institution)


@router.get(
    "/branches",
    response_model=List[BranchResponse],
    operation_id="listBranches",
    summary="List Branches",
    status_code=status.HTTP_200_OK,
)
def list_branches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[BranchResponse]:
    """List scoped branches for the current institution (API-003)."""
    branches = (
        db.query(Branch)
        .filter(Branch.institution_id == current_user.institution_id)
        .order_by(Branch.name)
        .all()
    )
    return [BranchResponse.model_validate(b) for b in branches]


@router.get(
    "/users",
    response_model=List[UserSummaryResponse],
    operation_id="listUsers",
    summary="List Users",
    status_code=status.HTTP_200_OK,
)
def list_users(
    current_user: User = Depends(require_roles(ROLE_INSTITUTION_ADMIN, ROLE_PLATFORM_OPERATOR)),
    db: Session = Depends(get_db),
) -> List[UserSummaryResponse]:
    """List staff accounts within the current institution (API-004)."""
    users = (
        db.query(User)
        .options(
            joinedload(User.roles),
            joinedload(User.user_branches).joinedload(UserBranch.branch),
        )
        .filter(User.institution_id == current_user.institution_id)
        .order_by(User.created_at.desc())
        .all()
    )

    results = []
    for u in users:
        role_codes = [r.code for r in u.roles]
        branches = [
            UserBranchScope(
                branch_id=ub.branch_id,
                branch_name=ub.branch.name if ub.branch else None,
                branch_code=ub.branch.code if ub.branch else None,
                scope=ub.scope,
            )
            for ub in u.user_branches
        ]
        results.append(
            UserSummaryResponse(
                id=u.id,
                institution_id=u.institution_id,
                email=u.email,
                full_name=u.full_name,
                status=u.status,
                roles=role_codes,
                branches=branches,
                created_at=u.created_at,
                updated_at=u.updated_at,
            )
        )
    return results


@router.post(
    "/users/invitations",
    response_model=UserSummaryResponse,
    operation_id="inviteUser",
    summary="Invite User",
    status_code=status.HTTP_201_CREATED,
)
def invite_user(
    request: Request,
    payload: UserInviteRequest,
    current_user: User = Depends(require_roles(ROLE_INSTITUTION_ADMIN, ROLE_PLATFORM_OPERATOR)),
    db: Session = Depends(get_db),
) -> UserSummaryResponse:
    """Invite and provision a new user within the current institution (API-005)."""
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise ConflictException(f"User with email '{payload.email}' already exists")

    new_user = User(
        institution_id=current_user.institution_id,
        email=payload.email.lower(),
        full_name=payload.full_name,
        hashed_password=hash_password("TemporaryPassword123!"),
        status="ACTIVE",
    )

    # Attach roles
    matched_roles = db.query(Role).filter(Role.code.in_(payload.roles)).all()
    new_user.roles = matched_roles

    db.add(new_user)
    db.flush()

    # Assign branch scopes
    for b_id in payload.branch_ids:
        branch = (
            db.query(Branch)
            .filter(Branch.id == b_id, Branch.institution_id == current_user.institution_id)
            .first()
        )
        if branch:
            user_branch = UserBranch(
                user_id=new_user.id,
                branch_id=branch.id,
                scope="BRANCH_READ_WRITE",
            )
            db.add(user_branch)

    db.commit()
    db.refresh(new_user)

    req_id = getattr(request.state, "request_id", None) or request_id_ctx.get() or "unknown"
    log_audit_event(
        db=db,
        institution_id=current_user.institution_id,
        action="USER_INVITED",
        object_type="user",
        object_id=new_user.id,
        request_id=req_id,
        actor_id=current_user.id,
        metadata={"email": new_user.email, "roles": payload.roles},
    )

    role_codes = [r.code for r in new_user.roles]
    branches = [
        UserBranchScope(
            branch_id=ub.branch_id,
            branch_name=ub.branch.name if ub.branch else None,
            branch_code=ub.branch.code if ub.branch else None,
            scope=ub.scope,
        )
        for ub in new_user.user_branches
    ]
    return UserSummaryResponse(
        id=new_user.id,
        institution_id=new_user.institution_id,
        email=new_user.email,
        full_name=new_user.full_name,
        status=new_user.status,
        roles=role_codes,
        branches=branches,
        created_at=new_user.created_at,
        updated_at=new_user.updated_at,
    )


@router.patch(
    "/users/{user_id}/roles",
    response_model=UserSummaryResponse,
    operation_id="updateUserRoles",
    summary="Update User Roles",
    status_code=status.HTTP_200_OK,
)
def update_user_roles(
    user_id: uuid.UUID,
    payload: UpdateUserRolesRequest,
    request: Request,
    current_user: User = Depends(require_roles(ROLE_INSTITUTION_ADMIN, ROLE_PLATFORM_OPERATOR)),
    db: Session = Depends(get_db),
) -> UserSummaryResponse:
    """Alter user roles and branch scopes (API-006)."""
    target_user = (
        db.query(User)
        .options(
            joinedload(User.roles),
            joinedload(User.user_branches).joinedload(UserBranch.branch),
        )
        .filter(User.id == user_id, User.institution_id == current_user.institution_id)
        .first()
    )
    if not target_user:
        raise NotFoundException("User not found in current institution")

    matched_roles = db.query(Role).filter(Role.code.in_(payload.roles)).all()
    target_user.roles = matched_roles

    if payload.branch_ids is not None:
        # Clear existing branch assignments
        db.query(UserBranch).filter(UserBranch.user_id == target_user.id).delete()
        for b_id in payload.branch_ids:
            branch = (
                db.query(Branch)
                .filter(Branch.id == b_id, Branch.institution_id == current_user.institution_id)
                .first()
            )
            if branch:
                db.add(
                    UserBranch(
                        user_id=target_user.id,
                        branch_id=branch.id,
                        scope="BRANCH_READ_WRITE",
                    )
                )

    db.commit()
    db.refresh(target_user)

    req_id = getattr(request.state, "request_id", None) or request_id_ctx.get() or "unknown"
    log_audit_event(
        db=db,
        institution_id=current_user.institution_id,
        action="USER_ROLES_UPDATED",
        object_type="user",
        object_id=target_user.id,
        request_id=req_id,
        actor_id=current_user.id,
        metadata={"new_roles": payload.roles},
    )

    role_codes = [r.code for r in target_user.roles]
    branches = [
        UserBranchScope(
            branch_id=ub.branch_id,
            branch_name=ub.branch.name if ub.branch else None,
            branch_code=ub.branch.code if ub.branch else None,
            scope=ub.scope,
        )
        for ub in target_user.user_branches
    ]
    return UserSummaryResponse(
        id=target_user.id,
        institution_id=target_user.institution_id,
        email=target_user.email,
        full_name=target_user.full_name,
        status=target_user.status,
        roles=role_codes,
        branches=branches,
        created_at=target_user.created_at,
        updated_at=target_user.updated_at,
    )
