import React from 'react';
import { AssessmentSnapshot } from '@/types/domain';
import { formatDate } from '@/lib/formatters/date';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { formatCurrency } from '@/lib/formatters/currency';
import { PlusCircle, MinusCircle, RefreshCw, GitCommit } from 'lucide-react';

interface TimelineProps {
  snapshots: AssessmentSnapshot[];
  onCompare?: (snapA: AssessmentSnapshot, snapB: AssessmentSnapshot) => void;
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({
  snapshots,
  className = '',
}) => {
  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-neutral-500 bg-white rounded-xl border border-neutral-200">
        No historical assessment snapshots recorded for this borrower.
      </div>
    );
  }

  return (
    <div className={`relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-200 ${className}`}>
      {snapshots.map((snap, idx) => {
        const isLatest = idx === 0;

        return (
          <div key={snap.assessment_id} className="relative group">
            {/* Dot marker */}
            <div
              className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full border-2 bg-white flex items-center justify-center ${
                isLatest ? 'border-primary-800 text-primary-800' : 'border-neutral-300 text-neutral-400'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
            </div>

            {/* Snapshot Card */}
            <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-sm font-bold text-neutral-900">
                    Snapshot {snap.assessment_id}
                  </span>
                  <StatusBadge
                    variant={snap.risk_classification === 'LOW' ? 'HEALTHY' : snap.risk_classification === 'HIGH' ? 'HIGH_RISK' : 'PENDING'}
                    label={`${snap.risk_classification} RISK`}
                    size="sm"
                  />
                  {snap.is_reconstructed && (
                    <StatusBadge variant="ILLUSTRATIVE" label="RECONSTRUCTED" size="sm" />
                  )}
                  {isLatest && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Current Active Baseline
                    </span>
                  )}
                </div>
                <div className="text-xs text-neutral-500 font-tabular">
                  Assessed {formatDate(snap.date)}
                </div>
              </div>

              {/* Financial Metrics Snapshot */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-neutral-50/70 p-3 rounded-lg border border-neutral-200">
                <div>
                  <span className="text-neutral-500 block text-[11px]">Score</span>
                  <span className="font-bold text-neutral-900 font-tabular">{snap.score ?? '—'} / 100</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[11px]">Prob. of Default (PD)</span>
                  <span className="font-bold text-neutral-900 font-tabular">
                    {snap.probability_of_default !== null ? `${(snap.probability_of_default * 100).toFixed(1)}%` : 'PD UNAVAILABLE'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[11px]">Net Farm Income</span>
                  <span className="font-bold text-neutral-900 font-tabular">{formatCurrency(snap.net_farm_income)}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[11px]">IADS Capacity</span>
                  <span className="font-bold text-neutral-900 font-tabular">{formatCurrency(snap.iads)}</span>
                </div>
              </div>

              {/* Diff changes from previous snapshot */}
              {snap.changes_from_previous && (
                <div className="space-y-2 pt-1 border-t border-neutral-100 text-xs">
                  <span className="font-semibold text-neutral-700 block uppercase tracking-wider text-[11px]">
                    Delta vs Previous Assessment Cycle
                  </span>

                  {snap.changes_from_previous.added_factors.length > 0 && (
                    <div className="flex items-start gap-1.5 text-emerald-800 bg-emerald-50/60 p-2 rounded">
                      <PlusCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-[11px]">Added Drivers: </span>
                        <span>{snap.changes_from_previous.added_factors.join(', ')}</span>
                      </div>
                    </div>
                  )}

                  {snap.changes_from_previous.removed_factors.length > 0 && (
                    <div className="flex items-start gap-1.5 text-neutral-700 bg-neutral-100 p-2 rounded">
                      <MinusCircle className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-[11px]">Resolved / Removed: </span>
                        <span>{snap.changes_from_previous.removed_factors.join(', ')}</span>
                      </div>
                    </div>
                  )}

                  {snap.changes_from_previous.changed_factors.map((cf, cIdx) => (
                    <div key={cIdx} className="flex items-center gap-1.5 text-blue-900 bg-blue-50/50 p-2 rounded">
                      <RefreshCw className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-semibold">{cf.factor}:</span>
                      <span className="line-through text-neutral-400">{cf.from}</span>
                      <span>→</span>
                      <span className="font-bold text-blue-800">{cf.to}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Model version & data timestamp metadata */}
              <div className="flex flex-wrap items-center justify-between text-[11px] text-neutral-500 pt-1">
                <span>Model Engine: {snap.model_version}</span>
                <span>Data snapshot frozen at: {formatDate(snap.data_timestamp)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
