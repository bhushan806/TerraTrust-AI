import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/PageHeader';
import { Timeline } from '@/components/data-display/Timeline';
import { DetailCard } from '@/components/data-display/DetailCard';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { typedGet } from '@/lib/api-client/client';
import { queryKeys } from '@/lib/query-client/query-keys';
import { AssessmentSnapshot } from '@/types/domain';

export const RiskTimelinePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const timelineQuery = useQuery({
    queryKey: queryKeys.borrowerAssessmentHistory(id || 'bor-1001'),
    queryFn: () =>
      typedGet<{ borrower_id: string; snapshots: AssessmentSnapshot[] }>(
        `/borrowers/${id || 'bor-1001'}/assessment-history`
      ),
  });

  if (timelineQuery.isLoading) {
    return <LoadingState message="Retrieving immutable assessment ledger..." />;
  }

  if (timelineQuery.isError || !timelineQuery.data) {
    return (
      <ErrorState
        error={timelineQuery.error}
        title="Unable to Load Timeline"
        onRetry={() => timelineQuery.refetch()}
      />
    );
  }

  const snapshots = timelineQuery.data.snapshots;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Credit Risk Assessment Timeline"
        subtitle={`Immutable chronological ledger of risk decisions, model versions, and factor transitions.`}
        breadcrumbs={[
          { label: 'Borrowers', href: '/borrowers' },
          { label: `Borrower ${id}`, href: `/borrowers/${id}` },
          { label: 'Risk Timeline', current: true },
        ]}
        actions={
          <Link
            to={`/borrowers/${id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Profile</span>
          </Link>
        }
      />

      {/* Immutability & Reconstructed Disclaimer */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Ledger Integrity Principle:</p>
          <p className="leading-relaxed text-amber-800">
            Historical snapshots are cryptographically sealed upon assessment completion and cannot be mutated or overridden retroactively. Reconstructed historical records are clearly demarcated with an illustrative badge.
          </p>
        </div>
      </div>

      {/* Vertical Timeline */}
      <DetailCard
        title="Assessment Evolution & Snapshot Diff"
        subtitle="Chronological sequence from latest active baseline to historical origin"
      >
        <Timeline snapshots={snapshots} />
      </DetailCard>
    </div>
  );
};
