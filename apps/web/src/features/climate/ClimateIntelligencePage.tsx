import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  CloudSun,
  Satellite,
  Droplets,
  Layers,
  RotateCcw,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Database,
  Calendar,
  Activity,
  Sparkles,
  Maximize2,
  ExternalLink,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { AccessibleLineChart } from '@/components/charts/AccessibleLineChart';
import { SourceMetadata } from '@/components/data-display/SourceMetadata';
import { ProviderFailure } from '@/components/feedback/ProviderFailure';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { formatDate } from '@/lib/formatters/date';
import { typedGet } from '@/lib/api-client/client';
import { queryKeys } from '@/lib/query-client/query-keys';
import {
  WeatherObservation,
  SatelliteObservation,
  SoilMoistureObservation,
  CropCycle,
} from '@/types/domain';
import { IMAGERY_ASSETS } from '@/lib/assets/imagery';

export const ClimateIntelligencePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [providerFailureSimulated, setProviderFailureSimulated] = useState(false);
  const [activeView, setActiveView] = useState<'CHARTS' | 'SATELLITE_GIS'>('CHARTS');

  const cycleQuery = useQuery({
    queryKey: queryKeys.cropCycle(id || 'cycle-301'),
    queryFn: () => typedGet<{ crop_cycle: CropCycle }>(`/crop-cycles/${id || 'cycle-301'}`),
  });

  const obsQuery = useQuery({
    queryKey: queryKeys.cropCycleObservations(id || 'cycle-301'),
    queryFn: () =>
      typedGet<{
        weather: WeatherObservation[];
        satellite: SatelliteObservation[];
        soil_moisture: SoilMoistureObservation[];
      }>(`/crop-cycles/${id || 'cycle-301'}/observations`),
  });

  if (obsQuery.isLoading || cycleQuery.isLoading) {
    return <LoadingState message="Fetching weather stations, Sentinel-2 imagery, and soil sensors..." />;
  }

  if (obsQuery.isError) {
    return (
      <ErrorState
        error={obsQuery.error}
        title="Telemetry Pipeline Failure"
        onRetry={() => obsQuery.refetch()}
      />
    );
  }

  const { weather, satellite, soil_moisture } = obsQuery.data || {
    weather: [],
    satellite: [],
    soil_moisture: [],
  };
  const cycle = cycleQuery.data?.crop_cycle;

  // Format data series for AccessibleLineChart
  const weatherChartData = weather.map((w) => ({
    date: formatDate(w.observed_at),
    temperature: w.temperature_c,
    rainfall: w.rainfall_mm,
    humidity: w.humidity_pct,
  }));

  const satelliteChartData = satellite.map((s) => ({
    date: formatDate(s.acquired_at),
    ndvi: s.ndvi,
    cloud: Number((s.cloud_fraction * 100).toFixed(1)),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agronomic & Climate-Risk Intelligence"
        subtitle={`Crop cycle telemetry for ${cycle?.crop_name || 'Crop'} (${cycle?.season || 'Season'}) · Station & satellite raster analysis`}
        breadcrumbs={[
          { label: 'Borrowers', href: '/borrowers' },
          { label: 'Crop Cycle', href: `/crop-cycles/${id || 'cycle-301'}` },
          { label: 'Climate Intelligence', current: true },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to="/assessments/asm-701"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-900 text-white rounded-xl text-xs font-bold hover:bg-primary-950 shadow-2xs transition-colors"
            >
              <span>Next: Credit Assessment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/admin/data-sources"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 shadow-2xs"
            >
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span>Branch: Data-Source Health</span>
            </Link>
            <button
              type="button"
              onClick={() => setProviderFailureSimulated(!providerFailureSimulated)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 transition-colors"
            >
              {providerFailureSimulated ? 'Clear Simulated Outage' : 'Simulate Provider Outage'}
            </button>
          </div>
        }
      />

      {/* Provider Outage Demonstration State */}
      {providerFailureSimulated && (
        <ProviderFailure
          providerName="India Meteorological Department (IMD) Numerical Weather Gateway"
          affectedIntelligence="daily precipitation & heat accumulation series"
          onRetry={() => setProviderFailureSimulated(false)}
        />
      )}

      {/* Visual Telemetry Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Sentinel-2 NDVI */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <Satellite className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Sentinel-2 MSI</span>
                <span className="text-[10px] text-slate-400">10m Ground Resolution</span>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-mono">
              0.742 NDVI
            </span>
          </div>

          <div className="relative h-24 rounded-xl overflow-hidden bg-slate-100">
            <img
              src={IMAGERY_ASSETS.lushCropsAerial}
              alt="Sentinel-2 vegetation scan"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-2 left-2 text-white text-[11px] font-mono">
              Peak Vegetative Stage
            </div>
          </div>
        </div>

        {/* Card 2: IoT Soil Moisture Probe */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Root-Zone Telemetry</span>
                <span className="text-[10px] text-slate-400">Soil Moisture Probe</span>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-mono">
              31.8% VWC
            </span>
          </div>

          <div className="relative h-24 rounded-xl overflow-hidden bg-slate-100">
            <img
              src={IMAGERY_ASSETS.soilMoistureSensor}
              alt="In-field soil probe"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-2 left-2 text-white text-[11px] font-mono">
              30cm Depth Optimal
            </div>
          </div>
        </div>

        {/* Card 3: Irrigation Canal Flow */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
                <CloudSun className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">Canal Water Allocation</span>
                <span className="text-[10px] text-slate-400">Warna Left Bank Rotation</span>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 font-mono">
              4 Rotas Active
            </span>
          </div>

          <div className="relative h-24 rounded-xl overflow-hidden bg-slate-100">
            <img
              src={IMAGERY_ASSETS.waterIrrigation}
              alt="Canal irrigation"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-2 left-2 text-white text-[11px] font-mono">
              Verified Irrigation Release
            </div>
          </div>
        </div>
      </div>

      {/* Weather Time-Series Chart */}
      <AccessibleLineChart
        title="Weather History & Numerical Forecast Series"
        data={weatherChartData}
        xKey="date"
        xLabel="Observation Date (IST)"
        yLabel="Temperature (°C) / Rainfall (mm)"
        series={[
          { key: 'temperature', name: 'Ambient Temp', stroke: '#D97706', unit: '°C' },
          { key: 'rainfall', name: 'Precipitation', stroke: '#175CD3', unit: 'mm', strokeDasharray: '4 4' },
          { key: 'humidity', name: 'Relative Humidity', stroke: '#0F766E', unit: '%' },
        ]}
        sourceName="India Meteorological Department — Baramati AWS"
        lastUpdated="2026-10-08T08:00:00Z"
        dateRange="Oct 04 – Oct 11, 2026"
        summaryText="Line chart showing daily temperatures ranging from 28.8°C to 32.2°C and maximum rainfall of 22mm on October 4, followed by 3-day dry forecast."
      />

      {/* Weather Provenance Metadata */}
      <SourceMetadata
        sourceName="India Meteorological Department (IMD) Automatic Weather Station"
        sourceId="IMD-AWS-PUN44"
        observedAt="2026-10-08T08:00:00Z"
        retrievedAt="2026-10-09T06:00:00Z"
        sourceTimezone="Asia/Kolkata (IST, UTC+05:30)"
        license="Government Open Data License - India (GODL)"
        thresholdHours={12}
      />

      {/* Satellite Crop Vegetation Vigor (NDVI) */}
      <div className="space-y-3">
        <AccessibleLineChart
          title="Satellite Crop Canopy Vigor (Sentinel-2 NDVI)"
          data={satelliteChartData}
          xKey="date"
          xLabel="Satellite Acquisition Date"
          yLabel="NDVI Index (0.0 – 1.0)"
          series={[
            { key: 'ndvi', name: 'NDVI Index', stroke: '#1F6B4F', unit: 'NDVI' },
            { key: 'cloud', name: 'Cloud Fraction', stroke: '#98A2B3', unit: '%', strokeDasharray: '3 3' },
          ]}
          sourceName="Copernicus Data Space Ecosystem (Sentinel-2 MSI Level-2A)"
          lastUpdated="2026-10-05T05:22:00Z"
          dateRange="Aug 26 – Oct 05, 2026"
          summaryText="NDVI vegetation index steadily climbed from 0.490 in late August to peak canopy vigor of 0.742 in early October with minimal cloud occlusion."
        />

        <SourceMetadata
          sourceName="European Space Agency (ESA) Copernicus Sentinel-2 MSI"
          sourceId="SENTINEL2-L2A-BOA"
          observedAt="2026-10-05T05:22:00Z"
          sourceTimezone="UTC"
          license="Copernicus Open Access License (Free, full and open data access)"
          thresholdHours={120}
        />
      </div>

      {/* Soil Moisture Section */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display">
              Root-Zone Soil Moisture Sensors
            </h3>
            <p className="text-xs text-slate-500">Volumetric moisture retention at 10cm and 30cm depths</p>
          </div>
          <StatusBadge variant="HEALTHY" size="sm" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {soil_moisture.map((sm) => (
            <div key={sm.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[11px] text-slate-500 font-bold block uppercase tracking-wider">
                Sensor Depth {sm.depth_cm} cm
              </span>
              <div className="text-3xl font-extrabold text-blue-900 font-tabular font-display">{sm.value_pct}%</div>
              <p className="text-[11px] text-slate-500 font-mono">
                Observed: {formatDate(sm.observed_at)} · {sm.source_id}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
