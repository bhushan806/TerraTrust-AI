import React, { useState } from 'react';
import {
  Building2,
  ChevronDown,
  LogOut,
  Menu,
  ShieldCheck,
  Check,
  Bell,
  Search,
  Sparkles,
  AlertTriangle,
  CloudSun,
  X,
  ExternalLink,
} from 'lucide-react';
import { UserRole } from '@/types/domain';
import { ScopeContextState } from '@/types/ui';
import { Link } from 'react-router-dom';

interface TopbarProps {
  user: {
    name: string;
    email: string;
    role: UserRole;
  };
  scope: ScopeContextState;
  onLogout: () => void;
  onSwitchRole: (role: UserRole) => void;
  onToggleMobileNav: () => void;
  className?: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  user,
  scope,
  onLogout,
  onSwitchRole,
  onToggleMobileNav,
  className = '',
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showScopeDropdown, setShowScopeDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);

  const roles: { role: UserRole; label: string }[] = [
    { role: 'LOAN_OFFICER', label: 'Loan Officer' },
    { role: 'RISK_ANALYST', label: 'Risk Analyst' },
    { role: 'INSTITUTION_ADMIN', label: 'Institution Admin' },
    { role: 'PLATFORM_OPERATOR', label: 'Platform Operator' },
  ];

  const notifications = [
    {
      id: 'notif-1',
      title: 'Canal Rotation Release Confirmed',
      desc: 'Warna Left Bank canal 4th irrigation cycle confirmed for Plot 143-A (Rameshwar Patil).',
      time: '12m ago',
      type: 'info',
      link: '/officer/crop-cycles/cycle-301',
    },
    {
      id: 'notif-2',
      title: 'Elevated Heatwave Alert (Solapur Cane)',
      desc: 'IMD 3-day max temp forecast >41°C. Soil moisture stress risk flagged.',
      time: '1h ago',
      type: 'warning',
      link: '/officer/crop-cycles/cycle-301/climate',
    },
  ];

  return (
    <header
      className={`h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 select-none z-30 sticky top-0 ${className}`}
    >
      {/* Left: Mobile Nav Toggle & Institutional Scope Indicator */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileNav}
          aria-label="Open navigation sidebar"
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-700"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mandatory Scope Indicator */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowScopeDropdown(!showScopeDropdown)}
            aria-expanded={showScopeDropdown}
            aria-label="Active institutional branch scope"
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100/90 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-700 transition-all duration-150 shadow-2xs hover:shadow-xs"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Building2 className="w-3.5 h-3.5 text-primary-800 shrink-0" aria-hidden="true" />
            <div className="text-left flex items-center gap-1.5">
              <span className="text-slate-400 font-normal text-[11px]">Scope:</span>
              <span className="text-slate-900 font-bold">{scope.region}</span>
              <span className="text-slate-300">/</span>
              <span className="text-primary-900 font-bold">{scope.branchName}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-0.5" />
          </button>

          {showScopeDropdown && (
            <div
              className="absolute left-0 mt-1.5 w-76 rounded-2xl bg-white shadow-xl border border-slate-200/90 p-2 z-50 text-xs animate-in fade-in-50"
              role="menu"
            >
              <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1 flex items-center justify-between">
                <span>Select Scoped Regional Branch</span>
                <span className="text-emerald-700 font-mono">Kharif '26</span>
              </div>
              {scope.availableBranches.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    scope.setBranch(b.id);
                    setShowScopeDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-colors ${
                    b.id === scope.branchId
                      ? 'bg-primary-50 text-primary-900 font-bold border border-primary-100'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  role="menuitem"
                >
                  <div>
                    <span className="block font-semibold text-xs text-slate-900">{b.name}</span>
                    <span className="text-[11px] text-slate-500 font-medium">{b.region} Agricultural Division</span>
                  </div>
                  {b.id === scope.branchId && <Check className="w-4 h-4 text-primary-800 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center Search Shortcut (Clean Pill-Shaped with Subtle Border) */}
      <div className="hidden lg:flex items-center max-w-md w-full mx-4">
        <Link
          to="/officer/borrowers"
          className="w-full flex items-center justify-between px-4 py-2 rounded-full bg-slate-50/80 hover:bg-white border border-slate-200/90 hover:border-emerald-500/50 hover:shadow-sm text-xs text-slate-500 hover:text-slate-800 transition-all duration-200 group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            <span className="font-normal">Search farmers, 7/12 land parcels, assessments...</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white border border-slate-200 text-slate-400 group-hover:border-slate-300 shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </Link>
      </div>

      {/* Right: Notifications, Role Switcher & User Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Real-time Climate & Portfolio Notifications Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotificationDropdown(!showNotificationDropdown);
              if (unreadCount > 0) setUnreadCount(0);
            }}
            aria-label="View climate alerts and notices"
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative focus:outline-none focus:ring-2 focus:ring-primary-700 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {showNotificationDropdown && (
            <div
              className="absolute right-0 mt-2 w-84 rounded-2xl bg-white shadow-xl border border-slate-200 p-3 z-50 text-xs space-y-2 animate-in fade-in-50"
              role="dialog"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CloudSun className="w-4 h-4 text-emerald-700" />
                  <span>Climate & Portfolio Notices</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Live Telemetry</span>
              </div>

              <div className="space-y-1.5">
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    to={n.link}
                    onClick={() => setShowNotificationDropdown(false)}
                    className="block p-2.5 rounded-xl bg-slate-50 hover:bg-primary-50/60 border border-slate-100 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{n.desc}</p>
                  </Link>
                ))}
              </div>

              <div className="pt-1 text-center border-t border-slate-100">
                <Link
                  to="/officer/crop-cycles/cycle-301/climate"
                  onClick={() => setShowNotificationDropdown(false)}
                  className="text-[11px] font-bold text-primary-800 hover:underline inline-flex items-center gap-1"
                >
                  <span>Open Climate Intelligence Dashboard</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Role Switcher Pill */}
        <div className="relative hidden md:block">
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-full px-3 py-1 text-xs shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span className="text-slate-500 font-medium">Role:</span>
            <select
              value={user.role}
              onChange={(e) => onSwitchRole(e.target.value as UserRole)}
              aria-label="Switch user role for testing"
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer pr-1"
            >
              {roles.map((r) => (
                <option key={r.role} value={r.role}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* User Account Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            aria-expanded={showUserDropdown}
            aria-label="User account menu"
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-700 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-900 to-primary-700 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              {user.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left text-xs">
              <span className="font-bold text-slate-900 block leading-tight">{user.name}</span>
              <span className="text-[10px] text-slate-500 block leading-tight">{user.role.replace('_', ' ')}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserDropdown && (
            <div
              className="absolute right-0 mt-1.5 w-64 rounded-2xl bg-white shadow-xl border border-slate-200 p-2 z-50 text-xs animate-in fade-in-50"
              role="menu"
            >
              <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                <p className="font-bold text-slate-900">{user.name}</p>
                <p className="text-[11px] text-slate-500 font-mono truncate">{user.email}</p>
                <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-900 border border-primary-100 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3 text-emerald-700" />
                  <span>{user.role}</span>
                </div>
              </div>

              {/* Mobile Role Switcher */}
              <div className="md:hidden px-3 py-2 border-b border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Active Role (Switch)
                </span>
                <select
                  value={user.role}
                  onChange={(e) => {
                    onSwitchRole(e.target.value as UserRole);
                    setShowUserDropdown(false);
                  }}
                  className="w-full text-xs font-semibold p-1.5 border border-slate-200 rounded-lg"
                >
                  {roles.map((r) => (
                    <option key={r.role} value={r.role}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserDropdown(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-rose-700 hover:bg-rose-50 flex items-center gap-2 font-semibold transition-colors"
                  role="menuitem"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
