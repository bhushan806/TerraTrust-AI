# Backend Implementation Plan — Member 2

## Module layout
```text
apps/api/app/
  main.py, config.py
  api/v1/ (routers and dependencies)
  core/ (auth, authorization, errors, logging, request IDs)
  domain/ (typed domain rules; no HTTP dependency)
  schemas/ (Pydantic request/response models)
  services/ (assessment orchestration, income, scenarios, reports)
  repositories/ (tenant-scoped persistence)
  models/ (SQLAlchemy models)
  adapters/{weather,satellite,soil,market,credit,ml}/
  jobs/ (enqueue/status interface)
  audit/ (append-only events)
  migrations/ (Alembic)
```

## Build sequence
1. App/config/logging/request ID and shared error envelope.
2. Authentication adapter and centralized authorization policy; test tenant/branch isolation before adding domain endpoints.
3. PostgreSQL models/migrations and synthetic fixtures.
4. Borrower/farm/crop-cycle/loan CRUD and validation.
5. Observation, import, source provenance and quality status.
6. Provider adapter protocols with fake implementations.
7. ML client contract and timeout/schema/version checks.
8. Income calculation with unit conversion and versioned assumptions.
9. Assessment orchestration and immutable snapshots.
10. Scenario, explanations, history and report APIs.
11. Worker/job status, retries/idempotency, monitoring and release tests.

## Assessment workflow
1. Authenticate and authorize user and institution/branch.
2. Validate borrower, farm/crop cycle and loan relationship.
3. Snapshot required inputs and source timestamps.
4. Check freshness, quality and unit compatibility; return partial/blocked status according to policy.
5. Request yield inference with explicit feature schema and model version.
6. Calculate revenue, cost, net income and IADS from versioned assumptions.
7. Run repayment model only if a promoted model is enabled and validation gates are current; otherwise set `repayment_probability.status = NOT_AVAILABLE`.
8. Generate evidence-tagged explanations.
9. Persist result, source manifest, model/assumption versions and audit event atomically.
10. Return `202 + job_id` for async operation; client polls assessment/job status.
11. On failure, persist a typed failure state where possible; never return a completed risk result with silently missing mandatory inputs.

## Interfaces
- Provider protocol: `fetch(query) -> ProviderResult[NormalizedRecord]` including source, retrieval time, quality and error classification.
- ML client: `predict_yield(YieldInferenceRequest) -> YieldInferenceResponse`; strict schema and model version check.
- Job service: `enqueue(job_type, payload_ref, idempotency_key) -> job_id`.
- Audit: `append(actor, action, object_type, object_id, request_id, redacted_metadata)`.

## Failure handling
Use explicit connect/read timeouts; bounded retry only for transient/idempotent operations; circuit breaker only when operational need is proven. Invalid ML output is a dependency failure. Duplicate idempotency key returns existing resource. Concurrent edits use optimistic locking/409. External requests occur outside long-running DB transactions. Model/schema mismatch blocks finalization. Provider outage becomes `UNAVAILABLE`, not a fabricated value.

## Tests
Unit tests for domain formulas and validation; API integration tests against disposable PostgreSQL; migration up/down checks; tenant negative tests; idempotency/replay tests; provider timeout/schema tests; ML contract tests; assessment end-to-end tests; OpenAPI diff and schema validation. API docs and examples are required in every endpoint PR.
