# AI/ML and Data Engineering Plan — Member 3

## Work sequence
1. Dataset inventory and license audit; save schema, checksums and data dictionary.
2. Target/units/geography/time coverage report; stop if target cannot be interpreted.
3. Build clean, reproducible ingestion and feature pipeline; keep raw and normalized layers distinct.
4. Establish naive baseline and leakage-safe split manifest.
5. Train baseline candidate; report errors by crop/region/time and compare to baseline.
6. Add uncertainty only after empirical coverage evaluation.
7. Package inference with strict schema and model card.
8. Build bounded scenario transformations with evidence status.
9. Define data/model monitoring and retraining triggers.
10. Explore repayment model only after institution-supplied labels pass governance gates.

## Yield inference request (illustrative contract)
```json
{
  "request_id": "uuid",
  "crop_cycle_id": "uuid",
  "target": "yield_per_area",
  "prediction_horizon": {"start": "2026-10-01", "end": "2027-03-31"},
  "features": {"crop_code": "CROP_CODE_FROM_DICTIONARY", "area": {"value": 1.0, "unit": "hectare"}},
  "input_manifest_id": "uuid",
  "feature_schema_version": "1.0"
}
```

## Yield response (illustrative; not a prediction)
```json
{
  "model_name": "crop-yield-baseline",
  "model_version": "0.1.0-demo",
  "prediction_timestamp": "2026-10-09T00:00:00Z",
  "prediction_horizon": {"start": "2026-10-01", "end": "2027-03-31"},
  "target": "yield_per_area",
  "value": null,
  "unit": "kg/hectare",
  "quality_status": "NOT_READY",
  "uncertainty": null,
  "limitations": ["Dataset audit and feature support not yet approved"],
  "explanation": [],
  "input_manifest_id": "uuid"
}
```

## Evaluation protocol
Split by time and/or geography; group related plots/farms to avoid leakage; fit preprocessing only on training fold; freeze test set until model selection; compare to baseline; report MAE/RMSE and errors by supported crop/region; document missingness and out-of-domain detection. No accuracy claim without measured results and reproducible report.

## Credit model gate
Specify outcome, prediction horizon, eligible population, label maturity, censoring, feature cutoff, policy for restructures/write-offs, leakage controls and protected/sensitive feature handling. Evaluate discrimination, calibration, stability, subgroup outcomes and decision impact. PD output stays disabled until approved. Yield labels alone are insufficient.

## Scenario and explanation contract
Scenario inputs include scenario code, baseline input manifest, variable perturbations, range bounds, method version and evidence status. Output includes baseline and scenario yield/income values, delta, uncertainty if supported, assumptions, limitations and model version. Explainability records fact/contribution/assumption categories; causal language is prohibited unless independently established.

## Reproducibility
Pin dependencies, seed stochastic processes, record dataset version/checksum, feature schema, split manifest, training config, code commit, metrics, artifact checksum and environment. Test deterministic preprocessing, missing/invalid values, unseen crops/regions, unit mismatch, model loading and inference schema. Retraining requires approval and rollback artifact retained.
