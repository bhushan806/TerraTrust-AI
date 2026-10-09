import React, { InputHTMLAttributes, forwardRef } from 'react';

interface NumberFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  unit?: string;
  error?: boolean;
}

export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(
  ({ className = '', unit, error, ...props }, ref) => {
    return (
      <div className="relative rounded-lg shadow-2xs">
        <input
          ref={ref}
          type="number"
          className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-neutral-900 font-tabular focus:outline-none focus:ring-2 focus:ring-primary-700 transition-colors ${
            unit ? 'pr-14' : ''
          } ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
              : 'border-neutral-300 focus:border-primary-700'
          } ${className}`}
          {...props}
        />
        {unit && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
              {unit}
            </span>
          </div>
        )}
      </div>
    );
  }
);
NumberField.displayName = 'NumberField';
