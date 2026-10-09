# Feasibility and Risk Assessment

## Dataset audit status
The two required references are named by the challenge, but their files/content have **not been inspected in this workspace**. Therefore no exact columns, row counts, date coverage, geography, missingness, license interpretation or model performance is asserted here. Treat all such properties as **unverified** until the audit is completed.

1. Kaggle: https://www.kaggle.com/datasets/gurudathg/crop-yield-prediction-using-soil-and-weather
2. Zenodo CY-Bench: https://zenodo.org/records/13838912

## Repeatable inspection procedure
1. Record landing-page metadata, author, publication/version date, license text, citation requirements, download/access terms and any commercial-use restrictions.
2. Download only through permitted routes; record URL, retrieval date, checksum, file size and data version.
3. Inventory files and formats; never execute dataset-provided code blindly.
4. Inspect schema, dtypes, units, target definitions, row count, unique crops/regions/seasons, date range and spatial identifiers.
5. Profile missingness, duplicates, outliers, impossible values, unit inconsistencies and label provenance.
6. Plot target and feature distributions; test whether rows are independent or grouped by farm/region/year.
7. Establish train/validation/test split by time and/or geography to avoid leakage; record seed and split manifest.
8. Confirm license and intended-use fit with institution/legal reviewer before redistributing or using commercially.
9. Produce `dataset_audit.json`, `data_dictionary.csv`, and an audit report with limitations.

## Data feasibility rules
- Yield data can support a crop-yield model only if the target, units, time alignment and feature coverage are defensible.
- Crop-yield labels are not actual loan repayment outcomes. They do not, by themselves, train or validate probability of default/repayment.
- Climate-aware credit assessment requires linking crop/cash-flow exposures to verified loan terms and repayment outcomes; this may require institution-supplied, legally usable historical data.
- Public demonstration data may be used to demonstrate pipeline mechanics, but not to claim lender-grade validity.
- If credit labels are unavailable, PD remains disabled; the product may present yield/income estimates, scenario deltas and a clearly labelled illustrative rule-based indicator.

## Primary risks
| Risk | Impact | Mitigation / gate | Owner |
|---|---|---|---|
| Reference data lacks needed geography/time/features | yield model not generalizable | audit before feature freeze; define supported domain | M3 |
| No repayment labels | false PD claim | disable PD; institution data and validation gate | M3 + M2 |
| External provider terms/fees change | outage/cost/legal risk | source registry, adapter boundary, fallback/import | M3 + M2 |
| Stale or misaligned observations | misleading output | timestamps, freshness policy, quality score/status | M3 |
| Data leakage in yield/credit models | inflated validation | temporal/geographic splits, leakage review | M3 |
| Tenant access flaw | sensitive data exposure | centralized authorization, negative tests, security review | M2 + M4 |
| Small team scope overload | incomplete product | modular monolith, conditional connectors, release gates | all |
| Scenario assumptions presented as science | misleading lender | evidence labels, model card, explicit assumptions | M3 |

## Data and validation gates before production scoring
G0 legal/source rights confirmed; G1 target/label definitions approved; G2 representative linked repayment dataset available; G3 leakage-safe temporal/geographic validation; G4 calibration and subgroup/performance analysis accepted; G5 independent model-risk review and human-use policy approved; G6 monitoring, drift, rollback and version traceability deployed. Any failed gate means no production PD.
