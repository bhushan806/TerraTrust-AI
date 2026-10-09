"""Governance, data provenance, and model registry models."""

import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import JSON, DateTime, ForeignKey, Index, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, CreationTimestampMixin, TimestampMixin, UUIDPrimaryKeyMixin


class DataSource(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """External provider and data source registry with licensing metadata."""

    __tablename__ = "data_sources"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    type: Mapped[str] = mapped_column(
        String(50), nullable=False, doc="WEATHER, SATELLITE, SOIL, MARKET, CREDIT"
    )
    terms_uri: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    license_ref: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", nullable=False)
    owner: Mapped[str] = mapped_column(String(100), nullable=False)

    source_records: Mapped[List["SourceRecord"]] = relationship(
        "SourceRecord", back_populates="data_source", cascade="all, delete-orphan"
    )


class SourceRecord(Base, UUIDPrimaryKeyMixin, CreationTimestampMixin):
    """Lineage tracking record for acquired raw or transformed data."""

    __tablename__ = "source_records"
    __table_args__ = (
        Index("ix_source_records_tracking", "source_id", "external_id", "transform_version"),
    )

    source_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("data_sources.id", ondelete="CASCADE"), nullable=False, index=True
    )
    external_id: Mapped[str] = mapped_column(String(255), nullable=False)
    retrieved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    checksum: Mapped[str] = mapped_column(String(64), nullable=False, doc="SHA256 payload checksum")
    raw_uri: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    transform_version: Mapped[str] = mapped_column(String(50), default="1.0", nullable=False)
    quality_status: Mapped[str] = mapped_column(String(50), default="VALID", nullable=False)

    data_source: Mapped["DataSource"] = relationship("DataSource", back_populates="source_records")


class ModelVersion(Base, UUIDPrimaryKeyMixin, CreationTimestampMixin):
    """Machine learning model version tracking for auditability and lineage."""

    __tablename__ = "model_versions"
    __table_args__ = (
        UniqueConstraint("name", "version", name="uq_model_name_version"),
    )

    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    version: Mapped[str] = mapped_column(String(50), nullable=False)
    artifact_uri: Mapped[str] = mapped_column(String(500), nullable=False)
    checksum: Mapped[str] = mapped_column(String(64), nullable=False, doc="SHA256 model checksum")
    feature_schema_version: Mapped[str] = mapped_column(String(50), default="1.0", nullable=False)
    metrics_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), default="PROMOTED", nullable=False, doc="EXPERIMENTAL, CANDIDATE, PROMOTED, RETIRED"
    )
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    yield_predictions: Mapped[List["YieldPrediction"]] = relationship(
        "YieldPrediction", back_populates="model_version"
    )
    assessments: Mapped[List["CreditAssessment"]] = relationship(
        "CreditAssessment", back_populates="model_version"
    )
