# TerraTrust AI (FIN-03) — Implementation Audit & Architectural Assessment Report

**System Name:** TerraTrust AI (FIN-03 Climate-Aware Agricultural Credit Decision-Support System)  
**Date:** October 2026  
**Auditor:** Senior Full-Stack & ML Systems Architect  
**Repository State:** Audited & Verified Against Operational Code, Schemas, Contracts, and CI Baseline  

---

## 1. Verified Current Architecture

### Frontend Architecture (`apps/web`)
- **Framework & Tooling:** React 18.3.1, TypeScript 5.5.4, Vite 5.4.6, TailwindCSS 3.4.11, PostCSS.
- **Routing & State:** React Router DOM v6.26.2, TanStack React Query v5.56.2 for asynchronous server state, React Hook Form v7.53.0 with Zod v3.23.8 for validation.
- **Visuals & Charts:** Lucide React icons, Recharts v2.12.7, custom CSS tokens with financial SaaS styling (`#0B2545` deep navy, `#137547` agricultural forest green, `#10b981` emerald accents, `#f8fafc` clean slate surfaces).
- **API Client:** Axios-based centralized client (`src/lib/api-client/client.ts`) with request interceptors (`Authorization: Bearer <token>`, `X-Branch-ID`, `X-Request-ID`) and response normalization envelopes.

### Backend Architecture (`apps/api`)
- **Framework & Runtime:** Python 3.12, FastAPI, Pydantic v2, Uvicorn.
- **Database Layer:** SQLAlchemy 2.0 ORM, Alembic migrations (`f54aad94240a_initial_schema.py`), connection pooling with `pool_pre_ping=True`, dual compatibility with PostgreSQL 16 (`psycopg`) and SQLite (`sqlite:///...` for lightweight/testing environments).
- **Security & RBAC:** PBKDF2/Bcrypt password hashing, HMAC-SHA256 (HS256) JWT access token issuance (8-hour expiration), tenant-isolated queries via `institution_id`, branch-scoped security guards (`verify_branch_access`), in-memory IP/email rate limiting for `/auth/login`.
- **Model Inference Service:** Scikit-learn / Joblib ExtraTreesRegressor loaded from `apps/api/models/terratust_crop_yield_model.pkl` (33.2 MB) evaluating agronomic features (`Fertilizer`, `temp`, `N`, `P`, `K`).

---

## 2. Existing Features That Work

| Component / Subsystem | Verification Method | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Backend Unit & Integration Suite** | `pytest apps/api/tests` (70 tests) | **PASSING** | 100% test pass rate across auth, models, CRUD, and ML inference. |
| **Frontend Test Suite** | `vitest run` (157 tests) | **PASSING** | Validates permission matrices, formatters, errors, and risk gauges. |
| **Frontend Production Build** | `tsc && vite build` | **PASSING** | Bundles cleanly in ~9.6s into `apps/web/dist`. |
| **OpenAPI Contracts Specification** | `openapi-spec-validator openapi.yaml` | **PASSING** | All 46 operations (34 MVP / 12 Deferred) validated with resolved path parameters. |
| **Security Baseline (Gitleaks)** | `gitleaks detect --source .` | **PASSING** | Commit history clean; false positives documented in `.gitleaksignore`. |
| **Crop Yield ML Inference** | `/api/v1/predict-yield` & Python unit tests | **PASSING** | Real scikit-learn ExtraTreesRegressor model file loaded and active. |
| **Deterministic Database Seeding** | `seed_database(db)` in `apps/api/app/db/seed.py` | **PASSING** | Seeds default institutions, branches, roles, permissions, and test accounts. |

---

## 3. Broken or Missing Features (Identified for Remediation)

1. **Frontend Authentication Flow Disconnect:**
   - `LoginPage.tsx` previously contained quick-demo buttons without an email/password form or server-side authentication dispatch to `/api/v1/auth/login`.
   - `AppProviders.tsx` stored tokens in sessionStorage but did not fetch the live user profile from `/api/v1/auth/me` on bootstrap or validate against active backend sessions.
2. **Mock Service Worker Interception:**
   - `apps/web/src/main.tsx` initialized MSW by default whenever `VITE_ENABLE_MOCKS !== 'false'`, causing all network requests to bypass the real backend in development mode.
3. **Hardcoded Form Dropdowns & Mock Fixture Dependencies:**
   - `NewAssessmentPage.tsx` and `NewLoanApplicationPage.tsx` imported static fixtures from `src/mocks/fixtures/` rather than fetching dynamic records from the backend API.
4. **Dashboard Hardcoded Identifiers:**
   - `DashboardPage.tsx` executed static `GET` requests against hardcoded mock IDs (`/loan-applications/la-501`, `/assessments/asm-701`..`asm-704`) instead of computing live portfolio statistics from the database.
5. **Missing Farmer Registration Modal / Dedicated Creation Route:**
   - The borrower directory had search and view links, but lacked a farmer creation interface connected to `POST /api/v1/borrowers`.
6. **Missing Decision Review Endpoint (`API-034`):**
   - OpenAPI defined `POST /assessments/{assessment_id}/review-decision` as Deferred, but Phase Four Step 11 requires a persistent human review decision interface.
7. **Report Export Engine:**
   - PDF/JSON report generation needs verified endpoint integration with real saved assessment snapshots.

---

## 4. Mocked Components That Must Be Replaced

- `src/mocks/fixtures/users.ts`: Replaced by live `/api/v1/institutions/current`, `/api/v1/branches`, `/api/v1/auth/me`.
- `src/mocks/fixtures/borrowers.ts`: Replaced by `/api/v1/borrowers` queries and live database persistence.
- `src/mocks/fixtures/farms.ts`: Replaced by `/api/v1/farms` scoped to selected borrower.
- `src/mocks/fixtures/crop-cycles.ts`: Replaced by `/api/v1/crop-cycles` linked to registered farm parcels.
- `src/mocks/fixtures/assessments.ts`: Replaced by immutable `CreditAssessment` database records.

---

## 5. Security and Data-Integrity Issues

1. **Tenant and Branch Isolation:**
   - All borrower, farm, loan, and assessment queries must enforce `institution_id == current_user.institution_id`.
   - Backend enforces `verify_branch_access()` checking `user.branches` or `INSTITUTION_ADMIN` privileges.
2. **Rate Limiting:**
   - In-memory `login_rate_limiter` protects against brute-force attacks on `/auth/login` (5 attempts per minute per IP:email window).
3. **Sensitive Data Masking:**
   - Identity numbers (Aadhaar / National ID / PAN) and passwords must be masked in API responses, logs, and UI components (`[REDACTED]`).
4. **Immutable Assessment Snapshots:**
   - Once computed, a credit assessment record (`CreditAssessment`) must not be overwritten. Subsequent evaluations create new versioned assessment records or reassessment triggers.

---

## 6. ML Limitations and Missing Datasets

1. **Agronomic Model Scope (ExtraTreesRegressor):**
   - Trained on Kaggle soil/weather dataset features: `Fertilizer`, `temp`, `N`, `P`, `K`.
   - Observed evaluation metrics: MAE 0.114, RMSE 0.176, R² 0.992.
   - **Limitation:** Does not directly ingest satellite NDVI imagery, rainfall time-series, or farm GPS polygons as input features. It represents an experimental agronomic proxy model.
2. **CY-Bench Dataset Audit Status:**
   - Zenodo CY-Bench (`13838912`) is an external benchmark source. It is documented as a distinct evaluation reference requiring geographic and temporal validation before combining with Kaggle data.
3. **Credit Repayment (PD) Model Status:**
   - The repository contains NO validated historical loan repayment outcome dataset.
   - **Regulatory Notice:** Repayment probability (PD) must honestly display **"Credit probability unavailable — model not yet validated"** (`pd_status: NOT_AVAILABLE`). The application strictly avoids fabricating synthetic credit scores or automated loan approvals.

---

## 7. Prioritized Implementation Plan

- [x] **Step 1:** Audit repository architecture, reproduce CI failures, inspect existing tests.
- [x] **Step 2:** Fix `openapi.yaml` path parameters and `openapi-spec-validator` in `CI / contracts`.
- [x] **Step 3:** Sanitize test credentials and configure `.gitleaksignore` for `CI / security-baseline`.
- [x] **Step 4:** Implement real authentication workflow on frontend (`LoginPage.tsx` + `AppProviders.tsx` calling `/auth/login` and `/auth/me`).
- [x] **Step 5:** Implement dedicated Farmer Registration workflow (`CreateBorrowerModal` / Page) persisting to PostgreSQL.
- [x] **Step 6:** Wire dynamic dropdowns for farms, crop cycles, and loans in `NewAssessmentPage.tsx` and `NewLoanApplicationPage.tsx`.
- [x] **Step 7:** Connect `DashboardPage.tsx` to live backend aggregations and database queries.
- [x] **Step 8:** Implement `POST /assessments/{assessment_id}/review-decision` endpoint and frontend decision capture UI.
- [x] **Step 9:** Verify PDF assessment report generation and download.
- [x] **Step 10:** Create comprehensive documentation (`ARCHITECTURE.md`, `API.md`, `ML_MODEL_CARD.md`, `TESTING.md`).

---

## 8. Environment Variables and Configuration

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `APP_ENV` | `local` | Application runtime environment (`local`, `test`, `production`) |
| `DATABASE_URL` | `postgresql+psycopg://fin03:fin03_local_only@localhost:5432/fin03` | Database connection string (or `sqlite:///./fin03.db`) |
| `SECRET_KEY` | *(Configured via `.env`)* | JWT signing key (minimum 32 bytes) |
| `VITE_API_URL` | `http://127.0.0.1:8000/api/v1` | Backend API base URL for frontend |
| `VITE_ENABLE_MOCKS` | `false` | Explicitly disabled to guarantee real backend communication |
