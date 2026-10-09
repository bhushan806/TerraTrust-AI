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
from app.schemas.auth import LoginRequest, TokenResponse, UserProfileResponse, build_user_profile, FarmerRegisterRequest, FarmerLoginRequest, OfficerRegisterRequest
from app.models.borrower import Borrower
from app.models.institution import Institution
from app.core.security import hash_password
from app.core.errors import ConflictException, NotFoundException
from app.schemas.borrower import BorrowerResponse
import uuid
from datetime import datetime
from typing import Union

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


@router.post(
    "/farmer/register",
    response_model=BorrowerResponse,
    summary="Register a new farmer via phone",
    status_code=status.HTTP_201_CREATED,
)
def register_farmer(
    request: Request,
    payload: FarmerRegisterRequest,
    db: Session = Depends(get_db),
) -> BorrowerResponse:
    # Use default institution or find first
    institution = db.query(Institution).filter(Institution.name == "Apex Rural Development Bank").first()
    if not institution:
        institution = db.query(Institution).first()
    if not institution:
        raise NotFoundException("No default institution found")

    branch = db.query(Branch).filter(Branch.institution_id == institution.id).first()
    branch_id = branch.id if branch else None

    existing = db.query(Borrower).filter(Borrower.contact_phone == payload.contact_phone).first()
    if existing:
        raise ConflictException("Phone number already registered")

    ext_ref = f"FARMER-{payload.contact_phone[-4:]}-{int(datetime.now().timestamp())}"
    
    borrower = Borrower(
        institution_id=institution.id,
        branch_id=branch_id,
        external_ref=ext_ref,
        display_name=payload.display_name,
        contact_phone=payload.contact_phone,
        hashed_password=hash_password(payload.password),
        status="ACTIVE",
    )
    db.add(borrower)
    db.commit()
    db.refresh(borrower)

    req_id = getattr(request.state, "request_id", None) or request_id_ctx.get() or "unknown"
    log_audit_event(
        db=db,
        institution_id=institution.id,
        action="FARMER_REGISTERED",
        object_type="borrower",
        object_id=borrower.id,
        request_id=req_id,
        actor_id=None,
    )
    return BorrowerResponse.model_validate(borrower)


@router.post(
    "/farmer/login",
    response_model=TokenResponse,
    summary="Authenticate farmer and issue JWT",
    status_code=status.HTTP_200_OK,
)
def login_farmer(
    request: Request,
    credentials: FarmerLoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    client_ip = request.client.host if request.client else "unknown"
    rate_limit_key = f"{client_ip}:{credentials.contact_phone}"
    login_rate_limiter.check(rate_limit_key)

    borrower = db.query(Borrower).filter(Borrower.contact_phone == credentials.contact_phone).first()

    if not borrower or not borrower.hashed_password or not verify_password(credentials.password, borrower.hashed_password):
        raise UnauthorizedException("Invalid phone number or password")

    if borrower.status != "ACTIVE":
        raise ForbiddenException("Farmer account is inactive or suspended")

    token = create_access_token(
        subject=str(borrower.id),
        institution_id=str(borrower.institution_id),
        roles=["FARMER"],
        email=borrower.contact_email,
        phone=borrower.contact_phone,
    )

    req_id = getattr(request.state, "request_id", None) or request_id_ctx.get() or "unknown"
    log_audit_event(
        db=db,
        institution_id=borrower.institution_id,
        action="FARMER_LOGIN_SUCCESS",
        object_type="borrower",
        object_id=borrower.id,
        request_id=req_id,
        actor_id=borrower.id,
        metadata={"client_ip": client_ip},
    )

    # Build a mock user profile for TokenResponse compliance, or modify frontend to handle Borrower directly
    # To keep TokenResponse satisfied:
    profile = UserProfileResponse(
        id=borrower.id,
        email=borrower.contact_email or "",
        full_name=borrower.display_name,
        status=borrower.status,
        institution_id=borrower.institution_id,
        institution_name="Apex Rural Development Bank",
        roles=["FARMER"],
        permissions=[],
        branches=[],
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=28800,
        user=profile,
    )


@router.post(
    "/officer/register",
    summary="Register a new loan officer",
    status_code=status.HTTP_201_CREATED,
)
def register_officer(
    request: Request,
    payload: OfficerRegisterRequest,
    db: Session = Depends(get_db),
):
    institution = db.query(Institution).filter(Institution.name == "Apex Rural Development Bank").first()
    if not institution:
        institution = db.query(Institution).first()

    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise ConflictException("Email already registered")

    user = User(
        institution_id=institution.id,
        email=payload.email.lower(),
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        status="ACTIVE",
    )

    # Assign Loan Officer role
    officer_role = db.query(Role).filter(Role.code == "ROLE_LOAN_OFFICER").first()
    if officer_role:
        user.roles.append(officer_role)

    db.add(user)
    db.commit()
    db.refresh(user)

    # Assign default branch
    branch = db.query(Branch).first()
    if branch:
        user_branch = UserBranch(user_id=user.id, branch_id=branch.id)
        db.add(user_branch)
        db.commit()

    return {"message": "Officer registered successfully. You can now sign in."}

