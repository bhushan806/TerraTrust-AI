import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = '',
}) => {
  if (totalPages <= 1 && totalItems === 0) return null;

  const startItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalItems);

  return (
    <nav
      aria-label="Table pagination navigation"
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border border-neutral-200 rounded-xl text-sm ${className}`}
    >
      <div className="text-xs text-neutral-600 font-tabular">
        Showing <span className="font-semibold text-neutral-900">{startItem}</span> to{' '}
        <span className="font-semibold text-neutral-900">{endItem}</span> of{' '}
        <span className="font-semibold text-neutral-900">{totalItems}</span> records
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Go to previous page"
          className="inline-flex items-center gap-1 px-3 py-1.5 border border-neutral-300 rounded-md text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-700"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <span className="px-2 text-xs font-medium text-neutral-600 font-tabular">
          Page {page} of {Math.max(1, totalPages)}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Go to next page"
          className="inline-flex items-center gap-1 px-3 py-1.5 border border-neutral-300 rounded-md text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-700"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};
