# CI/CD, Deployment and Observability

## Pipeline
Pull request → format/lint/type-check → unit tests → schema/contract tests → integration tests + migrations → build web/API/worker/ML artifacts → dependency/secret/SAST/container scan → E2E smoke → review and merge. Main branch → immutable versioned artifacts → deploy staging → smoke and acceptance → approval → production rollout → monitor and rollback if release criteria fail.

## Artifacts
Tag images with commit SHA and release version; retain SBOM and scan reports. Model artifact promoted separately with checksum, training manifest, model card, evaluation report and approval metadata. Do not retrain implicitly during deployment.

## Configuration
`.env.example` lists names only. Validate required configuration at startup. Keep dev/staging/prod secrets separate. Rotate credentials; use workload identity/managed identity when available. Do not pass secrets as build args or bake them into images.

## Observability signals
- API: request rate, p50/p95/p99 latency, 4xx/5xx, auth denials.
- Worker: queue depth, oldest job age, retries, dead/failed jobs, duration.
- Providers: latency, quota/rate-limit responses, failure rate, stale input rate.
- ML: load/inference latency, error rate, model version distribution, unsupported-domain count.
- Data/model: missingness, drift, prediction distributions, eventual yield error, calibration when labels mature.
- Security: privileged changes, repeated failed auth, import/report abuse signals.

## Operational rules
Use request/job/correlation IDs. Redact secrets and minimize personal/financial content. Alerts need an owner, severity, runbook and actionable threshold; avoid alerting on one transient failure. Health endpoints disclose no credentials or detailed infrastructure. Define SLOs after baseline traffic/load test.

## Rollback and recovery
Keep previous app image and model version available. Roll back app and model independently when safe; avoid reverting schema if destructive migration already occurred. Use expand/migrate/contract migrations. Restore backups into isolated environment and verify record counts, application startup, assessment history and access controls before declaring recovery complete.
