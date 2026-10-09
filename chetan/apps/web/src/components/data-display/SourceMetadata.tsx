import React from 'react';
import { formatDateTime } from '@/lib/formatters/date';
import { FreshnessIndicator } from './FreshnessIndicator';

interface SourceMetadataProps {
  sourceName: string;
  sourceId?: string;
  observedAt?: string;
  retrievedAt?: string;
  sourceTimezone?: string;
  license?: string;
  thresholdHours?: number;
  className?: string;
}

export const SourceMetadata: React.FC<SourceMetadataProps> = ({
  sourceName,
  sourceId,
  observedAt,
  retrievedAt,
  sourceTimezone = 'IST (UTC+05:30)',
  license,
  thresholdHours = 24,
  className = '',
}) => {
  return (
    <div className={`text-xs bg-neutral-50/70 border border-neutral-200 rounded-lg p-3 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-neutral-200">
        <div>
          <span className="font-semibold text-neutral-900">{sourceName}</span>
          {sourceId && <span className="text-neutral-500 font-mono ml-1.5">[{sourceId}]</span>}
        </div>
        <FreshnessIndicator timestamp={observedAt || retrievedAt} thresholdHours={thresholdHours} sourceName={sourceName} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-neutral-600 font-tabular">
        <div>
          <span className="text-neutral-500 block">Observation Time:</span>
          <span className="font-medium text-neutral-800">{formatDateTime(observedAt)}</span>
        </div>
        <div>
          <span className="text-neutral-500 block">Source Timezone:</span>
          <span className="font-medium text-neutral-800">{sourceTimezone}</span>
        </div>
        {license && (
          <div>
            <span className="text-neutral-500 block">Data License / Agreement:</span>
            <span className="font-medium text-neutral-800 truncate block" title={license}>{license}</span>
          </div>
        )}
      </div>
    </div>
  );
};
