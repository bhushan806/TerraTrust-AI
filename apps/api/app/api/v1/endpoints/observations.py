"""Observations and Market Prices endpoints."""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_user, get_db
from app.core.errors import NotFoundException
from app.models.crop_cycle import CropCycle
from app.models.farm import Farm, Plot
from app.models.market import MarketPrice
from app.models.observation import ClimateObservation, SatelliteObservation, SoilMoisture
from app.models.user import User
from app.schemas.observation import (
    ClimateObservationResponse,
    MarketPriceResponse,
    ObservationsResponse,
    SatelliteObservationResponse,
    SoilMoistureResponse,
)

router = APIRouter(tags=["Observations & Market Intelligence"])


@router.get(
    "/crop-cycles/{cycle_id}/observations",
    response_model=ObservationsResponse,
    operation_id="listCropCycleObservations",
    summary="List CropCycleObservations",
    status_code=status.HTTP_200_OK,
)
def list_crop_cycle_observations(
    cycle_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ObservationsResponse:
    """Retrieve multi-source environmental series (climate, satellite, soil moisture) for a crop cycle (API-020)."""
    cycle = db.query(CropCycle).filter(CropCycle.id == cycle_id).first()
    if not cycle:
        raise NotFoundException("Crop cycle not found")

    plot = db.query(Plot).filter(Plot.id == cycle.plot_id).first()
    if not plot:
        raise NotFoundException("Plot not found for crop cycle")

    farm = (
        db.query(Farm)
        .filter(Farm.id == plot.farm_id, Farm.institution_id == current_user.institution_id)
        .first()
    )
    if not farm:
        raise NotFoundException("Crop cycle does not belong to user's institution")

    plots = db.query(Plot).filter(Plot.farm_id == farm.id).all()
    plot_ids = [cycle.plot_id] if cycle.plot_id else [p.id for p in plots]

    climate_obs = []
    satellite_obs = []
    soil_obs = []

    if plot_ids:
        climate_obs = (
            db.query(ClimateObservation)
            .filter(ClimateObservation.plot_id.in_(plot_ids))
            .order_by(ClimateObservation.observed_at)
            .all()
        )
        satellite_obs = (
            db.query(SatelliteObservation)
            .filter(SatelliteObservation.plot_id.in_(plot_ids))
            .order_by(SatelliteObservation.acquired_at)
            .all()
        )
        soil_obs = (
            db.query(SoilMoisture)
            .filter(SoilMoisture.plot_id.in_(plot_ids))
            .order_by(SoilMoisture.observed_at)
            .all()
        )

    return ObservationsResponse(
        crop_cycle_id=cycle.id,
        climate=[ClimateObservationResponse.model_validate(c) for c in climate_obs],
        satellite=[SatelliteObservationResponse.model_validate(s) for s in satellite_obs],
        soil_moisture=[SoilMoistureResponse.model_validate(sm) for sm in soil_obs],
    )


@router.get(
    "/market-prices",
    response_model=List[MarketPriceResponse],
    operation_id="listMarketPrices",
    summary="List MarketPrices",
    status_code=status.HTTP_200_OK,
)
def list_market_prices(
    commodity: Optional[str] = Query(None, description="Commodity code filter"),
    market: Optional[str] = Query(None, description="Market ID filter"),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[MarketPriceResponse]:
    """Query benchmark APMC commodity prices (API-023)."""
    query = db.query(MarketPrice)

    if commodity:
        query = query.filter(MarketPrice.commodity_code.ilike(f"%{commodity}%"))
    if market:
        query = query.filter(MarketPrice.market_id.ilike(f"%{market}%"))

    prices = query.order_by(MarketPrice.observed_at.desc()).offset(offset).limit(limit).all()
    return [MarketPriceResponse.model_validate(p) for p in prices]
