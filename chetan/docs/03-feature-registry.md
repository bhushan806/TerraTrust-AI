# Feature Registry

Counts use one stable ID per capability; subcomponents are not counted as additional features. **Mandatory capabilities: 20. Proposed MVP: 20 capability IDs**, with production scoring conditional on gates. Optional/deferred enhancements are listed separately and do not change the mandatory count.

| ID | Feature / target user | Inputs → outputs / value | Dependencies & data | Owner | Priority / complexity | Security / acceptance / tests | Release |
|---|---|---|---|---|---|---|---|
| F01 | Borrower & farm profiles; officer | verified identity/profile → linked borrower/farms; organized review | institutions, branches, user permissions | M2 | P0 / M | PII scope; tenant checks; CRUD/authorization tests | MVP |
| F02 | Crop & season; officer | crop, dates, plot, irrigation → crop-cycle record | F01, crop dictionary | M2 | P0 / M | validate dates/area/units; schema tests | MVP |
| F03 | Historical weather; analyst | station/grid observations → normalized series | provider/import adapter | M3 data, M2 adapter | P0 / L | provenance; unit/range tests | MVP import + adapter contract |
| F04 | Weather forecast; analyst | provider forecast → horizon-tagged forecast | provider API, freshness policy | M3 data, M2 adapter | P0 / L | provider credentials; stale/timeout tests | MVP adapter/mock; live source gated |
| F05 | Satellite observations; analyst | vegetation/crop observation → dated indicators | imagery/product provider | M3 | P0 / L | licensing/geometry; missing-cloud/coverage tests | MVP schema/import; live integration gated |
| F06 | Soil moisture; analyst | soil-moisture observations → unit-normalized series | provider or field data | M3 | P0 / L | provenance; unit/staleness tests | MVP schema/import; live integration gated |
| F07 | Irrigation; officer | type, availability, reliability → irrigation profile | F02 | M2 | P0 / S | access controls; validation tests | MVP |
| F08 | Historical yield; officer/analyst | observed yield, unit, season → history | farm records/dataset | M3 | P0 / M | label provenance; duplicate/unit tests | MVP |
| F09 | Yield prediction; analyst | supported features → yield estimate, interval/status | F03–F08, trained model | M3 | P0 / L | model artifact control; leakage/reproducibility tests | MVP baseline; supported domains only |
| F10 | Market prices; analyst | commodity, market, date, unit → price series | official/authorized provider | M3 data, M2 adapter | P0 / L | license/provenance; unit/freshness tests | MVP import/contract; live gated |
| F11 | Farm income; officer | yield, price, costs, other income → gross/net/IADS | F09, F10, cost assumptions | M2 formula, M3 feature support | P0 / M | assumptions visible; arithmetic tests | MVP |
| F12 | Credit history; analyst | authorized credit inputs → verified feature record | institution/consented source | M2 | P0 / L | highly sensitive; consent/legal and access tests | MVP schema/manual entry; live integration gated |
| F13 | Loan & obligations; officer | terms, schedule, repayments → debt-service timeline | F01, institution policy | M2 | P0 / M | financial confidentiality; schedule tests | MVP |
| F14 | Climate-adjusted assessment; analyst | farm income, climate, loan, valid credit model if available → status/risk band/limitations | F03–F13, gates | M2 orchestration, M3 model | P0 / L | human review; fail-closed scoring tests | MVP decision support; no automatic decision |
| F15 | Repayment probability; analyst | labelled repayment outcomes + approved features → calibrated PD and horizon | representative labels and validated model | M3 | P0 / XL | fairness/model risk review; calibration tests | Conditional; disabled until gate |
| F16 | Explainable drivers; officer | model/features/assumptions → ranked contributions and caveats | F09/F14/F15 | M3 method, M2 API | P0 / M | no causal overclaim; explanation consistency tests | MVP |
| F17 | Dynamic reassessment; officer | new observations/events → new snapshot and reason | jobs, provenance, F14 | M2; M4 platform | P0 / L | idempotency/audit; event replay tests | MVP scheduled/manual |
| F18 | Climate scenarios; analyst | baseline + scenario deltas → impact comparison | supported hazard/yield response | M3 | P0 / L | label unsupported scenarios; invariant tests | MVP bounded illustrative scenarios; evidence-tagged |
| F19 | Risk history/timeline; officer | assessment snapshots → time series/diffs | F14, F17 | M2 | P0 / M | immutable history; ordering tests | MVP |
| F20 | Assessment report; officer | snapshot and explanations → report/export | F14, F16, F19 | M2 API, M1 UI | P0 / M | redaction/access; report consistency tests | MVP |

## Additional candidates (not part of mandatory count)
| ID | Capability | Owner | Priority | Release / acceptance |
|---|---|---|---|---|
| O01 | Role-based access and tenant/branch management | M2, M4 review | P0 security foundation | MVP platform control; negative authorization tests |
| O02 | Portfolio analytics | M2 | P1 / M | Later; totals reconcile to source records |
| O03 | Geographic risk maps | M1 + M3 data | P2 / L | Later; only valid geometries and coverage displayed |
| O04 | Automated early-warning alerts | M2 + M4 | P1 / M | Later; deduplicated, explainable triggers |
| O05 | Climate resilience indicators | M3 | P2 / L | Later; methodology and evidence documented |
| O06 | Audit trails | M2 + M4 | P0 | MVP foundation; append-only audit tests |
| O07 | Data-quality indicators | M3 + M2 | P0 | MVP foundation; freshness/missingness shown |
| O08 | Model-version tracking | M3 + M2 | P0 | MVP foundation; version in every inference/assessment |
| O09 | Admin dashboard | M1 + M2 | P1 | Basic source/model status MVP; richer dashboard later |
| O10 | Data-source health monitoring | M4 + M2 | P1 | MVP health endpoints/logs; full UI later |

## Count reconciliation
- Mandatory capabilities: **20** (F01–F20).
- Mandatory capabilities in MVP scope: **20**, but live external integrations and repayment probability are gated where data/provider validation is incomplete.
- Optional/deferred enhancements: **5** (O02–O05 and O09 richer admin dashboard); foundational controls O01/O06–O08/O10 are MVP non-negotiable requirements, not additional mandatory challenge capabilities.
- Deferred live integrations: provider-specific satellite, weather, soil moisture, market price and credit-bureau connectors remain individually gated; they are integration work, not duplicate features.
