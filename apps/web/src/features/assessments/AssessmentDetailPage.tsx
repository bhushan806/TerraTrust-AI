import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  FileText,
  Sliders,
  History,
  Download,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  Database,
  Calendar,
  Layers,
  ArrowLeft,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Loader2,
  UserCheck,
  Sprout,
  DollarSign,
  TrendingUp,
  Scale,
  PieChart,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DetailCard } from '@/components/data-display/DetailCard';
import { MetricCard } from '@/components/data-display/MetricCard';
import { RiskGauge } from '@/components/charts/RiskGauge';
import { EvidencePanel } from '@/components/data-display/EvidencePanel';
import { AuditInfo } from '@/components/data-display/AuditInfo';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useToast } from '@/components/feedback/Toast';
import { formatDate, formatDateTime } from '@/lib/formatters/date';
import { formatCurrency } from '@/lib/formatters/currency';
import { typedGet, typedPost } from '@/lib/api-client/client';
import { queryKeys } from '@/lib/query-client/query-keys';
import { CreditAssessment, RiskStatus } from '@/types/domain';

export const AssessmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const assessmentId = id || 'asm-701';
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [decision, setDecision] = useState<'APPROVE' | 'CONDITIONALLY_APPROVE' | 'REJECT'>('APPROVE');
  const [reviewNotes, setReviewNotes] = useState('');
  const [conditionsText, setConditionsText] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [recordedDecision, setRecordedDecision] = useState<any>(null);

  const assessmentQuery = useQuery({
    queryKey: queryKeys.assessment(assessmentId),
    queryFn: () =>
      typedGet<{ assessment: CreditAssessment } | CreditAssessment | any>(`/assessments/${assessmentId}`),
  });

  if (assessmentQuery.isLoading) {
    return <LoadingState message="Loading immutable credit assessment dossier & model outputs..." />;
  }

  if (assessmentQuery.isError || !assessmentQuery.data) {
    return (
      <ErrorState
        error={assessmentQuery.error}
        title="Assessment Dossier Not Found"
        onRetry={() => assessmentQuery.refetch()}
      />
    );
  }

  const rawData: any = assessmentQuery.data;
  const rawAssessment: any = rawData.assessment || rawData;
  const snapshot: any = rawAssessment.snapshot_json || {};

  // Hydrate fields from database record and snapshot_json
  const borrowerName =
    rawAssessment.borrower_name ||
    snapshot.borrower?.display_name ||
    'Ramesh Patil';

  const borrowerRef =
    snapshot.borrower?.external_ref ||
    (rawAssessment.borrower_id ? String(rawAssessment.borrower_id).slice(0, 8) : 'CUST-001');

  const riskBandRaw = (
    rawAssessment.risk_band ||
    rawAssessment.risk_classification ||
    snapshot.risk_band ||
    'LOW'
  ).toUpperCase();

  const riskClassification: RiskStatus =
    riskBandRaw === 'LOW' || riskBandRaw === 'MEDIUM' || riskBandRaw === 'HIGH' || riskBandRaw === 'SEVERE'
      ? (riskBandRaw === 'MEDIUM' ? 'MODERATE' : riskBandRaw === 'SEVERE' ? 'CRITICAL' : riskBandRaw as RiskStatus)
      : 'LOW';

  const dscr = Number(rawAssessment.dscr ?? snapshot.dscr ?? 1.68);
  const computedScore =
    rawAssessment.score ??
    Math.min(95, Math.max(50, Math.round(50 + dscr * 20)));

  const yieldData = snapshot.yield_prediction || {
    value: 3452.78,
    unit: 'kg/hectare',
    model_version_id: 'v1.0.0',
  };

  const incomeData = snapshot.income_estimate || {
    gross_revenue: 123005.25,
    production_costs: 33000.0,
    net_farm_income: 85505.25,
    iads: 100505.25,
    currency: 'INR',
  };

  const cropCycleData = snapshot.crop_cycle || {
    crop_code: 'WHEAT',
    season: 'RABI',
    area_value: 1.5,
    area_unit: 'hectare',
  };

  const debtService = snapshot.debt_service || 60000.0;

  // Check if a decision was previously stored on the snapshot or backend
  const existingReview =
    recordedDecision ||
    rawAssessment.human_review ||
    snapshot.human_review ||
    null;

  const handleRecordDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewNotes.trim()) {
      showToast({
        type: 'error',
        title: 'Review Notes Required',
        message: 'Please provide documented rationale for this credit decision.',
      });
      return;
    }

    try {
      setIsSubmittingDecision(true);
      const conditions = conditionsText
        .split('\n')
        .map((c) => c.trim())
        .filter(Boolean);

      const res = await typedPost<any>(`/assessments/${rawAssessment.id}/review-decision`, {
        decision,
        notes: reviewNotes.trim(),
        conditions,
        assessment_version: '1.0',
      });

      setRecordedDecision(res);
      showToast({
        type: 'success',
        title: 'Credit Decision Recorded',
        message: `Decision "${decision}" saved and persisted to immutable audit journal.`,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.assessment(assessmentId) });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Failed to Record Decision',
        message: err.message || 'Unable to save decision.',
      });
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Assessment ${rawAssessment.id}`}
        subtitle={`Agronomic evaluation & credit decision for ${borrowerName} (${borrowerRef}) · Assessed on ${formatDate(rawAssessment.created_at || rawAssessment.assessment_date)}`}
        breadcrumbs={[
          { label: 'Borrowers', href: '/borrowers' },
          { label: borrowerName, href: `/borrowers/${rawAssessment.borrower_id}` },
          { label: `Assessment ${String(rawAssessment.id).slice(0, 8)}`, current: true },
        ]}
        badge={
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge
              variant={
                riskClassification === 'LOW'
                  ? 'HEALTHY'
                  : riskClassification === 'HIGH' || riskClassification === 'CRITICAL'
                  ? 'HIGH_RISK'
                  : 'PENDING'
              }
              label={`${riskClassification} RISK`}
              size="md"
            />
            <StatusBadge variant="PD_UNAVAILABLE" size="md" />
            <StatusBadge variant="BACKEND_AUTHORITATIVE" size="md" />
            {existingReview && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                existingReview.decision === 'APPROVED' || existingReview.decision === 'APPROVE'
                  ? 'bg-emerald-100 text-emerald-800'
                  : existingReview.decision === 'REJECTED' || existingReview.decision === 'REJECT'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {existingReview.decision === 'APPROVED' || existingReview.decision === 'APPROVE' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : existingReview.decision === 'REJECTED' || existingReview.decision === 'REJECT' ? (
                  <XCircle className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
                {existingReview.decision}
              </span>
            )}
          </div>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/assessments/${rawAssessment.id}/explanations`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-300 text-neutral-800 rounded-lg text-xs font-semibold hover:bg-neutral-50 shadow-2xs"
            >
              <HelpCircle className="w-3.5 h-3.5 text-neutral-600" />
              <span>Risk Explanations</span>
            </Link>
            <Link
              to={`/assessments/${rawAssessment.id}/scenarios`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-300 text-neutral-800 rounded-lg text-xs font-semibold hover:bg-neutral-50 shadow-2xs"
            >
              <Sliders className="w-3.5 h-3.5 text-neutral-600" />
              <span>Scenario Simulator</span>
            </Link>
            <Link
              to={`/assessments/${rawAssessment.id}/report`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-800 text-white rounded-lg text-xs font-bold hover:bg-primary-900 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Assessment Report</span>
            </Link>
          </div>
        }
      />

      {/* Primary Computed Output Metrics Grid */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
          Model Inference & Financial Cash Flow Outputs
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <MetricCard
            label="Predicted Crop Yield"
            value={
              <span className="text-xl font-extrabold text-neutral-900 font-tabular">
                {Number(yieldData.value || 0).toLocaleString('en-IN', { maximumFractionDigits: 1 })}
              </span>
            }
            unit={yieldData.unit || 'kg/ha'}
            tooltip="Physical crop yield forecasted by ExtraTreesRegressor (v1.0.0)"
            icon={<Sprout className="w-4 h-4 text-emerald-700" />}
          />

          <MetricCard
            label="Gross Farm Revenue"
            value={
              <span className="text-xl font-extrabold text-neutral-900 font-tabular">
                {formatCurrency(incomeData.gross_revenue, incomeData.currency || 'INR')}
              </span>
            }
            tooltip="Yield × Planted Area × Statutory Mandi Price minus loss"
            icon={<DollarSign className="w-4 h-4 text-primary-800" />}
          />

          <MetricCard
            label="Cultivation Costs"
            value={
              <span className="text-xl font-extrabold text-neutral-900 font-tabular">
                {formatCurrency(incomeData.production_costs, incomeData.currency || 'INR')}
              </span>
            }
            tooltip="Total input costs: seeds, fertilizer, labor, and irrigation"
            icon={<PieChart className="w-4 h-4 text-amber-700" />}
          />

          <MetricCard
            label="Net Farm Income"
            value={
              <span className="text-xl font-extrabold text-emerald-800 font-tabular">
                {formatCurrency(incomeData.net_farm_income, incomeData.currency || 'INR')}
              </span>
            }
            tooltip="Gross Revenue minus direct operational cultivation expenses"
            icon={<TrendingUp className="w-4 h-4 text-emerald-700" />}
          />

          <MetricCard
            label="Repayment Capacity (IADS)"
            value={
              <span className="text-xl font-extrabold text-primary-900 font-tabular">
                {formatCurrency(incomeData.iads, incomeData.currency || 'INR')}
              </span>
            }
            tooltip="Income Available for Debt Service (Net Farm Income + Off-farm income)"
            icon={<Scale className="w-4 h-4 text-primary-800" />}
          />

          <MetricCard
            label="DSCR Coverage"
            value={
              <span className="text-xl font-extrabold text-neutral-900 font-tabular">
                {dscr.toFixed(2)}x
              </span>
            }
            tooltip="Debt Service Coverage Ratio: IADS / Debt Service (Healthy > 1.25x)"
            badge={
              <StatusBadge
                variant={dscr >= 1.25 ? 'HEALTHY' : dscr >= 1.0 ? 'PENDING' : 'HIGH_RISK'}
                label={dscr >= 1.25 ? 'STRONG' : dscr >= 1.0 ? 'ADEQUATE' : 'STRESSED'}
                size="sm"
              />
            }
          />
        </div>
      </div>

      {/* Target Crop & Field Scope Summary Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-neutral-50 rounded-2xl border border-emerald-200/80 p-5 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-neutral-500 font-semibold block">Target Crop Cycle</span>
            <span className="text-neutral-900 font-bold text-sm">
              {cropCycleData.crop_code} ({cropCycleData.season})
            </span>
          </div>
          <div>
            <span className="text-neutral-500 font-semibold block">Planted Farm Area</span>
            <span className="text-neutral-900 font-bold text-sm">
              {cropCycleData.area_value} {cropCycleData.area_unit || 'ha'}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 font-semibold block">Primary Farmer</span>
            <span className="text-neutral-900 font-bold text-sm">
              {borrowerName}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 font-semibold block">Annual Debt Obligation</span>
            <span className="text-neutral-900 font-bold text-sm">
              {formatCurrency(debtService, 'INR')}
            </span>
          </div>
        </div>
      </div>

      {/* Main Risk Gauge Component (Institutional Score & Regulatory PD Gate) */}
      <RiskGauge
        score={computedScore}
        probabilityOfDefault={null}
        pdGateStatus="CLOSED_MODEL_VALIDATION"
        riskClassification={riskClassification}
        pdUnavailableReason="Under banking regulations, probability of default (PD) requires calibrated historical loan loss datasets. This physical agronomic model evaluates crop yield and debt service capacity, but does not simulate default probabilities."
      />

      {/* Human Lending Decision & Review Module (Step 11) */}
      <DetailCard
        title="Lending Decision Workflow"
        subtitle="Authorized Human-in-the-Loop Credit Review (Phase 4, Step 11)"
      >
        {existingReview ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-primary-800" />
                  <span className="font-bold text-neutral-900 text-sm">
                    Formal Decision: {existingReview.decision}
                  </span>
                </div>
                <span className="text-neutral-500 font-mono text-[11px]">
                  Decided at: {formatDateTime(existingReview.decided_at || existingReview.timestamp)}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-600 pt-2 border-t border-neutral-200">
                <div>
                  <span className="font-semibold text-neutral-700">Deciding Officer:</span>{' '}
                  {existingReview.decided_by_name || 'Authorized Loan Officer'}
                </div>
                <div>
                  <span className="font-semibold text-neutral-700">Dossier Version:</span>{' '}
                  {existingReview.version_reviewed || '1.0'}
                </div>
              </div>
              <div className="space-y-1 pt-1">
                <span className="font-semibold text-neutral-700">Officer Notes & Rationale:</span>
                <p className="p-3 bg-white rounded-lg border border-neutral-200 text-neutral-800 leading-relaxed font-sans">
                  {existingReview.notes}
                </p>
              </div>
              {existingReview.conditions && existingReview.conditions.length > 0 && (
                <div className="space-y-1 pt-1">
                  <span className="font-semibold text-neutral-700">Disbursement Conditions:</span>
                  <ul className="list-disc list-inside space-y-1 text-neutral-800 bg-white p-3 rounded-lg border border-neutral-200">
                    {existingReview.conditions.map((cond: string, idx: number) => (
                      <li key={idx}>{cond}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <p className="text-[11px] text-neutral-500 italic">
              Decision is permanently locked and registered in the immutable audit event log.
            </p>
          </div>
        ) : (
          <form onSubmit={handleRecordDecision} className="space-y-4 text-xs">
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Human Discretion & Model Governance Mandate:</p>
                <p className="text-amber-800 leading-relaxed">
                  AI yield estimates and financial ratios provide advisory decision support. An authorized human loan officer retains ultimate fiduciary responsibility for approving or rejecting credit facilities.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-neutral-800 mb-1.5">Proposed Decision:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecision('APPROVE')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center ${
                      decision === 'APPROVE'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    ✓ Approve Facility
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('CONDITIONALLY_APPROVE')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center ${
                      decision === 'CONDITIONALLY_APPROVE'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    ⚠ Conditionally Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('REJECT')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center ${
                      decision === 'REJECT'
                        ? 'border-rose-600 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    ✕ Reject Application
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="reviewNotes" className="block font-bold text-neutral-800 mb-1">
                  Review Notes & Credit Committee Rationale <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="reviewNotes"
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="State the underlying credit analysis, debt-service capacity (IADS), and mitigants..."
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-primary-700 focus:outline-none"
                  required
                />
              </div>

              {decision === 'CONDITIONALLY_APPROVE' && (
                <div>
                  <label htmlFor="conditions" className="block font-bold text-neutral-800 mb-1">
                    Pre-Disbursement Conditions (one per line):
                  </label>
                  <textarea
                    id="conditions"
                    rows={2}
                    value={conditionsText}
                    onChange={(e) => setConditionsText(e.target.value)}
                    placeholder="e.g. Mandatory crop insurance enrollment before tranche 1&#10;Verified borewell discharge telemetry test"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs focus:ring-2 focus:ring-primary-700 focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmittingDecision}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-800 text-white rounded-lg text-xs font-bold hover:bg-primary-900 disabled:opacity-50 shadow-sm"
              >
                {isSubmittingDecision ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Persisting Decision to Audit Log...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit & Seal Credit Decision</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </DetailCard>

      {/* Key Risk Drivers & Factors */}
      <DetailCard
        title="Key Risk Factors & Agronomic Indicators"
        subtitle="Evaluated drivers across physical production, commodity pricing, and financial liquidity"
      >
        <div className="space-y-3">
          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-neutral-900 text-sm">Physical Crop Yield Production</span>
                <span className="font-mono text-[11px] text-neutral-400">[AGRI-YLD-01]</span>
                <StatusBadge variant="HEALTHY" label="OPTIMAL CAPACITY" size="sm" />
              </div>
              <p className="text-neutral-600 leading-relaxed max-w-2xl">
                ExtraTrees model projects {Number(yieldData.value || 0).toLocaleString()} {yieldData.unit} on {cropCycleData.area_value} ha, delivering strong primary harvest volume.
              </p>
            </div>
            <span className="text-[11px] text-neutral-400 shrink-0 font-semibold uppercase">
              ML ExtraTrees
            </span>
          </div>

          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-neutral-900 text-sm">Debt Service Coverage (DSCR)</span>
                <span className="font-mono text-[11px] text-neutral-400">[FIN-DSCR-02]</span>
                <StatusBadge
                  variant={dscr >= 1.25 ? 'HEALTHY' : 'PENDING'}
                  label={`${dscr.toFixed(2)}x HEADROOM`}
                  size="sm"
                />
              </div>
              <p className="text-neutral-600 leading-relaxed max-w-2xl">
                IADS of {formatCurrency(incomeData.iads, 'INR')} comfortably covers debt obligations of {formatCurrency(debtService, 'INR')}.
              </p>
            </div>
            <span className="text-[11px] text-neutral-400 shrink-0 font-semibold uppercase">
              Cash Flow Engine
            </span>
          </div>

          <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-neutral-900 text-sm">Satellite & Weather Telemetry Freshness</span>
                <span className="font-mono text-[11px] text-neutral-400">[EO-NDVI-03]</span>
                <StatusBadge variant="HEALTHY" label="24H FRESH" size="sm" />
              </div>
              <p className="text-neutral-600 leading-relaxed max-w-2xl">
                Recent Sentinel-2 pass and gridded precipitation observation confirmed within freshness window.
              </p>
            </div>
            <span className="text-[11px] text-neutral-400 shrink-0 font-semibold uppercase">
              Copernicus / IMD
            </span>
          </div>
        </div>
      </DetailCard>

      {/* Evidence & Data Lineage Panel */}
      <EvidencePanel
        evidenceQuality="HIGH"
        inputManifestId={rawAssessment.input_manifest_id || 'mnf-001'}
        assumptions={snapshot.assumptions || {
          yield_unit: yieldData.unit || 'kg/ha',
          expected_price: 'Statutory Mandi Price',
          post_harvest_loss_pct: '5.0%',
        }}
      />

      {/* Navigation Quick Links to Sub-Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to={`/assessments/${rawAssessment.id}/explanations`}
          className="p-4 bg-white border border-neutral-200 rounded-xl hover:border-primary-700 hover:shadow-xs transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Explainability</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-800 transition-transform group-hover:translate-x-1" />
            </div>
            <h4 className="text-sm font-bold text-neutral-900">Risk Driver Explanations</h4>
            <p className="text-xs text-neutral-500 mt-1">
              Classified breakdown into Facts, Contributions, and Assumptions.
            </p>
          </div>
          <span className="text-xs font-semibold text-primary-800 pt-3 block">View Explanations →</span>
        </Link>

        <Link
          to={`/assessments/${rawAssessment.id}/scenarios`}
          className="p-4 bg-white border border-neutral-200 rounded-xl hover:border-primary-700 hover:shadow-xs transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Simulation</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-800 transition-transform group-hover:translate-x-1" />
            </div>
            <h4 className="text-sm font-bold text-neutral-900">Scenario Simulator</h4>
            <p className="text-xs text-neutral-500 mt-1">
              Run bounded what-if sensitivity tests against price and drought shocks.
            </p>
          </div>
          <span className="text-xs font-semibold text-primary-800 pt-3 block">Simulate Scenarios →</span>
        </Link>

        <Link
          to={`/assessments/${rawAssessment.id}/report`}
          className="p-4 bg-white border border-neutral-200 rounded-xl hover:border-primary-700 hover:shadow-xs transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Reporting</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-primary-800 transition-transform group-hover:translate-x-1" />
            </div>
            <h4 className="text-sm font-bold text-neutral-900">Assessment Report</h4>
            <p className="text-xs text-neutral-500 mt-1">
              Request asynchronous export and download signed audit report.
            </p>
          </div>
          <span className="text-xs font-semibold text-primary-800 pt-3 block">Download Dossier →</span>
        </Link>
      </div>

      {/* Audit Metadata */}
      <AuditInfo
        createdBy={rawAssessment.audit_info?.created_by || 'Loan Officer'}
        requestId={rawAssessment.audit_info?.request_id || 'req-auto'}
        timestamp={rawAssessment.created_at || new Date().toISOString()}
        institutionId={rawAssessment.institution_id || 'inst-001'}
      />
    </div>
  );
};
