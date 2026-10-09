"""FastAPI dependencies for database sessions, authentication, and authorization."""

import uuid
from typing import Callable, Generator, List, Optional
from fastapi import Depends, Header, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session, joinedload
from app.core.errors import ForbiddenException, UnauthorizedException
from app.core.permissions import ROLE_PLATFORM_OPERATOR, ROLE_INSTITUTION_ADMIN, has_any_role
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.institution import Branch, Institution, UserBranch
from app.models.user import Permission, Role, User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Validate bearer token and resolve authenticated User entity."""
    if not token:
        # Check raw Authorization header fallback
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:].strip()

    if not token:
        raise UnauthorizedException("Authentication bearer token required")

    payload = decode_access_token(token)
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedException("Invalid token: missing subject claim")

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise UnauthorizedException("Invalid token: malformed subject UUID")

    user = (
        db.query(User)
        .options(
            joinedload(User.roles).joinedload(Role.permissions),
            joinedload(User.user_branches).joinedload(UserBranch.branch),
            joinedload(User.institution),
        )
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise UnauthorizedException("User account does not exist")

    if user.status != "ACTIVE":
        raise ForbiddenException("User account is inactive or suspended")

    # Store user context on request state for audit logs and trace context
    request.state.current_user = user
    request.state.actor_id = user.id
    request.state.institution_id = user.institution_id

    return user


def require_roles(*allowed_roles: str) -> Callable[[User], User]:
    """Dependency factory verifying that the authenticated user possesses at least one allowed role."""

    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role_codes = [role.code for role in current_user.roles]
        if not has_any_role(user_role_codes, allowed_roles):
            raise ForbiddenException(
                f"Operation requires one of the following roles: {', '.join(allowed_roles)}"
            )
        return current_user

    return role_checker


def verify_tenant_access(
    resource_institution_id: uuid.UUID,
    current_user: User,
) -> None:
    """Verify that current user is authorized to access resources belonging to target institution."""
    user_role_codes = [role.code for role in current_user.roles]
    if ROLE_PLATFORM_OPERATOR in user_role_codes:
        return

    if current_user.institution_id != resource_institution_id:
        raise ForbiddenException("Cross-tenant resource access is forbidden")


def verify_branch_access(
    resource_branch_id: uuid.UUID,
    current_user: User,
) -> None:
    """Verify that user is authorized to access resources belonging to a specific branch."""
    user_role_codes = [role.code for role in current_user.roles]
    if ROLE_PLATFORM_OPERATOR in user_role_codes or ROLE_INSTITUTION_ADMIN in user_role_codes:
        return

    allowed_branch_ids = {ub.branch_id for ub in current_user.user_branches}
    if resource_branch_id not in allowed_branch_ids:
        raise ForbiddenException("User does not have access to the specified branch scope")
