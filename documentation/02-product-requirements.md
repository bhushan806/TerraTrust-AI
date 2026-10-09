# Product Requirements

## Goals
1. Bring required agricultural, climate, market and credit inputs into a traceable review.
2. Estimate crop yield and farm cash flow with units, uncertainty and data-quality status.
3. Support climate stress scenarios without overstating scientific certainty.
4. Explain the drivers of a result and preserve a reproducible assessment history.
5. Keep the four-person team able to build in parallel against stable contracts.

## Non-goals for MVP
Automated loan adjudication; farmer mobile app; real-time satellite processing at scale; nationwide coverage guarantees; production repayment PD without labels; insurance pricing; and microservices/Kubernetes by default.

## Functional requirements
- FR-01 manage institution, branch, user and role scope.
- FR-02 manage borrower, farm, plot and crop-cycle records.
- FR-03 record loan application, loan terms, schedule and repayment events.
- FR-04 ingest/import historical weather and forecasts with source/time/units.
- FR-05 store satellite vegetation/crop observations and soil-moisture observations with provenance.
- FR-06 record crop type, irrigation and yield history.
- FR-07 import market prices with commodity, market, currency, unit and date.
- FR-08 run crop-yield inference only for supported inputs/regions/crops.
- FR-09 estimate gross revenue, costs and income available for debt service (IADS) using versioned assumptions.
- FR-10 incorporate credit history only through authorized, validated sources.
- FR-11 create an assessment snapshot with missingness/freshness status.
- FR-12 display validated repayment probability only after the credit-model gate passes.
- FR-13 display explanatory factors and distinguish model contribution from causal claims.
- FR-14 simulate supported climate scenarios and label illustrative assumptions.
- FR-15 maintain assessment timeline and audit events.
- FR-16 generate downloadable review reports.
- FR-17 support reassessment scheduling/events and stale-data warnings.
- FR-18 enforce tenant/branch access controls.
- FR-19 expose source health and model version metadata to authorized users.
- FR-20 provide a demonstration mode that never mislabels illustrative scores as calibrated probabilities.

## Non-functional requirements (proposed targets)
- Security: deny by default; tenant-scoped authorization on every object access; secrets never committed; sensitive data excluded from logs.
- Reliability: graceful degradation for unavailable providers; timeouts/retries bounded; assessment failures leave a traceable status.
- Performance target for pilot: ordinary CRUD p95 < 500 ms under agreed test load; assessment submission returns job ID within 2 s when asynchronous. Targets must be revisited after load testing.
- Accessibility: keyboard-operable core workflows, labelled controls, meaningful errors, adequate contrast and automated checks plus manual review.
- Auditability: immutable assessment snapshot and source/model/assumption provenance.
- Reproducibility: pinned dependencies, deterministic split seeds, versioned features and model artifacts.
- Privacy: collect minimum necessary data, define retention/deletion, and obtain institutional/legal review before live personal/financial data.

## Success metrics (pilot hypotheses)
- ≥95% of assessments show source freshness/completeness and model version.
- 100% of assessment outputs can be traced to a snapshot of input/source/model versions.
- 0 cross-tenant object access in authorization tests.
- ≥90% of critical workflow tests pass in CI; no unresolved critical/high security findings at release.
- Loan officers can complete a test assessment in a usability study with a team-agreed median time target.
- Yield model meets a pre-registered, crop/region-specific baseline improvement and error threshold before being used outside demonstration mode. Do not set numeric model performance until data audit establishes a defensible baseline.
