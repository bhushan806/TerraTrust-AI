# Frontend Implementation Plan — Member 1

## Ownership
Member 1 implements all frontend code, visual system, API client, tests, build and deployment artifact. Member 2 reviews API semantics; Member 4 reviews security/accessibility/CI. Other members do not implement frontend business logic.

## Setup and structure
```text
apps/web/src/
  app/ (router, providers, auth guards)
  components/{layout,forms,charts,feedback,data-display}/
  features/{dashboard,borrowers,farms,loans,climate,yield,income,assessments,scenarios,timeline,reports,admin}/
  lib/{api-client,query-client,errors,formatters,auth}/
  mocks/ (MSW handlers and fixtures)
  types/ (generated from contracts; do not hand-diverge)
  test/ (setup, accessibility helpers)
```

## Page inventory and routes
| Page | Route | Roles | Main APIs / UI / states |
|---|---|---|---|
| Login | `/login` | public | OIDC sign-in; loading/error; never collect institution password locally unless auth architecture explicitly supports it |
| Dashboard | `/` | all authenticated | scoped summary; empty first-use state |
| Borrowers | `/borrowers` | officer/analyst | API-007; search, filters, pagination |
| Borrower detail | `/borrowers/:id` | officer/analyst | API-009/010; profile and assessment history |
| Farm/crop cycle | `/farms/:id`, `/crop-cycles/:id` | officer/analyst | API-013/014/015/020; units and freshness |
| Loan application | `/loan-applications/new`, `/loan-applications/:id` | officer | API-016/017; validation and confirmation |
| Climate intelligence | `/crop-cycles/:id/climate` | officer/analyst | API-020/023; source/time/unit/status |
| Yield prediction | `/crop-cycles/:id/yield` | officer/analyst | API-024; uncertainty and model metadata |
| Farm-income analysis | `/crop-cycles/:id/income` | officer/analyst | API-025; formula and assumptions |
| Credit-risk assessment | `/assessments/new`, `/assessments/:id` | officer/analyst | API-026/027; PD unavailable state when gate closed |
| Risk explanation | `/assessments/:id/explanations` | officer/analyst | API-030; fact/contribution/assumption labels |
| Scenario simulator | `/assessments/:id/scenarios` | analyst | API-028/029; bounded inputs and evidence label |
| Risk timeline | `/borrowers/:id/timeline` | officer/analyst | API-031; compare immutable snapshots |
| Alerts | `/alerts` | later | deferred API; hide route until feature enabled |
| Portfolio analytics | `/portfolio` | analyst/admin | deferred API; MVP can show “not enabled” only if useful |
| Reports | `/assessments/:id/report` | officer/analyst | API-032/033; status/download/error |
| User administration | `/admin/users` | admin | API-004/005/006; role change confirmation |
| Data/system status | `/admin/data-sources` | admin/operator | basic API-034 health; richer APIs deferred |

## Implementation rules
- Generate TypeScript API types from OpenAPI; do not invent route names independently.
- TanStack Query for server state; avoid duplicating server data in global state.
- Forms use runtime schemas aligned with backend validation; backend remains authoritative.
- Every table/form has loading, empty, validation, permission-denied and provider-failure states.
- Display timestamps in local time with source timezone where important; show units/currency.
- Persistent badge/text for `ILLUSTRATIVE`, `STALE`, `PARTIAL`, `PD UNAVAILABLE` and other non-production states.
- Accessible labels, keyboard focus, semantic headings, contrast and screen-reader status announcements.

## Mock-first parallel work
Member 1 creates MSW handlers and fixtures matching the contract schemas: borrowers, farm/crop cycle, weather/satellite/soil observations, market price, yield response, income response, assessment pending/completed, PD unavailable, scenario response and error envelope. Member 2 approves schemas; Member 3 supplies realistic units/limitations; Member 4 adds contract validation to CI. Swap mocks for real client base URL only after contract tests pass.

## Tests and definition of done
Vitest/component tests; React Testing Library; Playwright core journey; axe/accessibility checks; API client tests for errors/retries; responsive smoke tests. Done means routes protected, unauthorized navigation handled, errors actionable, all core data labels include units/time/source, PD gate is obvious, no secret in bundle, tests and build pass, and UI contract matches OpenAPI.
