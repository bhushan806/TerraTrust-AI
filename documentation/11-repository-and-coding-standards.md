# Repository and Coding Standards

## Monorepo
```text
/apps/web                 React + TypeScript UI
/apps/api                 FastAPI routes, domain services, persistence
/apps/worker              ingestion and reassessment jobs
/services/ml              training, feature pipeline, inference contract
/packages/contracts       OpenAPI, JSON schemas, generated TS types
/packages/shared          small shared constants/utilities only
/infra                    Docker, CI/CD, deployment and observability config
/scripts                  audit, import, migration and maintenance scripts
/tests/contract            API/ML/provider contract tests
/tests/e2e                 browser workflows
/docs                     architecture and implementation documents
```

## Dependency direction
Web consumes contracts; API owns domain rules and persistence; worker calls API-domain services or shared service modules through explicit interfaces; ML package does not import API/database models; provider adapters implement declared protocols; shared package must not become a dumping ground.

## Standards
- Python: type hints, Pydantic boundary schemas, Ruff formatting/linting, pytest, SQLAlchemy migrations via Alembic.
- TypeScript: strict mode, ESLint + formatter, no `any` without reviewed justification, runtime validation for API responses where needed.
- API: `/api/v1`, plural resources, consistent errors, UTC timestamps, explicit units/currency, pagination for collections.
- Database: migrations only; no production schema edits by hand; constraints/indexes reviewed with migrations.
- ML: scripts accept config/seed; artifact includes feature schema and manifest; no hidden notebook-only logic.
- Commits: Conventional Commits suggested (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- Branches: short-lived feature branches; protected main; required CI and one reviewer; no force push to protected branch.
- PR: purpose, scope, risk, migration/API impact, tests, screenshots for UI, rollback notes, data/security impact.

## Local workflow
`docker compose up --build`; apply migrations using documented command; load synthetic fixtures; run API/web/ML contract tests. `.env.example` contains names and safe placeholders only; real secrets never committed.
