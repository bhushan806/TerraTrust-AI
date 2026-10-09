import React from 'react';
import { formatDateTime } from '@/lib/formatters/date';
import { ShieldCheck } from 'lucide-react';

interface AuditInfoProps {
  createdBy?: string;
  requestId?: string;
  timestamp?: string;
  institutionId?: string;
  className?: string;
}

export const AuditInfo: React.FC<AuditInfoProps> = ({
  createdBy,
  requestId,
  timestamp,
  institutionId,
  className = '',
}) => {
  return (
    <div className={`text-[11px] text-neutral-500 bg-neutral-50 border border-neutral-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-1.5 font-semibold text-neutral-700 mb-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-neutral-600" />
        <span>Institutional Audit Metadata</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 font-mono">
        {createdBy && (
          <div>
            <span className="text-neutral-400 block font-sans">Author:</span>
            <span className="text-neutral-800 font-semibold">{createdBy}</span>
          </div>
        )}
        {requestId && (
          <div>
            <span className="text-neutral-400 block font-sans">Request ID:</span>
            <span className="text-neutral-800">{requestId}</span>
          </div>
        )}
        {timestamp && (
          <div>
            <span className="text-neutral-400 block font-sans">Timestamp:</span>
            <span className="text-neutral-800">{formatDateTime(timestamp)}</span>
          </div>
        )}
        {institutionId && (
          <div>
            <span className="text-neutral-400 block font-sans">Tenant Scope:</span>
            <span className="text-neutral-800">{institutionId}</span>
          </div>
        )}
      </div>
    </div>
  );
};
