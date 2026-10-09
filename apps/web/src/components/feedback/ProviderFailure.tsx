import React from 'react';
import { WifiOff, RotateCcw } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface ProviderFailureProps {
  providerName: string;
  affectedIntelligence?: string;
  onRetry?: () => void;
  className?: string;
  fallbackAvailable?: boolean;
}

export const ProviderFailure: React.FC<ProviderFailureProps> = ({
  providerName,
  affectedIntelligence = 'observations',
  onRetry,
  className = '',
  fallbackAvailable = true,
}) => {
  return (
    <div
      role="alert"
      className={`rounded-xl border border-rose-200 bg-[#FFF5F5] p-6 text-left ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
          <WifiOff className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h3 className="text-base font-semibold text-neutral-900">
              External Provider Telemetry Degraded
            </h3>
            <StatusBadge variant="PROVIDER_UNAVAILABLE" size="sm" />
          </div>
          <p className="text-sm text-neutral-700 mb-3 leading-relaxed">
            We could not retrieve live {affectedIntelligence} because the upstream data provider (
            <span className="font-semibold text-neutral-900">{providerName}</span>) is currently unreachable or experiencing an outage.
            {fallbackAvailable &&
              ' Your borrower profile, historical assessment records, and financial formulas remain fully available.'}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-300 rounded-md text-xs font-semibold text-neutral-800 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <RotateCcw className="w-3.5 h-3.5 text-neutral-600" />
                Retry Provider Endpoint
              </button>
            )}
            <span className="text-xs text-neutral-500">
              Contract fallback: cached observations preserved
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
