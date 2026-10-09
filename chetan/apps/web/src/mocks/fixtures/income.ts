import { FarmIncomeEstimate } from '@/types/domain';

export const mockIncomeEstimates: Record<string, FarmIncomeEstimate> = {
  'cycle-301': {
    id: 'inc-801',
    crop_cycle_id: 'cycle-301',
    currency: 'INR',
    expected_production_value: 261.25, // 2.5 ha * 104.5 MT/ha
    expected_production_unit: 'metric_ton',
    expected_price_value: 3400, // ₹3,400 per MT
    expected_price_unit: 'metric_ton',
    gross_revenue: 869680, // 261.25 MT * ₹3,400 * (1 - 0.02 loss) = 869,680
    production_costs: 312500, // ₹125,000 / ha * 2.5 ha
    other_farm_expenses: 45000, // Drip maintenance + seasonal labor surcharge
    net_farm_income: 512180, // 869,680 - 312,500 - 45,000
    household_obligations: 180000, // Annual basic household expenditure
    income_available_for_debt_service: 332180, // IADS: 512,180 - 180,000
    repayment_capacity_ratio: 1.85, // 332,180 / 180,000 loan obligation = 1.85x
    assumptions: {
      post_harvest_loss_pct: 2.0,
      cost_inflation_pct: 4.5,
      price_haircut_pct: 0.0,
      cost_per_area_unit: 125000,
      source: 'BACKEND',
    },
    formula_breakdown: {
      gross_revenue_formula: 'Expected Production (261.25 MT) × Mandi Price (₹3,400/MT) × (1 − Post-Harvest Loss 2.0%)',
      net_income_formula: 'Gross Revenue (₹8,69,680) − Cultivation Cost (₹3,12,500) − Overhead/Labor (₹45,000)',
      iads_formula: 'Net Farm Income (₹5,12,180) − Household Basic Obligations (₹1,80,000)',
      repayment_ratio_formula: 'IADS (₹3,32,180) ÷ Annual Principal & Interest Due (₹1,79,500) = 1.85x',
    },
    quality_status: 'VALID',
    updated_at: '2026-10-08T09:20:00Z',
  },
  'cycle-302': {
    id: 'inc-802',
    crop_cycle_id: 'cycle-302',
    currency: 'INR',
    expected_production_value: 67.2, // 3.0 ha * 22.4 qtl/ha
    expected_production_unit: 'quintal',
    expected_price_value: 4620, // ₹4,620 per qtl
    expected_price_unit: 'quintal',
    gross_revenue: 301880, // 67.2 * 4620 * (1 - 0.03)
    production_costs: 135000, // ₹45,000 / ha * 3.0 ha
    other_farm_expenses: 22000,
    net_farm_income: 144880,
    household_obligations: 80000,
    income_available_for_debt_service: 64880,
    repayment_capacity_ratio: 1.30,
    assumptions: {
      post_harvest_loss_pct: 3.0,
      cost_inflation_pct: 3.0,
      price_haircut_pct: 0.0,
      cost_per_area_unit: 45000,
      source: 'BACKEND',
    },
    formula_breakdown: {
      gross_revenue_formula: 'Expected Production (67.2 qtl) × Mandi Price (₹4,620/qtl) × (1 − Post-Harvest Loss 3.0%)',
      net_income_formula: 'Gross Revenue (₹3,01,880) − Cultivation Cost (₹1,35,000) − Overhead/Labor (₹22,000)',
      iads_formula: 'Net Farm Income (₹1,44,880) − Household Obligations (₹80,000)',
      repayment_ratio_formula: 'IADS (₹64,880) ÷ Annual Loan Due (₹50,000) = 1.30x',
    },
    quality_status: 'VALID',
    updated_at: '2026-10-07T16:50:00Z',
  },
  'cycle-303': {
    id: 'inc-803',
    crop_cycle_id: 'cycle-303',
    currency: 'INR',
    expected_production_value: 61.44, // 4.8 ha * 12.8 qtl/ha
    expected_production_unit: 'quintal',
    expected_price_value: 7120, // ₹7,120 / qtl
    expected_price_unit: 'quintal',
    gross_revenue: 415560,
    production_costs: 264000, // ₹55,000 / ha * 4.8 ha
    other_farm_expenses: 35000,
    net_farm_income: 116560,
    household_obligations: 120000,
    income_available_for_debt_service: -3440, // Deficit!
    repayment_capacity_ratio: 0.72, // Deficit / High Risk
    assumptions: {
      post_harvest_loss_pct: 5.0,
      cost_inflation_pct: 6.0,
      price_haircut_pct: 5.0,
      cost_per_area_unit: 55000,
      source: 'BACKEND',
    },
    formula_breakdown: {
      gross_revenue_formula: 'Expected Production (61.44 qtl) × Mandi Price (₹7,120/qtl) × (1 − Post-Harvest Loss 5.0%)',
      net_income_formula: 'Gross Revenue (₹4,15,560) − Cultivation Cost (₹2,64,000) − Overhead/Labor (₹35,000)',
      iads_formula: 'Net Farm Income (₹1,16,560) − Household Basic Obligations (₹1,20,000) = Deficit (-₹3,440)',
      repayment_ratio_formula: 'Negative operating buffer indicates heightened default vulnerability under rainfall deficit',
    },
    quality_status: 'PARTIAL',
    updated_at: '2026-10-06T08:30:00Z',
  },
};
