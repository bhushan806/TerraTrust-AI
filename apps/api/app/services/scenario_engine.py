"""Climate Stress-Testing Scenario Engine.

Implements Section 08 (Climate scenario engine) and Section 15 of engineering blueprint:
- Evaluates named, versioned hazards (drought, excessive rainfall, heat stress, price volatility).
- Categorizes evidence status as EVIDENCE_BACKED or ILLUSTRATIVE_ASSUMPTION.
- Computes stressed income, stressed DSCR, and delta impact against baseline assessment snapshot.
"""

import uuid
from typing import Any, Dict, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.assessment import CreditAssessment, ScenarioRun
from app.schemas.assessment import ScenarioRunCreateRequest, ScenarioRunResponse


DEFAULT_SCENARIO_CONFIGS = {
    "DROUGHT_MODERATE": {
        "yield_delta_pct": -0.15,
        "price_delta_pct": 0.05,
        "cost_delta_pct": 0.05,
        "evidence_status": "EVIDENCE_BACKED",
        "description": "Moderate 25% seasonal precipitation deficit with partial canal supply.",
    },
    "DROUGHT_SEVERE": {
        "yield_delta_pct": -0.35,
        "price_delta_pct": 0.10,
        "cost_delta_pct": 0.10,
        "evidence_status": "EVIDENCE_BACKED",
        "description": "Severe 50% precipitation deficit with terminal heat stress at grain filling.",
    },
    "HEAT_STRESS": {
        "yield_delta_pct": -0.20,
        "price_delta_pct": 0.0,
        "cost_delta_pct": 0.0,
        "evidence_status": "EVIDENCE_BACKED",
        "description": "Prolonged daytime temperatures exceeding 35C during flowering stage.",
    },
    "FLOOD_EXCESS": {
        "yield_delta_pct": -0.40,
        "price_delta_pct": -0.05,
        "cost_delta_pct": 0.15,
        "evidence_status": "EVIDENCE_BACKED",
        "description": "Excess rainfall causing prolonged waterlogging and root rot.",
    },
    "PRICE_SHOCK_20": {
        "yield_delta_pct": 0.0,
        "price_delta_pct": -0.20,
        "cost_delta_pct": 0.0,
        "evidence_status": "EVIDENCE_BACKED",
        "description": "Bumper regional harvest or import tariff drop resulting in 20% price slump.",
    },
    "COMPOUND_SHOCK": {
        "yield_delta_pct": -0.30,
        "price_delta_pct": -0.15,
        "cost_delta_pct": 0.10,
        "evidence_status": "ILLUSTRATIVE_ASSUMPTION",
        "description": "Combined climate disruption and unfavorable market realization.",
    },
}


def run_scenario(
    db: Session,
    assessment: CreditAssessment,
    request: ScenarioRunCreateRequest,
) -> Tuple[ScenarioRunResponse, ScenarioRun]:
    """Execute scenario perturbation against baseline assessment snapshot."""
    config = DEFAULT_SCENARIO_CONFIGS.get(request.scenario_code, {
        "yield_delta_pct": request.yield_delta_pct or -0.10,
        "price_delta_pct": request.price_delta_pct or 0.0,
        "cost_delta_pct": request.cost_delta_pct or 0.0,
        "evidence_status": "ILLUSTRATIVE_ASSUMPTION",
        "description": "Custom user-specified stress assumptions.",
    })

    yield_delta = request.yield_delta_pct if request.yield_delta_pct is not None else config["yield_delta_pct"]
    price_delta = request.price_delta_pct if request.price_delta_pct is not None else config.get("price_delta_pct", 0.0)
    cost_delta = request.cost_delta_pct if request.cost_delta_pct is not None else config.get("cost_delta_pct", 0.0)
    evidence_status = config.get("evidence_status", "ILLUSTRATIVE_ASSUMPTION")

    # Extract baseline financials from assessment snapshot
    snapshot = assessment.snapshot_json or {}
    baseline_income = snapshot.get("income_estimate", {})
    baseline_revenue = float(baseline_income.get("gross_revenue", 120000.0))
    baseline_costs = float(baseline_income.get("production_costs", 40000.0))
    baseline_other_expenses = float(baseline_income.get("other_expenses", 0.0))
    baseline_net_income = float(baseline_income.get("net_farm_income", baseline_revenue - baseline_costs))
    debt_service = float(snapshot.get("debt_service", 50000.0))

    # Apply perturbations
    stressed_revenue = round(baseline_revenue * (1.0 + yield_delta) * (1.0 + price_delta), 2)
    stressed_costs = round(baseline_costs * (1.0 + cost_delta), 2)
    stressed_net_income = round(stressed_revenue - stressed_costs - baseline_other_expenses, 2)
    
    income_delta_pct = (
        round((stressed_net_income - baseline_net_income) / abs(baseline_net_income), 4)
        if baseline_net_income != 0 else -1.0
    )
    if request.income_delta_pct is not None:
        income_delta_pct = request.income_delta_pct

    stressed_iads = max(0.0, stressed_net_income)
    stressed_dscr = round(stressed_iads / debt_service, 4) if debt_service > 0 else 1.0

    if stressed_dscr >= 1.5:
        stressed_risk_band = "LOW"
    elif stressed_dscr >= 1.2:
        stressed_risk_band = "MEDIUM"
    elif stressed_dscr >= 1.0:
        stressed_risk_band = "HIGH"
    else:
        stressed_risk_band = "SEVERE"

    result_json = {
        "baseline_dscr": float(assessment.dscr) if assessment.dscr is not None else None,
        "baseline_risk_band": assessment.risk_band,
        "stressed_dscr": stressed_dscr,
        "stressed_risk_band": stressed_risk_band,
        "baseline_revenue": baseline_revenue,
        "stressed_revenue": stressed_revenue,
        "baseline_net_income": baseline_net_income,
        "stressed_net_income": stressed_net_income,
        "debt_service": debt_service,
    }

    assumptions_json = {
        "scenario_code": request.scenario_code,
        "yield_delta_pct": yield_delta,
        "price_delta_pct": price_delta,
        "cost_delta_pct": cost_delta,
        "evidence_status": evidence_status,
        "description": config.get("description", ""),
        "custom_assumptions": request.assumptions or {},
    }

    db_scenario = ScenarioRun(
        id=uuid.uuid4(),
        assessment_id=assessment.id,
        scenario_code=request.scenario_code,
        assumptions_json=assumptions_json,
        yield_delta_pct=yield_delta,
        income_delta_pct=income_delta_pct,
        result_json=result_json,
        evidence_status=evidence_status,
    )
    db.add(db_scenario)
    db.commit()
    db.refresh(db_scenario)

    response = ScenarioRunResponse(
        id=db_scenario.id,
        assessment_id=assessment.id,
        scenario_code=request.scenario_code,
        yield_delta_pct=yield_delta,
        income_delta_pct=income_delta_pct,
        evidence_status=evidence_status,
        assumptions_json=assumptions_json,
        result_json=result_json,
        created_at=db_scenario.created_at,
    )

    return response, db_scenario
