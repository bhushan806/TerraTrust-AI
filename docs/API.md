# TerraTrust AI — API Specification

**Base URL**: `/api/v1`  
**OpenAPI Specification**: `openapi.yaml` (Validated against OpenAPI 3.1.0)  
**Authentication**: OAuth2 Bearer Token (`Authorization: Bearer <JWT>`)

---

## 1. Global Conventions

### 1.1 Headers
| Header | Description | Required |
|---|---|---|
| `Authorization` | `Bearer <access_token>` | Yes (all protected routes) |
| `Content-Type` | `application/json` | Yes (for POST/PUT/PATCH) |
| `X-Request-ID` | Client correlation ID for end-to-end tracing | Optional (generated if missing) |
| `Idempotency-Key` | UUID to prevent duplicate execution of assessment runs | Recommended on `POST /assessments` |

### 1.2 Standard Error Response
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Expected harvest date cannot be earlier than sowing date",
  "request_id": "req-98f23a-101",
  "details": [
    {
      "loc": ["body", "expected_harvest_date"],
      "msg": "Date boundary violation",
      "type": "value_error"
    }
  ]
}
```

---

## 2. Core Endpoints

### 2.1 Authentication & Profile
- `POST /api/v1/auth/login`
  - Body: `{"email": "officer@fin03.local", "password": "password123"}`
  - Returns: `{"access_token": "...", "token_type": "bearer", "expires_in": 3600}`
- `GET /api/v1/auth/me`
  - Returns: Authenticated user profile, roles, assigned institution, and branch scopes.
- `POST /api/v1/auth/logout`
  - Invalidate current access token and record logout audit event.

### 2.2 Borrowers (Farmers)
- `GET /api/v1/borrowers`
  - Query params: `search`, `branch_id`, `limit`, `offset`
  - Returns: `BorrowerListResponse` (`items`, `total`, `limit`, `offset`).
- `POST /api/v1/borrowers`
  - Body: `{"branch_id": "...", "external_ref": "FARMER-102", "display_name": "Ramesh Patil", "contact_phone": "+91 98220 12345"}`
  - Returns: Created `BorrowerResponse`.
- `GET /api/v1/borrowers/{borrower_id}`
  - Returns: Detailed borrower profile with associated farms and credit facilities.

### 2.3 Farms & Plots
- `GET /api/v1/farms`
  - Query params: `borrower_id`, `limit`, `offset`
  - Returns: List of `FarmResponse` objects including plot geometries.
- `POST /api/v1/farms`
  - Body: `{"borrower_id": "...", "name": "East River Farm", "area_value": 3.5, "area_unit": "hectare", "latitude": 18.52, "longitude": 73.85}`
  - Returns: Created `FarmResponse`.
- `GET /api/v1/farms/{farm_id}`
  - Returns: Farm profile, registered plot boundaries, and soil characteristics.

### 2.4 Crop Cycles
- `GET /api/v1/farms/{farm_id}/crop-cycles`
  - Returns: List of all seasonal crop cycles across farm plots.
- `POST /api/v1/farms/{farm_id}/crop-cycles`
  - Body: `{"crop_code": "SUGARCANE", "variety": "Co 86032", "season": "Kharif 2026", "sowing_date": "2026-06-15", "expected_harvest_date": "2027-08-15", "area_value": 3.0, "irrigation_type": "DRIP"}`
  - Returns: Created `CropCycleResponse`.
- `GET /api/v1/crop-cycles/{cycle_id}`
  - Returns: Crop cycle details and growing status.

### 2.5 Loan Applications
- `GET /api/v1/loan-applications`
  - Query params: `borrower_id`, `limit`, `offset`
  - Returns: List of active loan applications.
- `POST /api/v1/loan-applications`
  - Body: `{"borrower_id": "...", "amount": 350000, "currency": "INR", "purpose": "CROP_PRODUCTION"}`
  - Returns: Created `LoanApplicationResponse`.
- `GET /api/v1/loan-applications/{application_id}`
  - Returns: Application status, linked borrower, and repayment terms.

### 2.6 Agronomic & Environmental Observations
- `GET /api/v1/crop-cycles/{cycle_id}/observations`
  - Query params: `observation_type` (`WEATHER`, `SATELLITE`, `SOIL_MOISTURE`), `start_date`, `end_date`
  - Returns: Time-series telemetry records with data source attribution and quality flags.
- `GET /api/v1/market-prices`
  - Query params: `crop_code`, `market_center`, `limit`
  - Returns: Statutory Minimum Support Price (MSP) and Fair & Remunerative Price (FRP) benchmarks.

### 2.7 AI/ML Inference & Financial Cash Flow
- `POST /api/v1/yield-predictions`
  - Body: `{"crop_cycle_id": "...", "features": {"Fertilizer": 65, "temp": 28.5, "N": 45, "P": 32, "K": 38}}`
  - Returns: `YieldInferenceResponse` with predicted yield (tonnes/ha), uncertainty intervals, and model version.
- `POST /api/v1/income-estimates`
  - Body: `{"crop_cycle_id": "...", "predicted_yield_per_area": 82.5, "expected_price_per_unit": 3400, "production_costs": 95000}`
  - Returns: `IncomeEstimateResponse` with gross revenue, net farm income, and IADS.

### 2.8 Credit Risk Assessments
- `GET /api/v1/assessments`
  - Returns: Chronological list of credit assessments for current institution.
- `POST /api/v1/assessments`
  - Body: `{"borrower_id": "...", "crop_cycle_id": "...", "farm_id": "...", "loan_application_id": "...", "trigger_reason": "INITIAL_APPLICATION"}`
  - Returns: Immutable `AssessmentResponse` with computed score, input manifest ID, and `pd_status: "NOT_AVAILABLE"` regulatory gate.
- `GET /api/v1/assessments/{assessment_id}`
  - Returns: Full assessment dossier, risk drivers, assumptions, and audit journal.
- `GET /api/v1/borrowers/{borrower_id}/assessment-history`
  - Returns: Chronological assessment log for borrower.

### 2.9 Climate Stress Scenarios & Explanations
- `POST /api/v1/assessments/{assessment_id}/scenarios`
  - Body: `{"scenario_code": "DROUGHT_SEVERE"}`
  - Supported codes: `DROUGHT_MODERATE`, `DROUGHT_SEVERE`, `HEAT_STRESS`, `FLOOD_EXCESS`, `PRICE_SHOCK_20`, `COMPOUND_SHOCK`
  - Returns: Yield shock percentage, degraded IADS, and debt-service coverage under adverse climate stress.
- `GET /api/v1/assessments/{assessment_id}/explanations`
  - Returns: Ranked risk driver contributions categorized into Facts, Contributions, and Assumptions.

### 2.10 Human Lending Decision (Step 11)
- `POST /api/v1/assessments/{assessment_id}/review-decision`
  - Body:
    ```json
    {
      "decision": "APPROVE",
      "notes": "Verified borewell discharge and 14-month adsali sugarcane yield capacity supports requested facility.",
      "conditions": ["Mandatory crop insurance enrollment", "Disbursement in 2 tranches"],
      "assessment_version": "1.0"
    }
    ```
  - Permitted decisions: `APPROVE`, `CONDITIONALLY_APPROVE`, `REJECT`
  - Returns: `ReviewDecisionResponse` with decision ID, decider ID, timestamp, and updated loan status.

### 2.11 Assessment Reports & Exports
- `POST /api/v1/assessments/{assessment_id}/reports`
  - Body: `{"export_format": "PDF"}`
  - Returns: Job creation confirmation and report ID.
- `GET /api/v1/reports/{report_id}`
  - Query params: `download=true`
  - Returns: Asynchronous report status or streamed PDF attachment.

### 2.12 Monitoring & Alerts
- `GET /api/v1/alerts`
  - Returns: Active monitoring alerts triggered by extreme heat, rainfall deficits, or NDVI drops.
- `POST /api/v1/alerts/{alert_id}/acknowledge`
  - Acknowledge alert and prevent duplicate notifications.
