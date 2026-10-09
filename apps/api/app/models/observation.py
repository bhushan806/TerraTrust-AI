"""Observation and sensor models for weather, satellite, and soil data."""

import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, ForeignKey, Index, Numeric, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, CreationTimestampMixin, UUIDPrimaryKeyMixin


class ClimateObservation(Base, UUIDPrimaryKeyMixin, CreationTimestampMixin):
    """Historical weather and agrometeorological observations."""

    __tablename__ = "climate_observations"
    __table_args__ = (
        Index("ix_climate_obs_plot_var_time", "plot_id", "variable_code", "observed_at"),
    )

    plot_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("plots.id", ondelete="CASCADE"), nullable=False, index=True
    )
    variable_code: Mapped[str] = mapped_column(
        String(50), nullable=False, doc="RAINFALL, TEMP_MAX, TEMP_MIN, HUMIDITY, SOLAR_RADIATION"
    )
    value: Mapped[float] = mapped_column(Numeric(12, 4), nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    spatial_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    source_id: Mapped[str] = mapped_column(String(100), nullable=False)
    quality_status: Mapped[str] = mapped_column(String(50), default="VALID", nullable=False)

    plot: Mapped["Plot"] = relationship("Plot", back_populates="climate_observations")


class Forecast(Base, UUIDPrimaryKeyMixin, CreationTimestampMixin):
    """Weather forecasts and seasonal horizon projections."""

    __tablename__ = "forecasts"
    __table_args__ = (
        Index("ix_forecast_plot_valid_time", "plot_id", "variable_code", "valid_time"),
    )

    plot_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("plots.id", ondelete="CASCADE"), nullable=False, index=True
    )
    variable_code: Mapped[str] = mapped_column(String(50), nullable=False)
    value: Mapped[float] = mapped_column(Numeric(12, 4), nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    valid_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    provider_model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    source_id: Mapped[str] = mapped_column(String(100), nullable=False)
    quality_status: Mapped[str] = mapped_column(String(50), default="VALID", nullable=False)

    plot: Mapped["Plot"] = relationship("Plot", back_populates="forecasts")


class SatelliteObservation(Base, UUIDPrimaryKeyMixin, CreationTimestampMixin):
    """Earth observation / satellite-derived vegetation indicators (NDVI, EVI)."""

    __tablename__ = "satellite_observations"
    __table_args__ = (
        Index("ix_sat_obs_plot_acquired", "plot_id", "product_code", "acquired_at"),
    )

    plot_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("plots.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_code: Mapped[str] = mapped_column(
        String(50), nullable=False, doc="SENTINEL2_NDVI, MODIS_EVI, LANDSAT_SAVI"
    )
    vegetation_index: Mapped[Optional[float]] = mapped_column(Numeric(8, 4), nullable=True)
    cloud_fraction: Mapped[Optional[float]] = mapped_column(Numeric(5, 4), nullable=True)
    acquired_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    processing_version: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    source_id: Mapped[str] = mapped_column(String(100), nullable=False)
    quality_status: Mapped[str] = mapped_column(String(50), default="VALID", nullable=False)

    plot: Mapped["Plot"] = relationship("Plot", back_populates="satellite_observations")


class SoilMoisture(Base, UUIDPrimaryKeyMixin, CreationTimestampMixin):
    """Ground and satellite-derived root-zone/surface soil moisture records."""

    __tablename__ = "soil_moisture"
    __table_args__ = (
        Index("ix_soil_moisture_plot_observed", "plot_id", "observed_at"),
    )

    plot_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("plots.id", ondelete="CASCADE"), nullable=False, index=True
    )
    value: Mapped[float] = mapped_column(Numeric(8, 4), nullable=False)
    unit: Mapped[str] = mapped_column(String(20), default="m3/m3", nullable=False)
    depth_cm: Mapped[Optional[float]] = mapped_column(Numeric(6, 2), nullable=True)
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    spatial_resolution: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    source_id: Mapped[str] = mapped_column(String(100), nullable=False)
    quality_status: Mapped[str] = mapped_column(String(50), default="VALID", nullable=False)

    plot: Mapped["Plot"] = relationship("Plot", back_populates="soil_moisture_records")
