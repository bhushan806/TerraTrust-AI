import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Tractor,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  Server,
  Sprout,
  Compass,
  FolderLock,
  Plus,
  CloudSun,
  ChevronRight,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';
import { UserRole } from '@/types/domain';
import { hasPermission } from '@/lib/auth/permissions';

interface SidebarProps {
  currentRole: UserRole;
  onNavigate?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRole, onNavigate, className = '' }) => {
  const isEnabledPortfolio = import.meta.env.VITE_ENABLE_PORTFOLIO === 'true';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
      isActive
        ? 'bg-emerald-50 text-emerald-900 font-bold border-l-4 border-emerald-600 rounded-r-xl rounded-l-sm shadow-xs'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <aside
      aria-label="Sidebar Navigation"
      className={`w-64 border-r border-slate-200/90 bg-white flex flex-col justify-between h-full select-none ${className}`}
    >
      <div className="p-4 space-y-6 overflow-y-auto">
        {/* Institutional Product Brand */}
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-900/20">
            <Sprout className="w-5 h-5 text-emerald-300" aria-hidden="true" />
          </div>
          <div>
            <div className="text-base font-extrabold text-slate-900 tracking-tight font-display flex items-center gap-1.5">
              <span>TerraTrust</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full border border-emerald-200">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
              Agri-Credit & Climate Risk
            </p>
          </div>
        </div>

        {/* Quick Action: Prominent "New Assessment" button */}
        {hasPermission(currentRole, 'CREATE_ASSESSMENT') && (
          <NavLink
            to="/officer/assessments/new"
            onClick={onNavigate}
            className="flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-md shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:scale-[1.02] active:scale-95 transition-all duration-200 group"
          >
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-200">
              <Plus className="w-3.5 h-3.5 text-white stroke-[3]" />
            </div>
            <span>New Assessment</span>
          </NavLink>
        )}

        {/* Navigation Sections */}
        <nav className="space-y-6">
          {/* Section: Overview */}
          <div>
            <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Portfolio Overview
            </span>
            <div className="space-y-1">
              {hasPermission(currentRole, 'VIEW_DASHBOARD') && (
                <NavLink to="/officer" end className={linkClass} onClick={onNavigate}>
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-emerald-700 group-[.font-bold]:text-emerald-700" />
                    <span>Dashboard</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-0 group-[.font-bold]:opacity-100 text-emerald-600" />
                </NavLink>
              )}
              {isEnabledPortfolio ? (
                <NavLink to="/officer/portfolio" className={linkClass} onClick={onNavigate}>
                  <div className="flex items-center gap-2.5">
                    <Compass className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-emerald-700 group-[.font-bold]:text-emerald-700" />
                    <span>Portfolio Analytics</span>
                  </div>
                </NavLink>
              ) : (
                <div className="flex items-center justify-between px-3.5 py-2 text-xs text-slate-400 opacity-60">
                  <span className="flex items-center gap-2.5">
                    <Compass className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>Portfolio Analytics</span>
                  </span>
                  <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-mono">Gated</span>
                </div>
              )}
            </div>
          </div>

          {/* Section: Field & Agricultural Borrowers */}
          {hasPermission(currentRole, 'VIEW_BORROWERS') && (
            <div>
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Field & Borrowers
              </span>
              <div className="space-y-1">
                <NavLink to="/officer/borrowers" className={linkClass} onClick={onNavigate}>
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-emerald-700 group-[.font-bold]:text-emerald-700" />
                    <span>Borrower Directory</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 group-[.font-bold]:bg-emerald-100 text-slate-600 group-[.font-bold]:text-emerald-800 font-bold">
                    42
                  </span>
                </NavLink>
                <NavLink to="/officer/farms/farm-201" className={linkClass} onClick={onNavigate}>
                  <div className="flex items-center gap-2.5">
                    <Tractor className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-emerald-700 group-[.font-bold]:text-emerald-700" />
                    <span>Farm Parcels (farm-201)</span>
                  </div>
                </NavLink>
                <NavLink to="/officer/crop-cycles/cycle-301" className={linkClass} onClick={onNavigate}>
                  <div className="flex items-center gap-2.5">
                    <Sprout className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-emerald-700 group-[.font-bold]:text-emerald-700" />
                    <span>Crop Cycle & Field IoT</span>
                  </div>
                </NavLink>
                <NavLink to="/officer/crop-cycles/cycle-301/climate" className={linkClass} onClick={onNavigate}>
                  <div className="flex items-center gap-2.5">
                    <CloudSun className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-emerald-700 group-[.font-bold]:text-emerald-700" />
                    <span>Climate Telemetry</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </NavLink>
              </div>
            </div>
          )}

          {/* Section: Credit Risk Engine */}
          {(hasPermission(currentRole, 'CREATE_LOAN_APPLICATION') ||
            hasPermission(currentRole, 'CREATE_ASSESSMENT') ||
            hasPermission(currentRole, 'VIEW_ASSESSMENT_DETAIL')) && (
            <div>
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Credit & Risk Underwriting
              </span>
              <div className="space-y-1">
                {hasPermission(currentRole, 'CREATE_LOAN_APPLICATION') && (
                  <NavLink to="/officer/loan-applications/new" className={linkClass} onClick={onNavigate}>
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-emerald-700 group-[.font-bold]:text-emerald-700" />
                      <span>New Loan Application</span>
                    </div>
                  </NavLink>
                )}
                {hasPermission(currentRole, 'CREATE_ASSESSMENT') && (
                  <NavLink to="/officer/assessments/new" className={linkClass} onClick={onNavigate}>
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-emerald-700 group-[.font-bold]:text-emerald-700" />
                      <span>Risk Assessment Pipeline</span>
                    </div>
                  </NavLink>
                )}
                <NavLink to="/officer/assessments/asm-701" className={linkClass} onClick={onNavigate}>
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-emerald-700 group-[.font-bold]:text-emerald-700" />
                    <span>Assessment (asm-701)</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 group-[.font-bold]:bg-emerald-200 text-emerald-800 font-bold">
                    Score 78
                  </span>
                </NavLink>
                <NavLink to="/officer/assessments/asm-702" className={linkClass} onClick={onNavigate}>
                  <div className="flex items-center gap-2.5">
                    <FolderLock className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-emerald-700 group-[.font-bold]:text-emerald-700" />
                    <span className="truncate">Gated Assessment (asm-702)</span>
                  </div>
                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-bold">
                    PD Gate
                  </span>
                </NavLink>
              </div>
            </div>
          )}

          {/* Section: Administration & System */}
          {(hasPermission(currentRole, 'MANAGE_USERS') ||
            hasPermission(currentRole, 'VIEW_DATA_SOURCE_HEALTH')) && (
            <div>
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                System Administration
              </span>
              <div className="space-y-1">
                {hasPermission(currentRole, 'MANAGE_USERS') && (
                  <NavLink to="/officer/admin/users" className={linkClass} onClick={onNavigate}>
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-emerald-700 group-[.font-bold]:text-emerald-700" />
                      <span>User Administration</span>
                    </div>
                  </NavLink>
                )}
                {hasPermission(currentRole, 'VIEW_DATA_SOURCE_HEALTH') && (
                  <NavLink to="/officer/admin/data-sources" className={linkClass} onClick={onNavigate}>
                    <div className="flex items-center gap-2.5">
                      <Server className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-emerald-700 group-[.font-bold]:text-emerald-700" />
                      <span>Data Source Health</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </NavLink>
                )}
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Institutional Compliance Notice Footer */}
      <div className="p-4 border-t border-slate-200/80 bg-slate-50/80 text-[11px] text-slate-500 space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-slate-700">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>RBI Climate-Risk Prudence</span>
        </div>
        <p className="leading-tight text-[11px]">
          Backend-authoritative risk engine. Automated approvals disabled by policy.
        </p>
      </div>
    </aside>
  );
};
