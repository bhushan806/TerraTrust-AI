import React, { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  helpText?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  required = false,
  helpText,
  error,
  children,
  className = '',
}) => {
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs font-semibold text-neutral-800">
          {label}
          {required && (
            <span className="text-rose-600 ml-1 font-bold" aria-hidden="true">
              *
            </span>
          )}
        </label>
        {required && <span className="text-[11px] text-neutral-400">Required</span>}
      </div>

      <div>{children}</div>

      {helpText && !error && (
        <p id={helpId} className="text-xs text-neutral-500">
          {helpText}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs text-rose-700 font-medium flex items-center gap-1.5 pt-0.5"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
