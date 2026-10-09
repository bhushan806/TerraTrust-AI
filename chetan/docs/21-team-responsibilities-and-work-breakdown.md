# Team Responsibilities and Work Breakdown

## RACI summary
R = implementation owner; A = accountable for acceptance in their domain; C = consulted/reviewer; I = informed. Every task has exactly one directly responsible owner.
| Workstream | M1 Frontend | M2 Backend | M3 AI/Data | M4 Platform/QA |
|---|---|---|---|---|
| UI/UX, pages, frontend tests/build | R/A | C | C | C |
| REST API and domain logic | C | R/A | C | C |
| DB domain schema/migrations | I | R/A | C | C |
| Yield pipeline/model/inference contract | C | C | R/A | C |
| Income formula requirements | C | R/A | C | C |
| Repayment-model validation | I | C | R/A | C |
| Provider data contracts | I | R (API adapters) | R (data semantics) | C; split tasks by adapter vs feature semantics |
| Docker/CI/CD/secrets/observability | I | C | C | R/A |
| E2E/integration harness/security checks | C | C | C | R/A |
| API contract/OpenAPI | C | R/A | C | C |
| Release approval | C | C | C | R (release gate coordination); product owner approves business release |

## Backlog (first wave)
| Task | Owner | Reviewer | Effort | Dependencies | Deliverables / acceptance |
|---|---|---|---|---|---|
| T01 Freeze glossary, IDs, quality states | M2 | M1/M3/M4 | 0.5d | none | approved shared terminology |
| T02 Create monorepo and branch protections | M4 | all | 0.5d | none | main protected, PR checks skeleton |
| T03 Draft OpenAPI and shared schemas | M2 | M1/M3/M4 | 1.5d | T01 | contracts validate; examples committed |
| T04 Dataset/license audit | M3 | M4 | 2–4d | none | schema/coverage/license report; no invented fields |
| T05 DB ERD and initial migrations | M2 | M4 | 2d | T01/T03 | migrations apply to clean DB |
| T06 Web shell and mock API handlers | M1 | M2 | 2d | T03 | login shell, nav, mock fixtures, typecheck |
| T07 Docker Compose and local config | M4 | M2/M3 | 1d | repo skeleton | one command starts services; no secrets |
| T08 Yield baseline notebook/script and report | M3 | M2 | 3–5d | T04 | leakage-safe baseline, metrics and model card draft |
| T09 Auth/tenant authorization vertical slice | M2 | M4 | 2–3d | T03/T05 | positive and negative scope tests pass |
| T10 CI gates and contract tests | M4 | all | 2d | T02/T03/T07 | PR fails on broken tests/schema/security scan |

## Parallel work after contracts
- M1 builds borrower/farm/assessment screens with MSW fixtures.
- M2 builds CRUD, persistence and assessment orchestration against agreed contracts.
- M3 audits datasets and builds yield baseline with offline fixtures.
- M4 builds CI, container environment, scanning, test harness and staging skeleton.

## Integration checkpoints
Weekly: review contracts and data assumptions; mid-sprint: contract test against each branch; before pilot: full E2E, security, data licensing and model gate review. Shared review does not transfer implementation ownership.
