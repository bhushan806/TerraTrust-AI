import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
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
    (error instanceof Error ? error.message : 'Something went wrong on our side. Please try again.');
  const requestId = normError?.requestId;

  return (
    <div
      role="alert"
      className={`rounded-xl border border-red-200 bg-[#FEF3F2] p-6 sm:p-8 text-center flex flex-col items-center justify-center ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-red-100 text-red-700 flex items-center justify-center mb-4">
        <AlertCircle className="w-6 h-6" aria-hidden="true" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-neutral-900 mb-2">{title}</h3>
      <p className="text-sm text-neutral-700 max-w-lg mb-4 leading-relaxed">{displayMessage}</p>

      {requestId && (
        <div className="mb-6 px-3 py-1 bg-red-100/60 rounded text-xs text-neutral-600 font-mono">
          Correlation Reference: <span className="font-semibold text-neutral-800">{requestId}</span>
        </div>
      )}

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-neutral-800 border border-neutral-300 rounded-lg text-sm font-semibold hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-700 focus:ring-offset-2 transition-colors shadow-sm"
        >
          <RotateCcw className="w-4 h-4 text-neutral-600" aria-hidden="true" />
          Retry Request
        </button>
      )}
    </div>
  );
};
