import React, { InputHTMLAttributes, forwardRef } from 'react';

interface CurrencyFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  currencyCode?: string;
  error?: boolean;
}

export const CurrencyField = forwardRef<HTMLInputElement, CurrencyFieldProps>(
  ({ className = '', currencyCode = '₹', error, ...props }, ref) => {
    return (
      <div className="relative rounded-lg shadow-2xs">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <span className="text-sm font-semibold text-neutral-500">{currencyCode}</span>
        </div>
        <input
          ref={ref}
          type="number"
          className={`w-full rounded-lg border bg-white px-3 py-2 pl-8 text-sm text-neutral-900 font-tabular focus:outline-none focus:ring-2 focus:ring-primary-700 transition-colors ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
              : 'border-neutral-300 focus:border-primary-700'
          } ${className}`}
          {...props}
        />
      </div>
    );
  }
);
CurrencyField.displayName = 'CurrencyField';
