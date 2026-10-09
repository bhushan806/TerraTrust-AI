# Data Ingestion and Quality

## Pipeline stages
1. Acquire through approved API, file import or institution adapter.
2. Persist immutable raw payload/file metadata in restricted object storage or raw tables.
3. Validate schema, license/source, timestamp, units, spatial reference and expected ranges.
4. Normalize units/time/geography using versioned transforms.
5. Deduplicate with provider key or deterministic natural key.
6. Run completeness, freshness, range and cross-source checks.
7. Publish normalized observations and lineage metadata transactionally.
8. Emit ingestion status/metrics and a safe operational event.

## Quality statuses
`VALID`, `PARTIAL`, `STALE`, `INVALID`, `UNAVAILABLE`, `NOT_APPLICABLE`. Each has a documented reason code. Do not replace missing weather, satellite, soil or price inputs with zero. Models must explicitly define allowed missingness and fail or return degraded status when requirements are unmet.

## Freshness policy (proposed defaults; tune by source)
- Forecast: use provider issue time and valid time; mark stale if past provider validity or institution-approved age limit.
- Satellite: freshness depends on acquisition date, crop stage and cloud coverage; avoid one universal cutoff.
- Soil moisture: respect product temporal resolution and measurement depth.
- Market price: use latest valid market-day record for the chosen commodity/market; expose date and source.
- Credit/repayment: use institution system-of-record and reconciliation timestamp.

## Reliability behavior
Provider requests use connection/read timeouts, bounded retries with exponential backoff and jitter for transient failures, circuit-breaker behavior if repeated failure is measured, and rate-limit respect. Do not retry non-idempotent writes without an idempotency key. Store failed attempts without storing secrets.

## Data-quality tests
Schema contract tests; unit conversion tests; impossible-range tests; duplicate tests; timezone boundary tests; spatial join coverage tests; freshness tests; source outage tests; replay/idempotency tests; and drift checks against approved baselines.

## Provenance record
For each derived feature, retain input record references, source/version, transformation code version, run timestamp, quality flags and any manual override (who/when/why). Reports should summarize provenance without exposing provider credentials or excessive personal data.
