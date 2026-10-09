import React from 'react';
import { formatNumber, formatPercent } from '@/lib/formatters/number';
import { HelpCircle } from 'lucide-react';

interface ConfidenceIndicatorProps {
  lowerBound: number | null | undefined;
  upperBound: number | null | undefined;
  unit: string;
  confidenceLevel?: number;
  method?: string;
  className?: string;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  lowerBound,
  upperBound,
  unit,
  confidenceLevel = 0.9,
  method = 'Conformal Quantile Regression',
  className = '',
}) => {
  if (lowerBound === null || lowerBound === undefined || upperBound === null || upperBound === undefined) {
    return (
      <div className={`text-xs text-neutral-500 italic p-3 bg-neutral-50 rounded border border-neutral-200 ${className}`}>
        Model uncertainty interval is unavailable for this crop cycle.
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2 text-xs ${className}`}>
      <div className="flex items-center justify-between text-neutral-700">
        <span className="font-semibold flex items-center gap-1">
          <span>Expected Range & Uncertainty Interval</span>
          <span title="Uncertainty calibrated via empirical holdout error distributions" className="cursor-help text-neutral-400">
            <HelpCircle className="w-3.5 h-3.5" />
          </span>
        </span>
        <span className="font-semibold px-2 py-0.5 bg-neutral-200 rounded text-[11px] font-tabular">
          {formatPercent(confidenceLevel, 0, { isRatio: true })} Coverage Band
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 bg-white p-2.5 rounded-lg border border-neutral-200 text-center">
          <span className="text-[11px] text-neutral-500 block">Lower Bound (10th %ile)</span>
          <span className="text-base font-bold text-neutral-900 font-tabular">
            {formatNumber(lowerBound, 1)} {unit}
          </span>
        </div>

        <span className="text-neutral-400 font-bold text-sm">to</span>

        <div className="flex-1 bg-white p-2.5 rounded-lg border border-neutral-200 text-center">
          <span className="text-[11px] text-neutral-500 block">Upper Bound (90th %ile)</span>
          <span className="text-base font-bold text-neutral-900 font-tabular">
            {formatNumber(upperBound, 1)} {unit}
          </span>
        </div>
      </div>

      <div className="pt-1 text-[11px] text-neutral-500 flex justify-between">
        <span>Method: {method}</span>
        <span className="font-medium text-amber-700">Not a guaranteed harvest volume</span>
      </div>
    </div>
  );
};
