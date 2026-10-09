import React from 'react';
import { Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '@/components/feedback/StatusBadge';

interface EvidencePanelProps {
  evidenceQuality: 'HIGH' | 'MODERATE' | 'PARTIAL' | 'STALE' | 'POOR';
  inputManifestId?: string;
  missingInformation?: string[];
  assumptions?: Record<string, any>;
  className?: string;
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({
  evidenceQuality,
  inputManifestId,
  missingInformation = [],
  assumptions = {},
  className = '',
}) => {
  const getQualityBadge = () => {
    switch (evidenceQuality) {
      case 'HIGH':
        return <StatusBadge variant="PRODUCTION" label="HIGH EVIDENCE QUALITY" />;
      case 'MODERATE':
        return <StatusBadge variant="HEALTHY" label="MODERATE EVIDENCE" />;
      case 'PARTIAL':
        return <StatusBadge variant="PARTIAL" label="PARTIAL EVIDENCE" />;
      case 'STALE':
        return <StatusBadge variant="STALE" label="STALE EVIDENCE" />;
      default:
        return <StatusBadge variant="FAILED" label="POOR EVIDENCE" />;
    }
  };

  return (
    <div className={`rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs ${className}`}>
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-100 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5 text-neutral-500" aria-hidden="true" />
          <h3 className="text-sm font-bold text-neutral-900">Evidence Lineage & Provenance</h3>
        </div>
        {getQualityBadge()}
      </div>

      <div className="space-y-4 text-xs">
        {inputManifestId && (
          <div className="flex items-center justify-between bg-neutral-50 p-2.5 rounded border border-neutral-200 font-mono text-neutral-600">
            <span>Input Manifest ID:</span>
            <span className="font-semibold text-neutral-800">{inputManifestId}</span>
          </div>
        )}

        {missingInformation.length > 0 && (
          <div className="bg-[#FEF3F2] border border-rose-200 p-3 rounded-lg text-rose-900">
            <div className="flex items-center gap-1.5 font-bold mb-1.5 text-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Missing Information Disclosed</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-rose-800">
              {missingInformation.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {Object.keys(assumptions).length > 0 && (
          <div>
            <h4 className="font-semibold text-neutral-700 mb-2 uppercase tracking-wider text-[11px]">
              Active Model Assumptions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(assumptions).map(([key, val]) => (
                <div key={key} className="bg-neutral-50 border border-neutral-200 p-2 rounded">
                  <span className="text-neutral-500 block text-[11px] font-mono">{key}</span>
                  <span className="font-semibold text-neutral-800">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-neutral-500 pt-1 text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>All telemetry observations cryptographically anchored to input manifest</span>
        </div>
      </div>
    </div>
  );
};
