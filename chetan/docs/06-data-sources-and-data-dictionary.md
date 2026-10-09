# Data Sources and Data Dictionary

## Source registry (proposed candidates; validate terms and access before use)
| Data need | Candidate source / documentation | Resolution and access considerations | Fallback |
|---|---|---|---|
| Historical weather / forecast | India Meteorological Department (IMD) official services; Open-Meteo API documentation for prototyping | IMD access/redistribution terms must be confirmed; Open-Meteo variables, forecast horizon, attribution and commercial terms vary by product | institution-provided station data; versioned CSV import |
| Satellite crop observations | Copernicus Data Space Ecosystem / Sentinel documentation; Google Earth Engine only if its terms fit | Sentinel spatial/temporal resolution depends on product/cloud conditions; processing, quotas, license and commercial terms need review | import vegetation-index time series with provenance |
| Soil moisture | NASA/USDA SMAP documentation; ISRO/Bhuvan or authorized local datasets where available | coarse satellite grid may not represent a specific plot; availability and API terms vary | field/lab measurement or manual import |
| Crop type / crop calendar | institution records; state agriculture department / ICAR publications | district/crop calendars may not match farm-level reality | officer-verified crop-cycle entry |
| Irrigation | borrower/field survey and institution records | requires verification date and method | officer-entered, marked self-reported |
| Historical yield | official agricultural statistics, institution/farmer records, required reference datasets | aggregation level and target units must be inspected | verified historical farm records |
| Market prices | AGMARKNET / e-NAM official portals and documentation where available | mandi/commodity/grade/unit/time matching and redistribution terms need validation | institution-approved market-price CSV |
| Credit history and repayment | institution loan-management system; authorized bureau integration if approved | sensitive personal/financial data; contractual, consent, security and legal review required | manually verified loan/repayment events for controlled pilot |
| Soil properties | ICAR/soil-health records or verified field tests | sampling date, depth and method affect comparability | field measurement with uncertainty |

Official links to verify during source onboarding: https://mausam.imd.gov.in/ ; https://open-meteo.com/en/docs ; https://dataspace.copernicus.eu/ ; https://smap.jpl.nasa.gov/ ; https://agmarknet.gov.in/ ; https://enam.gov.in/ ; https://bhuvan.nrsc.gov.in/ . These are candidate starting points, not confirmation of specific API entitlement or commercial reuse.

## Required common metadata
Every observation must include `source_id`, `source_record_id` (when available), `observed_at` or `valid_time`, `retrieved_at`, `location_id`/geometry or declared aggregation, `unit`, `quality_status`, `license_reference`, `transform_version`, and provenance notes. Preserve raw values separately from normalized values where practical.

## Canonical fields (initial proposal; finalize after audit)
- `crop_cycle`: crop_code, variety (optional), sowing_date, expected_harvest_date, area_value, area_unit, irrigation_type, season, plot_id.
- `weather_observation`: variable_code, value, unit, observed_at, spatial_reference, source_id, quality_status.
- `weather_forecast`: variable_code, value, unit, issued_at, valid_time, provider_model, source_id.
- `satellite_observation`: product_code, vegetation_index (optional), cloud_fraction (optional), acquisition_time, geometry/plot reference, processing_version.
- `soil_moisture_observation`: value, unit, depth/level (if known), observed_at, spatial_resolution, source_id.
- `yield_observation`: yield_value, yield_unit, harvested_area, crop_code, season, method, verified_by, source_id.
- `market_price`: commodity_code, grade/variety, market_id, price_value, currency, unit, observed_at, source_id.
- `loan`: principal, currency, interest terms, start/end dates, repayment frequency, schedule version.
- `repayment_event`: due_date, paid_at, amount_due, amount_paid, status, days_past_due (derived under documented policy), source_id.

## Units and time rules
Use ISO 8601 timestamps in UTC in storage; retain source timezone and original timestamp when material. Store geometry in a declared SRID (typically WGS84 for interchange; analysis may use a suitable projected CRS). Never combine yield values with different units without explicit conversion. Prices require currency and quantity unit. Costs require currency, season and cost category. Unknown units mean the value is not model-ready.
