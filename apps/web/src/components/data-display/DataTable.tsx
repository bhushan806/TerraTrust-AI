import React, { ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { ColumnDef } from '@/types/ui';
import { Skeleton } from '@/components/feedback/Skeleton';

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  caption?: string;
  ariaLabel?: string;
  isLoading?: boolean;
  emptyState?: ReactNode;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  renderMobileCard?: (item: T) => ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  caption,
  ariaLabel,
  isLoading = false,
  emptyState,
  sortBy,
  sortOrder,
  onSort,
  renderMobileCard,
  className = '',
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className={`rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-card ${className}`}>
        <div className="p-5 space-y-3">
          <Skeleton className="h-6 w-1/4" />
          <div className="space-y-2 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>;
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Mobile Card Layout */}
      {renderMobileCard && (
        <div className="block sm:hidden space-y-3">
          {data.map((item) => (
            <div key={keyExtractor(item)} className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-card">
              {renderMobileCard(item)}
            </div>
          ))}
        </div>
      )}

      {/* Desktop & Tablet Table View */}
      <div
        className={`${renderMobileCard ? 'hidden sm:block' : 'block'} rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-card`}
      >
        <div className="overflow-x-auto focus:outline-none focus:ring-1 focus:ring-primary-700" tabIndex={0} aria-label="Data table horizontal scroll container">
          <table
            className="w-full text-left border-collapse text-sm"
            aria-label={ariaLabel || caption || 'Data Table'}
          >
            {caption && <caption className="sr-only">{caption}</caption>}
            <thead className="bg-slate-50/80 border-b border-slate-200/90 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                {columns.map((col) => {
                  const isSorted = sortBy === col.key;
                  const sortAria = isSorted
                    ? sortOrder === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined;

                  return (
                    <th
                      key={col.key}
                      scope="col"
                      aria-sort={sortAria}
                      className={`px-4 py-3.5 ${
                        col.align === 'right'
                          ? 'text-right'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {col.sortable && onSort ? (
                        <button
                          type="button"
                          onClick={() => onSort(col.key)}
                          className="group inline-flex items-center gap-1 focus:outline-none focus:text-slate-900 transition-colors"
                        >
                          <span>{col.header}</span>
                          <span className="text-slate-400 group-hover:text-slate-700">
                            {isSorted ? (
                              sortOrder === 'asc' ? (
                                <ChevronUp className="w-3.5 h-3.5 text-primary-800" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-primary-800" />
                              )
                            ) : (
                              <ChevronsUpDown className="w-3.5 h-3.5 opacity-60" />
                            )}
                          </span>
                        </button>
                      ) : (
                        <span>{col.header}</span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className="hover:bg-slate-50/70 transition-colors focus-within:bg-slate-50"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3.5 whitespace-nowrap text-slate-800 ${
                        col.align === 'right'
                          ? 'text-right font-tabular'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      } ${col.className || ''}`}
                    >
                      {col.cell(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
