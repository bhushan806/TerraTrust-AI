import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  Phone,
  Building2,
  Tractor,
  Sprout,
  FileSpreadsheet,
  ShieldCheck,
  History,
  FileText,
  AlertTriangle,
  ArrowRight,
  Plus,
  BadgeCheck,
  MapPin,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DetailCard } from '@/components/data-display/DetailCard';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { AuditInfo } from '@/components/data-display/AuditInfo';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { formatDate, formatDateTime } from '@/lib/formatters/date';
import { formatArea } from '@/lib/formatters/units';
import { formatCurrency } from '@/lib/formatters/currency';
import { typedGet } from '@/lib/api-client/client';
import { queryKeys } from '@/lib/query-client/query-keys';
import { Borrower, Farm, CropCycle, LoanApplication } from '@/types/domain';
import { IMAGERY_ASSETS } from '@/lib/assets/imagery';

export const BorrowerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const borrowerQuery = useQuery({
    queryKey: queryKeys.borrower(id || 'bor-1001'),
    queryFn: () =>
      typedGet<{
        borrower: Borrower;
        farms: Farm[];
        loans: LoanApplication[];
        crop_cycles: CropCycle[];
      }>(`/borrowers/${id || 'bor-1001'}`),
  });

  if (borrowerQuery.isLoading) {
    return <LoadingState message="Loading verified borrower dossier & land records..." />;
  }

  if (borrowerQuery.isError || !borrowerQuery.data) {
    return (
      <ErrorState
        error={borrowerQuery.error}
        title="Borrower Record Not Found"
        onRetry={() => borrowerQuery.refetch()}
      />
    );
  }

  const { borrower, farms, loans, crop_cycles } = borrowerQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={borrower.display_name}
        subtitle={`Agricultural borrower file: ${borrower.external_ref} · Scoped to ${borrower.branch_name}`}
        breadcrumbs={[
          { label: 'Borrowers', href: '/borrowers' },
          { label: borrower.display_name, current: true },
        ]}
        badge={
          <StatusBadge
            variant={
              borrower.risk_status === 'LOW'
                ? 'HEALTHY'
                : borrower.risk_status === 'HIGH' || borrower.risk_status === 'CRITICAL'
                ? 'HIGH_RISK'
                : 'PENDING'
            }
            label={`${borrower.risk_status} RISK`}
            size="md"
          />
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/crop-cycles/${crop_cycles[0]?.id || 'cycle-301'}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-900 text-white rounded-xl text-xs font-bold hover:bg-primary-950 shadow-2xs transition-colors"
            >
              <span>Next: Farm & Crop Cycle</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to={`/borrowers/${borrower.id}/timeline`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 shadow-2xs"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Assessment Timeline</span>
            </Link>
          </div>
        }
      />

      {/* Profile Overview Card with Farmer Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DetailCard title="Borrower Identity & KYC Dossier" className="md:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 block text-[11px] font-bold">Legal Name</span>
              <span className="font-extrabold text-slate-900 text-base font-display">
                {borrower.legal_name || borrower.display_name}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-500 block text-[11px] font-bold">Kisan Credit Card (KCC) Ref</span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {borrower.external_ref}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Primary Contact</span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5 text-sm">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{borrower.phone}</span>
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Primary Crop Specialty</span>
              <span className="font-bold text-slate-800 text-sm">{borrower.primary_crop}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Total Operating Acreage</span>
              <span className="font-extrabold text-slate-900 text-sm font-tabular">
                {formatArea(borrower.total_area_ha, 'ha')}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Active Land Parcels</span>
              <span className="font-bold text-slate-900 text-sm">{borrower.total_farms} registered plots</span>
            </div>
          </div>
        </DetailCard>

        {/* Institution & Branch Scope */}
        <DetailCard title="Institutional Scope">
          <div className="space-y-3.5 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-500 block text-[11px] font-bold">Assigned Lending Branch</span>
              <span className="font-extrabold text-slate-900 text-sm font-display">{borrower.branch_name}</span>
              <span className="text-[11px] text-slate-500 block">{borrower.region} District Hub</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px] mb-1">Assessment Status</span>
              <StatusBadge
                variant={borrower.assessment_status === 'COMPLETED' ? 'HEALTHY' : 'PENDING'}
                label={borrower.assessment_status}
                size="sm"
              />
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
              Last Profile Sync: {formatDateTime(borrower.updated_at)}
            </div>
          </div>
        </DetailCard>
      </div>

      {/* Farms Section with Thumbnail */}
      <DetailCard
        title={`Registered Farm Parcels (${farms.length})`}
        subtitle="Audited land geometries, remote sensing imagery, and soil classifications"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {farms.map((f) => (
            <div
              key={f.id}
              className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 shadow-2xs hover:shadow-card transition-all space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={IMAGERY_ASSETS.satelliteParcel}
                      alt={f.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <Link
                      to={`/farms/${f.id}`}
                      className="font-bold text-sm text-slate-900 hover:text-primary-800 hover:underline flex items-center gap-1.5"
                    >
                      <span>{f.name}</span>
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5">{f.location_name}</p>
                  </div>
                </div>
                <StatusBadge variant="PRODUCTION" size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100 font-tabular">
                <div>
                  <span className="text-slate-400 block text-[11px]">Cultivated Area</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatArea(f.cultivated_area, f.area_unit)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Irrigation Delivery</span>
                  <span className="font-bold text-slate-800 text-sm">{f.irrigation_type}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 text-[11px]">Soil: {f.soil_type}</span>
                <Link
                  to={`/farms/${f.id}`}
                  className="text-primary-800 font-bold hover:text-primary-950 flex items-center gap-1"
                >
                  <span>Inspect Farm Cadastre</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </DetailCard>

      {/* Active Crop Cycles Section */}
      <DetailCard
        title={`Active Crop Cycles (${crop_cycles.length})`}
        subtitle="Seasonal sowing horizons and yield forecasts"
      >
        <div className="space-y-3">
          {crop_cycles.map((cc) => (
            <div
              key={cc.id}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs hover:shadow-card transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    to={`/crop-cycles/${cc.id}`}
                    className="font-bold text-sm text-slate-900 hover:text-primary-800 hover:underline flex items-center gap-1.5"
                  >
                    <Sprout className="w-4 h-4 text-emerald-700" />
                    <span>{cc.crop_name}</span>
                  </Link>
                  <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-semibold">
                    {cc.season} Season
                  </span>
                  <StatusBadge variant="HEALTHY" label={cc.status} size="sm" />
                </div>
                <p className="text-xs text-slate-500">
                  {cc.farm_name} · Sown {formatDate(cc.sowing_date)} · Expected Harvest {formatDate(cc.expected_harvest_date)}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/crop-cycles/${cc.id}/climate`}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
                >
                  Climate
                </Link>
                <Link
                  to={`/crop-cycles/${cc.id}/yield`}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition-colors"
                >
                  Yield
                </Link>
                <Link
                  to={`/crop-cycles/${cc.id}/income`}
                  className="px-3 py-1.5 text-xs font-semibold bg-primary-50 hover:bg-primary-100 text-primary-800 rounded-lg transition-colors"
                >
                  Income
                </Link>
              </div>
            </div>
          ))}
        </div>
      </DetailCard>
    </div>
  );
};
