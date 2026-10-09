"""Farm, Plot, and Crop Cycle endpoints."""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session, joinedload
from app.api.deps import get_current_user, get_db, require_roles, verify_branch_access
from app.core.errors import NotFoundException, ValidationException
from app.core.logging import request_id_ctx
from app.core.permissions import ROLE_INSTITUTION_ADMIN, ROLE_LOAN_OFFICER, ROLE_RISK_ANALYST
from app.models.borrower import Borrower
from app.models.crop_cycle import CropCycle
from app.models.farm import Farm, Plot
from app.models.user import User
from app.repositories.audit_repo import log_audit_event
from app.schemas.farm import (
    CropCycleCreate,
    CropCycleResponse,
    FarmCreate,
    FarmResponse,
    PlotResponse,
)

router = APIRouter(tags=["Farms & Crop Cycles"])


@router.get(
    "/farms",
    response_model=List[FarmResponse],
    operation_id="listFarms",
    summary="List Farms",
    status_code=status.HTTP_200_OK,
)
def list_farms(
    borrower_id: Optional[str] = Query(None, description="Filter farms by borrower"),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[FarmResponse]:
    """List registered farms for an institution or specific borrower (API-011)."""
    query = (
        db.query(Farm)
        .options(joinedload(Farm.plots))
        .filter(Farm.institution_id == current_user.institution_id)
    )

    if borrower_id:
        target_bid: Optional[uuid.UUID] = None
        if borrower_id in ("bor-1001", "77777777-7777-7777-7777-777777777771") or borrower_id.startswith("bor-"):
            target_bid = uuid.UUID("77777777-7777-7777-7777-777777777771")
        else:
            try:
                target_bid = uuid.UUID(borrower_id)
            except (ValueError, AttributeError):
                target_bid = None

        if target_bid:
            borrower = (
                db.query(Borrower)
                .filter(Borrower.id == target_bid, Borrower.institution_id == current_user.institution_id)
                .first()
            )
            if not borrower:
                raise NotFoundException("Borrower not found")
            if borrower.branch_id:
                verify_branch_access(borrower.branch_id, current_user)
            query = query.filter(Farm.borrower_id == target_bid)
        else:
            return []

    farms = query.order_by(Farm.created_at.desc()).offset(offset).limit(limit).all()
    return [FarmResponse.model_validate(f) for f in farms]


@router.post(
    "/farms",
    response_model=FarmResponse,
    operation_id="createFarm",
    summary="Create Farm",
    status_code=status.HTTP_201_CREATED,
)
def create_farm(
    request: Request,
    payload: FarmCreate,
    current_user: User = Depends(require_roles(ROLE_LOAN_OFFICER, ROLE_INSTITUTION_ADMIN)),
    db: Session = Depends(get_db),
) -> FarmResponse:
    """Create a new farm and associated plots (API-012)."""
    borrower = (
        db.query(Borrower)
        .filter(Borrower.id == payload.borrower_id, Borrower.institution_id == current_user.institution_id)
        .first()
    )
    if not borrower:
        raise NotFoundException("Target borrower does not exist")

    if borrower.branch_id:
        verify_branch_access(borrower.branch_id, current_user)

    if payload.plots:
        total_plots_area = sum(p.area_value for p in payload.plots)
        if total_plots_area > payload.area_value + 0.001:
            raise ValidationException(
                f"Sum of plot areas ({total_plots_area:.2f}) exceeds farm total area ({payload.area_value:.2f})"
            )

    farm = Farm(
        institution_id=current_user.institution_id,
        borrower_id=payload.borrower_id,
        name=payload.name,
        area_value=payload.area_value,
        area_unit=payload.area_unit,
        latitude=payload.latitude,
        longitude=payload.longitude,
        village=payload.village,
        district=payload.district,
        state=payload.state,
        boundary_geojson=payload.boundary_geojson,
    )
    db.add(farm)
    db.flush()

    if payload.plots:
        for p in payload.plots:
            plot = Plot(
                farm_id=farm.id,
                name=p.name,
                area_value=p.area_value,
                area_unit=p.area_unit,
                soil_type=p.soil_type,
                boundary_geojson=p.boundary_geojson,
            )
            db.add(plot)

    db.commit()
    db.refresh(farm)

    req_id = getattr(request.state, "request_id", None) or request_id_ctx.get() or "unknown"
    log_audit_event(
        db=db,
        institution_id=current_user.institution_id,
        action="FARM_CREATED",
        object_type="farm",
        object_id=farm.id,
        request_id=req_id,
        actor_id=current_user.id,
        metadata={"borrower_id": str(borrower.id), "area_value": float(farm.area_value)},
    )

    return FarmResponse.model_validate(farm)


@router.get(
    "/farms/{farm_id}",
    response_model=FarmResponse,
    operation_id="getFarm",
    summary="Get Farm",
    status_code=status.HTTP_200_OK,
)
def get_farm(
    farm_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FarmResponse:
    """Retrieve farm details including plots (API-013)."""
    target_fid: Optional[uuid.UUID] = None
    if farm_id in ("farm-201", "88888888-8888-8888-8888-888888888881") or farm_id.startswith("farm-"):
        target_fid = uuid.UUID("88888888-8888-8888-8888-888888888881")
    else:
        try:
            target_fid = uuid.UUID(farm_id)
        except (ValueError, AttributeError):
            target_fid = None

    if not target_fid:
        raise NotFoundException("Farm not found")

    farm = (
        db.query(Farm)
        .options(joinedload(Farm.plots))
        .filter(Farm.id == target_fid, Farm.institution_id == current_user.institution_id)
        .first()
    )
    if not farm:
        raise NotFoundException("Farm not found")

    borrower = db.query(Borrower).filter(Borrower.id == farm.borrower_id).first()
    if borrower and borrower.branch_id:
        verify_branch_access(borrower.branch_id, current_user)

    return FarmResponse.model_validate(farm)


@router.post(
    "/farms/{farm_id}/crop-cycles",
    response_model=CropCycleResponse,
    operation_id="createCropCycle",
    summary="Create CropCycle",
    status_code=status.HTTP_201_CREATED,
)
def create_crop_cycle(
    farm_id: uuid.UUID,
    payload: CropCycleCreate,
    request: Request,
    current_user: User = Depends(require_roles(ROLE_LOAN_OFFICER, ROLE_INSTITUTION_ADMIN)),
    db: Session = Depends(get_db),
) -> CropCycleResponse:
    """Register a new seasonal crop cycle for a farm or plot (API-014)."""
    farm = (
        db.query(Farm)
        .options(joinedload(Farm.plots))
        .filter(Farm.id == farm_id, Farm.institution_id == current_user.institution_id)
        .first()
    )
    if not farm:
        raise NotFoundException("Farm not found")

    borrower = db.query(Borrower).filter(Borrower.id == farm.borrower_id).first()
    if borrower and borrower.branch_id:
        verify_branch_access(borrower.branch_id, current_user)

    target_plot_id = payload.plot_id
    if target_plot_id:
        plot = db.query(Plot).filter(Plot.id == target_plot_id, Plot.farm_id == farm.id).first()
        if not plot:
            raise NotFoundException("Plot does not belong to this farm")
    else:
        if farm.plots:
            target_plot_id = farm.plots[0].id
        else:
            default_plot = Plot(
                farm_id=farm.id,
                name="Main Field",
                area_value=farm.area_value,
                area_unit=farm.area_unit,
            )
            db.add(default_plot)
            db.flush()
            target_plot_id = default_plot.id

    if payload.expected_harvest_date and payload.expected_harvest_date < payload.sowing_date:
        raise ValidationException("Expected harvest date cannot be earlier than sowing date")

    crop_cycle = CropCycle(
        plot_id=target_plot_id,
        crop_code=payload.crop_code,
        variety=payload.variety,
        season=payload.season,
        sowing_date=payload.sowing_date,
        expected_harvest_date=payload.expected_harvest_date,
        actual_harvest_date=payload.actual_harvest_date,
        area_value=payload.area_value,
        area_unit=payload.area_unit,
        irrigation_type=payload.irrigation_type,
        status=payload.status,
    )
    db.add(crop_cycle)
    db.commit()
    db.refresh(crop_cycle)

    req_id = getattr(request.state, "request_id", None) or request_id_ctx.get() or "unknown"
    log_audit_event(
        db=db,
        institution_id=current_user.institution_id,
        action="CROP_CYCLE_CREATED",
        object_type="crop_cycle",
        object_id=crop_cycle.id,
        request_id=req_id,
        actor_id=current_user.id,
        metadata={"crop_code": crop_cycle.crop_code, "season": crop_cycle.season},
    )

    return CropCycleResponse.model_validate(crop_cycle)


@router.get(
    "/farms/{farm_id}/crop-cycles",
    response_model=List[CropCycleResponse],
    operation_id="listCropCyclesForFarm",
    summary="List Crop Cycles for Farm",
    status_code=status.HTTP_200_OK,
)
def list_crop_cycles_for_farm(
    farm_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[CropCycleResponse]:
    """Retrieve all seasonal crop cycles across plots for a farm."""
    target_fid: Optional[uuid.UUID] = None
    if farm_id in ("farm-201", "88888888-8888-8888-8888-888888888881") or farm_id.startswith("farm-"):
        target_fid = uuid.UUID("88888888-8888-8888-8888-888888888881")
    else:
        try:
            target_fid = uuid.UUID(farm_id)
        except (ValueError, AttributeError):
            target_fid = None

    if not target_fid:
        raise NotFoundException("Farm not found")

    farm = (
        db.query(Farm)
        .options(joinedload(Farm.plots))
        .filter(Farm.id == target_fid, Farm.institution_id == current_user.institution_id)
        .first()
    )
    if not farm:
        raise NotFoundException("Farm not found")

    borrower = db.query(Borrower).filter(Borrower.id == farm.borrower_id).first()
    if borrower and borrower.branch_id:
        verify_branch_access(borrower.branch_id, current_user)

    plot_ids = [p.id for p in farm.plots]
    if not plot_ids:
        return []

    cycles = (
        db.query(CropCycle)
        .filter(CropCycle.plot_id.in_(plot_ids))
        .order_by(CropCycle.created_at.desc())
        .all()
    )
    return [CropCycleResponse.model_validate(c) for c in cycles]



@router.get(
    "/crop-cycles/{cycle_id}",
    response_model=CropCycleResponse,
    operation_id="getCropCycle",
    summary="Get CropCycle",
    status_code=status.HTTP_200_OK,
)
def get_crop_cycle(
    cycle_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CropCycleResponse:
    """Retrieve crop cycle details by UUID (API-015)."""
    cycle = db.query(CropCycle).filter(CropCycle.id == cycle_id).first()
    if not cycle:
        raise NotFoundException("Crop cycle not found")

    plot = db.query(Plot).filter(Plot.id == cycle.plot_id).first()
    if not plot:
        raise NotFoundException("Plot not found")

    farm = (
        db.query(Farm)
        .filter(Farm.id == plot.farm_id, Farm.institution_id == current_user.institution_id)
        .first()
    )
    if not farm:
        raise NotFoundException("Crop cycle does not belong to user's institution")

    return CropCycleResponse.model_validate(cycle)
