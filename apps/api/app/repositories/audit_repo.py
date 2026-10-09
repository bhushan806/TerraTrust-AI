"""Audit repository for immutable append-only event logging."""

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.core.logging import redact_sensitive_data
from app.models.audit import AuditEvent


def log_audit_event(
    db: Session,
    institution_id: uuid.UUID,
    action: str,
    object_type: str,
    object_id: uuid.UUID,
    request_id: str,
    actor_id: Optional[uuid.UUID] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> AuditEvent:
    """Record an immutable audit event in the database."""
    safe_metadata = redact_sensitive_data(metadata) if metadata else None

    event = AuditEvent(
        institution_id=institution_id,
        actor_id=actor_id,
        action=action,
        object_type=object_type,
        object_id=object_id,
        request_id=request_id,
        timestamp=datetime.now(timezone.utc),
        metadata_json=safe_metadata,
    )
    db.add(event)
    db.commit()
    return event
