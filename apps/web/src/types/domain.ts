/**
 * Domain Models for TerraTrust-AI
 * Strictly aligned with OpenAPI specifications, DB Schemas (Doc 12) and ML Architecture (Doc 08)
 */

export type UserRole = 'LOAN_OFFICER' | 'RISK_ANALYST' | 'INSTITUTION_ADMIN' | 'PLATFORM_OPERATOR';

export interface User {
  id: string;
  institution_id: string;
  external_subject: string;
  email: string;
  display_name: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  branches: string[];
  last_login_at?: string;
  created_at: string;
}

export interface Institution {
  id: string;
  name: string;
  code: string;
  currency: string;
  country: string;
  status: 'ACTIVE' | 'PILOT' | 'SUSPENDED';
}

export interface Branch {
  id: string;
  institution_id: string;
  name: string;
  code: string;
  region: string;
}

export type RiskStatus = 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'CRITICAL' | 'UNASSESSED';
export type QualityStatus = 'VALID' | 'PARTIAL' | 'STALE' | 'INVALID' | 'UNAVAILABLE' | 'NOT_READY';
export type FreshnessState = 'FRESH' | 'AGING' | 'STALE' | 'UNKNOWN' | 'PROVIDER_UNAVAILABLE' | 'PARTIAL';

export interface Borrower {
  id: string;
  institution_id: string;
  branch_id?: string;
  branch_name?: string;
  external_ref: string;
  display_name: string;
  legal_name?: string;
  phone?: string;
  contact_phone?: string;
  contact_email?: string;
  status?: string;
  primary_crop?: string;
  region?: string;
  risk_status?: RiskStatus;
  assessment_status?: 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'NOT_STARTED';
  last_assessed_at?: string | null;
  created_at?: string;
  updated_at?: string;
  total_farms?: number;
  total_area_ha?: number;
}

export interface Farm {
  id: string;
  institution_id: string;
  borrower_id: string;
  borrower_name?: string;
  name: string;
  location_name?: string;
  village?: string;
  total_area?: number;
  cultivated_area?: number;
  area_value?: number;
  area_unit?: string;
  soil_type?: string;
  irrigation_type?: 'CANAL' | 'TUBEWELL' | 'DRIP' | 'RAINFED' | 'SPRINKLER' | string;
  coordinates_redacted?: boolean;
  latitude?: number;
  longitude?: number;
  latitude_approx?: number;
  longitude_approx?: number;
  state?: string;
  district?: string;
  data_source?: string;
  status?: string;
  plots?: any[];
  created_at?: string;
  updated_at?: string;
  freshness_status?: FreshnessState;
}

export interface CropCycle {
  id: string;
  farm_id: string;
  farm_name: string;
  borrower_id: string;
  borrower_name: string;
  crop_code: string;
  crop_name: string;
  variety?: string;
  season: 'KHARIF' | 'RABI' | 'ZAID' | 'ANNUAL';
  sowing_date: string;
  expected_harvest_date: string;
  actual_harvest_date?: string | null;
  area_value: number;
  area_unit: 'ha' | 'acres';
  irrigation_type: string;
  status: 'ACTIVE' | 'HARVESTED' | 'FAILED' | 'PLANNED';
  quality_status: QualityStatus;
  updated_at: string;
}

export interface WeatherObservation {
  id: string;
  plot_id?: string;
  observed_at: string;
  temperature_c: number;
  rainfall_mm: number;
  humidity_pct: number;
  source_id: string;
  source_name: string;
  quality_status: QualityStatus;
  is_forecast: boolean;
  horizon_days?: number;
}

export interface SatelliteObservation {
  id: string;
  plot_id?: string;
  acquired_at: string;
  product_code: string;
  ndvi: number;
  cloud_fraction: number;
  processing_version: string;
  quality_status: QualityStatus;
  source_id: string;
}

export interface SoilMoistureObservation {
  id: string;
  plot_id?: string;
  observed_at: string;
  value_pct: number;
  depth_cm: number;
  unit: string;
  source_id: string;
  quality_status: QualityStatus;
}

export interface MarketPriceObservation {
  id: string;
  commodity_code: string;
  commodity_name: string;
  variety_grade: string;
  market_name: string;
  district: string;
  price_value: number;
  currency: string;
  unit: string;
  observed_at: string;
  source_id: string;
}

export interface YieldPrediction {
  id: string;
  crop_cycle_id: string;
  model_name: string;
  model_version: string;
  prediction_timestamp: string;
  prediction_horizon: {
    start: string;
    end: string;
  };
  target: 'yield_per_area';
  value: number | null;
  unit: string;
  quality_status: QualityStatus;
  uncertainty: {
    lower_bound: number;
    upper_bound: number;
    confidence_level: number;
    method: string;
  } | null;
  limitations: string[];
  explanation: Array<{
    feature: string;
    importance: number;
    description: string;
  }>;
  input_manifest_id: string;
  feature_schema_version: string;
  is_illustrative?: boolean;
}

export interface FarmIncomeEstimate {
  id: string;
  crop_cycle_id: string;
  currency: string;
  expected_production_value: number;
  expected_production_unit: string;
  expected_price_value: number;
  expected_price_unit: string;
  gross_revenue: number;
  production_costs: number;
  other_farm_expenses: number;
  net_farm_income: number;
  household_obligations: number;
  income_available_for_debt_service: number; // IADS
  repayment_capacity_ratio: number;
  assumptions: {
    post_harvest_loss_pct: number;
    cost_inflation_pct: number;
    price_haircut_pct: number;
    cost_per_area_unit: number;
    source: 'USER' | 'BACKEND';
  };
  formula_breakdown: {
    gross_revenue_formula: string;
    net_income_formula: string;
    iads_formula: string;
    repayment_ratio_formula: string;
  };
  quality_status: QualityStatus;
  updated_at: string;
}

export interface LoanApplication {
  id: string;
  borrower_id: string;
  borrower_name: string;
  farm_id: string;
  farm_name: string;
  crop_cycle_id: string;
  crop_name: string;
  branch_id: string;
  requested_amount: number;
  currency: string;
  tenor_months: number;
  purpose: 'CROP_PRODUCTION' | 'EQUIPMENT_PURCHASE' | 'IRRIGATION_INFRASTRUCTURE' | 'LAND_PREPARATION';
  repayment_frequency: 'BULK_HARVEST' | 'MONTHLY' | 'QUARTERLY' | 'BIANNUAL';
  interest_rate_pct: number;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  submitted_at: string;
  created_at: string;
  updated_at: string;
  assumptions_acknowledged: {
    stale_data_warning: boolean;
    partial_data_warning: boolean;
    illustrative_warning: boolean;
  };
  linked_assessment_id?: string;
  audit_info: {
    created_by: string;
    request_id: string;
  };
}

export interface CreditAssessment {
  id: string;
  borrower_id: string;
  borrower_name: string;
  farm_id: string;
  crop_cycle_id: string;
  loan_application_id?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REQUIRES_REVIEW';
  risk_classification: RiskStatus;
  score: number | null;
  /** Nullable! When PD gate is closed or evidence incomplete, probability_of_default is strictly null */
  probability_of_default: number | null;
  pd_gate_status: 'CLOSED_EVIDENCE_INCOMPLETE' | 'CLOSED_MODEL_VALIDATION' | 'OPEN';
  pd_unavailable_reason?: string;
  assessment_date: string;
  model_version: string;
  evidence_quality: 'HIGH' | 'MODERATE' | 'PARTIAL' | 'STALE' | 'POOR';
  trigger: 'MANUAL' | 'SCHEDULED' | 'WEATHER_EVENT';
  completed_at: string | null;
  input_manifest_id: string;
  assumptions: Record<string, string | number | boolean>;
  risk_factors: Array<{
    code: string;
    name: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
  }>;
  audit_info: {
    created_by: string;
    request_id: string;
    institution_id: string;
  };
}

export type RiskExplanationCategory = 'FACT' | 'CONTRIBUTION' | 'ASSUMPTION';

export interface RiskExplanationItem {
  id: string;
  code: string;
  label: string;
  category: RiskExplanationCategory;
  direction: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  impact_magnitude: 'HIGH' | 'MEDIUM' | 'LOW';
  impact_score: number;
  value: string;
  unit?: string;
  evidence_source: string;
  observation_period: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  narrative: string;
  caveat?: string;
}

export interface RiskExplanationReport {
  assessment_id: string;
  model_version: string;
  generated_at: string;
  items: RiskExplanationItem[];
  missing_information: string[];
  limitations: string[];
}

export interface ScenarioAssumptionBounds {
  yield_change_pct: { min: -50; max: 50; default: 0; unit: '%' };
  price_change_pct: { min: -40; max: 40; default: 0; unit: '%' };
  cost_change_pct: { min: -20; max: 50; default: 0; unit: '%' };
  rainfall_factor_pct: { min: -60; max: 60; default: 0; unit: '%' };
  tenor_extension_months: { min: 0; max: 12; default: 0; unit: 'months' };
}

export interface ScenarioRun {
  id: string;
  assessment_id: string;
  name: string;
  description: string;
  created_at: string;
  created_by: string;
  evidence_status: 'ILLUSTRATIVE_ASSUMPTION' | 'EVIDENCE_BACKED';
  assumptions: {
    yield_change_pct: number;
    price_change_pct: number;
    cost_change_pct: number;
    rainfall_factor_pct: number;
    tenor_extension_months: number;
  };
  baseline: {
    yield_val: number;
    gross_revenue: number;
    net_income: number;
    iads: number;
    repayment_ratio: number;
    risk_classification: RiskStatus;
  };
  projected: {
    yield_val: number;
    gross_revenue: number;
    net_income: number;
    iads: number;
    repayment_ratio: number;
    risk_classification: RiskStatus;
    delta_net_income: number;
    delta_iads: number;
  };
}

export interface AssessmentSnapshot {
  assessment_id: string;
  date: string;
  risk_classification: RiskStatus;
  score: number | null;
  probability_of_default: number | null;
  model_version: string;
  data_timestamp: string;
  evidence_quality: string;
  status: string;
  is_reconstructed: boolean;
  factors: string[];
  net_farm_income: number;
  iads: number;
  changes_from_previous?: {
    added_factors: string[];
    removed_factors: string[];
    changed_factors: Array<{
      factor: string;
      from: string;
      to: string;
    }>;
  };
}

export interface AssessmentReport {
  id: string;
  assessment_id: string;
  report_version: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  requested_by: string;
  requested_at: string;
  completed_at?: string;
  download_url?: string;
  expires_at?: string;
  file_size_bytes?: number;
  snapshot_date: string;
  model_version: string;
  error_message?: string;
}

export interface DataSourceHealth {
  id: string;
  name: string;
  category: 'WEATHER' | 'SATELLITE' | 'SOIL' | 'MARKET_PRICE' | 'CREDIT_REGISTRY';
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'STALE';
  last_sync_at: string;
  last_failure_at?: string;
  freshness_status: FreshnessState;
  freshness_threshold_hours: number;
  latency_ms: number;
  error_details?: string;
  affected_features: string[];
  retry_supported: boolean;
  terms_or_license: string;
}
