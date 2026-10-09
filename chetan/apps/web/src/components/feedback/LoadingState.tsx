import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading verified institutional records...',
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center p-12 text-center ${className}`}
    >
      <Loader2 className="w-8 h-8 text-primary-700 animate-spin mb-3" aria-hidden="true" />
      <p className="text-sm font-medium text-neutral-600">{message}</p>
      <span className="sr-only">Please wait, loading data.</span>
    </div>
  );
};
