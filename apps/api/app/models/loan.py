"""Loan application, loan, repayment schedule, and repayment event models."""

import uuid
from datetime import date, datetime, timezone
from typing import List, Optional
from sqlalchemy import Date, DateTime, ForeignKey, Index, Numeric, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, CreationTimestampMixin, TimestampMixin, UUIDPrimaryKeyMixin


class LoanApplication(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Borrower loan application undergoing credit review."""

    __tablename__ = "loan_applications"

    institution_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    borrower_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("borrowers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    branch_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("branches.id", ondelete="SET NULL"), nullable=True, index=True
    )
    amount: Mapped[float] = mapped_column(Numeric(16, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    purpose: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="SUBMITTED", nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    institution: Mapped["Institution"] = relationship("Institution")
    branch: Mapped[Optional["Branch"]] = relationship("Branch")
    borrower: Mapped["Borrower"] = relationship("Borrower", back_populates="loan_applications")
    loan: Mapped[Optional["Loan"]] = relationship(
        "Loan", back_populates="application", uselist=False, cascade="all, delete-orphan"
    )


class Loan(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Sanctioned agricultural loan facility."""

    __tablename__ = "loans"

    application_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("loan_applications.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    institution_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    borrower_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("borrowers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    principal: Mapped[float] = mapped_column(Numeric(16, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    interest_rate: Mapped[float] = mapped_column(Numeric(6, 4), nullable=False, doc="Annual interest rate")
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    repayment_frequency: Mapped[str] = mapped_column(
        String(50), default="BULLET_HARVEST", nullable=False, doc="BULLET_HARVEST, MONTHLY, QUARTERLY"
    )
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", nullable=False)

    # Relationships
    institution: Mapped["Institution"] = relationship("Institution")
    borrower: Mapped["Borrower"] = relationship("Borrower")
    application: Mapped["LoanApplication"] = relationship("LoanApplication", back_populates="loan")
    schedules: Mapped[List["RepaymentSchedule"]] = relationship(
        "RepaymentSchedule", back_populates="loan", cascade="all, delete-orphan"
    )
    repayments: Mapped[List["RepaymentEvent"]] = relationship(
        "RepaymentEvent", back_populates="loan", cascade="all, delete-orphan"
    )
    assessments: Mapped[List["CreditAssessment"]] = relationship("CreditAssessment", back_populates="loan")


class RepaymentSchedule(Base, UUIDPrimaryKeyMixin, CreationTimestampMixin):
    """Scheduled debt service payment obligations."""

    __tablename__ = "repayment_schedules"
    __table_args__ = (
        Index("ix_repayment_schedule_loan_ver", "loan_id", "version", "due_date"),
    )

    loan_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("loans.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version: Mapped[int] = mapped_column(default=1, nullable=False)
    installment_number: Mapped[int] = mapped_column(nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount_due: Mapped[float] = mapped_column(Numeric(16, 2), nullable=False)
    principal_component: Mapped[float] = mapped_column(Numeric(16, 2), nullable=False)
    interest_component: Mapped[float] = mapped_column(Numeric(16, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)

    loan: Mapped["Loan"] = relationship("Loan", back_populates="schedules")


class RepaymentEvent(Base, UUIDPrimaryKeyMixin, CreationTimestampMixin):
    """Actual repayment event or transaction received from core banking."""

    __tablename__ = "repayment_events"

    loan_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("loans.id", ondelete="CASCADE"), nullable=False, index=True
    )
    schedule_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid, ForeignKey("repayment_schedules.id", ondelete="SET NULL"), nullable=True
    )
    paid_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    amount_paid: Mapped[float] = mapped_column(Numeric(16, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="COMPLETED", nullable=False)
    days_past_due: Mapped[int] = mapped_column(default=0, nullable=False)
    source_id: Mapped[str] = mapped_column(String(100), default="CBS_IMPORT", nullable=False)

    loan: Mapped["Loan"] = relationship("Loan", back_populates="repayments")
