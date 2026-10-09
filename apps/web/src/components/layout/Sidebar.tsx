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
  AlertTriangle,
  FolderLock,
  Plus,
  CloudSun,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { UserRole } from '@/types/domain';
import { hasPermission } from '@/lib/auth/permissions';

interface SidebarProps {
  currentRole: UserRole;
  onNavigate?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRole, onNavigate, className = '' }) => {
  const isEnabledAlerts = import.meta.env.VITE_ENABLE_ALERTS === 'true';
  const isEnabledPortfolio = import.meta.env.VITE_ENABLE_PORTFOLIO === 'true';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
      isActive
        ? 'bg-primary-900 text-white shadow-xs font-bold'
        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
    }`;

  return (
    <aside
      aria-label="Sidebar Navigation"
      className={`w-64 border-r border-slate-200/90 bg-white flex flex-col justify-between h-full select-none ${className}`}
    >
      <div className="p-4 space-y-6 overflow-y-auto">
        {/* Institutional Product Brand */}
        <div className="flex items-center gap-3 px-1 py-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-900 to-primary-700 text-white flex items-center justify-center font-bold shadow-xs">
            <Sprout className="w-5 h-5 text-emerald-300" aria-hidden="true" />
          </div>
          <div>
            <div className="text-base font-extrabold text-slate-900 tracking-tight font-display flex items-center gap-1.5">
              <span>TerraTrust</span>
              <span className="text-[10px] bg-primary-100 text-primary-900 font-bold px-1.5 py-0.2 rounded-full">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
              Agri-Credit & Climate Risk
            </p>
          </div>
        </div>

        {/* Quick Action: New Assessment */}
        {hasPermission(currentRole, 'CREATE_ASSESSMENT') && (
          <NavLink
            to="/assessments/new"
            onClick={onNavigate}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-primary-900 to-primary-800 hover:from-primary-950 hover:to-primary-900 text-white text-xs font-bold shadow-xs hover:shadow-card transition-all duration-200 group"
          >
            <Plus className="w-4 h-4 text-emerald-300 group-hover:rotate-90 transition-transform duration-200" />
            <span>New Assessment</span>
          </NavLink>
        )}

        {/* Navigation Sections */}
        <nav className="space-y-5">
          {/* Section: Overview */}
          <div>
            <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Core Overview
            </span>
            <div className="space-y-1">
              {hasPermission(currentRole, 'VIEW_DASHBOARD') && (
                <NavLink to="/" end className={linkClass} onClick={onNavigate}>
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4 shrink-0 text-slate-500 group-[.font-bold]:text-emerald-300" />
                    <span>Dashboard</span>
                  </div>
                  <ChevronRight className="w-3 h-3 opacity-0 group-[.font-bold]:opacity-100 text-emerald-300" />
                </NavLink>
              )}
              {isEnabledPortfolio ? (
                <NavLink to="/portfolio" className={linkClass} onClick={onNavigate}>
                  <div className="flex items-center gap-2.5">
                    <Compass className="w-4 h-4 shrink-0 text-slate-500 group-[.font-bold]:text-emerald-300" />
                    <span>Portfolio Analytics</span>
                  </div>
                </NavLink>
              ) : (
                <div className="flex items-center justify-between px-3 py-1.5 text-xs text-slate-400 opacity-60">
                  <span className="flex items-center gap-2.5">
                    <Compass className="w-4 h-4 shrink-0" />
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
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Field & Farmers
              </span>
              <div className="space-y-1">
                <NavLink to="/borrowers" className={linkClass} onClick={onNavigate}>
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 shrink-0 text-slate-500 group-[.font-bold]:text-emerald-300" />
                    <span>Borrower Directory</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 group-[.font-bold]:bg-primary-800 text-slate-600 group-[.font-bold]:text-emerald-200">
                    42
                  </span>
                </NavLink>
                <NavLink to="/farms/farm-201" className={linkClass} onClick={onNavigate}>
                  <div className="flex items-center gap-2.5">
                    <Tractor className="w-4 h-4 shrink-0 text-slate-500 group-[.font-bold]:text-emerald-300" />
                    <span>Farm Parcels (farm-201)</span>
                  </div>
                </NavLink>
                <NavLink to="/crop-cycles/cycle-301" className={linkClass} onClick={onNavigate}>
                  <div className="flex items-center gap-2.5">
                    <Sprout className="w-4 h-4 shrink-0 text-slate-500 group-[.font-bold]:text-emerald-300" />
                    <span>Crop Cycle & Field IoT</span>
                  </div>
                </NavLink>
                <NavLink to="/crop-cycles/cycle-301/climate" className={linkClass} onClick={onNavigate}>
                  <div className="flex items-center gap-2.5">
                    <CloudSun className="w-4 h-4 shrink-0 text-slate-500 group-[.font-bold]:text-emerald-300" />
                    <span>Climate Telemetry</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </NavLink>
              </div>
            </div>
          )}

          {/* Section: Credit Risk Engine */}
          {(hasPermission(currentRole, 'CREATE_LOAN_APPLICATION') ||
            hasPermission(currentRole, 'CREATE_ASSESSMENT') ||
            hasPermission(currentRole, 'VIEW_ASSESSMENT_DETAIL')) && (
            <div>
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Credit & Risk Engine
              </span>
              <div className="space-y-1">
                {hasPermission(currentRole, 'CREATE_LOAN_APPLICATION') && (
                  <NavLink to="/loan-applications/new" className={linkClass} onClick={onNavigate}>
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className="w-4 h-4 shrink-0 text-slate-500 group-[.font-bold]:text-emerald-300" />
                      <span>New Loan Application</span>
                    </div>
                  </NavLink>
                )}
                {hasPermission(currentRole, 'CREATE_ASSESSMENT') && (
                  <NavLink to="/assessments/new" className={linkClass} onClick={onNavigate}>
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-slate-500 group-[.font-bold]:text-emerald-300" />
                      <span>New Risk Assessment</span>
                    </div>
                  </NavLink>
                )}
                <NavLink to="/assessments/asm-701" className={linkClass} onClick={onNavigate}>
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 shrink-0 text-slate-500 group-[.font-bold]:text-emerald-300" />
                    <span>Assessment (asm-701)</span>
                  </div>
                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-emerald-100 group-[.font-bold]:bg-emerald-800 text-emerald-800 group-[.font-bold]:text-emerald-100 font-bold">
                    Score 78
                  </span>
                </NavLink>
                <NavLink to="/assessments/asm-702" className={linkClass} onClick={onNavigate}>
                  <div className="flex items-center gap-2.5">
                    <FolderLock className="w-4 h-4 shrink-0 text-slate-500 group-[.font-bold]:text-emerald-300" />
                    <span className="truncate">Gated Assessment (asm-702)</span>
                  </div>
                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-mono font-bold">
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
              <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Administration
              </span>
              <div className="space-y-1">
                {hasPermission(currentRole, 'MANAGE_USERS') && (
                  <NavLink to="/admin/users" className={linkClass} onClick={onNavigate}>
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 shrink-0 text-slate-500 group-[.font-bold]:text-emerald-300" />
                      <span>User Administration</span>
                    </div>
                  </NavLink>
                )}
                {hasPermission(currentRole, 'VIEW_DATA_SOURCE_HEALTH') && (
                  <NavLink to="/admin/data-sources" className={linkClass} onClick={onNavigate}>
                    <div className="flex items-center gap-2.5">
                      <Server className="w-4 h-4 shrink-0 text-slate-500 group-[.font-bold]:text-emerald-300" />
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
