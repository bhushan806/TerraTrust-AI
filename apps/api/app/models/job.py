"""Job queue model for database-backed asynchronous background processing."""

import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import JSON, DateTime, ForeignKey, Index, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, CreationTimestampMixin, UUIDPrimaryKeyMixin


class Job(Base, UUIDPrimaryKeyMixin, CreationTimestampMixin):
    """Database-backed job table for idempotent asynchronous background execution."""

    __tablename__ = "jobs"
    __table_args__ = (
        Index("ix_jobs_status_available", "status", "available_at"),
        Index("ix_jobs_idempotency", "institution_id", "idempotency_key", unique=True),
    )

    institution_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=True, index=True
    )
    type: Mapped[str] = mapped_column(
        String(50), nullable=False, doc="ASSESSMENT, DATA_IMPORT, REPORT_GENERATION"
    )
    status: Mapped[str] = mapped_column(
        String(50), default="QUEUED", nullable=False, doc="QUEUED, RUNNING, COMPLETED, FAILED"
    )
    idempotency_key: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    payload_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    result_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    available_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    error_code: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
