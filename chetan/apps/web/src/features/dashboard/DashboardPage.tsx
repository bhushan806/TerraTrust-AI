import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users,
  FileSpreadsheet,
  Clock,
  AlertTriangle,
  FileText,
  Server,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  Plus,
  Sprout,
  Activity,
  CloudSun,
  Droplets,
  Search,
  CheckCircle2,
  TrendingUp,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard } from '@/components/data-display/MetricCard';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { formatDateTime, formatRelativeTime } from '@/lib/formatters/date';
import { useScope, useAuth } from '@/app/providers';
import { typedGet } from '@/lib/api-client/client';
import { queryKeys } from '@/lib/query-client/query-keys';
import { Borrower, LoanApplication, CreditAssessment, DataSourceHealth } from '@/types/domain';
import { IMAGERY_ASSETS } from '@/lib/assets/imagery';

export const DashboardPage: React.FC = () => {
  const scope = useScope();
  const { user } = useAuth();
  const [assessmentFilter, setAssessmentFilter] = useState<'ALL' | 'HEALTHY' | 'HIGH_RISK'>('ALL');

  // Queries for dashboard metrics
  const borrowersQuery = useQuery({
    queryKey: queryKeys.borrowers({ branch_id: scope.branchId }),
    queryFn: () => typedGet<{ borrowers: Borrower[]; total: number }>(`/borrowers?branch_id=${scope.branchId}`),
  });

  const loansQuery = useQuery({
    queryKey: ['loans', scope.branchId],
    queryFn: async () => {
      const res = await typedGet<{ loan_application: LoanApplication }>('/loan-applications/la-501');
      return [res.loan_application];
    },
  });

  const assessmentsQuery = useQuery({
    queryKey: queryKeys.assessments({ branch_id: scope.branchId }),
    queryFn: async () => {
      const a1 = await typedGet<{ assessment: CreditAssessment }>('/assessments/asm-701');
      const a2 = await typedGet<{ assessment: CreditAssessment }>('/assessments/asm-702');
      const a3 = await typedGet<{ assessment: CreditAssessment }>('/assessments/asm-703');
      const a4 = await typedGet<{ assessment: CreditAssessment }>('/assessments/asm-704');
      return [a1.assessment, a2.assessment, a3.assessment, a4.assessment];
    },
  });

  const dataSourcesQuery = useQuery({
    queryKey: queryKeys.dataSourceHealth(),
    queryFn: () => typedGet<{ data_sources: DataSourceHealth[] }>('/data-sources'),
  });

  const borrowers = borrowersQuery.data?.borrowers || [];
  const assessments = assessmentsQuery.data || [];
  const dataSources = dataSourcesQuery.data?.data_sources || [];

  const pendingAssessments = assessments.filter((a) => a.status === 'PENDING').length;
  const highRiskAssessments = assessments.filter(
    (a) => a.risk_classification === 'HIGH' || a.risk_classification === 'CRITICAL'
  ).length;
  const staleDataSources = dataSources.filter(
    (ds) => ds.freshness_status === 'STALE' || ds.status === 'DEGRADED' || ds.status === 'DOWN'
  ).length;

  const filteredAssessments = assessments.filter((a) => {
    if (assessmentFilter === 'HEALTHY') return a.risk_classification === 'LOW';
    if (assessmentFilter === 'HIGH_RISK') return a.risk_classification === 'HIGH' || a.risk_classification === 'CRITICAL';
    return true;
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Executive Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-primary-950 via-primary-900 to-slate-900 text-white p-6 sm:p-8 shadow-card overflow-hidden">
        {/* Subtle Background Drone Farmland Overlay */}
        <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none">
          <img
            src={IMAGERY_ASSETS.satelliteParcel}
            alt="Agricultural background"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs font-semibold text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{scope.branchName} · Kharif 2026 Active Portfolio</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-white">
              {getGreeting()}, {user?.name || 'Officer'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Evaluating agricultural credit risks across <span className="font-bold text-white">{scope.region}</span> with Sentinel-2 satellite canopy indexes, canal flow telemetry, and verified crop yield models.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/borrowers"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 transform active:scale-[0.98]"
            >
              <Users className="w-4 h-4" />
              <span>Borrower Directory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/assessments/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold backdrop-blur-md transition-all duration-200"
            >
              <Plus className="w-4 h-4 text-emerald-300" />
              <span>New Assessment</span>
            </Link>

            <Link
              to="/crop-cycles/cycle-301/climate"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold backdrop-blur-md transition-all duration-200"
            >
              <CloudSun className="w-4 h-4 text-emerald-300" />
              <span>Climate Telemetry</span>
            </Link>
          </div>
        </div>

        {/* Ticker Badges */}
        <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-4 flex-wrap text-[11px]">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Telemetry Refreshed: {formatDateTime(new Date().toISOString())}</span>
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>{scope.institutionName}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge variant="PRODUCTION" size="sm" />
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
              NDVI 0.742 High Vigor
            </span>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          label="Active Borrowers"
          value={borrowersQuery.isLoading ? '—' : borrowersQuery.data?.total ?? 0}
          icon={<Users className="w-4 h-4" />}
          isLoading={borrowersQuery.isLoading}
          isError={borrowersQuery.isError}
          tooltip="Total agricultural borrowers scoped to current institution branch"
        />

        <MetricCard
          label="Open Applications"
          value={loansQuery.isLoading ? '—' : 3}
          icon={<FileSpreadsheet className="w-4 h-4" />}
          isLoading={loansQuery.isLoading}
          isError={loansQuery.isError}
          tooltip="Loan applications submitted and pending credit decision"
        />

        <MetricCard
          label="Pending Assessments"
          value={assessmentsQuery.isLoading ? '—' : pendingAssessments}
          icon={<Clock className="w-4 h-4" />}
          isLoading={assessmentsQuery.isLoading}
          isError={assessmentsQuery.isError}
          badge={pendingAssessments > 0 ? <StatusBadge variant="PENDING" size="sm" /> : undefined}
          tooltip="Credit risk assessments currently queued in the pipeline"
        />

        <MetricCard
          label="High-Risk Cases"
          value={assessmentsQuery.isLoading ? '—' : highRiskAssessments}
          icon={<AlertTriangle className="w-4 h-4" />}
          isLoading={assessmentsQuery.isLoading}
          isError={assessmentsQuery.isError}
          badge={highRiskAssessments > 0 ? <StatusBadge variant="HIGH_RISK" size="sm" /> : undefined}
          tooltip="Borrower portfolios exhibiting elevated climate or debt service distress"
        />

        <MetricCard
          label="Stale Telemetry"
          value={dataSourcesQuery.isLoading ? '—' : staleDataSources}
          icon={<Server className="w-4 h-4" />}
          isLoading={dataSourcesQuery.isLoading}
          isError={dataSourcesQuery.isError}
          badge={staleDataSources > 0 ? <StatusBadge variant="STALE" size="sm" /> : undefined}
          tooltip="External agronomic sources exceeding SLA refresh windows"
        />

        <MetricCard
          label="Reports Ready"
          value={2}
          icon={<FileText className="w-4 h-4" />}
          tooltip="Immutable PDF risk assessment reports available for download"
        />
      </div>

      {/* Main Dashboard Sections: Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Priority Risk Pipeline & Active Borrowers */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Assessment Pipeline */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-display">Recent Risk Assessments</h2>
                <p className="text-xs text-slate-500">
                  Evaluations generated with multi-factor climate, yield, and income models
                </p>
              </div>

              {/* Assessment Filter Pills */}
              <div className="flex items-center gap-1.5">
                {(['ALL', 'HEALTHY', 'HIGH_RISK'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setAssessmentFilter(filter)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                      assessmentFilter === filter
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {filter === 'ALL' ? 'All' : filter === 'HEALTHY' ? 'Low Risk' : 'High Risk'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredAssessments.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all duration-150"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/assessments/${a.id}`}
                        className="font-bold text-sm text-slate-900 hover:text-primary-800 hover:underline"
                      >
                        {a.borrower_name}
                      </Link>
                      <StatusBadge
                        variant={
                          a.risk_classification === 'LOW'
                            ? 'HEALTHY'
                            : a.risk_classification === 'HIGH' || a.risk_classification === 'CRITICAL'
                            ? 'HIGH_RISK'
                            : 'PENDING'
                        }
                        label={`${a.risk_classification} RISK`}
                        size="sm"
                      />
                      {a.pd_gate_status !== 'OPEN' && (
                        <StatusBadge variant="PD_UNAVAILABLE" size="sm" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      Assessment ID: {a.id} · Model {a.model_version}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-tabular">
                    <div className="text-right">
                      <span className="text-slate-400 block text-[11px]">Score</span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {a.score ? `${a.score}/100` : '—'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-400 block text-[11px]">Default Prob (PD)</span>
                      <span className="font-bold text-slate-800">
                        {a.probability_of_default !== null
                          ? `${(a.probability_of_default * 100).toFixed(1)}%`
                          : 'PD GATED'}
                      </span>
                    </div>

                    <Link
                      to={`/assessments/${a.id}`}
                      className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-800 hover:bg-slate-100 shadow-2xs transition-colors"
                    >
                      Inspect
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Active Farm & Crop Monitoring Overview with Satellite Imagery */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-display">Crop Cycle Agronomic Telemetry</h2>
                <p className="text-xs text-slate-500">Live vegetation, soil, and price indicators</p>
              </div>
              <Link
                to="/crop-cycles/cycle-301/climate"
                className="text-xs font-bold text-primary-800 hover:text-primary-950 flex items-center gap-1"
              >
                <span>Climate Intelligence</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-1">
                <span className="text-emerald-800 block text-[11px] font-bold uppercase">Sentinel-2 NDVI</span>
                <span className="text-2xl font-extrabold text-emerald-900 font-tabular font-display">0.742</span>
                <p className="text-[11px] text-emerald-700 mt-1">Canopy vigor above normal for Adsali Cane</p>
              </div>

              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200/80 space-y-1">
                <span className="text-blue-800 block text-[11px] font-bold uppercase">Root-Zone Moisture</span>
                <span className="text-2xl font-extrabold text-blue-900 font-tabular font-display">31.8%</span>
                <p className="text-[11px] text-blue-700 mt-1">NASA SMAP 30cm depth within optimal range</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-600 block text-[11px] font-bold uppercase">Mandatory FRP Price</span>
                <span className="text-2xl font-extrabold text-slate-900 font-tabular font-display">₹3,400 / MT</span>
                <p className="text-[11px] text-slate-500 mt-1">Cane FRP statutory benchmark verified</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Data Source Health & Tasks */}
        <div className="space-y-6">
          {/* Section: Data Source Health Snippet */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-900 font-display">Data-Source Health</h3>
              </div>
              <Link
                to="/admin/data-sources"
                className="text-xs font-bold text-primary-800 hover:text-primary-950"
              >
                Manage
              </Link>
            </div>

            <div className="space-y-2.5">
              {dataSources.map((ds) => (
                <div
                  key={ds.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-xs border border-slate-100"
                >
                  <div className="truncate pr-2">
                    <span className="font-bold text-slate-800 block truncate">{ds.name}</span>
                    <span className="text-[11px] text-slate-400">
                      Sync: {formatRelativeTime(ds.last_sync_at)}
                    </span>
                  </div>
                  <StatusBadge
                    variant={
                      ds.status === 'HEALTHY'
                        ? 'HEALTHY'
                        : ds.status === 'DEGRADED'
                        ? 'PENDING'
                        : 'FAILED'
                    }
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Institutional Compliance Card */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 text-xs text-emerald-950 space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Credit Governance Assurance</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              TerraTrust-AI is configured under RBI Climate Risk & Sustainable Lending Guidelines. Probability of default metrics are disabled until quantitative holdout validation gates pass.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
