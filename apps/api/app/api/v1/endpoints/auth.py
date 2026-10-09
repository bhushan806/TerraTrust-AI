"""Authentication endpoints for session management, token issuance, and profile retrieval."""

from typing import Any, Dict
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session, joinedload
from app.api.deps import get_current_user, get_db
from app.core.errors import ForbiddenException, UnauthorizedException
from app.core.logging import request_id_ctx
from app.core.rate_limit import login_rate_limiter
from app.core.security import create_access_token, verify_password
from app.models.institution import Branch, UserBranch
from app.models.user import Permission, Role, User
from app.repositories.audit_repo import log_audit_event
from app.schemas.auth import LoginRequest, TokenResponse, UserProfileResponse, build_user_profile

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate user and issue JWT access token",
    status_code=status.HTTP_200_OK,
)
def login(
    request: Request,
    credentials: LoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Validate credentials and return bearer access token with populated user profile."""
    # Enforce brute-force protection rate limit
    client_ip = request.client.host if request.client else "unknown"
    rate_limit_key = f"{client_ip}:{credentials.email.lower()}"
    login_rate_limiter.check(rate_limit_key)

    req_id = getattr(request.state, "request_id", None) or request_id_ctx.get() or "unknown"

    # Fetch user with relations
    user = (
        db.query(User)
        .options(
            joinedload(User.roles).joinedload(Role.permissions),
            joinedload(User.user_branches).joinedload(UserBranch.branch),
            joinedload(User.institution),
        )
        .filter(User.email == credentials.email.lower())
        .first()
    )

    if not user or not user.hashed_password or not verify_password(credentials.password, user.hashed_password):
        # Audit login failure if institution is discoverable
        if user:
            log_audit_event(
                db=db,
                institution_id=user.institution_id,
                action="USER_LOGIN_FAILED",
                object_type="user",
                object_id=user.id,
                request_id=req_id,
                actor_id=None,
                metadata={"reason": "INVALID_CREDENTIALS", "client_ip": client_ip},
            )
        raise UnauthorizedException("Invalid email or password")

    if user.status != "ACTIVE":
        log_audit_event(
            db=db,
            institution_id=user.institution_id,
            action="USER_LOGIN_BLOCKED",
            object_type="user",
            object_id=user.id,
            request_id=req_id,
            actor_id=user.id,
            metadata={"reason": "ACCOUNT_INACTIVE", "status": user.status},
        )
        raise ForbiddenException("User account is inactive or suspended")

    role_codes = [role.code for role in user.roles]
    token = create_access_token(
        subject=str(user.id),
        institution_id=str(user.institution_id),
        roles=role_codes,
        email=user.email,
    )

    # Record successful login audit event
    log_audit_event(
        db=db,
        institution_id=user.institution_id,
        action="USER_LOGIN_SUCCESS",
        object_type="user",
        object_id=user.id,
        request_id=req_id,
        actor_id=user.id,
        metadata={"client_ip": client_ip},
    )

    profile = build_user_profile(user)
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=28800,
        user=profile,
    )


@router.get(
    "/me",
    response_model=UserProfileResponse,
    operation_id="getCurrentUser",
    summary="Get CurrentUser",
    status_code=status.HTTP_200_OK,
)
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> UserProfileResponse:
    """Retrieve profile and assigned permissions for the currently authenticated user (API-001)."""
    return build_user_profile(current_user)


@router.post(
    "/logout",
    summary="Terminate user session and log audit event",
    status_code=status.HTTP_200_OK,
)
def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Record logout audit event."""
    req_id = getattr(request.state, "request_id", None) or request_id_ctx.get() or "unknown"
    log_audit_event(
        db=db,
        institution_id=current_user.institution_id,
        action="USER_LOGOUT",
        object_type="user",
        object_id=current_user.id,
        request_id=req_id,
        actor_id=current_user.id,
    )
    return {"message": "Successfully logged out"}
