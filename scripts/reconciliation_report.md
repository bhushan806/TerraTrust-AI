# Endpoint Reconciliation

| Method | Endpoint Path | Operation ID | Status | Implemented | Discrepancy |
|---|---|---|---|---|---|
| GET | /alerts | listAlerts | Deferred | Yes | None |
| PATCH | /alerts/{alert_id} | updateAlert | Deferred | Yes | None |
| GET | /assessments | N/A | N/A | Yes | In code but not in OpenAPI |
| POST | /assessments | createAssessment | MVP | Yes | None |
| GET | /assessments/{assessment_id} | getAssessment | MVP | Yes | None |
| POST | /assessments/{assessment_id}/dynamic-trigger | N/A | N/A | Yes | In code but not in OpenAPI |
| GET | /assessments/{assessment_id}/explanations | getAssessmentExplanations | MVP | Yes | None |
| POST | /assessments/{assessment_id}/reports | createAssessmentReport | MVP | Yes | None |
| POST | /assessments/{assessment_id}/review-decision | recordHumanReviewDecision | Deferred | Yes | None |
| GET | /assessments/{assessment_id}/scenarios | listScenarios | MVP | Yes | None |
| POST | /assessments/{assessment_id}/scenarios | createScenario | MVP | Yes | None |
| GET | /audit-events | listAuditEvents | Deferred | No | In OpenAPI but not in code |
| POST | /auth/login | N/A | N/A | Yes | In code but not in OpenAPI |
| POST | /auth/logout | N/A | N/A | Yes | In code but not in OpenAPI |
| GET | /auth/me | getCurrentUser | MVP | Yes | None |
| GET | /borrowers | listBorrowers | MVP | Yes | None |
| POST | /borrowers | createBorrower | MVP | Yes | None |
| GET | /borrowers/{borrower_id} | getBorrower | MVP | Yes | None |
| PATCH | /borrowers/{borrower_id} | updateBorrower | MVP | Yes | None |
| GET | /borrowers/{borrower_id}/assessment-history | getAssessmentHistory | MVP | Yes | None |
| GET | /branches | listBranches | MVP | Yes | None |
| GET | /crop-cycles/{cycle_id} | getCropCycle | MVP | Yes | None |
| GET | /crop-cycles/{cycle_id}/observations | listCropCycleObservations | MVP | Yes | None |
| POST | /data-imports | createDataImport | MVP | Yes | None |
| GET | /data-imports/{job_id} | getDataImport | MVP | Yes | None |
| GET | /data-sources | listDataSources | Deferred | Yes | None |
| POST | /data-sources/{source_id}/sync | syncDataSource | Deferred | No | In OpenAPI but not in code |
| GET | /docs | N/A | N/A | Yes | In code but not in OpenAPI |
| GET | /farms | listFarms | MVP | Yes | None |
| POST | /farms | createFarm | MVP | Yes | None |
| GET | /farms/{farm_id} | getFarm | MVP | Yes | None |
| GET | /farms/{farm_id}/crop-cycles | N/A | N/A | Yes | In code but not in OpenAPI |
| POST | /farms/{farm_id}/crop-cycles | createCropCycle | MVP | Yes | None |
| GET | /health | N/A | N/A | Yes | In code but not in OpenAPI |
| GET | /health/live | N/A | N/A | Yes | In code but not in OpenAPI |
| GET | /health/ready | readinessCheck | MVP | Yes | None |
| POST | /income-estimates | createIncomeEstimate | MVP | Yes | None |
| GET | /institutions/current | getCurrentInstitution | MVP | Yes | None |
| POST | /jobs/run-pending | N/A | N/A | Yes | In code but not in OpenAPI |
| GET | /loan-applications | N/A | N/A | Yes | In code but not in OpenAPI |
| POST | /loan-applications | createLoanApplication | MVP | Yes | None |
| GET | /loan-applications/{application_id} | getLoanApplication | MVP | Yes | None |
| POST | /loans/{loan_id}/repayment-events | createRepaymentEvent | MVP | Yes | None |
| POST | /loans/{loan_id}/repayment-schedules | createRepaymentSchedule | MVP | Yes | None |
| GET | /market-prices | listMarketPrices | MVP | Yes | None |
| GET | /models | listModels | Deferred | No | In OpenAPI but not in code |
| POST | /models/{model_id}/promote | promoteModel | Deferred | No | In OpenAPI but not in code |
| GET | /monitoring/rules | listMonitoringRules | Deferred | No | In OpenAPI but not in code |
| POST | /monitoring/rules | createMonitoringRule | Deferred | No | In OpenAPI but not in code |
| GET | /portfolio/regions | getPortfolioRegions | Deferred | No | In OpenAPI but not in code |
| GET | /portfolio/summary | getPortfolioSummary | Deferred | No | In OpenAPI but not in code |
| POST | /predict-yield | N/A | N/A | Yes | In code but not in OpenAPI |
| GET | /reports/{report_id} | getReport | MVP | Yes | None |
| GET | /reports/{report_id}/download | N/A | N/A | Yes | In code but not in OpenAPI |
| GET | /users | listUsers | MVP | Yes | None |
| POST | /users/invitations | inviteUser | MVP | Yes | None |
| PATCH | /users/{user_id}/roles | updateUserRoles | MVP | Yes | None |
| POST | /yield-predictions | createYieldPrediction | MVP | Yes | None |

## Discrepancies

- **GET /assessments**: In code but not in OpenAPI
- **POST /assessments/{assessment_id}/dynamic-trigger**: In code but not in OpenAPI
- **GET /audit-events**: In OpenAPI but not in code
- **POST /auth/login**: In code but not in OpenAPI
- **POST /auth/logout**: In code but not in OpenAPI
- **POST /data-sources/{source_id}/sync**: In OpenAPI but not in code
- **GET /docs**: In code but not in OpenAPI
- **GET /farms/{farm_id}/crop-cycles**: In code but not in OpenAPI
- **GET /health**: In code but not in OpenAPI
- **GET /health/live**: In code but not in OpenAPI
- **POST /jobs/run-pending**: In code but not in OpenAPI
- **GET /loan-applications**: In code but not in OpenAPI
- **GET /models**: In OpenAPI but not in code
- **POST /models/{model_id}/promote**: In OpenAPI but not in code
- **GET /monitoring/rules**: In OpenAPI but not in code
- **POST /monitoring/rules**: In OpenAPI but not in code
- **GET /portfolio/regions**: In OpenAPI but not in code
- **GET /portfolio/summary**: In OpenAPI but not in code
- **POST /predict-yield**: In code but not in OpenAPI
- **GET /reports/{report_id}/download**: In code but not in OpenAPI