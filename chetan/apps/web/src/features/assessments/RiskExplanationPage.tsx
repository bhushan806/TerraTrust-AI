import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  HelpCircle,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  FileText,
  Filter,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DetailCard } from '@/components/data-display/DetailCard';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { typedGet } from '@/lib/api-client/client';
import { queryKeys } from '@/lib/query-client/query-keys';
import { RiskExplanationReport, RiskExplanationCategory } from '@/types/domain';

export const RiskExplanationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | RiskExplanationCategory>('ALL');

  const explanationsQuery = useQuery({
    queryKey: queryKeys.assessmentExplanation(id || 'asm-701'),
    queryFn: () =>
      typedGet<{ explanations: RiskExplanationReport }>(`/assessments/${id || 'asm-701'}/explanations`),
  });

  if (explanationsQuery.isLoading) {
    return <LoadingState message="Extracting SHAP feature attributions and factor categories..." />;
  }

  if (explanationsQuery.isError || !explanationsQuery.data) {
    return (
      <ErrorState
        error={explanationsQuery.error}
        title="Explanations Unavailable"
        onRetry={() => explanationsQuery.refetch()}
      />
    );
  }

  const report = explanationsQuery.data.explanations;
  const items = categoryFilter === 'ALL'
    ? report.items
    : report.items.filter((item) => item.category === categoryFilter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Explainable Credit Risk Drivers"
        subtitle={`Audit breakdown for Assessment ${id || 'asm-701'} · Classified strictly into Facts, Contributions, and Assumptions.`}
        breadcrumbs={[
          { label: 'Borrowers', href: '/borrowers' },
          { label: `Assessment ${id || 'asm-701'}`, href: `/assessments/${id || 'asm-701'}` },
          { label: 'Risk Explanations', current: true },
        ]}
        badge={<StatusBadge variant="MODEL_OUTPUT" label="EXPLAINABILITY" size="md" />}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/assessments/${id || 'asm-701'}/report`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-900 text-white rounded-xl text-xs font-bold hover:bg-primary-950 shadow-2xs transition-colors"
            >
              <span>Next: Assessment Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to={`/assessments/${id || 'asm-701'}/scenarios`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 shadow-2xs"
            >
              <span>Scenario Simulator</span>
            </Link>
            <Link
              to={`/assessments/${id || 'asm-701'}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Assessment</span>
            </Link>
          </div>
        }
      />

      {/* Mandatory Governance Definition Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-5 bg-blue-50/70 border border-blue-200/90 rounded-2xl space-y-1.5 shadow-2xs">
          <span className="font-extrabold text-blue-900 block text-xs uppercase tracking-wider font-display">
            Fact Classification
          </span>
          <p className="text-blue-800 leading-relaxed text-xs">
            Observed telemetry or verified historical information (e.g. verified canal releases, credit bureau records).
          </p>
        </div>

        <div className="p-5 bg-emerald-50/70 border border-emerald-200/90 rounded-2xl space-y-1.5 shadow-2xs">
          <span className="font-extrabold text-emerald-900 block text-xs uppercase tracking-wider font-display">
            Contribution Classification
          </span>
          <p className="text-emerald-800 leading-relaxed text-xs">
            How this specific factor influenced the assessment score and risk band according to the backend model.
          </p>
        </div>

        <div className="p-5 bg-amber-50/70 border border-amber-200/90 rounded-2xl space-y-1.5 shadow-2xs">
          <span className="font-extrabold text-amber-900 block text-xs uppercase tracking-wider font-display">
            Assumption Classification
          </span>
          <p className="text-amber-800 leading-relaxed text-xs">
            A value, formula parameter, or interpretation used by the model or human loan officer.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5">
          {(['ALL', 'FACT', 'CONTRIBUTION', 'ASSUMPTION'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Drivers' : `${cat}s Only`}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 font-mono">
          Model: {report.model_version}
        </span>
      </div>

      {/* Classified Driver Cards */}
      <div className="space-y-4">
        {items.map((item) => {
          const getCategoryStyles = () => {
            switch (item.category) {
              case 'FACT':
                return { badgeBg: 'bg-blue-100 text-blue-900 border-blue-300', label: 'FACT' };
              case 'CONTRIBUTION':
                return { badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300', label: 'CONTRIBUTION' };
              case 'ASSUMPTION':
                return { badgeBg: 'bg-amber-100 text-amber-900 border-amber-300', label: 'ASSUMPTION' };
            }
          };

          const styles = getCategoryStyles();

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-card space-y-3 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-card-hover"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${styles.badgeBg}`}
                  >
                    {styles.label}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 font-display">{item.label}</h3>
                  <span className="font-mono text-xs text-slate-400">[{item.code}]</span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      item.direction === 'POSITIVE'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : item.direction === 'NEGATIVE'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {item.direction === 'POSITIVE' && <TrendingUp className="w-3.5 h-3.5" />}
                    {item.direction === 'NEGATIVE' && <TrendingDown className="w-3.5 h-3.5" />}
                    <span className="font-tabular font-bold">
                      {item.impact_score > 0 ? `+${item.impact_score}` : item.impact_score} pts
                    </span>
                  </span>
                  <StatusBadge
                    variant={item.confidence === 'HIGH' ? 'HEALTHY' : 'PENDING'}
                    label={`${item.confidence} CONFIDENCE`}
                    size="sm"
                  />
                </div>
              </div>

              {/* Narrative */}
              <div className="space-y-2 text-xs text-slate-700">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                    Observed Metric / Value:
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm font-display">{item.value}</span>
                </div>

                <p className="text-slate-800 leading-relaxed text-xs pt-1">{item.narrative}</p>

                {item.caveat && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-1.5 mt-2">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span><span className="font-bold">Caveat / Constraint:</span> {item.caveat}</span>
                  </div>
                )}
              </div>

              {/* Provenance & Time Window Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-tabular">
                <div>
                  <span className="text-slate-400">Evidence Source: </span>
                  <span className="text-slate-800 font-semibold">{item.evidence_source}</span>
                </div>
                <div>
                  <span className="text-slate-400">Observation Window: </span>
                  <span className="text-slate-800 font-semibold">{item.observation_period}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Disclosed Missing Information */}
      {report.missing_information.length > 0 && (
        <DetailCard title="Missing Evidence Disclosures">
          <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
            {report.missing_information.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </DetailCard>
      )}
    </div>
  );
};
