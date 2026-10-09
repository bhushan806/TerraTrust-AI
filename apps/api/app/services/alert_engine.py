"""Early Warning Risk Alerting and Threshold Monitoring Service (O04)."""

import uuid
from datetime import datetime, timezone
from typing import List
from sqlalchemy.orm import Session

from app.models.assessment import Alert, CreditAssessment


def evaluate_risk_alerts(db: Session, assessment: CreditAssessment) -> List[Alert]:
    """Evaluate financial and agronomic risk thresholds to trigger early-warning alerts."""
    alerts: List[Alert] = []
    now_utc = datetime.now(timezone.utc)
    dscr = float(assessment.dscr) if assessment.dscr is not None else 1.5

    # 1. Critical DSCR Deficit (< 1.0)
    if dscr < 1.0 or assessment.risk_band == "SEVERE":
        rule_code = "FIN_DSCR_CRITICAL"
        existing = (
            db.query(Alert)
            .filter(
                Alert.assessment_id == assessment.id,
                Alert.rule_code == rule_code,
                Alert.status == "ACTIVE",
            )
            .first()
        )
        if not existing:
            alert = Alert(
                id=uuid.uuid4(),
                institution_id=assessment.institution_id,
                assessment_id=assessment.id,
                rule_code=rule_code,
                severity="CRITICAL",
                message=f"Debt Service Coverage Ratio ({dscr:.2f}) is below 1.0. Farm cash flow is insufficient to cover debt service.",
                status="ACTIVE",
            )
            db.add(alert)
            alerts.append(alert)

    # 2. Warning DSCR Margin (1.0 <= DSCR < 1.2)
    elif dscr < 1.2:
        rule_code = "FIN_DSCR_TIGHT"
        existing = (
            db.query(Alert)
            .filter(
                Alert.assessment_id == assessment.id,
                Alert.rule_code == rule_code,
                Alert.status == "ACTIVE",
            )
            .first()
        )
        if not existing:
            alert = Alert(
                id=uuid.uuid4(),
                institution_id=assessment.institution_id,
                assessment_id=assessment.id,
                rule_code=rule_code,
                severity="WARNING",
                message=f"Debt Service Coverage Ratio ({dscr:.2f}) has thin repayment cushion (1.0 to 1.2 buffer).",
                status="ACTIVE",
            )
            db.add(alert)
            alerts.append(alert)

    # 3. Agronomic Yield Deficit Check
    snapshot = assessment.snapshot_json or {}
    yield_snap = snapshot.get("yield_prediction", {})
    predicted_yield = float(yield_snap.get("value", 3000.0))
    if predicted_yield < 2000.0:
        rule_code = "AGRO_YIELD_DEFICIT"
        existing = (
            db.query(Alert)
            .filter(
                Alert.assessment_id == assessment.id,
                Alert.rule_code == rule_code,
                Alert.status == "ACTIVE",
            )
            .first()
        )
        if not existing:
            alert = Alert(
                id=uuid.uuid4(),
                institution_id=assessment.institution_id,
                assessment_id=assessment.id,
                rule_code=rule_code,
                severity="WARNING",
                message=f"Projected harvest yield ({predicted_yield:.1f} kg/ha) indicates significant crop stress.",
                status="ACTIVE",
            )
            db.add(alert)
            alerts.append(alert)

    if alerts:
        db.commit()
        for a in alerts:
            db.refresh(a)

    return alerts
