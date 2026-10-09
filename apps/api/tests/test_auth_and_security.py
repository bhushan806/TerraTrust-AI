"""Tests for authentication, authorization (RBAC), multi-tenancy, and security lifecycle."""

import datetime
from datetime import timezone
import uuid
import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.api.deps import (
    get_current_user,
    require_roles,
    verify_branch_access,
    verify_tenant_access,
)
from app.config import get_settings
from app.core.errors import ForbiddenException, RateLimitException, UnauthorizedException
from app.core.permissions import (
    ROLE_INSTITUTION_ADMIN,
    ROLE_LOAN_OFFICER,
    ROLE_PLATFORM_OPERATOR,
    ROLE_RISK_ANALYST,
)
from app.core.rate_limit import InMemoryRateLimiter, login_rate_limiter
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.audit import AuditEvent
from app.models.institution import Branch, Institution, UserBranch
from app.models.user import Role, User


def test_password_hashing_and_verification():
    """Verify bcrypt salt hashing and positive/negative verification."""
    password = "SuperSecretPassword123!"
    hashed = hash_password(password)

    assert hashed != password
    assert hashed.startswith("$2b$") or hashed.startswith("$2a$")
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_jwt_lifecycle_and_claims():
    """Verify JWT encoding, claim integrity, and decoding."""
    subject_id = str(uuid.uuid4())
    institution_id = str(uuid.uuid4())
    roles = [ROLE_LOAN_OFFICER]
    email = "officer@test.local"

    token = create_access_token(
        subject=subject_id,
        institution_id=institution_id,
        roles=roles,
        email=email,
    )

    claims = decode_access_token(token)
    assert claims["sub"] == subject_id
    assert claims["institution_id"] == institution_id
    assert claims["roles"] == roles
    assert claims["email"] == email
    assert claims["iss"] == "fin03-backend"
    assert claims["aud"] == "fin03-api"


def test_jwt_expired_token():
    """Verify that an expired token raises UnauthorizedException."""
    token = create_access_token(
        subject=str(uuid.uuid4()),
        institution_id=str(uuid.uuid4()),
        roles=[ROLE_LOAN_OFFICER],
        email="expired@test.local",
        expires_delta=datetime.timedelta(seconds=-10),
    )

    with pytest.raises(UnauthorizedException) as exc_info:
        decode_access_token(token)
    assert "expired" in str(exc_info.value.message).lower()


def test_jwt_tampered_token():
    """Verify that a tampered token signature raises UnauthorizedException."""
    token = create_access_token(
        subject=str(uuid.uuid4()),
        institution_id=str(uuid.uuid4()),
        roles=[ROLE_LOAN_OFFICER],
        email="tamper@test.local",
    )
    tampered_token = token[:-5] + "XXXXX"

    with pytest.raises(UnauthorizedException) as exc_info:
        decode_access_token(tampered_token)
    assert "invalid" in str(exc_info.value.message).lower()


def test_login_success(seeded_client: TestClient, seeded_db_session: Session):
    """Verify successful login returns valid JWT token and user profile."""
    login_rate_limiter.reset()

    response = seeded_client.post(
        "/api/v1/auth/login",
        json={"email": "officer@fin03.local", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] == 28800

    user_info = data["user"]
    assert user_info["email"] == "officer@fin03.local"
    assert "LOAN_OFFICER" in user_info["roles"]
    assert user_info["institution_name"] == "Apex Rural Development Bank"
    assert "hashed_password" not in user_info
    assert "password" not in user_info

    # Verify audit event recorded
    audit = (
        seeded_db_session.query(AuditEvent)
        .filter(AuditEvent.action == "USER_LOGIN_SUCCESS")
        .first()
    )
    assert audit is not None
    assert audit.object_type == "user"


def test_login_invalid_password(seeded_client: TestClient, error_schema_validator):
    """Verify invalid password returns 401 conforming to error schema."""
    login_rate_limiter.reset()

    response = seeded_client.post(
        "/api/v1/auth/login",
        json={"email": "officer@fin03.local", "password": "IncorrectPassword!"},
    )
    assert response.status_code == 401
    body = response.json()
    error_schema_validator.validate(body)
    assert body["error"]["code"] == "UNAUTHENTICATED"


def test_login_nonexistent_user(seeded_client: TestClient, error_schema_validator):
    """Verify nonexistent user returns 401."""
    login_rate_limiter.reset()

    response = seeded_client.post(
        "/api/v1/auth/login",
        json={"email": "unknown@fin03.local", "password": "password123"},
    )
    assert response.status_code == 401
    body = response.json()
    error_schema_validator.validate(body)
    assert body["error"]["code"] == "UNAUTHENTICATED"


def test_login_inactive_user(seeded_client: TestClient, seeded_db_session: Session):
    """Verify disabled/inactive user cannot log in (403 Forbidden)."""
    login_rate_limiter.reset()

    officer = seeded_db_session.query(User).filter_by(email="officer@fin03.local").first()
    officer.status = "SUSPENDED"
    seeded_db_session.commit()

    response = seeded_client.post(
        "/api/v1/auth/login",
        json={"email": "officer@fin03.local", "password": "password123"},
    )
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"

    # Restore status
    officer.status = "ACTIVE"
    seeded_db_session.commit()


def test_get_current_user_unauthenticated(seeded_client: TestClient, error_schema_validator):
    """Verify GET /auth/me returns 401 without Bearer token."""
    response = seeded_client.get("/api/v1/auth/me")
    assert response.status_code == 401
    body = response.json()
    error_schema_validator.validate(body)
    assert body["error"]["code"] == "UNAUTHENTICATED"


def test_get_current_user_authenticated(seeded_client: TestClient):
    """Verify GET /auth/me returns profile for authenticated user (API-001)."""
    login_rate_limiter.reset()

    # Login first
    login_resp = seeded_client.post(
        "/api/v1/auth/login",
        json={"email": "analyst@fin03.local", "password": "password123"},
    )
    token = login_resp.json()["access_token"]

    # Request /auth/me with Bearer token
    response = seeded_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    profile = response.json()
    assert profile["email"] == "analyst@fin03.local"
    assert "RISK_ANALYST" in profile["roles"]
    assert profile["institution_name"] == "Apex Rural Development Bank"


def test_logout(seeded_client: TestClient, seeded_db_session: Session):
    """Verify POST /auth/logout records audit event."""
    login_rate_limiter.reset()

    login_resp = seeded_client.post(
        "/api/v1/auth/login",
        json={"email": "admin@fin03.local", "password": "password123"},
    )
    token = login_resp.json()["access_token"]

    response = seeded_client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully logged out"

    audit = (
        seeded_db_session.query(AuditEvent)
        .filter(AuditEvent.action == "USER_LOGOUT")
        .first()
    )
    assert audit is not None


def test_role_based_access_control(seeded_client: TestClient):
    """Verify RBAC dependency denies unauthorized roles with 403."""
    # Obtain token for LOAN_OFFICER
    login_rate_limiter.reset()
    login_resp = seeded_client.post(
        "/api/v1/auth/login",
        json={"email": "officer@fin03.local", "password": "password123"},
    )
    officer_token = login_resp.json()["access_token"]

    # Direct unit test of require_roles dependency
    checker = require_roles(ROLE_INSTITUTION_ADMIN)

    # Mock user with LOAN_OFFICER
    mock_role = Role(id=uuid.uuid4(), code=ROLE_LOAN_OFFICER, description="")
    mock_user = User(
        id=uuid.uuid4(),
        institution_id=uuid.uuid4(),
        email="officer@test.local",
        full_name="Officer",
        status="ACTIVE",
    )
    mock_user.roles = [mock_role]

    with pytest.raises(ForbiddenException) as exc_info:
        checker(current_user=mock_user)
    assert exc_info.value.status_code == 403
    assert "INSTITUTION_ADMIN" in str(exc_info.value.message)


def test_tenant_isolation_enforcement():
    """Verify cross-tenant access is rejected with 403."""
    inst1 = uuid.uuid4()
    inst2 = uuid.uuid4()

    user = User(
        id=uuid.uuid4(),
        institution_id=inst1,
        email="u@inst1.local",
        full_name="User 1",
        status="ACTIVE",
    )
    user.roles = [Role(id=uuid.uuid4(), code=ROLE_LOAN_OFFICER, description="")]

    # Accessing own tenant passes
    verify_tenant_access(inst1, user)

    # Accessing different tenant fails
    with pytest.raises(ForbiddenException):
        verify_tenant_access(inst2, user)


def test_branch_scope_isolation_enforcement():
    """Verify branch-level access control restricts access outside assigned branch."""
    branch1 = uuid.uuid4()
    branch2 = uuid.uuid4()

    user = User(
        id=uuid.uuid4(),
        institution_id=uuid.uuid4(),
        email="u@branch1.local",
        full_name="User Branch 1",
        status="ACTIVE",
    )
    user.roles = [Role(id=uuid.uuid4(), code=ROLE_LOAN_OFFICER, description="")]
    user.user_branches = [
        UserBranch(
            id=uuid.uuid4(),
            user_id=user.id,
            branch_id=branch1,
            scope="BRANCH_READ_WRITE",
        )
    ]

    # Accessing assigned branch passes
    verify_branch_access(branch1, user)

    # Accessing unassigned branch raises 403
    with pytest.raises(ForbiddenException):
        verify_branch_access(branch2, user)


def test_rate_limiter():
    """Verify sliding-window rate limiter triggers RateLimitException when threshold exceeded."""
    limiter = InMemoryRateLimiter(max_requests=3, window_seconds=60)
    key = "127.0.0.1:test@example.com"

    limiter.check(key)
    limiter.check(key)
    limiter.check(key)

    with pytest.raises(RateLimitException):
        limiter.check(key)

    # Reset allows access again
    limiter.reset(key)
    limiter.check(key)
