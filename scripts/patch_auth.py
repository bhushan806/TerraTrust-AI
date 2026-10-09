import os
from pathlib import Path

auth_py_path = Path(r"c:\Users\pbhus\Desktop\Fintech\apps\api\app\api\v1\endpoints\auth.py")
content = auth_py_path.read_text(encoding="utf-8")

# Update imports
content = content.replace(
    "from app.schemas.auth import LoginRequest, TokenResponse, UserProfileResponse, build_user_profile",
    "from app.schemas.auth import LoginRequest, TokenResponse, UserProfileResponse, build_user_profile, FarmerRegisterRequest, FarmerLoginRequest, OfficerRegisterRequest\nfrom app.models.borrower import Borrower\nfrom app.models.institution import Institution\nfrom app.core.security import hash_password\nfrom app.core.errors import ConflictException, NotFoundException\nfrom app.schemas.borrower import BorrowerResponse\nimport uuid\nfrom datetime import datetime\nfrom typing import Union"
)

# New endpoints code
new_endpoints = """

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

    existing = db.query(Borrower).filter(Borrower.contact_phone == payload.contact_phone).first()
    if existing:
        raise ConflictException("Phone number already registered")

    ext_ref = f"FARMER-{payload.contact_phone[-4:]}-{int(datetime.now().timestamp())}"
    
    borrower = Borrower(
        institution_id=institution.id,
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
    summary="Register a new loan officer (Pending Approval)",
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
        status="PENDING_APPROVAL",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {"message": "Officer registered successfully and is pending approval."}

"""

content = content + new_endpoints
auth_py_path.write_text(content, encoding="utf-8")
print("auth.py updated successfully.")
