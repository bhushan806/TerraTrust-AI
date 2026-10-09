# Technology Stack and Decisions

## Recommended stack
| Layer | Selection | Why / alternatives |
|---|---|---|
| Frontend | React + TypeScript + Vite | broad ecosystem, strong typing; Next.js unnecessary if app is authenticated dashboard only |
| UI/data | React Router, TanStack Query, React Hook Form + Zod, accessible component primitives | separates routing, server state and form validation |
| Charts/maps | Recharts; Leaflet only when useful | keep maps deferred until reliable geospatial inputs exist |
| API | FastAPI + Pydantic | Python aligns with ML, typed validation and OpenAPI |
| Persistence | PostgreSQL + SQLAlchemy 2 + Alembic | relational loan/assessment data, transactions and migrations |
| Geospatial | PostGIS optional but recommended if polygon/point queries are part of pilot | don't add until geometry use is defined |
| ML | pandas, scikit-learn, joblib | transparent baselines and maintainable tabular models |
| Worker | separate Python worker using DB job table initially | avoids broker overhead; move to Celery/Redis only if measured need |
| Contracts | OpenAPI + shared JSON schemas/types generated or checked in CI | prevent frontend/backend divergence |
| Auth | OIDC-compatible identity provider; short-lived secure session/token pattern chosen after threat review | avoid custom password crypto; local dev can use seeded mock identity only |
| CI | GitHub Actions, Ruff, mypy/pyright as chosen, pytest, ESLint, typecheck, npm tests, secret/dependency/container scans | clear merge gates |
| Deploy | Docker containers + managed PostgreSQL + object storage | low operations burden; provider chosen based on region, privacy and budget |
| Observability | structured logs, metrics and traces with OpenTelemetry-compatible instrumentation | provider-neutral baseline |

## Version policy
At project start, pin current stable supported releases in lockfiles and container images; record versions in `docs/09-technology-stack-and-decisions.md`. Use Python supported by all selected packages (prefer a currently supported 3.x release after compatibility check), Node.js active LTS, PostgreSQL supported major, and lockfile reproducibility. Do not use floating `latest` in production. Review upgrades monthly and security advisories continuously.

## Architecture decisions (proposed ADRs)
- ADR-001: modular monolith for domain API; defer microservices until independently scaling/deploying a module is justified.
- ADR-002: PostgreSQL is system of record; immutable assessment snapshots and provenance records.
- ADR-003: separate ML package/process boundary; begin as internal inference service/process only if deployment dependencies require it.
- ADR-004: no repayment PD until valid labels and validation gate.
- ADR-005: adapters isolate providers; mock/import providers enable parallel development.
- ADR-006: background jobs via DB-backed queue first; broker introduced only after throughput/reliability evidence.
- ADR-007: institution/tenant/branch scope is enforced server-side on every query and mutation.
- ADR-008: all model and scenario outputs include quality, units, limitations and version metadata.

## Cost model (planning bands, not quotes)
- Local development: typically no hosting cost beyond laptops; provider API quotas may apply.
- Demo/staging: one small application container, one small managed database, object storage and logs; plan roughly tens to a few hundred USD/month depending on provider/region, uptime and data transfer. Obtain actual quotes before procurement.
- Production: managed database backups/high availability, multiple app replicas, monitoring retention, security tooling, provider fees, data storage/egress and support can raise costs materially; obtain volume-based quotes and run load tests.
- Data providers: never assume free/commercial redistribution rights. Track usage/quotas and terms in source registry.
