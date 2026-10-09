import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Sprout,
  CloudSun,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Database,
  Calendar,
  Tractor,
  ArrowRight,
  HelpCircle,
  Camera,
  Activity,
  Layers,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DetailCard } from '@/components/data-display/DetailCard';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { formatDate } from '@/lib/formatters/date';
import { formatArea, formatYield } from '@/lib/formatters/units';
import { formatCurrency } from '@/lib/formatters/currency';
import { typedGet } from '@/lib/api-client/client';
import { queryKeys } from '@/lib/query-client/query-keys';
import { CropCycle, Farm, Borrower, YieldPrediction, FarmIncomeEstimate } from '@/types/domain';
import { IMAGERY_ASSETS } from '@/lib/assets/imagery';

export const CropCycleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'climate' | 'yield' | 'income'>('overview');

  const cycleQuery = useQuery({
    queryKey: queryKeys.cropCycle(id || 'cycle-301'),
    queryFn: () =>
      typedGet<{
        crop_cycle: CropCycle;
        farm: Farm;
        borrower: Borrower;
        yield_prediction: YieldPrediction | null;
        income_estimate: FarmIncomeEstimate | null;
      }>(`/crop-cycles/${id || 'cycle-301'}`),
  });

  if (cycleQuery.isLoading) {
    return <LoadingState message="Loading crop cycle agronomic telemetry & models..." />;
  }

  if (cycleQuery.isError || !cycleQuery.data) {
    return (
      <ErrorState
        error={cycleQuery.error}
        title="Crop Cycle Not Found"
        onRetry={() => cycleQuery.refetch()}
      />
    );
  }

  const { crop_cycle, farm, borrower, yield_prediction, income_estimate } = cycleQuery.data;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Sprout className="w-4 h-4" /> },
    { id: 'climate', label: 'Climate Intelligence', icon: <CloudSun className="w-4 h-4" />, link: `/crop-cycles/${crop_cycle.id}/climate` },
    { id: 'yield', label: 'Yield Prediction', icon: <TrendingUp className="w-4 h-4" />, link: `/crop-cycles/${crop_cycle.id}/yield` },
    { id: 'income', label: 'Farm Income Analysis', icon: <DollarSign className="w-4 h-4" />, link: `/crop-cycles/${crop_cycle.id}/income` },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${crop_cycle.crop_name} (${crop_cycle.season})`}
        subtitle={`${farm.name} · Borrower: ${borrower.display_name} · Sown: ${formatDate(crop_cycle.sowing_date)}`}
        breadcrumbs={[
          { label: 'Borrowers', href: '/borrowers' },
          { label: borrower.display_name, href: `/borrowers/${borrower.id}` },
          { label: farm.name, href: `/farms/${farm.id}` },
          { label: crop_cycle.crop_name, current: true },
        ]}
        badge={<StatusBadge variant="HEALTHY" label={crop_cycle.status} size="md" />}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to={`/crop-cycles/${crop_cycle.id}/climate`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-900 text-white rounded-xl text-xs font-bold hover:bg-primary-950 shadow-2xs transition-colors"
            >
              <span>Next: Climate & Telemetry</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        }
      />

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 overflow-x-auto pb-1" aria-label="Crop cycle tabs">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return tab.link ? (
              <Link
                key={tab.id}
                to={tab.link}
                className="flex items-center gap-2 py-2 px-3 text-xs font-bold rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                {tab.icon}
                <span>{tab.label}</span>
              </Link>
            ) : (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                aria-current={isSelected ? 'page' : undefined}
                className={`flex items-center gap-2 py-2 px-3.5 text-xs font-bold rounded-xl transition-colors ${
                  isSelected
                    ? 'bg-primary-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Visual Crop Status Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary-800" />
              <h3 className="font-bold text-sm text-slate-900 font-display">
                Field Inspection & Standing Crop Telemetry
              </h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
              Geo-Tag Verified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative h-44 rounded-xl overflow-hidden bg-slate-100">
              <img
                src={IMAGERY_ASSETS.sugarcaneCrop}
                alt="Standing sugarcane field"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-2.5 left-2.5 text-white text-xs font-medium">
                <span className="block font-bold">Standing Adsali Cane</span>
                <span className="text-[10px] text-slate-300">Co-86032 High-Recovery Strain</span>
              </div>
            </div>

            <div className="relative h-44 rounded-xl overflow-hidden bg-slate-100">
              <img
                src={IMAGERY_ASSETS.soilMoistureSensor}
                alt="Soil probe and cane root"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-2.5 left-2.5 text-white text-xs font-medium">
                <span className="block font-bold">In-Field IoT Telemetry</span>
                <span className="text-[10px] text-slate-300">31.8% VWC · 26°C Root Temperature</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 block text-[11px] font-bold">Cultivated Area</span>
              <span className="font-extrabold text-slate-900 font-display text-sm">
                {formatArea(crop_cycle.area_value, crop_cycle.area_unit)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 block text-[11px] font-bold">Delivery</span>
              <span className="font-bold text-slate-800 text-sm truncate block">
                {crop_cycle.irrigation_type}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 block text-[11px] font-bold">Sowing</span>
              <span className="font-bold text-slate-800 text-sm">
                {formatDate(crop_cycle.sowing_date)}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 block text-[11px] font-bold">Est. Harvest</span>
              <span className="font-bold text-slate-800 text-sm">
                {formatDate(crop_cycle.expected_harvest_date)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Intelligence Status Card */}
        <div className="space-y-4">
          <DetailCard title="Model Forecast Snapshot">
            <div className="space-y-4 text-xs">
              {yield_prediction ? (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5 shadow-2xs">
                  <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                    Estimated Yield Output
                  </span>
                  <div className="text-2xl font-extrabold text-emerald-950 font-tabular font-display">
                    {formatYield(yield_prediction.value, yield_prediction.unit)}
                  </div>
                  <p className="text-[11px] text-emerald-800">
                    Model: {yield_prediction.model_version} · 90% confidence bound active
                  </p>
                  <Link
                    to={`/crop-cycles/${crop_cycle.id}/yield`}
                    className="text-xs font-bold text-emerald-900 underline block pt-1 hover:text-emerald-950"
                  >
                    Inspect Full Yield Model →
                  </Link>
                </div>
              ) : null}

              {income_estimate ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Net Projected Farm Income
                  </span>
                  <div className="text-2xl font-extrabold text-slate-900 font-tabular font-display">
                    {formatCurrency(income_estimate.net_farm_income, income_estimate.currency)}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Debt Service Coverage: {income_estimate.repayment_capacity_ratio}x
                  </p>
                  <Link
                    to={`/crop-cycles/${crop_cycle.id}/income`}
                    className="text-xs font-bold text-primary-800 underline block pt-1 hover:text-primary-950"
                  >
                    View Income Breakdown →
                  </Link>
                </div>
              ) : null}
            </div>
          </DetailCard>
        </div>
      </div>
    </div>
  );
};
