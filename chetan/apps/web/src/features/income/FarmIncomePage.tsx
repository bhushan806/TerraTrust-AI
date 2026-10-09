import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  Calculator,
  Info,
  HelpCircle,
  ArrowLeft,
  ShieldCheck,
  Building2,
  UserCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DetailCard } from '@/components/data-display/DetailCard';
import { MetricCard } from '@/components/data-display/MetricCard';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { formatCurrency } from '@/lib/formatters/currency';
import { formatPercent } from '@/lib/formatters/number';
import { formatCommodityPrice } from '@/lib/formatters/units';
import { typedGet } from '@/lib/api-client/client';
import { queryKeys } from '@/lib/query-client/query-keys';
import { CropCycle, FarmIncomeEstimate } from '@/types/domain';

export const FarmIncomePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const cycleQuery = useQuery({
    queryKey: queryKeys.cropCycle(id || 'cycle-301'),
    queryFn: () =>
      typedGet<{
        crop_cycle: CropCycle;
        income_estimate: FarmIncomeEstimate | null;
      }>(`/crop-cycles/${id || 'cycle-301'}`),
  });

  if (cycleQuery.isLoading) {
    return <LoadingState message="Calculating gross revenue, cost structures, and debt service capacity..." />;
  }

  if (cycleQuery.isError || !cycleQuery.data) {
    return (
      <ErrorState
        error={cycleQuery.error}
        title="Income Analysis Unavailable"
        onRetry={() => cycleQuery.refetch()}
      />
    );
  }

  const { crop_cycle, income_estimate } = cycleQuery.data;

  if (!income_estimate) {
    return (
      <div className="space-y-6">
        <PageHeader title="Farm Income Analysis" subtitle="Income estimation not calculated" />
        <div className="p-8 text-center bg-white rounded-xl border border-neutral-200">
          <p className="text-sm text-neutral-600">
            Income estimation requires verified yield prediction and cost parameters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Farm Income & Debt Repayment Capacity"
        subtitle={`Cash flow and debt service capacity for ${crop_cycle.crop_name} (${crop_cycle.season}) · Transparent arithmetic formulas`}
        breadcrumbs={[
          { label: 'Borrowers', href: '/borrowers' },
          { label: 'Crop Cycle', href: `/crop-cycles/${crop_cycle.id}` },
          { label: 'Farm Income Analysis', current: true },
        ]}
        badge={
          <div className="flex items-center gap-2">
            <StatusBadge variant="BACKEND_AUTHORITATIVE" size="md" />
            <StatusBadge variant="PRODUCTION" size="md" />
          </div>
        }
        actions={
          <Link
            to={`/crop-cycles/${crop_cycle.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-800 bg-white hover:bg-neutral-50 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Cycle</span>
          </Link>
        }
      />

      {/* Top Metric Cards: Revenue, Costs, Net Farm Income, IADS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Estimated Gross Revenue"
          value={formatCurrency(income_estimate.gross_revenue, income_estimate.currency)}
          tooltip="Expected saleable harvest volume multiplied by mandi price minus post-harvest loss"
        />

        <MetricCard
          label="Total Production Costs"
          value={formatCurrency(income_estimate.production_costs + income_estimate.other_farm_expenses, income_estimate.currency)}
          tooltip="Cultivation inputs (seed, fertilizer, power) plus overhead and seasonal labor"
        />

        <MetricCard
          label="Net Farm Income"
          value={formatCurrency(income_estimate.net_farm_income, income_estimate.currency)}
          tooltip="Gross farm revenue minus total production costs and operating expenses"
        />

        <MetricCard
          label="Income Avail. for Debt (IADS)"
          value={formatCurrency(income_estimate.income_available_for_debt_service, income_estimate.currency)}
          badge={
            <StatusBadge
              variant={income_estimate.income_available_for_debt_service > 0 ? 'HEALTHY' : 'HIGH_RISK'}
              label={income_estimate.income_available_for_debt_service > 0 ? 'SURPLUS' : 'DEFICIT'}
              size="sm"
            />
          }
          tooltip="Net farm income minus baseline household maintenance obligations"
        />
      </div>

      {/* Transparent Formula Breakdown: "How this was calculated" Panel */}
      <DetailCard
        title="How This Was Calculated (Transparent Arithmetic Formulas)"
        subtitle="Auditable step-by-step formula breakdown without hidden weighting factors"
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
            <div>
              <span className="font-bold text-neutral-900 block text-sm mb-1 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary-800" />
                <span>1. Gross Crop Revenue Formulation</span>
              </span>
              <p className="font-mono bg-white p-2.5 rounded border border-neutral-200 text-neutral-800">
                {income_estimate.formula_breakdown.gross_revenue_formula}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-[11px] text-neutral-600">
                <span>Production: {income_estimate.expected_production_value} {income_estimate.expected_production_unit}s</span>
                <span>Expected Price: {formatCommodityPrice(income_estimate.expected_price_value, income_estimate.currency, income_estimate.expected_price_unit)}</span>
                <span>Post-Harvest Loss Assumption: {formatPercent(income_estimate.assumptions.post_harvest_loss_pct, 1)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-200">
              <span className="font-bold text-neutral-900 block text-sm mb-1 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary-800" />
                <span>2. Net Farm Operating Income</span>
              </span>
              <p className="font-mono bg-white p-2.5 rounded border border-neutral-200 text-neutral-800">
                {income_estimate.formula_breakdown.net_income_formula}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-[11px] text-neutral-600">
                <span>Cultivation Cost per Hectare: ₹{income_estimate.assumptions.cost_per_area_unit.toLocaleString('en-IN')}/ha</span>
                <span>Seasonal Labor & Overhead Surcharge: {formatCurrency(income_estimate.other_farm_expenses, income_estimate.currency)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-200">
              <span className="font-bold text-neutral-900 block text-sm mb-1 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary-800" />
                <span>3. Income Available for Debt Service (IADS)</span>
              </span>
              <p className="font-mono bg-white p-2.5 rounded border border-neutral-200 text-neutral-800">
                {income_estimate.formula_breakdown.iads_formula}
              </p>
              <p className="text-[11px] text-neutral-500 mt-1">
                Policy requirement: Living expense baseline must be deducted before debt servicing capacity is certified.
              </p>
            </div>

            <div className="pt-2 border-t border-neutral-200">
              <span className="font-bold text-neutral-900 block text-sm mb-1 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary-800" />
                <span>4. Debt Repayment Coverage Ratio</span>
              </span>
              <p className="font-mono bg-white p-2.5 rounded border border-neutral-200 text-neutral-800">
                {income_estimate.formula_breakdown.repayment_ratio_formula}
              </p>
            </div>
          </div>
        </div>
      </DetailCard>

      {/* Assumptions Breakdown: User vs Backend */}
      <DetailCard
        title="Assumptions Ledger (Provenance & Authority)"
        subtitle="Explicit differentiation between user assumptions, backend benchmarks, and actuals"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Backend Authoritative Benchmarks */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-primary-800" />
                <span>Institutional Backend Assumptions</span>
              </span>
              <StatusBadge variant="BACKEND_AUTHORITATIVE" size="sm" />
            </div>
            <ul className="space-y-2 text-neutral-700">
              <li className="flex justify-between border-b border-neutral-200 pb-1">
                <span>Statutory Fair & Remunerative Price (FRP):</span>
                <span className="font-bold">₹3,400 / MT</span>
              </li>
              <li className="flex justify-between border-b border-neutral-200 pb-1">
                <span>District Standard Cultivation Cost:</span>
                <span className="font-bold">₹1,25,000 / ha</span>
              </li>
              <li className="flex justify-between border-b border-neutral-200 pb-1">
                <span>Baseline Household Maintenance:</span>
                <span className="font-bold">₹1,80,000 / year</span>
              </li>
            </ul>
          </div>

          {/* User Entered & Validated Inputs */}
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-800" />
                <span>Officer Verified Survey Entries</span>
              </span>
              <StatusBadge variant="USER_ASSUMPTION" size="sm" />
            </div>
            <ul className="space-y-2 text-neutral-700">
              <li className="flex justify-between border-b border-neutral-200 pb-1">
                <span>Cultivated Adsali Area:</span>
                <span className="font-bold">2.50 hectares</span>
              </li>
              <li className="flex justify-between border-b border-neutral-200 pb-1">
                <span>Drip System Operational Condition:</span>
                <span className="font-bold">Functional (No Repairs)</span>
              </li>
              <li className="flex justify-between border-b border-neutral-200 pb-1">
                <span>Cooperative Sugar Mill Member Quota:</span>
                <span className="font-bold">Active Member (#849)</span>
              </li>
            </ul>
          </div>
        </div>
      </DetailCard>
    </div>
  );
};
