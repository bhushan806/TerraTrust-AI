import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  X,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DetailCard } from '@/components/data-display/DetailCard';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useToast } from '@/components/feedback/Toast';
import { formatDate, formatDateTime } from '@/lib/formatters/date';
import { formatArea } from '@/lib/formatters/units';
import { typedGet, typedPost } from '@/lib/api-client/client';
import { queryKeys } from '@/lib/query-client/query-keys';
import { Borrower, Farm, CropCycle, LoanApplication } from '@/types/domain';
import { IMAGERY_ASSETS } from '@/lib/assets/imagery';

export const BorrowerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Modal States
  const [isAddFarmOpen, setIsAddFarmOpen] = useState(false);
  const [farmLoading, setFarmLoading] = useState(false);
  const [farmError, setFarmError] = useState<string | null>(null);
  const [farmName, setFarmName] = useState('');
  const [farmArea, setFarmArea] = useState('2.5');
  const [farmUnit, setFarmUnit] = useState('hectare');
  const [farmLat, setFarmLat] = useState('17.6599');
  const [farmLon, setFarmLon] = useState('75.9064');
  const [farmVillage, setFarmVillage] = useState('Mandrup');
  const [farmDistrict, setFarmDistrict] = useState('Solapur');
  const [farmState, setFarmState] = useState('Maharashtra');

  // Crop Cycle Modal States
  const [isAddCropCycleOpen, setIsAddCropCycleOpen] = useState(false);
  const [cropCycleLoading, setCropCycleLoading] = useState(false);
  const [cropCycleError, setCropCycleError] = useState<string | null>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [cropCode, setCropCode] = useState('Sugarcane');
  const [cropVariety, setCropVariety] = useState('Co 86032');
  const [cropSeason, setCropSeason] = useState('Kharif');
  const [sowingDate, setSowingDate] = useState('2026-06-15');
  const [harvestDate, setHarvestDate] = useState('2027-02-28');
  const [cropArea, setCropArea] = useState('2.0');
  const [irrigationType, setIrrigationType] = useState('Drip Irrigation');

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

  const { borrower, farms = [], loans = [], crop_cycles = [] } = borrowerQuery.data;

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmName.trim() || !farmArea) {
      setFarmError('Please provide farm plot name and area size.');
      return;
    }

    try {
      setFarmLoading(true);
      setFarmError(null);
      await typedPost('/farms', {
        borrower_id: borrower.id,
        name: farmName.trim(),
        area_value: parseFloat(farmArea),
        area_unit: farmUnit,
        latitude: farmLat ? parseFloat(farmLat) : undefined,
        longitude: farmLon ? parseFloat(farmLon) : undefined,
        village: farmVillage.trim() || undefined,
        district: farmDistrict.trim() || undefined,
        state: farmState.trim() || undefined,
      });

      showToast({
        type: 'success',
        title: 'Farm Parcel Added',
        message: `Registered farm "${farmName}" (${farmArea} ${farmUnit}) to ${borrower.display_name}.`,
      });

      queryClient.invalidateQueries({ queryKey: queryKeys.borrower(borrower.id) });
      setIsAddFarmOpen(false);
    } catch (err: any) {
      setFarmError(err?.message || 'Failed to create farm plot in database.');
    } finally {
      setFarmLoading(false);
    }
  };

  const handleCreateCropCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetFarm = selectedFarmId || (farms.length > 0 ? farms[0].id : null);
    if (!targetFarm) {
      setCropCycleError('Please select or register a farm parcel first.');
      return;
    }

    try {
      setCropCycleLoading(true);
      setCropCycleError(null);
      await typedPost(`/farms/${targetFarm}/crop-cycles`, {
        crop_code: cropCode,
        variety: cropVariety || undefined,
        season: cropSeason,
        sowing_date: sowingDate,
        expected_harvest_date: harvestDate,
        area_value: parseFloat(cropArea) || 1.0,
        area_unit: 'hectare',
        irrigation_type: irrigationType,
      });

      showToast({
        type: 'success',
        title: 'Crop Cycle Registered',
        message: `Recorded ${cropSeason} ${cropCode} crop cycle.`,
      });

      queryClient.invalidateQueries({ queryKey: queryKeys.borrower(borrower.id) });
      setIsAddCropCycleOpen(false);
    } catch (err: any) {
      setCropCycleError(err?.message || 'Failed to register crop cycle.');
    } finally {
      setCropCycleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={borrower.display_name}
        subtitle={`Agricultural borrower file: ${borrower.external_ref} · Scoped to ${borrower.branch_name || 'Solapur Hub'}`}
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
            label={`${borrower.risk_status || 'UNASSESSED'} RISK`}
            size="md"
          />
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setFarmName(`${borrower.display_name.split(' ')[0]} Parcel B`);
                setFarmError(null);
                setIsAddFarmOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900 shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-200" />
              <span>Add Farm Parcel</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedFarmId(farms.length > 0 ? farms[0].id : '');
                setCropCycleError(null);
                setIsAddCropCycleOpen(true);
              }}
              disabled={farms.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-900 text-white rounded-xl text-xs font-bold hover:bg-primary-950 shadow-2xs transition-colors disabled:opacity-50"
            >
              <Sprout className="w-3.5 h-3.5 text-primary-200" />
              <span>Add Crop Cycle</span>
            </button>

            <Link
              to="/loans/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>Apply for Loan</span>
            </Link>

            <Link
              to={`/borrowers/${borrower.id}/timeline`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 bg-white rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 shadow-2xs"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Timeline</span>
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
                <span>{borrower.phone || borrower.contact_phone || 'Unlisted'}</span>
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Primary Crop Specialty</span>
              <span className="font-bold text-slate-800 text-sm">{borrower.primary_crop || 'Multicrop / Horticulture'}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Total Operating Acreage</span>
              <span className="font-extrabold text-slate-900 text-sm font-tabular">
                {formatArea(borrower.total_area_ha || 2.5, 'ha')}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Registered Land Parcels</span>
              <span className="font-bold text-slate-900 text-sm">{farms.length} active plots</span>
            </div>
          </div>
        </DetailCard>

        {/* Institution & Branch Scope */}
        <DetailCard title="Institutional Scope">
          <div className="space-y-3.5 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <span className="text-slate-500 block text-[11px] font-bold">Assigned Lending Branch</span>
              <span className="font-extrabold text-slate-900 text-sm font-display">{borrower.branch_name || 'Solapur South Branch'}</span>
              <span className="text-[11px] text-slate-500 block">{borrower.region || 'Maharashtra'} District Hub</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px] mb-1">Assessment Status</span>
              <StatusBadge
                variant={borrower.assessment_status === 'COMPLETED' ? 'HEALTHY' : 'PENDING'}
                label={borrower.assessment_status || 'PENDING_EVALUATION'}
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
        action={
          <button
            type="button"
            onClick={() => {
              setFarmName(`${borrower.display_name.split(' ')[0]} Plot ${farms.length + 1}`);
              setIsAddFarmOpen(true);
            }}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Plot</span>
          </button>
        }
      >
        {farms.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 space-y-3">
            <Tractor className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No farm parcels registered yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Register this farmer's first land plot to enable remote sensing, soil telemetry, and crop yield forecasting.
            </p>
            <button
              type="button"
              onClick={() => setIsAddFarmOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register First Plot</span>
            </button>
          </div>
        ) : (
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
                      <p className="text-xs text-slate-500 mt-0.5">{f.location_name || `${f.village || ''} ${f.district || ''}`}</p>
                    </div>
                  </div>
                  <StatusBadge variant="PRODUCTION" size="sm" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100 font-tabular">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Cultivated Area</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {formatArea(f.cultivated_area || f.area_value || 2.5, f.area_unit || 'ha')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Irrigation Delivery</span>
                    <span className="font-bold text-slate-800 text-sm">{f.irrigation_type || 'Borewell / Drip'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500 text-[11px]">Soil: {f.soil_type || 'Black Vertisol'}</span>
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
        )}
      </DetailCard>

      {/* Active Crop Cycles Section */}
      <DetailCard
        title={`Active Crop Cycles (${crop_cycles.length})`}
        subtitle="Seasonal sowing horizons and yield forecasts"
        action={
          farms.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedFarmId(farms[0].id);
                setIsAddCropCycleOpen(true);
              }}
              className="text-xs font-bold text-primary-800 hover:text-primary-950 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Season</span>
            </button>
          )
        }
      >
        {crop_cycles.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 space-y-3">
            <Sprout className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No crop cycles recorded</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add a seasonal crop cycle (e.g. Kharif Sugarcane, Rabi Wheat) to evaluate yield estimates and cash-flow projections.
            </p>
            {farms.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFarmId(farms[0].id);
                  setIsAddCropCycleOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-900 text-white rounded-xl text-xs font-bold hover:bg-primary-950"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record First Crop Cycle</span>
              </button>
            )}
          </div>
        ) : (
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
                      <span>{cc.crop_name || cc.crop_code}</span>
                    </Link>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-semibold">
                      {cc.season} Season
                    </span>
                    <StatusBadge variant="HEALTHY" label={cc.status || 'GROWING'} size="sm" />
                  </div>
                  <p className="text-xs text-slate-500">
                    {cc.farm_name || 'Main Plot'} · Sown {formatDate(cc.sowing_date)} · Expected Harvest {formatDate(cc.expected_harvest_date)}
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
        )}
      </DetailCard>

      {/* Add Farm Modal */}
      {isAddFarmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Tractor className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Register Farm Parcel</h3>
                  <p className="text-[11px] text-slate-500">Link verified land cadastre for {borrower.display_name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddFarmOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFarm} className="p-6 space-y-4">
              {farmError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  <div>{farmError}</div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 block">Parcel / Farm Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Plot - Survey No. 42"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Area Value *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={farmArea}
                    onChange={(e) => setFarmArea(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Area Unit</label>
                  <select
                    value={farmUnit}
                    onChange={(e) => setFarmUnit(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                  >
                    <option value="hectare">Hectares (ha)</option>
                    <option value="acre">Acres</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Latitude</label>
                  <input
                    type="text"
                    value={farmLat}
                    onChange={(e) => setFarmLat(e.target.value)}
                    placeholder="17.6599"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Longitude</label>
                  <input
                    type="text"
                    value={farmLon}
                    onChange={(e) => setFarmLon(e.target.value)}
                    placeholder="75.9064"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Village</label>
                  <input
                    type="text"
                    value={farmVillage}
                    onChange={(e) => setFarmVillage(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">District</label>
                  <input
                    type="text"
                    value={farmDistrict}
                    onChange={(e) => setFarmDistrict(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">State</label>
                  <input
                    type="text"
                    value={farmState}
                    onChange={(e) => setFarmState(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddFarmOpen(false)}
                  disabled={farmLoading}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={farmLoading}
                  className="px-4 py-2 rounded-xl bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {farmLoading ? 'Saving...' : 'Save Farm Parcel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Crop Cycle Modal */}
      {isAddCropCycleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-900 flex items-center justify-center">
                  <Sprout className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Add Seasonal Crop Cycle</h3>
                  <p className="text-[11px] text-slate-500">Record sowing and expected harvest for {borrower.display_name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCropCycleOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCropCycle} className="p-6 space-y-4">
              {cropCycleError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  <div>{cropCycleError}</div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 block">Select Farm Parcel</label>
                <select
                  value={selectedFarmId}
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.cultivated_area || f.area_value || 2.5} {f.area_unit || 'ha'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Crop Type</label>
                  <select
                    value={cropCode}
                    onChange={(e) => setCropCode(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                  >
                    <option value="Sugarcane">Sugarcane</option>
                    <option value="Soybean">Soybean</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Maize">Maize</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Season</label>
                  <select
                    value={cropSeason}
                    onChange={(e) => setCropSeason(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                  >
                    <option value="Kharif">Kharif</option>
                    <option value="Rabi">Rabi</option>
                    <option value="Zaid">Zaid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Sowing Date</label>
                  <input
                    type="date"
                    required
                    value={sowingDate}
                    onChange={(e) => setSowingDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Expected Harvest Date</label>
                  <input
                    type="date"
                    required
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Planted Area (ha)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={cropArea}
                    onChange={(e) => setCropArea(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Irrigation Delivery</label>
                  <select
                    value={irrigationType}
                    onChange={(e) => setIrrigationType(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                  >
                    <option value="Drip Irrigation">Drip Irrigation</option>
                    <option value="Canal Gravity">Canal Gravity</option>
                    <option value="Sprinkler System">Sprinkler System</option>
                    <option value="Rainfed (Dryland)">Rainfed (Dryland)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddCropCycleOpen(false)}
                  disabled={cropCycleLoading}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={cropCycleLoading}
                  className="px-4 py-2 rounded-xl bg-primary-900 text-white text-xs font-bold hover:bg-primary-950 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {cropCycleLoading ? 'Saving...' : 'Register Crop Cycle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
