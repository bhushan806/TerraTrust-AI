import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet,
  Building2,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  DollarSign,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DetailCard } from '@/components/data-display/DetailCard';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { AuditInfo } from '@/components/data-display/AuditInfo';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { formatCurrency } from '@/lib/formatters/currency';
import { formatDate, formatDateTime } from '@/lib/formatters/date';
import { typedGet } from '@/lib/api-client/client';
import { queryKeys } from '@/lib/query-client/query-keys';
import { LoanApplication } from '@/types/domain';

export const LoanApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const loanQuery = useQuery({
    queryKey: queryKeys.loanApplication(id || 'la-501'),
    queryFn: () =>
      typedGet<{ loan_application: LoanApplication }>(`/loan-applications/${id || 'la-501'}`),
  });

  if (loanQuery.isLoading) {
    return <LoadingState message="Loading loan facility dossier & underwriting terms..." />;
  }

  if (loanQuery.isError || !loanQuery.data) {
    return (
      <ErrorState
        error={loanQuery.error}
        title="Application Dossier Not Found"
        onRetry={() => loanQuery.refetch()}
      />
    );
  }

  const app = loanQuery.data.loan_application;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Application ${app.id}`}
        subtitle={`Kisan Credit Facility for ${app.borrower_name} · ${app.farm_name} (${app.crop_name})`}
        breadcrumbs={[
          { label: 'Borrowers', href: '/borrowers' },
          { label: app.borrower_name, href: `/borrowers/${app.borrower_id}` },
          { label: `Loan ${app.id}`, current: true },
        ]}
        badge={
          <StatusBadge
            variant={app.status === 'APPROVED' ? 'HEALTHY' : 'PENDING'}
            label={app.status}
            size="md"
          />
        }
        actions={
          <div className="flex items-center gap-2">
            {app.linked_assessment_id ? (
              <Link
                to={`/assessments/${app.linked_assessment_id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-800 text-white rounded-lg text-xs font-semibold hover:bg-primary-900 shadow-2xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>View Linked Assessment ({app.linked_assessment_id})</span>
              </Link>
            ) : (
              <Link
                to="/assessments/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-800 text-white rounded-lg text-xs font-semibold hover:bg-primary-900 shadow-2xs"
              >
                <span>Trigger New Assessment</span>
              </Link>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DetailCard title="Credit Terms & Schedule" className="md:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-neutral-500 block text-[11px]">Requested Principal</span>
              <span className="text-2xl font-extrabold text-neutral-900 font-tabular">
                {formatCurrency(app.requested_amount, app.currency)}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[11px]">Subsidized KCC Interest Rate</span>
              <span className="text-2xl font-bold text-emerald-800 font-tabular">
                {app.interest_rate_pct}% p.a.
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[11px]">Tenor Duration</span>
              <span className="font-semibold text-neutral-800 text-sm font-tabular">
                {app.tenor_months} months
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[11px]">Repayment Structure</span>
              <span className="font-semibold text-neutral-800 text-sm">
                {app.repayment_frequency}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[11px]">Borrower Entity</span>
              <Link to={`/borrowers/${app.borrower_id}`} className="font-bold text-primary-800 hover:underline">
                {app.borrower_name}
              </Link>
            </div>
            <div>
              <span className="text-neutral-500 block text-[11px]">Associated Land Parcel</span>
              <Link to={`/farms/${app.farm_id}`} className="font-bold text-primary-800 hover:underline">
                {app.farm_name}
              </Link>
            </div>
          </div>
        </DetailCard>

        <DetailCard title="Underwriting Status">
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-neutral-500 block text-[11px]">Submitted Timestamp</span>
              <span className="font-medium text-neutral-800">{formatDateTime(app.submitted_at)}</span>
            </div>
            <div>
              <span className="text-neutral-500 block text-[11px]">Linked Assessment ID</span>
              {app.linked_assessment_id ? (
                <Link to={`/assessments/${app.linked_assessment_id}`} className="font-mono text-primary-800 font-bold hover:underline">
                  {app.linked_assessment_id}
                </Link>
              ) : (
                <span className="text-neutral-400 italic">No assessment linked</span>
              )}
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <span className="text-[11px] font-bold text-neutral-700 block mb-1">
                Risk Acknowledgment Status:
              </span>
              <span className="text-neutral-600">
                All pre-submission data freshness and partial evidence caveats were formally recorded by loan officer.
              </span>
            </div>
          </div>
        </DetailCard>
      </div>

      <AuditInfo
        createdBy={app.audit_info.created_by}
        requestId={app.audit_info.request_id}
        timestamp={app.updated_at}
        institutionId="inst-9901"
      />
    </div>
  );
};
