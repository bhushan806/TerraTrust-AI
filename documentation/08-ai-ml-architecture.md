# AI/ML Architecture

## Modules and boundaries
### A. Crop-yield prediction
- Target: yield per declared area unit for a crop-cycle at a stated forecast horizon, after dataset audit confirms a valid target.
- Features: only audited and available features; likely candidates include crop/season, weather history/forecast summaries, soil properties/moisture, irrigation, vegetation indicators, region and historical yield. These are candidates, not confirmed dataset columns.
- Baseline: training-set median by defensible crop/region grouping, compared with a simple linear/regularized model where suitable.
- Candidates: Random Forest / Gradient Boosting (e.g. HistGradientBoosting or gradient-boosted trees) only if sample size and feature types support them. Avoid complex deep learning without evidence.
- Validation: temporal holdout and, where feasible, geographic holdout; compare MAE/RMSE and normalized error by crop/region. Prevent same farm/season leakage across splits.
- Uncertainty: prediction intervals via quantile model/conformal method only after coverage is evaluated; otherwise state uncertainty unavailable.
- Packaging: versioned model artifact + feature schema + preprocessing + training data manifest + metrics + model card.

### B. Farm-income estimation
Define `gross_revenue = predicted_saleable_yield × expected_price`, after consistent unit conversion and explicit post-harvest/loss assumptions. Define `net_farm_income = gross_revenue + other_verified_farm_income − production_costs − other_farm_expenses`. Define `IADS = net_farm_income − other_household/financial obligations included by the approved policy`. The exact definition must be approved by lender policy; avoid double-counting expenses or obligations. Report currency, season/time period, input sources, assumptions and ranges.

### C. Credit-risk estimation
Outcome definition must be agreed before training—for example, a loan-level event of being 90+ days past due within 12 months, if that matches institutional policy and available labels. Do not assume this definition is automatically correct. Eligible data must link application-time features to later outcomes, with time cutoffs that prevent leakage. Evaluate discrimination (ROC-AUC/PR-AUC as relevant), calibration (Brier score/calibration curve), stability, subgroup performance and decision utility. Select threshold policy with lender; probability output is disabled until data and governance gates pass.

### D. Climate scenario engine
Represent scenarios as named, versioned perturbations to supported inputs (e.g. rainfall deficit, heat stress, excessive rainfall), within observed or scientifically justified ranges. A scenario is `EVIDENCE_BACKED` only if the yield-response method is validated for that hazard/domain; otherwise `ILLUSTRATIVE_ASSUMPTION`. Never extrapolate outside validated support without a warning. Store baseline, delta, assumptions and version.

### E. Explainability
Use model-appropriate local explanations (e.g. SHAP where its assumptions/implementation are suitable) or transparent feature deltas/rule explanations. Separate: (1) observed fact, (2) model contribution, (3) scenario assumption, and (4) causal claim (not made unless separately substantiated). Show direction, magnitude, units, reference baseline and confidence/limitations.

### F. Dynamic monitoring
Triggers: new valid forecast, new satellite/soil observation, material market-price change, repayment/loan update, manual reassessment or scheduled interval. Deduplicate triggers; record stale-input policy; queue idempotent jobs; compare results only when compatible model/feature versions exist. Monitor input drift, missingness, prediction distribution, yield error once ground truth arrives, and credit calibration only when outcomes mature.

## Required inference response metadata
`model_name`, `model_version`, `prediction_timestamp`, `prediction_horizon`, `target`, `value`, `unit`, `quality_status`, `uncertainty` (nullable with method), `limitations[]`, `explanation[]`, `input_manifest_id`.

## Release and rollback
A model is promoted only after reproducible training, leakage review, holdout evaluation, model-card review, inference contract tests, security scan, shadow/staging evaluation and owner approval. Keep last known good artifact; rollback by model registry pointer/config change, preserving old assessment snapshots.
