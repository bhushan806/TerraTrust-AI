"""Farm and Plot spatial models for agricultural land management."""

import uuid
from typing import List, Optional
from sqlalchemy import JSON, ForeignKey, Numeric, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Farm(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Agricultural farm holding operated by a borrower."""

    __tablename__ = "farms"

    institution_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    borrower_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("borrowers.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[Optional[float]] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Numeric(9, 6), nullable=True)
    boundary_geojson: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    area_value: Mapped[float] = mapped_column(Numeric(12, 4), nullable=False)
    area_unit: Mapped[str] = mapped_column(String(20), default="hectare", nullable=False)
    village: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    district: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", nullable=False)

    # Relationships
    institution: Mapped["Institution"] = relationship("Institution")
    borrower: Mapped["Borrower"] = relationship("Borrower", back_populates="farms")
    plots: Mapped[List["Plot"]] = relationship(
        "Plot", back_populates="farm", cascade="all, delete-orphan"
    )


class Plot(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Delineated land plot within a farm where crops are cultivated."""

    __tablename__ = "plots"

    farm_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    boundary_geojson: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    area_value: Mapped[float] = mapped_column(Numeric(12, 4), nullable=False)
    area_unit: Mapped[str] = mapped_column(String(20), default="hectare", nullable=False)
    soil_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Relationships
    farm: Mapped["Farm"] = relationship("Farm", back_populates="plots")
    crop_cycles: Mapped[List["CropCycle"]] = relationship(
        "CropCycle", back_populates="plot", cascade="all, delete-orphan"
    )
    climate_observations: Mapped[List["ClimateObservation"]] = relationship(
        "ClimateObservation", back_populates="plot", cascade="all, delete-orphan"
    )
    forecasts: Mapped[List["Forecast"]] = relationship(
        "Forecast", back_populates="plot", cascade="all, delete-orphan"
    )
    satellite_observations: Mapped[List["SatelliteObservation"]] = relationship(
        "SatelliteObservation", back_populates="plot", cascade="all, delete-orphan"
    )
    soil_moisture_records: Mapped[List["SoilMoisture"]] = relationship(
        "SoilMoisture", back_populates="plot", cascade="all, delete-orphan"
    )
