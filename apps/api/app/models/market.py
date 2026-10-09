"""Market price models for agricultural commodities."""

from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, Index, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, CreationTimestampMixin, UUIDPrimaryKeyMixin


class MarketPrice(Base, UUIDPrimaryKeyMixin, CreationTimestampMixin):
    """Mandi and commodity market price series for farm revenue estimation."""

    __tablename__ = "market_prices"
    __table_args__ = (
        Index("ix_market_prices_query", "commodity_code", "market_id", "observed_at"),
    )

    commodity_code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    variety_grade: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    market_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    price_value: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    unit: Mapped[str] = mapped_column(String(20), default="quintal", nullable=False)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    source_id: Mapped[str] = mapped_column(String(100), nullable=False)
    quality_status: Mapped[str] = mapped_column(String(50), default="VALID", nullable=False)
