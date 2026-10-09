"""Institution and branch models for multi-tenant isolation."""

import uuid
from typing import List, Optional
from sqlalchemy import ForeignKey, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Institution(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Tenant organization entity (bank, cooperative, NBFC)."""

    __tablename__ = "institutions"

    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", nullable=False)

    # Relationships
    branches: Mapped[List["Branch"]] = relationship(
        "Branch", back_populates="institution", cascade="all, delete-orphan"
    )
    users: Mapped[List["User"]] = relationship(
        "User", back_populates="institution", cascade="all, delete-orphan"
    )
    borrowers: Mapped[List["Borrower"]] = relationship(
        "Borrower", back_populates="institution", cascade="all, delete-orphan"
    )


class Branch(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Branch location scoping within an institution."""

    __tablename__ = "branches"
    __table_args__ = (
        UniqueConstraint("institution_id", "code", name="uq_institution_branch_code"),
    )

    institution_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)

    # Relationships
    institution: Mapped["Institution"] = relationship("Institution", back_populates="branches")
    borrowers: Mapped[List["Borrower"]] = relationship("Borrower", back_populates="branch")
    user_branches: Mapped[List["UserBranch"]] = relationship(
        "UserBranch", back_populates="branch", cascade="all, delete-orphan"
    )


class UserBranch(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Association granting user access to specific branch scope."""

    __tablename__ = "user_branches"
    __table_args__ = (
        UniqueConstraint("user_id", "branch_id", name="uq_user_branch"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    branch_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("branches.id", ondelete="CASCADE"), nullable=False, index=True
    )
    scope: Mapped[str] = mapped_column(String(50), default="BRANCH_READ_WRITE", nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="user_branches")
    branch: Mapped["Branch"] = relationship("Branch", back_populates="user_branches")
