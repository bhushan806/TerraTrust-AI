import React, { SelectHTMLAttributes, forwardRef, ReactNode } from 'react';

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  children: ReactNode;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ className = '', error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-700 transition-colors shadow-2xs ${
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
            : 'border-neutral-300 focus:border-primary-700'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);
SelectField.displayName = 'SelectField';
