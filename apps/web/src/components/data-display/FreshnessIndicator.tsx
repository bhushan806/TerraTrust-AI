import React from 'react';
import { evaluateFreshness } from '@/lib/formatters/freshness';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { formatRelativeTime, formatDateTime } from '@/lib/formatters/date';

interface FreshnessIndicatorProps {
  timestamp: string | null | undefined;
  thresholdHours?: number;
  sourceName?: string;
  showExplanation?: boolean;
  className?: string;
}

export const FreshnessIndicator: React.FC<FreshnessIndicatorProps> = ({
  timestamp,
  thresholdHours = 24,
  sourceName = 'Data provider',
  showExplanation = false,
  className = '',
}) => {
  const freshness = evaluateFreshness(timestamp, thresholdHours, sourceName);

  return (
    <div className={`flex flex-col gap-1 text-xs ${className}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge
          variant={freshness.badgeVariant}
          label={freshness.label.toUpperCase()}
          size="sm"
          tooltip={freshness.explanation}
        />
        <span className="text-neutral-500 font-tabular">
          {timestamp ? `Updated ${formatRelativeTime(timestamp)}` : 'No timestamp'}
        </span>
      </div>

      {showExplanation && (
        <div className="text-neutral-600 bg-neutral-50 border border-neutral-200 rounded p-2 text-xs mt-1">
          <p className="font-medium text-neutral-800 mb-0.5">{freshness.explanation}</p>
          <div className="flex justify-between text-[11px] text-neutral-500 font-mono mt-1 pt-1 border-t border-neutral-200">
            <span>Threshold: {thresholdHours}h SLA</span>
            <span>Recorded: {formatDateTime(timestamp)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
