import React, { ReactNode } from 'react';
import { Skeleton } from '@/components/feedback/Skeleton';

interface MetricCardProps {
  label: string;
  value: ReactNode;
  unit?: string;
  subLabel?: string;
  tooltip?: string;
  icon?: ReactNode;
  iconBgColor?: string;
  badge?: ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptySubLabel?: string;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  subLabel,
  tooltip,
  icon,
  iconBgColor = 'bg-slate-100 text-slate-600 border-slate-200',
  badge,
  isLoading = false,
  isEmpty = false,
  emptySubLabel = 'All caught up',
  className = '',
}) => {
  if (isLoading) {
    return (
      <div className={`h-full min-h-[140px] rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between ${className}`}>
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-8 rounded-xl" />
        </div>
        <Skeleton className="h-9 w-16 my-2" />
        <Skeleton className="h-3 w-24" />
      </div>
    );
  }

  const isZero = value === 0 || value === '0' || value === '—';
  const showEmpty = isEmpty || isZero;

  return (
    <div
      className={`group h-full min-h-[140px] rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden ${className}`}
    >
      {/* Top Header Row: Label & Subtle Colored Icon Circle */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
          {label}
        </span>
        {icon && (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${iconBgColor} transition-transform duration-200 group-hover:scale-105`}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Main Metric Value: Large, bold number + Clean Sub-label */}
      <div className="my-auto py-1">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span
            className={`text-3xl sm:text-4xl font-extrabold tracking-tight leading-none tabular-nums font-display ${
              showEmpty ? 'text-slate-400' : 'text-slate-900'
            }`}
          >
            {value}
          </span>
          {unit && <span className="text-xs font-semibold text-slate-400">{unit}</span>}
          {badge && (
            <div className="shrink-0 overflow-hidden max-w-[100px] truncate">
              {badge}
            </div>
          )}
        </div>
        <p className="text-xs text-slate-400 font-medium mt-1.5 truncate">
          {showEmpty ? emptySubLabel : subLabel || 'Active records'}
        </p>
      </div>
    </div>
  );
};
