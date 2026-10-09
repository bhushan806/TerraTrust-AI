import React, { ReactNode } from 'react';
import { Info, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Skeleton } from '@/components/feedback/Skeleton';
import { formatRelativeTime } from '@/lib/formatters/date';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  unit?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    label: string;
    positiveIsGood?: boolean;
  };
  timestamp?: string;
  tooltip?: string;
  icon?: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  isEmpty?: boolean;
  emptyText?: string;
  badge?: ReactNode;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  trend,
  timestamp,
  tooltip,
  icon,
  isLoading = false,
  isError = false,
  errorMessage = 'Metric unavailable',
  isEmpty = false,
  emptyText = 'No data recorded',
  badge,
  className = '',
}) => {
  if (isLoading) {
    return (
      <div className={`rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-3 w-32" />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        role="alert"
        className={`rounded-2xl border border-rose-200 bg-rose-50/70 p-5 text-slate-800 ${className}`}
      >
        <div className="flex items-center gap-2 text-rose-700 text-xs font-semibold mb-2">
          <AlertCircle className="w-4 h-4" />
          <span>{label}</span>
        </div>
        <p className="text-xs text-rose-800">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card hover:border-slate-300 ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {label}
          </span>
          <div className="flex items-center gap-1.5">
            {badge}
            {icon && <span className="text-slate-400">{icon}</span>}
            {tooltip && (
              <span title={tooltip} className="cursor-help text-slate-400 hover:text-slate-600">
                <Info className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="sr-only">{tooltip}</span>
              </span>
            )}
          </div>
        </div>

        {isEmpty ? (
          <p className="text-sm font-medium text-slate-400 italic py-1">{emptyText}</p>
        ) : (
          <div className="flex items-baseline gap-1.5 py-0.5">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-display font-tabular">
              {value}
            </span>
            {unit && <span className="text-xs font-medium text-slate-500">{unit}</span>}
          </div>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        {trend ? (
          <span
            className={`inline-flex items-center gap-0.5 font-bold ${
              trend.direction === 'up'
                ? trend.positiveIsGood !== false
                  ? 'text-emerald-700'
                  : 'text-rose-700'
                : trend.direction === 'down'
                ? trend.positiveIsGood === false
                  ? 'text-emerald-700'
                  : 'text-rose-700'
                : 'text-slate-600'
            }`}
          >
            {trend.direction === 'up' && <ArrowUpRight className="w-3.5 h-3.5" />}
            {trend.direction === 'down' && <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend.label}
          </span>
        ) : (
          <span className="text-slate-400 font-mono text-[10px]">Verified Contract Metric</span>
        )}

        {timestamp && (
          <span className="text-slate-400 font-tabular text-[10px]">
            {formatRelativeTime(timestamp)}
          </span>
        )}
      </div>
    </div>
  );
};
