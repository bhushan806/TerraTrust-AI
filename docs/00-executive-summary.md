# FIN-03 — Executive Summary

## Decision summary
Build a climate-aware agricultural credit decision-support system for institutional loan officers and risk analysts. The product combines farm/crop-cycle information, historical weather, forecasts, satellite crop observations, soil moisture, irrigation, yield history, market prices, borrower credit history and loan obligations. It produces traceable yield and farm-income estimates, climate scenarios, risk-driver explanations and reassessment history.

**Important boundary:** crop-yield prediction is not repayment prediction. The system must not display a calibrated repayment probability until representative, lawful, historical repayment labels and an independently validated credit model exist. Until then, show an explicitly labelled *demonstration risk indicator* or *not available*—never a fabricated probability.

## Proposed stack
- Web: React + TypeScript + Vite; React Router; TanStack Query; React Hook Form + Zod; accessible component system; Recharts; map layer only where geospatial data quality justifies it.
- API: Python + FastAPI + Pydantic; SQLAlchemy 2; Alembic; PostgreSQL/PostGIS; OpenAPI generated from API definitions.
- ML: Python, pandas, scikit-learn, joblib; experiment metadata and model cards; separate inference package/process only when isolation or dependency needs justify it.
- Jobs: start with a database-backed job table and worker process; add Redis/Celery only when measured queue/concurrency needs justify it.
- Delivery: Docker Compose locally; GitHub Actions CI; managed container hosting and managed PostgreSQL for production; object storage for versioned model/data artifacts.

## Scope and counts
The registry defines **20 mandatory capabilities**. For planning, each capability is one feature ID and is counted once. The proposed MVP implements all 20 at a safe, bounded depth; features marked “conditional” are available only when their data/validation gates pass. Portfolio analytics, geographic maps, automated alerts, resilience scoring, and advanced administration are later-release extensions unless required for the first pilot. The detailed registry records the exact classification and count.

Endpoint counts are maintained in `13-api-specification.md` and `openapi.yaml`; the initial API proposal has **34 MVP operations** and **12 deferred operations**. These are proposed contract counts, not implemented endpoints.

## Team ownership
- Member 1: all frontend code, UI tests and frontend deployment artifact.
- Member 2: main API, domain logic, persistence integration and API tests.
- Member 3: datasets, data pipelines, yield model, income calculation support and ML inference contract.
- Member 4: platform code/configuration, CI/CD, security controls, integration/E2E/performance/recovery tests and release gates.

## First gate
Before implementation, approve the domain glossary, MVP boundary, data provenance rules, schema/API/ML contracts, authentication and tenant model, and the “no repayment probability without validated labels” rule. Inspect both named reference datasets before fixing feature columns or making claims about coverage.

## Status labels used in this blueprint
- **Confirmed:** part of the locked challenge statement.
- **Proposed:** recommended design decision requiring team approval.
- **Assumption:** working choice used to keep planning moving.
- **Unverified:** requires dataset/provider/legal validation.
- **Illustrative:** example only; not a measured result or real credit decision.
