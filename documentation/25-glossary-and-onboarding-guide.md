# Glossary and Onboarding Guide

- **Assessment snapshot:** immutable record of inputs, versions, outputs and limitations for one run.
- **IADS:** income available for debt service; exact formula must be approved by lender policy.
- **PD / repayment probability:** estimated probability of a defined repayment/default outcome over a stated horizon; requires valid historical outcome labels and calibration.
- **Yield prediction:** estimated crop output per stated area unit and horizon; not a repayment prediction.
- **Feature:** model input derived from observed or recorded data.
- **Data provenance:** source, time, transformation and version lineage for a value.
- **Freshness:** whether an input is recent enough for its intended use under a documented policy.
- **Calibration:** agreement between predicted probabilities and observed event frequencies.
- **Leakage:** information unavailable at prediction time that incorrectly enters training/evaluation.
- **Scenario:** a controlled input perturbation with stated assumptions; not automatically a forecast.
- **Tenant:** institution-level data/security boundary.
- **Branch scope:** narrower authorization scope within an institution.
- **Model card:** document describing model purpose, data, evaluation, limits and governance.
- **Source adapter:** provider-specific implementation behind a stable internal interface.

## First day for each member
1. Read executive summary, feature registry, architecture, API and team responsibility docs.
2. Run local Compose with synthetic data.
3. Read the contract for your workstream and open a task with owner, reviewer and acceptance criteria.
4. Do not rename fields/routes unilaterally; propose contract changes in a PR.
5. Label assumptions and mock outputs; never represent mock data as real observations or validated model outputs.
6. Run checks locally and include tests in each PR.
