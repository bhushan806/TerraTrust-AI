# Open Questions and Architecture Decisions

## Decisions proposed for approval
- ADR-001: modular monolith with separately packaged ML logic; no microservices initially.
- ADR-002: PostgreSQL system of record; PostGIS only where actual spatial queries require it.
- ADR-003: React/TypeScript + FastAPI/Python + PostgreSQL + scikit-learn.
- ADR-004: PD disabled until suitable repayment labels, calibration, governance and release gates pass.
- ADR-005: provider adapters and mock implementations permit parallel work.
- ADR-006: database-backed job table for initial background tasks; add queue when justified.
- ADR-007: all assessment snapshots immutable; corrections create new versions.
- ADR-008: no zero-filling missing critical data; quality states visible end-to-end.

## Open questions (record owner and due date in project tracker)
1. Which institution/customer and pilot geography/crops are in scope? Owner: product lead.
2. What loan outcome and horizon define repayment risk? Owner: lender risk owner + M3.
3. Are historical application-time features and mature repayment labels available lawfully? Owner: institution + M3.
4. What is the authoritative source for credit history and repayment data? Owner: M2/institution.
5. Which satellite/soil/weather/market provider licenses allow intended use? Owner: M3 + legal.
6. What farm-level geospatial precision and plot geometry are available? Owner: M3.
7. What income/household obligation formula does lender policy require? Owner: M2 + risk analyst.
8. Which OIDC provider and hosting region are approved? Owner: M4 + institution.
9. What retention, deletion, consent/notice, RPO/RTO and audit retention are required? Owner: legal/compliance + M4.
10. What expected volume/performance SLO and budget are approved? Owner: product owner + M4.
11. Which language/localization is required for the pilot? Owner: M1 + institution.
12. What human review, override, appeal and adverse-action explanation policy is required? Owner: lender risk/compliance.

## Approval rule
No code should silently settle a domain or legal question. Where not resolved, use a documented assumption and safe behavior; keep feature flags disabled when the assumption affects credit decisions or personal data processing.
