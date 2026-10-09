import React, { InputHTMLAttributes, forwardRef } from 'react';
import { Calendar } from 'lucide-react';

interface DateFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const DateField = forwardRef<HTMLInputElement, DateFieldProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <div className="relative rounded-lg shadow-2xs">
        <input
          ref={ref}
          type="date"
          className={`w-full rounded-lg border bg-white px-3 py-2 pl-9 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-700 transition-colors ${
            error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200' : 'border-neutral-300 focus:border-primary-700'
          } ${className}`}
          {...props}
        />
        <Calendar
          className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-neutral-400"
          aria-hidden="true"
        />
      </div>
    );
  }
);
DateField.displayName = 'DateField';
