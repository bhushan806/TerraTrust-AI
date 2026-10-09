# Roadmap and Release Gates

## Milestones (relative; estimate after team capacity is confirmed)
- **M0 — Contract freeze (week 1):** glossary, feature IDs, data states, API/ML schemas, auth/tenant model, repo and local environment.
- **M1 — Data feasibility (weeks 1–2):** inspect required datasets, licenses, source registry and baseline feasibility. Gate: target/geography/time units understood.
- **M2 — Vertical slice (weeks 2–3):** auth + borrower/farm/crop cycle + synthetic observation + DB + UI mock/real API + CI.
- **M3 — Yield and income (weeks 3–5):** leakage-safe baseline, inference contract, income calculator, provenance and explanations.
- **M4 — Assessment and scenarios (weeks 5–7):** async orchestration, snapshot history, bounded scenarios, reports, PD unavailable unless gated.
- **M5 — Hardening (weeks 7–8):** E2E, tenant security, performance, backup restore, accessibility and staging acceptance.
- **M6 — Pilot decision:** institution/legal/source/model review; production scoring remains disabled unless every gate passes.

These are planning estimates, not a promise. Dataset access and institution repayment labels may extend the schedule.

## Release gates
G0 product/contract approval; G1 dataset audit and source rights; G2 reproducible yield baseline validated within supported domain; G3 secure multi-tenant vertical slice; G4 scenario assumptions reviewed; G5 operational hardening and recovery tests; G6 repayment-label/model governance gate; G7 institution approval and human-use policy. A failed gate blocks the dependent capability, not necessarily all other safe demo features.
