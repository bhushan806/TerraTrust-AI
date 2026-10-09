"""Schemas for Farm, Plot, and Crop Cycle operations."""

import uuid
from datetime import date, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class PlotCreate(BaseModel):
    """Payload to create a plot within a farm."""

    name: str = Field(..., min_length=1, max_length=100)
    area_value: float = Field(..., gt=0.0)
    area_unit: str = Field(default="hectare", max_length=20)
    soil_type: Optional[str] = Field(None, max_length=100)
    boundary_geojson: Optional[Dict[str, Any]] = None


class PlotResponse(BaseModel):
    """Plot summary representation."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    farm_id: uuid.UUID
    name: str
    area_value: float
    area_unit: str
    soil_type: Optional[str] = None
    boundary_geojson: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime


class FarmCreate(BaseModel):
    """Payload to create a farm and optional plots (API-012)."""

    borrower_id: uuid.UUID
    name: str = Field(..., min_length=2, max_length=255)
    area_value: float = Field(..., gt=0.0)
    area_unit: str = Field(default="hectare", max_length=20)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    village: Optional[str] = Field(None, max_length=100)
    district: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    boundary_geojson: Optional[Dict[str, Any]] = None
    plots: Optional[List[PlotCreate]] = None


class FarmResponse(BaseModel):
    """Farm profile with registered plots (API-013)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    institution_id: uuid.UUID
    borrower_id: uuid.UUID
    name: str
    area_value: float
    area_unit: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    village: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    status: str = "ACTIVE"
    boundary_geojson: Optional[Dict[str, Any]] = None
    plots: List[PlotResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class CropCycleCreate(BaseModel):
    """Payload to register a crop cycle for a farm/plot (API-014)."""

    plot_id: Optional[uuid.UUID] = None
    crop_code: str = Field(..., min_length=2, max_length=50)
    variety: Optional[str] = Field(None, max_length=100)
    season: str = Field(..., min_length=2, max_length=50)
    sowing_date: date
    expected_harvest_date: date
    actual_harvest_date: Optional[date] = None
    area_value: float = Field(..., gt=0.0)
    area_unit: str = Field(default="hectare", max_length=20)
    irrigation_type: str = Field(default="RAINFED", max_length=50)
    status: str = Field(default="GROWING", max_length=50)


class CropCycleResponse(BaseModel):
    """Crop cycle detail representation (API-015)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    plot_id: uuid.UUID
    crop_code: str
    variety: Optional[str] = None
    season: str
    sowing_date: date
    expected_harvest_date: date
    actual_harvest_date: Optional[date] = None
    area_value: float
    area_unit: str
    irrigation_type: str
    status: str
    created_at: datetime
    updated_at: datetime
