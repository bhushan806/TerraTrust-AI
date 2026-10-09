import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Tractor,
  MapPin,
  Lock,
  Layers,
  Sprout,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Maximize2,
  Satellite,
  Compass,
  FileCheck,
  UploadCloud,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DetailCard } from '@/components/data-display/DetailCard';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { FreshnessIndicator } from '@/components/data-display/FreshnessIndicator';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { formatArea } from '@/lib/formatters/units';
import { formatDate } from '@/lib/formatters/date';
import { typedGet } from '@/lib/api-client/client';
import { queryKeys } from '@/lib/query-client/query-keys';
import { Farm, CropCycle } from '@/types/domain';
import { DocumentUploadManager } from '@/components/forms/DocumentUploadManager';
import { IMAGERY_ASSETS } from '@/lib/assets/imagery';

export const FarmDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeMapLayer, setActiveMapLayer] = useState<'AERIAL' | 'NDVI' | 'SOIL'>('AERIAL');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DOCUMENTS'>('OVERVIEW');

  const farmQuery = useQuery({
    queryKey: queryKeys.farm(id || 'farm-201'),
    queryFn: () =>
      typedGet<{ farm: Farm; crop_cycles: CropCycle[] }>(`/farms/${id || 'farm-201'}`),
  });

  if (farmQuery.isLoading) {
    return <LoadingState message="Retrieving farm cadastre & environmental parcel data..." />;
  }

  if (farmQuery.isError || !farmQuery.data) {
    return (
      <ErrorState
        error={farmQuery.error}
        title="Farm Parcel Not Found"
        onRetry={() => farmQuery.refetch()}
      />
    );
  }

  const { farm, crop_cycles } = farmQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={farm.name}
        subtitle={`${farm.location_name} · Operated by ${farm.borrower_name}`}
        breadcrumbs={[
          { label: 'Borrowers', href: '/borrowers' },
          { label: farm.borrower_name, href: `/borrowers/${farm.borrower_id}` },
          { label: farm.name, current: true },
        ]}
        badge={<StatusBadge variant="PRODUCTION" size="md" />}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/crop-cycles/cycle-301/climate"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-900 text-white rounded-xl text-xs font-bold hover:bg-primary-950 shadow-2xs transition-colors"
            >
              <span>Climate Intelligence</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        }
      />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'OVERVIEW'
              ? 'border-primary-800 text-primary-950'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Parcel Overview & Cadastre GIS
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('DOCUMENTS')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'DOCUMENTS'
              ? 'border-primary-800 text-primary-950'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Land Titles & Satellite Scans</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono">
            5
          </span>
        </button>
      </div>

      {activeTab === 'DOCUMENTS' ? (
        <DocumentUploadManager farmId={farm.id} farmName={farm.name} />
      ) : (
        <>
          {/* Geospatial Satellite & Drone Viewer */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
              <div className="flex items-center gap-2">
                <Satellite className="w-4 h-4 text-primary-800" />
                <h3 className="font-bold text-sm text-slate-900 font-display">
                  Remote Sensing Earth Observation Cadastre
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  [Centroid: {farm.latitude_approx}°, {farm.longitude_approx}°]
                </span>
              </div>

              {/* Layer Switcher */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs shadow-2xs">
                <button
                  type="button"
                  onClick={() => setActiveMapLayer('AERIAL')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    activeMapLayer === 'AERIAL'
                      ? 'bg-primary-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Drone True-Color
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMapLayer('NDVI')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    activeMapLayer === 'NDVI'
                      ? 'bg-primary-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Sentinel-2 NDVI
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMapLayer('SOIL')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    activeMapLayer === 'SOIL'
                      ? 'bg-primary-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Soil Moisture IoT
                </button>
              </div>
            </div>

            {/* Satellite Map Canvas */}
            <div className="relative h-72 sm:h-96 w-full bg-slate-950 overflow-hidden">
              <img
                src={
                  activeMapLayer === 'NDVI'
                    ? IMAGERY_ASSETS.lushCropsAerial
                    : activeMapLayer === 'SOIL'
                    ? IMAGERY_ASSETS.soilMoistureSensor
                    : IMAGERY_ASSETS.satelliteParcel
                }
                alt="Farm satellite imagery"
                className="w-full h-full object-cover"
              />

              {/* Cadastral Polygon Overlay Visual */}
              <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/30 pointer-events-none" />

              {/* Floating Cadastre Marker */}
              <div className="absolute top-6 left-6 p-3 rounded-xl bg-slate-900/80 backdrop-blur-md text-white text-xs border border-white/20 shadow-lg space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-400">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Cadastral Parcel: 143-A</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Area: {formatArea(farm.total_area, farm.area_unit)} · Status: Clear Title
                </p>
                <div className="text-[10px] text-slate-400 font-mono">
                  Mahabhulekh Ref: MH-SGL-2026-991
                </div>
              </div>

              {/* Layer Legend Overlay */}
              <div className="absolute bottom-6 right-6 p-3 rounded-xl bg-slate-900/80 backdrop-blur-md text-white text-xs border border-white/20 shadow-lg space-y-1.5 font-mono text-[11px]">
                <div className="font-bold text-white uppercase text-[10px] tracking-wider">
                  {activeMapLayer === 'NDVI' ? 'NDVI Density Scale' : 'Raster Legend'}
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-emerald-500" />
                  <span>Dense Vigor (&gt;0.70)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-amber-500" />
                  <span>Moderate (0.40 - 0.70)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Farm Profile & Cadastral Areas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DetailCard title="Parcel & Soil Characteristics" className="md:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-500 block text-[11px] font-bold">Total Titled Area</span>
                  <span className="font-extrabold text-slate-900 text-base font-tabular">
                    {formatArea(farm.total_area, farm.area_unit)}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100">
                  <span className="text-emerald-800 block text-[11px] font-bold">Cultivated Area</span>
                  <span className="font-extrabold text-emerald-950 text-base font-tabular">
                    {formatArea(farm.cultivated_area, farm.area_unit)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Soil Classification</span>
                  <span className="font-bold text-slate-800 text-sm">{farm.soil_type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Primary Irrigation</span>
                  <span className="font-bold text-slate-800 text-sm">{farm.irrigation_type}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Administrative District</span>
                  <span className="font-semibold text-slate-800">
                    {farm.district}, {farm.state}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Authoritative Cadastre Source</span>
                  <span className="font-semibold text-slate-800">{farm.data_source}</span>
                </div>
              </div>
            </DetailCard>

            {/* Location Privacy & Freshness */}
            <DetailCard title="Location Privacy & Telemetry">
              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px] mb-1 font-bold">Observation Freshness</span>
                  <FreshnessIndicator timestamp={farm.updated_at} thresholdHours={48} sourceName={farm.data_source} showExplanation />
                </div>

                {/* Location Privacy Notice */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-slate-700 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Geospatial Privacy Guard</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600">
                    Centroid coordinates are obfuscated to 3 decimal places (~100m radius) to preserve farmer privacy under RBI Fair Practice codes.
                  </p>
                  {farm.latitude_approx && farm.longitude_approx && (
                    <div className="font-mono text-[11px] text-slate-500 pt-1">
                      Approx. Lat: {farm.latitude_approx}°, Lon: {farm.longitude_approx}°
                    </div>
                  )}
                </div>
              </div>
            </DetailCard>
          </div>

          {/* Linked Crop Cycles */}
          <DetailCard
            title={`Crop Cycles on this Parcel (${crop_cycles.length})`}
            subtitle="Active, harvested, or planned planting cycles"
          >
            <div className="space-y-3">
              {crop_cycles.map((cc) => (
                <div
                  key={cc.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs hover:shadow-card transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/crop-cycles/${cc.id}`} className="font-bold text-sm text-slate-900 hover:text-primary-800 hover:underline flex items-center gap-1.5">
                        <Sprout className="w-4 h-4 text-emerald-700" />
                        <span>{cc.crop_name}</span>
                      </Link>
                      <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-semibold">
                        {cc.season}
                      </span>
                      <StatusBadge variant="HEALTHY" label={cc.status} size="sm" />
                    </div>
                    <p className="text-xs text-slate-500">
                      Acreage: {formatArea(cc.area_value, cc.area_unit)} · Sowing: {formatDate(cc.sowing_date)} · Expected Harvest: {formatDate(cc.expected_harvest_date)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/crop-cycles/${cc.id}`}
                      className="px-3.5 py-1.5 bg-primary-900 text-white rounded-lg text-xs font-bold hover:bg-primary-950 shadow-2xs transition-colors"
                    >
                      Inspect Cycle
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </DetailCard>
        </>
      )}
    </div>
  );
};
