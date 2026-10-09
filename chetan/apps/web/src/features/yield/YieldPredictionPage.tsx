import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Cpu,
  ShieldAlert,
  HelpCircle,
  ArrowLeft,
  Calendar,
  AlertCircle,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DetailCard } from '@/components/data-display/DetailCard';
import { ConfidenceIndicator } from '@/components/data-display/ConfidenceIndicator';
import { ConfidenceBandChart } from '@/components/charts/ConfidenceBandChart';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { formatDate, formatDateTime } from '@/lib/formatters/date';
import { formatYield, formatArea } from '@/lib/formatters/units';
import { typedGet, typedPost } from '@/lib/api-client/client';
import { queryKeys } from '@/lib/query-client/query-keys';
import { CropCycle, YieldPrediction } from '@/types/domain';

export const YieldPredictionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Interactive Live ML Inference State
  const [fertilizer, setFertilizer] = useState<number>(78.5);
  const [temperature, setTemperature] = useState<number>(27.2);
  const [nitrogen, setNitrogen] = useState<number>(42.0);
  const [phosphorus, setPhosphorus] = useState<number>(25.0);
  const [potassium, setPotassium] = useState<number>(30.0);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] = useState<{
    predicted_yield: number;
    unit: string;
    model_used: string;
    message?: string;
  } | null>(null);
  const [predictionError, setPredictionError] = useState<string | null>(null);

  const handleLivePrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPredicting(true);
    setPredictionError(null);
    try {
      const res = await typedPost<{
        predicted_yield: number;
        unit: string;
        model_used: string;
        message?: string;
      }>('/predict-yield', {
        fertilizer,
        temperature,
        nitrogen,
        phosphorus,
        potassium,
      });
      setPredictionResult(res);
    } catch (err: any) {
      setPredictionError(err?.message || 'Failed to execute live model inference');
    } finally {
      setIsPredicting(false);
    }
  };

  const cycleQuery = useQuery({
    queryKey: queryKeys.cropCycle(id || 'cycle-301'),
    queryFn: () =>
      typedGet<{
        crop_cycle: CropCycle;
        yield_prediction: YieldPrediction | null;
      }>(`/crop-cycles/${id || 'cycle-301'}`),
  });

  if (cycleQuery.isLoading) {
    return <LoadingState message="Running gradient yield estimation and conformal quantile intervals..." />;
  }

  if (cycleQuery.isError || !cycleQuery.data) {
    return (
      <ErrorState
        error={cycleQuery.error}
        title="Yield Prediction Unavailable"
        onRetry={() => cycleQuery.refetch()}
      />
    );
  }

  const { crop_cycle, yield_prediction } = cycleQuery.data;

  if (!yield_prediction) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Yield Prediction"
          subtitle="Model inference not yet executed for this crop cycle"
        />
        <div className="p-8 text-center bg-white rounded-xl border border-neutral-200">
          <p className="text-sm text-neutral-600">
            Yield estimation requires at least 45 days of verified vegetative telemetry.
          </p>
        </div>
      </div>
    );
  }

  // Construct chart periods for confidence band chart
  const bandData = [
    { period: 'Aug (Sowing)', expected: 65, lower: 55, upper: 75 },
    { period: 'Sep (Tillering)', expected: 82, lower: 72, upper: 92 },
    { period: 'Oct (Grand Growth)', expected: 104.5, lower: 96.2, upper: 112.8 },
    { period: 'Nov (Pre-Harvest)', expected: 106.0, lower: 97.0, upper: 115.0 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Estimated Yield: ${formatYield(yield_prediction.value, yield_prediction.unit)}`}
        subtitle={`${crop_cycle.crop_name} (${crop_cycle.season}) · Prediction based on available agronomic evidence`}
        breadcrumbs={[
          { label: 'Borrowers', href: '/borrowers' },
          { label: 'Crop Cycle', href: `/crop-cycles/${crop_cycle.id}` },
          { label: 'Yield Prediction', current: true },
        ]}
        badge={
          <div className="flex items-center gap-2">
            <StatusBadge variant="MODEL_OUTPUT" size="md" />
            {yield_prediction.is_illustrative && (
              <StatusBadge variant="ILLUSTRATIVE" size="md" />
            )}
            <StatusBadge variant="PRODUCTION" label="CALIBRATED" size="md" />
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

      {/* Mandatory Uncertainty Notice */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Model Uncertainty Disclosure:</p>
          <p className="leading-relaxed text-amber-800">
            This result is an estimated yield derived from historical weather observations, satellite vegetation indices, and soil moisture grids. 
            <span className="font-semibold text-amber-950"> This result is not a guarantee of actual field harvest or crop realization.</span> Unseasonal weather events or late pest pressure may alter actual yields.
          </p>
        </div>
      </div>

      {/* Prediction Value & Uncertainty Bands */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DetailCard title="Estimated Yield & Forecast Horizon" className="md:col-span-2">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl">
              <div>
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide block">
                  Model Estimated Yield
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-950 font-tabular mt-1">
                  {formatYield(yield_prediction.value, yield_prediction.unit)}
                </div>
                <p className="text-xs text-neutral-600 mt-1">
                  Cultivated plot area: {formatArea(crop_cycle.area_value, crop_cycle.area_unit)}
                </p>
              </div>

              <div className="text-right text-xs space-y-1 font-tabular">
                <span className="text-neutral-500 block text-[11px]">Prediction Horizon</span>
                <span className="font-bold text-neutral-900">
                  {formatDate(yield_prediction.prediction_horizon.start)} – {formatDate(yield_prediction.prediction_horizon.end)}
                </span>
                <p className="text-[11px] text-neutral-500">
                  Evaluated at: {formatDateTime(yield_prediction.prediction_timestamp)}
                </p>
              </div>
            </div>

            {/* Uncertainty Interval Box */}
            <ConfidenceIndicator
              lowerBound={yield_prediction.uncertainty?.lower_bound}
              upperBound={yield_prediction.uncertainty?.upper_bound}
              unit={yield_prediction.unit}
              confidenceLevel={yield_prediction.uncertainty?.confidence_level}
              method={yield_prediction.uncertainty?.method}
            />

            {/* Visual Confidence Band Chart */}
            <div className="pt-2">
              <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                Yield Trajectory & 90% Uncertainty Envelope
              </h4>
              <ConfidenceBandChart data={bandData} unit={yield_prediction.unit} />
            </div>
          </div>
        </DetailCard>

        {/* Model Governance & Limitations */}
        <div className="space-y-6">
          <DetailCard title="Model Card & Provenance">
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-neutral-500 block text-[11px]">Model Architecture</span>
                <span className="font-semibold text-neutral-900">{yield_prediction.model_name}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[11px]">Model Version</span>
                <span className="font-mono font-semibold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded">
                  {yield_prediction.model_version}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[11px]">Feature Schema Version</span>
                <span className="font-mono text-neutral-700">{yield_prediction.feature_schema_version}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[11px]">Input Manifest ID</span>
                <span className="font-mono text-neutral-600 truncate block" title={yield_prediction.input_manifest_id}>
                  {yield_prediction.input_manifest_id}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[11px]">Data Quality Status</span>
                <StatusBadge variant="HEALTHY" label={yield_prediction.quality_status} size="sm" />
              </div>
            </div>
          </DetailCard>

          {/* Explicit Model Limitations List */}
          <DetailCard title="Model Limitations & Caveats">
            <ul className="space-y-2 text-xs text-neutral-700">
              {yield_prediction.limitations.map((lim, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span className="leading-tight">{lim}</span>
                </li>
              ))}
            </ul>
          </DetailCard>
        </div>
      </div>

      {/* Feature Contributions Breakdown */}
      <DetailCard
        title="Input Features Used by Yield Model"
        subtitle="Ranked agronomic features driving this inference"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {yield_prediction.explanation.map((item, idx) => (
            <div key={idx} className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-900">{item.feature}</span>
                <span className="font-mono text-neutral-500 text-[11px]">
                  Weight: {(item.importance * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-neutral-600 leading-relaxed text-[11px]">{item.description}</p>
            </div>
          ))}
        </div>
      </DetailCard>

      {/* Live ML Pipeline Interactive Simulation */}
      <DetailCard
        title="Live ML Crop Yield Inference (ExtraTreesRegressor)"
        subtitle="Simulate real-time model inference served by the FastAPI ML pipeline"
      >
        <form onSubmit={handleLivePrediction} className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block font-medium text-neutral-700 mb-1">Fertilizer (kg/ha)</label>
              <input
                type="number"
                step="0.1"
                value={fertilizer}
                onChange={(e) => setFertilizer(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block font-medium text-neutral-700 mb-1">Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block font-medium text-neutral-700 mb-1">Nitrogen (N)</label>
              <input
                type="number"
                step="0.1"
                value={nitrogen}
                onChange={(e) => setNitrogen(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block font-medium text-neutral-700 mb-1">Phosphorus (P)</label>
              <input
                type="number"
                step="0.1"
                value={phosphorus}
                onChange={(e) => setPhosphorus(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block font-medium text-neutral-700 mb-1">Potassium (K)</label>
              <input
                type="number"
                step="0.1"
                value={potassium}
                onChange={(e) => setPotassium(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-lg text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              disabled={isPredicting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isPredicting ? 'Executing Model Inference...' : 'Run Live ML Inference'}</span>
            </button>

            {predictionResult && (
              <div className="flex items-center gap-3 p-2 px-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                <span className="text-neutral-600">Predicted Yield:</span>
                <span className="font-bold text-emerald-900 text-sm font-tabular">
                  {predictionResult.predicted_yield.toFixed(2)} {predictionResult.unit}
                </span>
                <span className="text-neutral-400">|</span>
                <span className="text-[11px] font-mono text-neutral-500">{predictionResult.model_used}</span>
              </div>
            )}
          </div>

          {predictionError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{predictionError}</span>
            </div>
          )}
        </form>
      </DetailCard>
    </div>
  );
};
