# TerraTrust AI — Comprehensive Testing & Quality Assurance Guide

This document outlines the test architecture, execution procedures, test matrices, and continuous integration validations for **TerraTrust AI**.

---

## 1. Quick Test Execution Reference

| Test Suite | Command | Expected Result |
|---|---|---|
| **Backend Unit & Integration** | `.venv\Scripts\python -m pytest apps/api/tests` | **71 passed** |
| **Frontend Unit & Component** | `npm run test --workspace=web` | **157 passed** (4 test files) |
| **Frontend Production Build** | `npm run build --workspace=web` | **0 errors** (Vite bundle built) |
| **OpenAPI Contract Validation** | `openapi-spec-validator openapi.yaml` | `openapi.yaml: OK` |
| **Endpoint Contract Count** | `python scripts/count_endpoints.py` | 46 operations (34 MVP, 12 Deferred) |
| **Security Secrets Scan** | `gitleaks detect` | `no leaks found` |
| **CY-Bench ML Pipeline** | `.venv\Scripts\python scripts/cy_bench_evaluation.py` | Generates audit report |

---

## 2. Backend Test Architecture (`apps/api/tests`)

Backend tests execute on Python 3.12 with `pytest` and `fastapi.testclient.TestClient`. Tests run in an isolated in-memory or SQLite database with standard fixtures in `conftest.py`.

### 2.1 Test Suites Overview

1. **`test_auth_and_security.py` (15 tests)**:
   - Validates credential verification, bcrypt password hashing, and generic authentication error messages.
   - Enforces login rate limiting (429 Too Many Requests after threshold attempts).
   - Validates JWT expiration, token revocation upon logout, and unauthorized request rejection.
   - Verifies Role-Based Access Control (RBAC): loan officers cannot invite users; read-only roles cannot mutate records.
   - Verifies multi-branch tenancy: officers cannot access borrowers outside assigned branches.

2. **`test_phase4_apis.py` (12 tests)**:
   - Tests borrower creation with duplicate `external_ref` conflict detection.
   - Tests farm parcel registration, plot sum-area boundary validation, and coordinate handling.
   - Tests seasonal crop cycle creation with date order checks (`expected_harvest_date >= sowing_date`).
   - Tests loan application submission and retrieval.
   - Tests time-series observations retrieval for weather, Sentinel-2 NDVI, and soil moisture.

3. **`test_phase5_ml_and_assessments.py` (10 tests)**:
   - Verifies physical ExtraTreesRegressor yield model loading from `terratust_crop_yield_model.pkl`.
   - Validates feature ordering and alias remapping (`Fertilizer`, `temp`, `N`, `P`, `K`).
   - Tests cash-flow and IADS calculations under differing price and cost parameters.
   - Tests credit assessment generation with immutable snapshot creation and `pd_status: NOT_AVAILABLE` regulatory gate.
   - Tests climate scenario stress runs (`DROUGHT_SEVERE`, `HEAT_STRESS`, `PRICE_SHOCK_20`).
   - Tests risk explanation generation (Facts, Contributions, Assumptions).
   - Tests formal human review decision recording (`record_human_review_decision_lifecycle`).

4. **`test_phase6_reports.py` (3 tests)**:
   - Tests report creation job dispatch.
   - Tests report memorandum summary generation matching assessment snapshot data.
   - Tests direct file streaming with appropriate `Content-Disposition` attachment headers.

5. **`test_phase7_monitoring_and_workers.py` (5 tests)**:
   - Tests scheduled worker execution.
   - Tests threshold-based weather deficit alert generation.
   - Tests alert acknowledgement and duplicate alert suppression.

6. **`test_predict_yield.py` (5 tests)**:
   - Unit tests for `run_yield_prediction` and schema validation.

7. **`test_all_endpoints_audit.py` (1 test)**:
   - Exhaustive end-to-end audit exercising all registered API operations.

---

## 3. Frontend Test Architecture (`apps/web/src/test`)

Frontend tests run using **Vitest** with JSDOM environment and `@testing-library/react`.

### 3.1 Test Files Overview

1. **`permissions.test.ts` (55 tests)**:
   - Tests role-based permission matrices across `LOAN_OFFICER`, `RISK_ANALYST`, `INSTITUTION_ADMIN`, and `PLATFORM_OPERATOR`.
   - Tests route authorization guards and conditional UI action rendering.

2. **`formatters.test.ts` (55 tests)**:
   - Tests Indian Rupee currency formatting (`₹3,50,000` with Lakhs/Crores notation).
   - Tests date and time formatters, relative time ("2 hours ago"), and area units (`ha`, `acres`).

3. **`error-normalization.test.ts` (23 tests)**:
   - Tests API error normalization converting HTTP error payloads into structured toast messages and field validation errors.

4. **`risk-gauge.test.tsx` (24 tests)**:
   - Tests the critical `RiskGauge` component under all regulatory states:
     - When PD is gated (`CLOSED_MODEL_VALIDATION` or `CLOSED_EVIDENCE_INCOMPLETE`), verifies that default probability is strictly displayed as **"PD UNAVAILABLE"** and never shows a fabricated percentage.
     - Tests risk score rendering, color tiers, and accessible ARIA attributes.

---

## 4. Continuous Integration & Baseline Contracts

### 4.1 OpenAPI Contracts (`CI / contracts`)
- Validates that `openapi.yaml` complies strictly with the OpenAPI 3.1.0 specification using `openapi-spec-validator`.
- All path parameters (`{user_id}`, `{borrower_id}`, `{farm_id}`, `{cycle_id}`, `{assessment_id}`, etc.) have required parameter definitions.
- `scripts/count_endpoints.py` asserts 46 total operations (34 MVP, 12 Deferred).

### 4.2 Security Baseline (`CI / security-baseline`)
- Scans git repository history for secrets, tokens, and private keys using **Gitleaks**.
- Uses `.gitleaksignore` for historical false positives in sanitized test fixtures.
- Zero secrets committed.

---

## 5. End-to-End Verification Journey

To verify the complete 12-step loan officer journey locally:

1. **Start Backend**:
   ```bash
   .venv\Scripts\python -m uvicorn app.main:app --port 8000
   ```
2. **Start Frontend**:
   ```bash
   npm run dev --workspace=web
   ```
3. **Execution Steps**:
   - Navigate to `http://localhost:5173/login`. Click **"Officer Demo"** and sign in.
   - On the **Dashboard**, verify live counts for borrowers, farms, and assessments.
   - Go to **Borrowers**, click **"Register Farmer"**, fill in farmer details, and submit.
   - In the farmer profile, click **"Add Farm Parcel"** (e.g. 3.5 ha), then click **"Register Crop Cycle"** (e.g. Sugarcane Co 86032).
   - Click **"New Loan Application"**, enter ₹3,50,000, 14 months tenor, and submit.
   - In the top action bar, click **"Assess Risk"** (`/assessments/new`), select the farmer and plot, and click **"Review & Trigger Assessment"**.
   - Inspect the **Assessment Dossier**: verify physical yield prediction, gross revenue, net farm income, and the explicit **PD UNAVAILABLE** regulatory badge.
   - In the **Lending Decision** card, select **Approve Facility**, enter committee notes, and click **"Submit & Seal Credit Decision"**.
   - Click **"Assessment Report"**, generate the memorandum, and verify download.
