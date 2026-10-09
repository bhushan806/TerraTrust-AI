"""Schemas for Climate, Satellite, Soil, and Market Price observations."""

import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class ClimateObservationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    plot_id: uuid.UUID
    variable_code: str
    value: float
    unit: str
    observed_at: datetime
    source_id: str


class SatelliteObservationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    plot_id: uuid.UUID
    product_code: str
    vegetation_index: Optional[float] = None
    cloud_fraction: Optional[float] = None
    acquired_at: datetime
    source_id: str


class SoilMoistureResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    plot_id: uuid.UUID
    depth_cm: Optional[float] = None
    value: float
    unit: str
    observed_at: datetime
    source_id: str


class ObservationsResponse(BaseModel):
    """Aggregated observation series for a crop cycle (API-020)."""

    crop_cycle_id: uuid.UUID
    climate: List[ClimateObservationResponse]
    satellite: List[SatelliteObservationResponse]
    soil_moisture: List[SoilMoistureResponse]


class MarketPriceResponse(BaseModel):
    """Market commodity price observation (API-023)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    commodity_code: str
    variety_grade: Optional[str] = None
    market_id: str
    price_value: float
    currency: str
    unit: str
    observed_at: datetime
    source_id: str
    quality_status: str
