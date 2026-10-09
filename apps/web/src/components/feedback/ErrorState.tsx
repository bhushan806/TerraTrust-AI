import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { NormalizedApiError } from '@/lib/api-client/client';

interface ErrorStateProps {
  error?: NormalizedApiError | Error | null;
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  title = 'Unable to Load Information',
  message,
  onRetry,
  className = '',
}) => {
  const normError = error && 'message' in error ? (error as NormalizedApiError) : undefined;
  const displayMessage =
    message ||
    normError?.message ||
    (error instanceof Error ? error.message : 'The requested agricultural record could not be retrieved.');
  const requestId = normError?.requestId;

  return (
    <div className="w-full flex items-center justify-center py-8 px-4">
      <div
        role="alert"
        className={`w-full max-w-md bg-white border border-rose-200/80 rounded-2xl p-6 sm:p-7 shadow-xs text-center flex flex-col items-center justify-center ${className}`}
      >
        {/* Soft, Muted Icon Circle */}
        <div className="w-11 h-11 rounded-full bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center mb-3.5 shadow-2xs">
          <AlertTriangle className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
        </div>

        {/* Title & Explanatory Text */}
        <h3 className="text-base font-bold text-slate-900 mb-1.5 font-display">{title}</h3>
        <p className="text-xs text-slate-500 max-w-sm mb-4 leading-relaxed font-normal">
          {displayMessage}
        </p>

        {/* Small, Muted Correlation Reference */}
        {requestId && (
          <div className="mb-4 text-[10px] text-slate-400 font-mono tracking-tight">
            Correlation ID: <span className="text-slate-600 font-medium">{requestId}</span>
          </div>
        )}

        {/* Clean, Outlined Retry Button */}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 rounded-xl text-xs font-semibold shadow-2xs hover:shadow-xs transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span>Retry Request</span>
          </button>
        )}
      </div>
    </div>
  );
};
