"""Borrower model representing agricultural loan applicants."""

import uuid
from typing import List, Optional
from sqlalchemy import ForeignKey, Index, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Borrower(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Agricultural borrower entity linked to farms and loans."""

    __tablename__ = "borrowers"
    __table_args__ = (
        Index("ix_borrowers_tenant_external_ref", "institution_id", "external_ref", unique=True),
    )

    institution_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    branch_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("branches.id", ondelete="SET NULL"), nullable=True, index=True
    )
    external_ref: Mapped[str] = mapped_column(
        String(100), nullable=False, doc="Institution-assigned unique customer identifier"
    )
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", nullable=False)

    # Relationships
    institution: Mapped["Institution"] = relationship("Institution", back_populates="borrowers")
    branch: Mapped[Optional["Branch"]] = relationship("Branch", back_populates="borrowers")
    farms: Mapped[List["Farm"]] = relationship(
        "Farm", back_populates="borrower", cascade="all, delete-orphan"
    )
    loan_applications: Mapped[List["LoanApplication"]] = relationship(
        "LoanApplication", back_populates="borrower", cascade="all, delete-orphan"
    )
    assessments: Mapped[List["CreditAssessment"]] = relationship(
        "CreditAssessment", back_populates="borrower", cascade="all, delete-orphan"
    )
