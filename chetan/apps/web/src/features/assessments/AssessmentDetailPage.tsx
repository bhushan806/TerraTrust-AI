import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
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
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DetailCard } from '@/components/data-display/DetailCard';
import { RiskGauge } from '@/components/charts/RiskGauge';
import { EvidencePanel } from '@/components/data-display/EvidencePanel';
import { AuditInfo } from '@/components/data-display/AuditInfo';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { formatDate, formatDateTime } from '@/lib/formatters/date';
import { typedGet } from '@/lib/api-client/client';
import { queryKeys } from '@/lib/query-client/query-keys';
import { CreditAssessment } from '@/types/domain';

export const AssessmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const assessmentQuery = useQuery({
    queryKey: queryKeys.assessment(id || 'asm-701'),
    queryFn: () =>
      typedGet<{ assessment: CreditAssessment }>(`/assessments/${id || 'asm-701'}`),
  });

  if (assessmentQuery.isLoading) {
    return <LoadingState message="Loading immutable credit assessment dossier & model gates..." />;
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

  const assessment = assessmentQuery.data.assessment;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Assessment ${assessment.id}`}
        subtitle={`Evaluation for ${assessment.borrower_name} · Assessed on ${formatDate(assessment.assessment_date)}`}
        breadcrumbs={[
          { label: 'Borrowers', href: '/borrowers' },
          { label: assessment.borrower_name, href: `/borrowers/${assessment.borrower_id}` },
          { label: `Assessment ${assessment.id}`, current: true },
        ]}
        badge={
          <div className="flex items-center gap-2">
            <StatusBadge
              variant={
                assessment.risk_classification === 'LOW'
                  ? 'HEALTHY'
                  : assessment.risk_classification === 'HIGH' || assessment.risk_classification === 'CRITICAL'
                  ? 'HIGH_RISK'
                  : 'PENDING'
              }
              label={`${assessment.risk_classification} RISK`}
              size="md"
            />
            {assessment.pd_gate_status !== 'OPEN' && (
              <StatusBadge variant="PD_UNAVAILABLE" size="md" />
            )}
            <StatusBadge variant="BACKEND_AUTHORITATIVE" size="md" />
          </div>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/assessments/${assessment.id}/explanations`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-300 text-neutral-800 rounded-lg text-xs font-semibold hover:bg-neutral-50 shadow-2xs"
            >
              <HelpCircle className="w-3.5 h-3.5 text-neutral-600" />
              <span>Risk Explanations</span>
            </Link>
            <Link
              to={`/assessments/${assessment.id}/scenarios`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-300 text-neutral-800 rounded-lg text-xs font-semibold hover:bg-neutral-50 shadow-2xs"
            >
              <Sliders className="w-3.5 h-3.5 text-neutral-600" />
              <span>Scenario Simulator</span>
            </Link>
            <Link
              to={`/assessments/${assessment.id}/report`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-800 text-white rounded-lg text-xs font-bold hover:bg-primary-900 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Assessment Report</span>
            </Link>
          </div>
        }
      />

      {/* Main Risk Gauge Component (Handles PD Open vs Strictly PD UNAVAILABLE) */}
      <RiskGauge
        score={assessment.score}
        probabilityOfDefault={assessment.probability_of_default}
        pdGateStatus={assessment.pd_gate_status}
        riskClassification={assessment.risk_classification}
        pdUnavailableReason={assessment.pd_unavailable_reason}
      />

      {/* Key Risk Drivers & Factors */}
      <DetailCard
        title={`Key Risk Factors & Drivers (${assessment.risk_factors.length})`}
        subtitle="Ranked agronomic, financial, and repayment indicators"
      >
        <div className="space-y-3">
          {assessment.risk_factors.map((rf) => (
            <div
              key={rf.code}
              className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-neutral-900 text-sm">{rf.name}</span>
                  <span className="font-mono text-[11px] text-neutral-400">[{rf.code}]</span>
                  <StatusBadge
                    variant={rf.severity === 'LOW' ? 'HEALTHY' : rf.severity === 'HIGH' ? 'HIGH_RISK' : 'PENDING'}
                    label={`${rf.severity} SEVERITY`}
                    size="sm"
                  />
                </div>
                <p className="text-neutral-600 leading-relaxed max-w-2xl">{rf.description}</p>
              </div>

              <span className="text-[11px] text-neutral-400 shrink-0 font-semibold uppercase">
                Verified Factor
              </span>
            </div>
          ))}
        </div>
      </DetailCard>

      {/* Evidence & Data Lineage Panel */}
      <EvidencePanel
        evidenceQuality={assessment.evidence_quality}
        inputManifestId={assessment.input_manifest_id}
        assumptions={assessment.assumptions}
      />

      {/* Navigation Quick Links to Sub-Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to={`/assessments/${assessment.id}/explanations`}
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
          to={`/assessments/${assessment.id}/scenarios`}
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
          to={`/assessments/${assessment.id}/report`}
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
        createdBy={assessment.audit_info.created_by}
        requestId={assessment.audit_info.request_id}
        timestamp={assessment.assessment_date}
        institutionId={assessment.audit_info.institution_id}
      />
    </div>
  );
};
