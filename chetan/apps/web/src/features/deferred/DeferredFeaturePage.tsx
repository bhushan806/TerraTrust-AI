import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Compass, ArrowLeft, Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/feedback/StatusBadge';

interface DeferredFeaturePageProps {
  featureName: string;
  roadmapMilestone?: string;
  description: string;
  apiCodes?: string[];
}

export const DeferredFeaturePage: React.FC<DeferredFeaturePageProps> = ({
  featureName,
  roadmapMilestone = 'Phase 2 (Post-MVP)',
  description,
  apiCodes = [],
}) => {
  return (
    <div className="space-y-6">
      <PageHeader
        title={featureName}
        subtitle="This enterprise module is currently feature-flagged and scheduled for post-MVP deployment."
        breadcrumbs={[
          { label: 'Overview', href: '/' },
          { label: featureName, current: true },
        ]}
        badge={<StatusBadge variant="PD_UNAVAILABLE" label="FEATURE GATED" size="md" />}
      />

      <div className="bg-white rounded-2xl border border-neutral-200 p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-5 shadow-2xs">
        <div className="w-14 h-14 rounded-full bg-neutral-100 text-neutral-600 flex items-center justify-center mx-auto">
          <Clock className="w-7 h-7" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-neutral-900">{featureName} Is Not Enabled</h2>
          <p className="text-sm text-neutral-600 leading-relaxed max-w-lg mx-auto">
            {description}
          </p>
        </div>

        {apiCodes.length > 0 && (
          <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs font-mono text-neutral-600 inline-block">
            Authoritative Gated Operations: {apiCodes.join(', ')}
          </div>
        )}

        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-emerald-900 text-left space-y-1">
          <span className="font-bold flex items-center gap-1.5 text-emerald-950">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Zero-Fake-Analytics Principle:</span>
          </span>
          <p className="leading-relaxed">
            TerraTrust-AI strictly avoids presenting fabricated or simulated mock graphs in place of authoritative backend calculations. This feature remains inactive until backend contract endpoints are deployed and certified.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-800 text-white rounded-lg text-xs font-bold hover:bg-primary-900 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Portfolio Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
