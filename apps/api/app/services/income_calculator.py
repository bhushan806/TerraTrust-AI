"""Farm Income, Cash Flow, and Debt Service Capacity Estimation Service.

Follows Section 08 (Farm-income estimation) and Section 15 of engineering blueprint:
- gross_revenue = predicted_saleable_yield * expected_price
- net_farm_income = gross_revenue + other_farm_income - production_costs - other_farm_expenses
- IADS = net_farm_income + other_household_income - debt_service_obligations
"""

import uuid
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.models.assessment import IncomeEstimate
from app.models.crop_cycle import CropCycle
from app.schemas.assessment import IncomeEstimateRequest, IncomeEstimateResponse


def calculate_farm_income(
    db: Session,
    request: IncomeEstimateRequest,
    crop_cycle: CropCycle,
) -> Tuple[IncomeEstimateResponse, IncomeEstimate]:
    """Calculate farm revenue, net income, and IADS, and persist estimate snapshot."""
    area = request.area_value if request.area_value is not None else float(crop_cycle.area_value or 1.0)
    
    # 1. Total and Saleable Yield
    total_yield = round(request.predicted_yield_per_area * area, 2)
    post_harvest_loss_ratio = max(0.0, min(0.5, request.post_harvest_loss_pct))
    saleable_yield = round(total_yield * (1.0 - post_harvest_loss_ratio), 2)

    # 2. Gross Farm Revenue
    gross_revenue = round(saleable_yield * request.expected_price_per_unit, 2)

    # 3. Net Farm Income
    net_farm_income = round(gross_revenue - request.production_costs - request.other_expenses, 2)

    # 4. Income Available for Debt Service (IADS)
    iads = round(net_farm_income + request.other_household_income - request.debt_service_obligations, 2)

    assumptions = {
        "area_value": area,
        "area_unit": request.area_unit,
        "yield_per_area": request.predicted_yield_per_area,
        "yield_unit": request.yield_unit,
        "total_yield_kg": total_yield,
        "post_harvest_loss_pct": post_harvest_loss_ratio,
        "saleable_yield_kg": saleable_yield,
        "price_per_unit": request.expected_price_per_unit,
        "price_unit": request.price_unit,
        "production_costs": request.production_costs,
        "other_expenses": request.other_expenses,
        "other_household_income": request.other_household_income,
        "debt_service_obligations": request.debt_service_obligations,
    }

    db_income = IncomeEstimate(
        id=uuid.uuid4(),
        crop_cycle_id=crop_cycle.id,
        gross_revenue=gross_revenue,
        production_costs=request.production_costs,
        other_expenses=request.other_expenses,
        net_farm_income=net_farm_income,
        other_household_income=request.other_household_income,
        debt_service_obligations=request.debt_service_obligations,
        income_available_for_debt_service=iads,
        currency=request.currency,
        assumptions_version=request.assumptions_version,
        assumptions_json=assumptions,
    )
    db.add(db_income)
    db.commit()
    db.refresh(db_income)

    response = IncomeEstimateResponse(
        id=db_income.id,
        crop_cycle_id=crop_cycle.id,
        gross_revenue=gross_revenue,
        production_costs=request.production_costs,
        other_expenses=request.other_expenses,
        net_farm_income=net_farm_income,
        other_household_income=request.other_household_income,
        debt_service_obligations=request.debt_service_obligations,
        income_available_for_debt_service=iads,
        currency=request.currency,
        assumptions_version=request.assumptions_version,
        assumptions_json=assumptions,
        created_at=db_income.created_at,
    )

    return response, db_income
