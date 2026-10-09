# REST API Specification (Proposed)

**Base:** `/api/v1`; HTTPS outside local development. OpenAPI source of truth is `../openapi.yaml`. The initial proposal contains **34 MVP operations** and **12 deferred operations**. Endpoint count is the number of operation IDs in the OpenAPI file; run `scripts/count_endpoints.py` after changes.

## Shared rules
- Authentication: OIDC-backed session or bearer access token as approved by threat review; never accept user/tenant IDs as authority without verifying scope.
- Roles: `LOAN_OFFICER`, `RISK_ANALYST`, `INSTITUTION_ADMIN`, `PLATFORM_OPERATOR`; permissions are action- and tenant-scoped.
- Pagination: `limit` default 25, max 100; opaque `cursor` preferred for changing datasets. Filtering is allowlisted.
- Error envelope: `{ "error": { "code": "VALIDATION_ERROR", "message": "Request could not be validated", "request_id": "...", "details": [] } }`. Do not return stack traces or sensitive existence details.
- Idempotency: `Idempotency-Key` required for assessment creation and other retry-sensitive commands.
- Status: `202` for queued jobs; `409` for state/version conflicts; `422` for schema/domain validation; `429` for rate limits; `503` for dependency outage.
- Every operation has a stable `operationId`, schema, authorization expectation and tests. Institution/branch scope is enforced in the query itself.

## MVP operation inventory (34)
| ID | Method + route | Purpose / roles | Behavior and tests |
|---|---|---|---|
| API-001 | GET `/auth/me` | current user; all authenticated | sync; tenant context; unauthenticated test |
| API-002 | GET `/institutions/current` | institution; all authenticated | scope test |
| API-003 | GET `/branches` | list scoped branches; admin/officer/analyst | pagination + scope |
| API-004 | GET `/users` | user list; institution admin | branch/tenant isolation |
| API-005 | POST `/users/invitations` | invite user; admin | idempotency, audit |
| API-006 | PATCH `/users/{user_id}/roles` | change role/scope; admin | least privilege, audit |
| API-007 | GET `/borrowers` | search borrowers; officer/analyst | filter/pagination |
| API-008 | POST `/borrowers` | create borrower; officer | validation, PII redaction |
| API-009 | GET `/borrowers/{borrower_id}` | details; officer/analyst | object-level auth |
| API-010 | PATCH `/borrowers/{borrower_id}` | update borrower; officer | optimistic concurrency |
| API-011 | GET `/farms` | scoped farm list; officer/analyst | filters/scope |
| API-012 | POST `/farms` | create farm; officer | geometry/area validation |
| API-013 | GET `/farms/{farm_id}` | farm detail; officer/analyst | object auth |
| API-014 | POST `/farms/{farm_id}/crop-cycles` | add crop cycle; officer | date/crop validation |
| API-015 | GET `/crop-cycles/{cycle_id}` | cycle detail; officer/analyst | scope |
| API-016 | POST `/loan-applications` | create application; officer | financial validation, audit |
| API-017 | GET `/loan-applications/{application_id}` | application detail; officer/analyst | scope |
| API-018 | POST `/loans/{loan_id}/repayment-schedules` | create schedule version; officer/admin | transaction, duplicate/version test |
| API-019 | POST `/loans/{loan_id}/repayment-events` | record repayment; officer | idempotency/reconciliation |
| API-020 | GET `/crop-cycles/{cycle_id}/observations` | climate/satellite/soil series; analyst/officer | freshness and source metadata |
| API-021 | POST `/data-imports` | upload/import approved data; admin/analyst | size/type checks, async job |
| API-022 | GET `/data-imports/{job_id}` | import status; submitter/admin | scope/redaction |
| API-023 | GET `/market-prices` | query prices; analyst/officer | units/date/market filters |
| API-024 | POST `/yield-predictions` | request yield inference; analyst/officer | async, model status |
| API-025 | POST `/income-estimates` | calculate farm income; officer/analyst | unit arithmetic tests |
| API-026 | POST `/assessments` | create assessment; analyst/officer | async, idempotent, audit |
| API-027 | GET `/assessments/{assessment_id}` | result/status; officer/analyst | scope; PD nullable |
| API-028 | POST `/assessments/{assessment_id}/scenarios` | run scenario; analyst | assumptions validated; async if needed |
| API-029 | GET `/assessments/{assessment_id}/scenarios` | list scenarios; analyst/officer | scope/order |
| API-030 | GET `/assessments/{assessment_id}/explanations` | risk drivers; analyst/officer | contribution/caveat schema |
| API-031 | GET `/borrowers/{borrower_id}/assessment-history` | timeline; officer/analyst | immutable ordering |
| API-032 | POST `/assessments/{assessment_id}/reports` | create report; officer/analyst | snapshot consistency, async export |
| API-033 | GET `/reports/{report_id}` | download/status; authorized requester | signed short-lived URL or streamed file |
| API-034 | GET `/health/ready` | readiness; platform operator/load balancer | no secrets; dependency status limited |

## Deferred operations (12)
| ID | Method + route | Purpose |
|---|---|---|
| API-D01 | GET `/portfolio/summary` | portfolio risk aggregates |
| API-D02 | GET `/portfolio/regions` | geospatial aggregation |
| API-D03 | GET `/alerts` | alert inbox |
| API-D04 | PATCH `/alerts/{alert_id}` | acknowledge/resolve alert |
| API-D05 | POST `/monitoring/rules` | configure reassessment/alert rules |
| API-D06 | GET `/monitoring/rules` | list rules |
| API-D07 | POST `/data-sources/{source_id}/sync` | trigger provider sync |
| API-D08 | GET `/data-sources` | source registry/status UI |
| API-D09 | POST `/models/{model_id}/promote` | gated model promotion |
| API-D10 | GET `/models` | model registry view |
| API-D11 | GET `/audit-events` | privileged audit search |
| API-D12 | POST `/assessments/{assessment_id}/review-decision` | record human review outcome |

## Required schemas
Request/response examples and reusable JSON schemas are in `../packages/contracts/schemas/`. `openapi.yaml` is the contract baseline; route/schema changes require contract tests and frontend generated-type update.

## Per-operation checklist
For every operation, the implementing PR must record: tenant/branch scope, authorized roles, request validation, response schema, DB effects, external dependencies, sync/async behavior, idempotency, audit event, status/error codes, unit tests, integration tests and example fixture. The inventory above gives the contract-level summary; OpenAPI schemas define machine-readable shapes.
