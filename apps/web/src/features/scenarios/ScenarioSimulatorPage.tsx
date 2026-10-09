import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Sliders,
  FlaskConical,
  RotateCcw,
  Play,
  ArrowLeft,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DetailCard } from '@/components/data-display/DetailCard';
import { FormField } from '@/components/forms/FormField';
import { NumberField } from '@/components/forms/NumberField';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useToast } from '@/components/feedback/Toast';
import { formatCurrency } from '@/lib/formatters/currency';
import { formatPercent } from '@/lib/formatters/number';
import { formatDate } from '@/lib/formatters/date';
import { typedGet, typedPost } from '@/lib/api-client/client';
import { queryKeys } from '@/lib/query-client/query-keys';
import { SCENARIO_BOUNDS } from '@/mocks/fixtures/scenarios';
import { ScenarioRun, CreditAssessment } from '@/types/domain';

// Bounded input validation strictly enforcing backend metadata ranges
const scenarioInputSchema = z.object({
  name: z.string().min(3, 'Scenario name must be at least 3 characters'),
  description: z.string().min(5, 'Please provide a short description'),
  yield_change_pct: z.coerce
    .number()
    .min(SCENARIO_BOUNDS.yield_change_pct.min, `Minimum yield adjustment is ${SCENARIO_BOUNDS.yield_change_pct.min}%`)
    .max(SCENARIO_BOUNDS.yield_change_pct.max, `Maximum yield adjustment is +${SCENARIO_BOUNDS.yield_change_pct.max}%`),
  price_change_pct: z.coerce
    .number()
    .min(SCENARIO_BOUNDS.price_change_pct.min, `Minimum price adjustment is ${SCENARIO_BOUNDS.price_change_pct.min}%`)
    .max(SCENARIO_BOUNDS.price_change_pct.max, `Maximum price adjustment is +${SCENARIO_BOUNDS.price_change_pct.max}%`),
  cost_change_pct: z.coerce
    .number()
    .min(SCENARIO_BOUNDS.cost_change_pct.min, `Minimum cost adjustment is ${SCENARIO_BOUNDS.cost_change_pct.min}%`)
    .max(SCENARIO_BOUNDS.cost_change_pct.max, `Maximum cost adjustment is +${SCENARIO_BOUNDS.cost_change_pct.max}%`),
  rainfall_factor_pct: z.coerce
    .number()
    .min(SCENARIO_BOUNDS.rainfall_factor_pct.min, `Minimum rainfall adjustment is ${SCENARIO_BOUNDS.rainfall_factor_pct.min}%`)
    .max(SCENARIO_BOUNDS.rainfall_factor_pct.max, `Maximum rainfall adjustment is +${SCENARIO_BOUNDS.rainfall_factor_pct.max}%`),
  tenor_extension_months: z.coerce
    .number()
    .min(SCENARIO_BOUNDS.tenor_extension_months.min, 'Tenor extension cannot be negative')
    .max(SCENARIO_BOUNDS.tenor_extension_months.max, `Maximum tenor extension is ${SCENARIO_BOUNDS.tenor_extension_months.max} months`),
});

type ScenarioFormData = z.infer<typeof scenarioInputSchema>;

export const ScenarioSimulatorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const assessmentId = id || 'asm-701';
  const queryClientTanstack = useQueryClient();
  const { showToast } = useToast();

  const [activeScenario, setActiveScenario] = useState<ScenarioRun | null>(null);

  const assessmentQuery = useQuery({
    queryKey: queryKeys.assessment(assessmentId),
    queryFn: () => typedGet<{ assessment: CreditAssessment }>(`/assessments/${assessmentId}`),
  });

  const scenariosQuery = useQuery({
    queryKey: queryKeys.scenarios(assessmentId),
    queryFn: () => typedGet<{ scenarios: ScenarioRun[] }>(`/assessments/${assessmentId}/scenarios`),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScenarioFormData>({
    resolver: zodResolver(scenarioInputSchema),
    defaultValues: {
      name: 'Severe Monsoon Dry-Spell Stress Test',
      description: 'Simulates 20% rainfall deficit combined with 15% fertilizer inflation and 10% crop price discount.',
      yield_change_pct: -15,
      price_change_pct: -10,
      cost_change_pct: 15,
      rainfall_factor_pct: -20,
      tenor_extension_months: 2,
    },
  });

  const runScenarioMutation = useMutation({
    mutationFn: (data: ScenarioFormData) =>
      typedPost<{ scenario: ScenarioRun }>(`/assessments/${assessmentId}/scenarios`, {
        name: data.name,
        description: data.description,
        assumptions: {
          yield_change_pct: data.yield_change_pct,
          price_change_pct: data.price_change_pct,
          cost_change_pct: data.cost_change_pct,
          rainfall_factor_pct: data.rainfall_factor_pct,
          tenor_extension_months: data.tenor_extension_months,
        },
      }),
    onSuccess: (data) => {
      queryClientTanstack.invalidateQueries({ queryKey: queryKeys.scenarios(assessmentId) });
      setActiveScenario(data.scenario);
      showToast({
        type: 'success',
        title: 'Scenario Simulation Completed',
        message: `Simulation "${data.scenario.name}" evaluated under parametric bounds.`,
      });
    },
    onError: (err: any) => {
      showToast({
        type: 'error',
        title: 'Simulation Failed',
        message: err.message || 'Unable to execute scenario run.',
      });
    },
  });

  if (assessmentQuery.isLoading || scenariosQuery.isLoading) {
    return <LoadingState message="Loading simulation constraints and historical scenarios..." />;
  }

  const existingScenarios = scenariosQuery.data?.scenarios || [];
  const displayScenario = activeScenario || existingScenarios[0] || null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Parametric Climate & Price Scenario Simulator"
        subtitle={`Stress-testing engine for Assessment ${assessmentId} · Evaluate bounded macro-shocks on borrower debt service capacity.`}
        breadcrumbs={[
          { label: 'Borrowers', href: '/borrowers' },
          { label: `Assessment ${assessmentId}`, href: `/assessments/${assessmentId}` },
          { label: 'Scenarios', current: true },
        ]}
        badge={
          <div className="flex items-center gap-2">
            <StatusBadge variant="ILLUSTRATIVE" size="md" />
            <span className="text-xs bg-purple-100 text-purple-900 font-bold px-2 py-0.5 rounded">
              ANALYST WORKBENCH
            </span>
          </div>
        }
        actions={
          <Link
            to={`/assessments/${assessmentId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-800 bg-white hover:bg-neutral-50 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Assessment</span>
          </Link>
        }
      />

      {/* Mandatory Illustrative Disclaimer */}
      <div className="bg-[#FFFBEB] border-2 border-amber-300 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-extrabold text-sm text-amber-950">
            Mandatory Institutional Notice:
          </p>
          <p className="text-amber-900 text-xs font-semibold leading-relaxed">
            This scenario is illustrative and does not replace the official assessment.
          </p>
          <p className="text-amber-800 leading-relaxed text-[11px]">
            What-if projections simulate hypothetical stress perturbations within mathematically bounded ranges. They are designed for sensitivity analysis and do not constitute authorized credit committee decisions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Bounded Scenario Input Controls */}
        <div className="lg:col-span-5 space-y-6">
          <DetailCard
            title="Bounded Simulation Parameters"
            subtitle="Perturbations strictly bounded by historical empirical variance"
          >
            <form onSubmit={handleSubmit((d) => runScenarioMutation.mutate(d))} className="space-y-4">
              <FormField
                id="name"
                label="Scenario Run Title"
                required
                error={errors.name?.message}
              >
                <input
                  id="name"
                  type="text"
                  className="w-full text-xs font-semibold p-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-700"
                  {...register('name')}
                />
              </FormField>

              <FormField
                id="description"
                label="Hypothesis / Narrative"
                required
                error={errors.description?.message}
              >
                <textarea
                  id="description"
                  rows={2}
                  className="w-full text-xs p-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-700"
                  {...register('description')}
                />
              </FormField>

              <div className="space-y-3 pt-2 border-t border-neutral-100">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wide block">
                  Bounded Parameter Ranges
                </span>

                <FormField
                  id="yield_change_pct"
                  label={`Yield Shock (${SCENARIO_BOUNDS.yield_change_pct.min}% to +${SCENARIO_BOUNDS.yield_change_pct.max}%)`}
                  error={errors.yield_change_pct?.message}
                >
                  <NumberField id="yield_change_pct" unit="%" step="1" {...register('yield_change_pct')} />
                </FormField>

                <FormField
                  id="price_change_pct"
                  label={`Mandi Price Shock (${SCENARIO_BOUNDS.price_change_pct.min}% to +${SCENARIO_BOUNDS.price_change_pct.max}%)`}
                  error={errors.price_change_pct?.message}
                >
                  <NumberField id="price_change_pct" unit="%" step="1" {...register('price_change_pct')} />
                </FormField>

                <FormField
                  id="cost_change_pct"
                  label={`Production Cost Shift (${SCENARIO_BOUNDS.cost_change_pct.min}% to +${SCENARIO_BOUNDS.cost_change_pct.max}%)`}
                  error={errors.cost_change_pct?.message}
                >
                  <NumberField id="cost_change_pct" unit="%" step="1" {...register('cost_change_pct')} />
                </FormField>

                <FormField
                  id="rainfall_factor_pct"
                  label={`Rainfall Deficit / Surplus (${SCENARIO_BOUNDS.rainfall_factor_pct.min}% to +${SCENARIO_BOUNDS.rainfall_factor_pct.max}%)`}
                  error={errors.rainfall_factor_pct?.message}
                >
                  <NumberField id="rainfall_factor_pct" unit="%" step="1" {...register('rainfall_factor_pct')} />
                </FormField>

                <FormField
                  id="tenor_extension_months"
                  label={`Tenor Moratorium Extension (0 to ${SCENARIO_BOUNDS.tenor_extension_months.max} months)`}
                  error={errors.tenor_extension_months?.message}
                >
                  <NumberField id="tenor_extension_months" unit="mo" step="1" {...register('tenor_extension_months')} />
                </FormField>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => reset()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Bounds</span>
                </button>

                <button
                  type="submit"
                  disabled={runScenarioMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-800 text-white rounded-lg text-xs font-bold hover:bg-primary-900 disabled:opacity-50 transition-colors shadow-2xs"
                >
                  {runScenarioMutation.isPending ? (
                    <span>Simulating...</span>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Run Scenario Simulation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </DetailCard>
        </div>

        {/* Right Column: Baseline vs Projected Results Comparison */}
        <div className="lg:col-span-7 space-y-6">
          {displayScenario ? (
            <DetailCard
              title={`Simulation Outcome: ${displayScenario.name}`}
              subtitle={displayScenario.description}
              badge={<StatusBadge variant="ILLUSTRATIVE" size="sm" />}
            >
              <div className="space-y-5">
                {/* Comparison Table */}
                <div className="overflow-x-auto border border-neutral-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 uppercase font-semibold">
                      <tr>
                        <th scope="col" className="px-3.5 py-3">Financial / Agronomic Metric</th>
                        <th scope="col" className="px-3.5 py-3 text-right">Official Baseline</th>
                        <th scope="col" className="px-3.5 py-3 text-right">Projected Scenario</th>
                        <th scope="col" className="px-3.5 py-3 text-right">Delta Shift</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 font-tabular">
                      <tr className="hover:bg-neutral-50">
                        <td className="px-3.5 py-2.5 font-medium text-neutral-800">Saleable Harvest Yield</td>
                        <td className="px-3.5 py-2.5 text-right font-semibold">{displayScenario.baseline.yield_val} MT/ha</td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-neutral-900">{displayScenario.projected.yield_val} MT/ha</td>
                        <td className="px-3.5 py-2.5 text-right text-rose-700 font-semibold">
                          {displayScenario.assumptions.yield_change_pct}%
                        </td>
                      </tr>

                      <tr className="hover:bg-neutral-50">
                        <td className="px-3.5 py-2.5 font-medium text-neutral-800">Gross Farm Revenue</td>
                        <td className="px-3.5 py-2.5 text-right font-semibold">{formatCurrency(displayScenario.baseline.gross_revenue)}</td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-neutral-900">{formatCurrency(displayScenario.projected.gross_revenue)}</td>
                        <td className="px-3.5 py-2.5 text-right text-rose-700 font-semibold">
                          {formatCurrency(displayScenario.projected.gross_revenue - displayScenario.baseline.gross_revenue)}
                        </td>
                      </tr>

                      <tr className="hover:bg-neutral-50">
                        <td className="px-3.5 py-2.5 font-medium text-neutral-800">Net Operating Farm Income</td>
                        <td className="px-3.5 py-2.5 text-right font-semibold">{formatCurrency(displayScenario.baseline.net_income)}</td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-neutral-900">{formatCurrency(displayScenario.projected.net_income)}</td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-rose-700">
                          {formatCurrency(displayScenario.projected.delta_net_income)}
                        </td>
                      </tr>

                      <tr className="hover:bg-neutral-50">
                        <td className="px-3.5 py-2.5 font-medium text-neutral-800">IADS Repayment Buffer</td>
                        <td className="px-3.5 py-2.5 text-right font-semibold">{formatCurrency(displayScenario.baseline.iads)}</td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-neutral-900">{formatCurrency(displayScenario.projected.iads)}</td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-rose-700">
                          {formatCurrency(displayScenario.projected.delta_iads)}
                        </td>
                      </tr>

                      <tr className="bg-neutral-50/70 font-semibold">
                        <td className="px-3.5 py-3 text-neutral-900">Projected Risk Classification</td>
                        <td className="px-3.5 py-3 text-right">
                          <StatusBadge
                            variant={displayScenario.baseline.risk_classification === 'LOW' ? 'HEALTHY' : 'HIGH_RISK'}
                            label={displayScenario.baseline.risk_classification}
                            size="sm"
                          />
                        </td>
                        <td className="px-3.5 py-3 text-right">
                          <StatusBadge
                            variant={displayScenario.projected.risk_classification === 'LOW' ? 'HEALTHY' : 'HIGH_RISK'}
                            label={displayScenario.projected.risk_classification}
                            size="sm"
                          />
                        </td>
                        <td className="px-3.5 py-3 text-right text-neutral-600 font-bold">
                          {displayScenario.projected.repayment_ratio}x coverage
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Scenario Metadata */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-100 gap-2">
                  <span>Author: {displayScenario.created_by}</span>
                  <span>Simulated At: {formatDate(displayScenario.created_at)}</span>
                  <span>Evidence Tag: {displayScenario.evidence_status}</span>
                </div>
              </div>
            </DetailCard>
          ) : (
            <div className="p-12 text-center bg-white rounded-xl border border-neutral-200 text-neutral-500 text-xs">
              No simulation results. Select or run a scenario from the panel on the left.
            </div>
          )}

          {/* Historical Saved Scenarios for this Assessment */}
          {existingScenarios.length > 0 && (
            <DetailCard title={`Previous Simulation Runs (${existingScenarios.length})`}>
              <div className="space-y-2 text-xs">
                {existingScenarios.map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => setActiveScenario(sc)}
                    className={`w-full text-left p-3 rounded-lg border flex items-center justify-between transition-colors ${
                      displayScenario?.id === sc.id
                        ? 'border-primary-700 bg-primary-50/40'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-neutral-900 block">{sc.name}</span>
                      <span className="text-neutral-500 text-[11px]">
                        Yield {sc.assumptions.yield_change_pct}% · Price {sc.assumptions.price_change_pct}% · Run by {sc.created_by}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold font-tabular text-neutral-800">
                        {sc.projected.repayment_ratio}x DSCR
                      </span>
                      <StatusBadge variant="ILLUSTRATIVE" size="sm" className="ml-2" />
                    </div>
                  </button>
                ))}
              </div>
            </DetailCard>
          )}
        </div>
      </div>
    </div>
  );
};
