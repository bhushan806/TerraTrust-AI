"""CropCycle model representing seasonal cultivation events on a plot."""

import uuid
from datetime import date
from typing import List, Optional
from sqlalchemy import Date, ForeignKey, Numeric, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class CropCycle(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Specific crop growing cycle linking agronomic inputs to yield and income."""

    __tablename__ = "crop_cycles"

    plot_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("plots.id", ondelete="CASCADE"), nullable=False, index=True
    )
    crop_code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    variety: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    season: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    sowing_date: Mapped[date] = mapped_column(Date, nullable=False)
    expected_harvest_date: Mapped[date] = mapped_column(Date, nullable=False)
    actual_harvest_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    area_value: Mapped[float] = mapped_column(Numeric(12, 4), nullable=False)
    area_unit: Mapped[str] = mapped_column(String(20), default="hectare", nullable=False)
    irrigation_type: Mapped[str] = mapped_column(String(50), default="RAINFED", nullable=False)
    irrigation_reliability: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="GROWING", nullable=False)

    # Relationships
    plot: Mapped["Plot"] = relationship("Plot", back_populates="crop_cycles")
    yield_predictions: Mapped[List["YieldPrediction"]] = relationship(
        "YieldPrediction", back_populates="crop_cycle", cascade="all, delete-orphan"
    )
    income_estimates: Mapped[List["IncomeEstimate"]] = relationship(
        "IncomeEstimate", back_populates="crop_cycle", cascade="all, delete-orphan"
    )
