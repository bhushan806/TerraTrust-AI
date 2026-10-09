# Testing and Quality Assurance

## Testing pyramid and ownership
| Layer | Examples | Owner |
|---|---|---|
| Unit | domain formulas, validators, UI components, feature transforms | M1/M2/M3 by code |
| API integration | routes + auth + DB; provider adapter contracts | M2; M4 harness |
| Database/migration | constraints, tenant filters, migration upgrade path | M2; M4 pipeline |
| Contract | OpenAPI, JSON schema, ML request/response, provider adapters | M2/M3; M4 gate |
| ML/data | leakage checks, reproducibility, missingness, drift, unit validation | M3 |
| E2E | login → borrower → crop cycle → assessment → explanation/report | M1 authors UI; M4 integrates |
| Security | tenant IDOR, role escalation, SSRF, upload abuse, secret scans | M4 leads; M2 fixes API |
| Performance | API p95, job throughput, provider timeout behavior | M4 harness; M2/M3 optimize |
| Accessibility | keyboard, labels, contrast, screen-reader announcements | M1 |
| Deployment/recovery | smoke, rollback, backup restore, migration failure | M4 |

## Critical test matrix
- Missing climate/soil/price data: status visible; no silent zero substitution.
- Stale forecast: freshness flag and policy behavior verified.
- Unsupported crop/geography: typed unsupported-domain response; no misleading estimate.
- Incorrect units: reject or explicitly convert; arithmetic regression tests.
- Missing repayment labels: PD stays unavailable.
- Uncalibrated model: release gate blocks PD activation.
- Invalid scenario/out-of-range perturbation: 422/domain error and no result persisted as completed.
- Cross-tenant/branch access: 403/404 policy enforced for every object endpoint.
- ML timeout/schema mismatch: bounded timeout, typed failure, no fabricated output.
- Provider outage/rate limit: bounded retry, quality status, no retry storm.
- Duplicate assessment: same idempotent resource returned; no duplicate charge/run.
- Migration failure: deployment halts and recovery plan is exercised.
- Rollback failure: runbook escalates; do not report release healthy.

## Release gates (proposed)
- 100% of authorization tests pass; zero known cross-tenant exposure.
- No open critical/high exploitable security finding unless formally risk-accepted by authorized owner.
- All critical journey E2E tests pass.
- API and ML contracts validate; no unreviewed breaking change.
- Database migration and restore smoke test pass.
- All assessment outputs have input manifest, model/assumption version and limitation metadata.
- Production PD gate evidence complete; otherwise PD feature disabled.
- Performance thresholds agreed and passed under documented test load.
