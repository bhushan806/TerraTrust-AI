# User Stories and Acceptance Criteria

## Personas
1. **Loan officer (primary):** reviews a borrower, farm, crop cycle and loan; needs a readable evidence trail and report.
2. **Credit-risk analyst:** compares climate scenarios and checks data/model limitations before interpreting risk.
3. **Institution administrator:** manages users/branches and needs auditable access controls and source health.
4. **Platform operator:** diagnoses failed ingestion/inference jobs without seeing unnecessary borrower PII.

## Core journeys
1. Sign in → choose institution/branch-scoped borrower → inspect farm/crop cycle → review data freshness → run assessment → inspect yield/income and risk drivers → save/review report.
2. Analyst selects a baseline and supported adverse scenario → reviews assumptions and delta → saves scenario result linked to the assessment.
3. New forecast/price/repayment event arrives → policy marks assessment stale or queues reassessment → new immutable snapshot is created with trigger reason.
4. Administrator invites/assigns a user → role and branch scope are enforced → audit event records the change.

## Stories and acceptance criteria
- **US-01:** As an officer, I can create a borrower and farm. Given authorized tenant scope, valid required fields save and appear in lists; cross-tenant IDs return 404/403 according to policy without leaking existence.
- **US-02:** As an officer, I can register crop cycle and irrigation. Dates, area and units are validated; unsupported crop values are explicitly flagged.
- **US-03:** As an analyst, I can see weather, satellite, soil and price observations with source, units and timestamp. Missing/stale values are visibly marked; no missing value is silently converted to zero.
- **US-04:** As an analyst, I can request yield prediction. Supported inputs return estimate, units, model version, horizon, quality status and uncertainty if supported; unsupported geography/crop returns a typed error/status.
- **US-05:** As an officer, I can inspect farm income. Revenue, costs and IADS show formulas, currency/unit and assumptions; arithmetic reconciles to stored inputs.
- **US-06:** As an analyst, I can run a climate scenario. The response names scenario assumptions and marks illustrative versus evidence-backed outputs; invalid ranges are rejected.
- **US-07:** As a risk analyst, I can review a credit assessment. If a validated repayment model is unavailable, the UI says PD is unavailable and shows the demonstration indicator only with a persistent label.
- **US-08:** As an officer, I can compare assessment history. Prior snapshots cannot be overwritten; each snapshot shows run time, trigger, inputs and model versions.
- **US-09:** As an officer, I can export a report. It matches the saved snapshot, includes limitations and provenance, and is denied outside authorized scope.
- **US-10:** As an administrator, I can manage role/branch access. Least privilege is enforced server-side and changes are audited.
- **US-11:** As an operator, I can identify provider/inference failures. Health/status data excludes secrets and unnecessary PII; retries are bounded and failures visible.

## Definition of done
Contract agreed; implementation owner identified; unit and relevant integration tests pass; negative authorization tests pass for protected operations; errors follow shared schema; logs redact sensitive fields; docs/examples updated; accessibility and responsive checks complete for UI; provenance and limitations are visible wherever model results are shown.
