import React, { InputHTMLAttributes, forwardRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ className = '', value, onClear, onChange, ...props }, ref) => {
    return (
      <div className="relative w-full rounded-lg shadow-2xs">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-neutral-400" aria-hidden="true" />
        </div>
        <input
          ref={ref}
          type="search"
          value={value}
          onChange={onChange}
          className={`w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-9 text-sm text-neutral-900 placeholder-neutral-400 focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700/20 transition-colors ${className}`}
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search input"
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-600 focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);
SearchField.displayName = 'SearchField';
