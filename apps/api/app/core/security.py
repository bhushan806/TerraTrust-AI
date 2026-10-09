"""Security utilities: password hashing with bcrypt and JWT token lifecycle."""

import datetime
from datetime import timezone
from typing import Any, Dict, List, Optional
import bcrypt
import jwt
from app.config import get_settings
from app.core.errors import UnauthorizedException

settings = get_settings()

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    """Hash plain password using bcrypt with standard salt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against stored bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(
    subject: str,
    institution_id: str,
    roles: List[str],
    email: str,
    expires_delta: Optional[datetime.timedelta] = None,
    extra_claims: Optional[Dict[str, Any]] = None,
) -> str:
    """Create a signed JWT access token."""
    now = datetime.datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + datetime.timedelta(hours=8)

    payload: Dict[str, Any] = {
        "sub": str(subject),
        "iss": "fin03-backend",
        "aud": "fin03-api",
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "institution_id": str(institution_id),
        "roles": roles,
        "email": email,
    }

    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate JWT access token claims."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[ALGORITHM],
            audience="fin03-api",
            issuer="fin03-backend",
            options={"require": ["exp", "sub", "institution_id"]},
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise UnauthorizedException("Access token has expired")
    except jwt.InvalidTokenError as exc:
        raise UnauthorizedException(f"Invalid access token: {str(exc)}")
