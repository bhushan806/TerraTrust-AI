"""Credit Assessment Report Generation and Export Engine.

Follows Section 13 (API-032 & API-033) and Section 15 of engineering blueprint:
- Guarantees snapshot consistency by deriving report directly from immutable assessment snapshot.
- Strictly includes regulatory disclosures: PD = None, pd_status = "NOT_AVAILABLE".
- Generates structured memorandum content in JSON, Markdown, or text format.
- Uses database Job table for async/sync tracking and logs security audit trail.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple
from sqlalchemy.orm import Session

from app.models.assessment import CreditAssessment, RiskExplanation, ScenarioRun
from app.models.institution import Institution
from app.models.job import Job
from app.models.user import User
from app.repositories.audit_repo import log_audit_event
from app.schemas.report import ReportCreateRequest, ReportResponse


def generate_assessment_report(
    db: Session,
    assessment: CreditAssessment,
    request: ReportCreateRequest,
    current_user: User,
    request_id: str,
) -> Tuple[ReportResponse, Job]:
    """Compile immutable assessment snapshot into credit memorandum report and record job."""
    now_utc = datetime.now(timezone.utc)
    report_id = uuid.uuid4()
    institution = db.query(Institution).filter(Institution.id == assessment.institution_id).first()
    inst_name = institution.name if institution else "Lending Institution"

    snapshot = assessment.snapshot_json or {}
    borrower_snap = snapshot.get("borrower", {})
    crop_snap = snapshot.get("crop_cycle", {})
    yield_snap = snapshot.get("yield_prediction", {})
    income_snap = snapshot.get("income_estimate", {})

    borrower_name = borrower_snap.get("display_name", "Unknown Borrower")
    external_ref = borrower_snap.get("external_ref", "N/A")
    crop_code = crop_snap.get("crop_code", "AGRI-CROP")
    season = crop_snap.get("season", "N/A")
    planted_area = float(crop_snap.get("area_value", 1.0))
    area_unit = crop_snap.get("area_unit", "hectare")
    pred_yield = float(yield_snap.get("value", 0.0))
    dscr_val = float(assessment.dscr) if assessment.dscr is not None else None
    risk_band_val = assessment.risk_band or "UNKNOWN"

    # Scenarios and Explanations
    scenarios_list = (
        db.query(ScenarioRun)
        .filter(ScenarioRun.assessment_id == assessment.id)
        .order_by(ScenarioRun.created_at.desc())
        .all()
    ) if request.include_scenarios else []

    explanations_list = (
        db.query(RiskExplanation)
        .filter(RiskExplanation.assessment_id == assessment.id)
        .order_by(RiskExplanation.created_at.asc())
        .all()
    ) if request.include_explanations else []

    summary_data = {
        "title": request.report_title or "Agricultural Credit Risk Assessment Memorandum",
        "institution_name": inst_name,
        "borrower_name": borrower_name,
        "external_ref": external_ref,
        "crop_code": crop_code,
        "season": season,
        "planted_area": planted_area,
        "area_unit": area_unit,
        "predicted_yield_kg_ha": pred_yield,
        "dscr": dscr_val,
        "risk_band": risk_band_val,
        "repayment_probability_status": "NOT_AVAILABLE",
        "disclaimer": (
            "REGULATORY NOTICE: In accordance with model risk governance guidelines, "
            "uncalibrated Probability of Default (PD) is withheld (status: NOT_AVAILABLE) "
            "until validated historical default outcome labels are approved."
        ),
        "scenarios_evaluated_count": len(scenarios_list),
        "explanations_count": len(explanations_list),
    }

    # Render formatted markdown / text memorandum
    content_lines = [
        f"# {summary_data['title']}",
        f"**Report ID:** `{report_id}`",
        f"**Assessment ID:** `{assessment.id}`",
        f"**Generated At:** {now_utc.isoformat()}",
        f"**Institution:** {inst_name}",
        "",
        "---",
        "",
        "## 1. Executive Summary & Regulatory Governance Notice",
        f"> **Regulatory Gate Status:** `PD: NOT_AVAILABLE`",
        f"> {summary_data['disclaimer']}",
        "",
        f"- **Assigned Risk Band:** `{risk_band_val}`",
        f"- **Debt Service Coverage Ratio (DSCR):** `{dscr_val if dscr_val is not None else 'N/A'}`",
        "",
        "## 2. Borrower & Enterprise Profile",
        f"- **Borrower Name:** {borrower_name}",
        f"- **Customer Reference:** `{external_ref}`",
        f"- **Planted Area:** {planted_area} {area_unit}",
        f"- **Primary Crop & Season:** {crop_code} ({season})",
        "",
        "## 3. Physical Agronomic Yield Projections",
        f"- **Model Estimated Yield:** {pred_yield} kg/{area_unit}",
        f"- **Model Version ID:** `{yield_snap.get('model_version_id', 'N/A')}`",
        "",
        "## 4. Financial Cash Flow & Debt Capacity (IADS)",
        f"- **Gross Revenue:** INR {income_snap.get('gross_revenue', 0.0):,.2f}",
        f"- **Production Costs:** INR {income_snap.get('production_costs', 0.0):,.2f}",
        f"- **Net Farm Income:** INR {income_snap.get('net_farm_income', 0.0):,.2f}",
        f"- **Income Available for Debt Service (IADS):** INR {income_snap.get('iads', 0.0):,.2f}",
        f"- **Scheduled Debt Service:** INR {snapshot.get('debt_service', 0.0):,.2f}",
        "",
    ]

    if request.include_scenarios and scenarios_list:
        content_lines.append("## 5. Climate & Market Stress-Testing Scenarios")
        for s in scenarios_list:
            res_j = s.result_json or {}
            content_lines.append(
                f"- **{s.scenario_code}** (`{s.evidence_status}`): "
                f"Yield Delta: {float(s.yield_delta_pct)*100:+.1f}%, "
                f"Stressed DSCR: {res_j.get('stressed_dscr', 'N/A')} "
                f"(Stressed Band: `{res_j.get('stressed_risk_band', 'N/A')}`)"
            )
        content_lines.append("")

    if request.include_explanations and explanations_list:
        content_lines.append("## 6. Risk Factor Attribution Matrix")
        for e in explanations_list:
            content_lines.append(
                f"- **{e.factor_code}** ({e.direction}, {e.explanation_type}): "
                f"{float(e.contribution_value)} {e.unit}. *{e.caveat or ''}*"
            )
        content_lines.append("")

    content_text = "\n".join(content_lines)

    result_payload = {
        "report_id": str(report_id),
        "assessment_id": str(assessment.id),
        "institution_id": str(assessment.institution_id),
        "status": "COMPLETED",
        "format": request.format.upper(),
        "download_url": f"/api/v1/reports/{report_id}/download",
        "summary": summary_data,
        "content": content_text,
    }

    # Persist as Job record
    job = Job(
        id=report_id,
        institution_id=assessment.institution_id,
        type="REPORT_GENERATION",
        status="COMPLETED",
        payload_json=request.model_dump(),
        result_json=result_payload,
        attempts=1,
        started_at=now_utc,
        completed_at=now_utc,
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Log security audit trail
    log_audit_event(
        db=db,
        institution_id=assessment.institution_id,
        actor_id=current_user.id,
        action="GENERATE_REPORT",
        object_type="REPORT",
        object_id=report_id,
        request_id=request_id,
        metadata={
            "assessment_id": str(assessment.id),
            "format": request.format.upper(),
            "risk_band": risk_band_val,
        },
    )

    response = ReportResponse(
        report_id=job.id,
        assessment_id=assessment.id,
        institution_id=assessment.institution_id,
        status="COMPLETED",
        format=request.format.upper(),
        download_url=f"/api/v1/reports/{job.id}/download",
        created_at=job.created_at,
        completed_at=job.completed_at,
        summary=summary_data,
        content=content_text,
    )

    return response, job
