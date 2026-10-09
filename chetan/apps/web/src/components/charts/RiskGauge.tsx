import React from 'react';
import { Ban, ShieldCheck, AlertTriangle } from 'lucide-react';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { RiskStatus } from '@/types/domain';

interface RiskGaugeProps {
  score: number | null | undefined;
  probabilityOfDefault: number | null | undefined;
  pdGateStatus: 'CLOSED_EVIDENCE_INCOMPLETE' | 'CLOSED_MODEL_VALIDATION' | 'OPEN';
  riskClassification: RiskStatus;
  pdUnavailableReason?: string;
  missingEvidenceLink?: string;
  className?: string;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  probabilityOfDefault,
  pdGateStatus,
  riskClassification,
  pdUnavailableReason,
  className = '',
}) => {
  const isPdOpen = pdGateStatus === 'OPEN' && probabilityOfDefault !== null && probabilityOfDefault !== undefined;

  return (
    <div className={`rounded-xl border border-neutral-200 bg-white p-6 shadow-2xs space-y-6 ${className}`}>
      {/* Header & Overall Classification */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
        <div>
          <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block">
            Institutional Risk Evaluation
          </span>
          <div className="flex items-center gap-2.5 mt-1">
            <h3 className="text-xl font-bold text-neutral-900">
              {riskClassification} RISK CLASSIFICATION
            </h3>
            <StatusBadge
              variant={
                riskClassification === 'LOW'
                  ? 'HEALTHY'
                  : riskClassification === 'HIGH' || riskClassification === 'CRITICAL'
                  ? 'HIGH_RISK'
                  : 'PENDING'
              }
              label={riskClassification}
              size="sm"
            />
          </div>
        </div>

        {score !== null && score !== undefined && (
          <div className="bg-neutral-50 border border-neutral-200 px-3.5 py-1.5 rounded-lg text-right font-tabular">
            <span className="text-[11px] text-neutral-500 block">Credit Risk Score</span>
            <span className="text-lg font-bold text-neutral-900">{score} / 100</span>
          </div>
        )}
      </div>

      {/* Main PD Display: Open vs Strictly Unavailable */}
      {isPdOpen ? (
        <div className="bg-[#ECFDF3] border border-[#A6F4C5] rounded-xl p-5 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-emerald-800">
            <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-wide">
              Validated Probability of Default (PD)
            </span>
          </div>
          <div className="text-4xl font-extrabold text-emerald-950 font-tabular">
            {(probabilityOfDefault * 100).toFixed(2)}%
          </div>
          <p className="text-xs text-emerald-800 max-w-md mx-auto">
            Calibrated 12-month horizon probability of default based on verified historical outcomes and validated agronomic indicators.
          </p>
        </div>
      ) : (
        /* Mandatory PD UNAVAILABLE Implementation */
        <div className="bg-[#F8FAFC] border-2 border-neutral-300 rounded-xl p-6 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-200 text-neutral-600 mb-1">
            <Ban className="w-6 h-6" aria-hidden="true" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <StatusBadge variant="PD_UNAVAILABLE" size="lg" />
            </div>
            <h4 className="text-base font-bold text-neutral-900 pt-1">
              Probability of Default is Gated & Unavailable
            </h4>
          </div>

          {/* Explicit Institutional Warning Requirement */}
          <div className="bg-white border border-neutral-200 rounded-lg p-4 text-xs text-neutral-700 max-w-xl mx-auto text-left space-y-2">
            <div className="flex items-start gap-2 text-amber-800 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Mandatory Risk Governance Principle:</span>
            </div>
            <p className="leading-relaxed">
              {pdUnavailableReason ||
                'A probability-of-default value is not available for this assessment because the required backend gate is closed or required evidence is incomplete.'}
            </p>
            <p className="font-semibold text-neutral-900 border-t border-neutral-100 pt-2">
              The risk classification shown here must not be interpreted as a probability of default.
            </p>
          </div>

          <div className="text-[11px] text-neutral-500 font-mono">
            Gate Status: <span className="font-semibold text-neutral-700">{pdGateStatus}</span>
          </div>
        </div>
      )}
    </div>
  );
};
