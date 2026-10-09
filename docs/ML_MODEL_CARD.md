# TerraTrust AI — Model Card: Physical Crop Yield Regressor

## 1. Model Details

| Attribute | Specification |
|---|---|
| **Model Name** | TerraTrust Agricultural Crop Yield Estimator |
| **Model Version** | `v1.0.0` |
| **Model Architecture** | `ExtraTreesRegressor` (Scikit-Learn, 100 Estimators) |
| **Serialized Artifact** | `apps/api/models/terratust_crop_yield_model.pkl` (33.2 MB) |
| **Target Variable** | Physical Crop Yield (`tonnes_per_hectare`) |
| **Authoritative Engine** | `apps/api/app/services/crop_yield_predictor.py` |
| **License** | Proprietary Financial Decision Support Model |

---

## 2. Intended Use & Scope

### 2.1 Intended Use
- **Agronomic Advisory**: Estimating baseline crop yield capacity based on soil nutrient inputs and regional temperatures.
- **Financial Cash-Flow Modeling**: Providing the physical production input to the Income Available for Debt Service (IADS) calculation engine:
  $$\text{Gross Revenue} = \text{Predicted Yield} \times \text{Plot Area} \times (1 - \text{Post-Harvest Loss}\%) \times \text{Market Price}$$
- **Adverse Stress Simulation**: Measuring expected yield degradation under simulated climate shocks (heat stress, drought, rainfall deficit).

### 2.2 Prohibited & Out-of-Scope Uses
- **Autonomous Credit Decisions**: The model does **NOT** grant or reject loans automatically. Authorized human loan officers make all credit decisions.
- **Credit Default Prediction**: This is a physical crop yield model, **NOT** a loan repayment or probability-of-default (PD) model.

---

## 3. Training Data & Features

### 3.1 Input Feature Manifest
The model consumes exactly 5 continuous numerical features:

| Feature Name | Permitted Range | Unit / Scale | Agronomic Description |
|---|---|---|---|
| `Fertilizer` | $[0, 500]$ | kg/ha equivalent | Total chemical/organic fertilizer applied |
| `temp` | $[0, 55]$ | °C | Mean growing-season temperature |
| `N` | $[0, 300]$ | mg/kg (ppm) | Available soil Nitrogen |
| `P` | $[0, 200]$ | mg/kg (ppm) | Available soil Phosphorus ($P_2O_5$) |
| `K` | $[0, 300]$ | mg/kg (ppm) | Available soil Potassium ($K_2O$) |

### 3.2 Dataset Origin & Provenance
- **Dataset**: Kaggle Soil & Crop Production Agronomic Dataset.
- **Nature**: Experimental tabular dataset mapping edaphic macronutrients and temperature to harvested crop output.

---

## 4. Evaluation & Performance Metrics

On the experimental test partition, the model achieved the following metrics:

| Metric | Observed Value | Interpretation |
|---|---|---|
| **Mean Absolute Error (MAE)** | `0.11401` | Average deviation $< 0.12$ tonnes/ha |
| **Root Mean Squared Error (RMSE)**| `0.17560` | Penalizes large prediction outliers |
| **Coefficient of Determination ($R^2$)**| `0.99173` | Strong fit on experimental synthetic distribution |

> [!WARNING]
> **Experimental Data Governance Notice**:
> The observed $R^2$ of $0.9917$ reflects the structured experimental conditions of the Kaggle dataset. In live agricultural environments, real-world yield variance is subject to unmeasured pest incidence, microclimatic variations, and farm management practices. Consequently, predictions must be bounded by uncertainty intervals and cross-checked against regional historical averages.

---

## 5. Regulatory Credit Gating: Why Probability of Default is `PD_UNAVAILABLE`

Under global banking regulations (Basel Committee on Banking Supervision and RBI Climate Risk Guidelines), a credit decision system cannot invent or simulate loan repayment probabilities without an empirically validated historical credit loss dataset containing:
1. Historical default labels (90+ days past due).
2. Verified borrower repayment track records across economic cycles.
3. Class-imbalance calibration (e.g. Brier score, ROC-AUC, Kolmogorov-Smirnov).

Because the repository contains an agronomic crop yield model but no validated historical credit default dataset:
- The system **strictly gates** Probability of Default as `PD_UNAVAILABLE`.
- In the frontend, the `RiskGauge` explicitly displays:  
  **"Credit probability unavailable — model not yet validated"**
- Fabricating a static percentage (e.g. 82%) or hardcoding risk badges is strictly prohibited.

---

## 6. CY-Bench Benchmark Integration

To advance toward production-grade satellite and meteorological forecasting, the repository includes a reproducible evaluation pipeline for the **Zenodo CY-Bench** benchmark (`scripts/cy_bench_evaluation.py`):

1. **Multi-Modal Features**: Consumes Sentinel-2 NDVI/EVI canopy vigor, NASA SMAP root-zone moisture, and ERA5 weather series.
2. **Temporal Split Validation**: Enforces strict temporal partitioning (Train $\le 2020$, Test $\ge 2021$) to eliminate forward-looking data leakage.
3. **Harmonization Architecture**: Kaggle soil nutrient models and CY-Bench satellite models are kept as **distinct routing tiers** rather than concatenated, ensuring feature integrity and avoiding schema pollution.
4. **Audit Report**: Generated and stored in `docs/cy_bench_audit_report.json`.

---

## 7. Model Governance & Explainability

- **Explainability Method**: Tree feature importances and directional contributions categorized into *Facts* (verified telemetry), *Contributions* (feature weights), and *Assumptions* (market price and cost parameters).
- **Causality Caveat**: The system explicitly warns officers that feature contributions reflect statistical associations and do **not** constitute proof of agronomic causality.
- **Audit Lineage**: Every inference run writes an immutable `input_manifest_id` and records the exact model version (`v1.0.0`) in the database.
