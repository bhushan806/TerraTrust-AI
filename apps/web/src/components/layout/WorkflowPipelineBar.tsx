import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Lock,
  LayoutDashboard,
  Users,
  User,
  Sprout,
  CloudSun,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Settings,
  Database,
  ChevronRight,
  ChevronDown,
  Workflow,
  Sparkles,
} from 'lucide-react';

interface Step {
  id: number;
  label: string;
  shortLabel: string;
  path: string;
  icon: React.ReactNode;
  bgActive: string;
  textColor: string;
  badgeBg: string;
  description: string;
  matches: (pathname: string) => boolean;
}

export const WorkflowPipelineBar: React.FC = () => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);

  const steps: Step[] = [
    {
      id: 1,
      label: 'Login',
      shortLabel: 'Login',
      path: '/login',
      icon: <Lock className="w-3.5 h-3.5" />,
      bgActive: 'bg-blue-600',
      textColor: 'text-blue-700',
      badgeBg: 'bg-blue-100 text-blue-800',
      description: 'OIDC Single Sign-On',
      matches: (p) => p.startsWith('/login'),
    },
    {
      id: 2,
      label: 'Dashboard',
      shortLabel: 'Dashboard',
      path: '/',
      icon: <LayoutDashboard className="w-3.5 h-3.5" />,
      bgActive: 'bg-teal-700',
      textColor: 'text-teal-700',
      badgeBg: 'bg-teal-100 text-teal-800',
      description: 'Portfolio & Telemetry',
      matches: (p) => p === '/',
    },
    {
      id: 3,
      label: 'Borrowers',
      shortLabel: 'Borrowers',
      path: '/borrowers',
      icon: <Users className="w-3.5 h-3.5" />,
      bgActive: 'bg-emerald-700',
      textColor: 'text-emerald-700',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      description: 'Directory & Triage',
      matches: (p) => p === '/borrowers',
    },
    {
      id: 4,
      label: 'Borrower Detail',
      shortLabel: 'Profile',
      path: '/borrowers/bor-1001',
      icon: <User className="w-3.5 h-3.5" />,
      bgActive: 'bg-amber-600',
      textColor: 'text-amber-700',
      badgeBg: 'bg-amber-100 text-amber-800',
      description: 'Land Title & KYC',
      matches: (p) => p.startsWith('/borrowers/') && !p.includes('/timeline'),
    },
    {
      id: 5,
      label: 'Farm / Crop Cycle',
      shortLabel: 'Farm/Crop',
      path: '/crop-cycles/cycle-301',
      icon: <Sprout className="w-3.5 h-3.5" />,
      bgActive: 'bg-emerald-800',
      textColor: 'text-emerald-800',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      description: 'Parcel & Soil IoT',
      matches: (p) =>
        (p.startsWith('/farms/') || p.startsWith('/crop-cycles/')) &&
        !p.includes('/climate') &&
        !p.includes('/yield') &&
        !p.includes('/income'),
    },
    {
      id: 6,
      label: 'Climate & Yield',
      shortLabel: 'Climate/Yield',
      path: '/crop-cycles/cycle-301/climate',
      icon: <CloudSun className="w-3.5 h-3.5" />,
      bgActive: 'bg-teal-800',
      textColor: 'text-teal-800',
      badgeBg: 'bg-teal-100 text-teal-800',
      description: 'NDVI Canopy & Rain',
      matches: (p) =>
        p.includes('/climate') || p.includes('/yield') || p.includes('/income'),
    },
    {
      id: 7,
      label: 'Credit Assessment',
      shortLabel: 'Credit Risk',
      path: '/assessments/asm-701',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      bgActive: 'bg-primary-900',
      textColor: 'text-primary-900',
      badgeBg: 'bg-primary-100 text-primary-900',
      description: 'Gated Score & PD',
      matches: (p) =>
        (p.startsWith('/assessments/') &&
          !p.includes('/explanations') &&
          !p.includes('/scenarios') &&
          !p.includes('/report')) ||
        p.startsWith('/loan-applications/'),
    },
    {
      id: 8,
      label: 'Explanations / Simulator',
      shortLabel: 'Explain & Sim',
      path: '/assessments/asm-701/explanations',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      bgActive: 'bg-indigo-700',
      textColor: 'text-indigo-700',
      badgeBg: 'bg-indigo-100 text-indigo-800',
      description: 'Fact/Contrib Drivers',
      matches: (p) =>
        p.includes('/explanations') ||
        p.includes('/scenarios') ||
        p.includes('/timeline'),
    },
    {
      id: 9,
      label: 'Report',
      shortLabel: 'Report',
      path: '/assessments/asm-701/report',
      icon: <FileText className="w-3.5 h-3.5" />,
      bgActive: 'bg-slate-900',
      textColor: 'text-slate-900',
      badgeBg: 'bg-slate-100 text-slate-800',
      description: 'Audited Decision Memo',
      matches: (p) => p.includes('/report'),
    },
  ];

  // Determine current active step index
  const activeStep = steps.find((s) => s.matches(location.pathname)) || steps[1];

  return (
    <aside
      aria-label="Agricultural Credit Decision Workflow Guide"
      className="mb-6 bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden transition-all duration-200"
    >
      {/* Header Bar */}
      <div className="px-4 sm:px-5 py-3 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-900 to-primary-700 text-emerald-300 flex items-center justify-center shadow-2xs">
            <Workflow className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-slate-900 font-display tracking-tight text-xs sm:text-sm">
              Agricultural Credit Decision Workflow
            </span>
            <span className="hidden md:inline-block ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 text-primary-900">
              Stage {activeStep.id} of 9: {activeStep.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Branch Links */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px]">
            <Link
              to="/admin/users"
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors ${
                location.pathname.startsWith('/admin/users')
                  ? 'bg-primary-900 text-white border-primary-900 font-bold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-medium'
              }`}
            >
              <Settings className="w-3 h-3 text-slate-400" />
              <span>Admin Users</span>
            </Link>

            <Link
              to="/admin/data-sources"
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-colors ${
                location.pathname.startsWith('/admin/data-sources')
                  ? 'bg-primary-900 text-white border-primary-900 font-bold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-medium'
              }`}
            >
              <Database className="w-3 h-3 text-slate-400" />
              <span>Data-Source Health</span>
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-label="Toggle pipeline view"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-700 transition-colors"
          >
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Expanded Stepper Steps */}
      {isExpanded && (
        <div className="p-3 sm:p-4 bg-white overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-[900px] justify-between">
            {steps.map((step, idx) => {
              const isCurrent = step.id === activeStep.id;
              const isPassed = step.id < activeStep.id;

              return (
                <React.Fragment key={step.id}>
                  <Link
                    to={step.path}
                    className={`group relative flex-1 flex flex-col p-2.5 rounded-xl border transition-all text-left focus:outline-none focus:ring-2 focus:ring-primary-700 ${
                      isCurrent
                        ? `${step.bgActive} text-white border-transparent shadow-card scale-[1.02] ring-2 ring-primary-500/20`
                        : isPassed
                        ? 'bg-slate-50/80 hover:bg-slate-100 border-slate-200/90 text-slate-800'
                        : 'bg-white hover:bg-slate-50 border-slate-200/70 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isCurrent
                            ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                            : isPassed
                            ? 'bg-slate-800 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {step.id}
                      </div>
                      <div
                        className={`${
                          isCurrent ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                        }`}
                      >
                        {step.icon}
                      </div>
                    </div>

                    <div className="truncate">
                      <span
                        className={`block text-xs font-bold truncate ${
                          isCurrent ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {step.shortLabel}
                      </span>
                      <span
                        className={`block text-[10px] truncate leading-tight mt-0.5 ${
                          isCurrent ? 'text-white/80' : 'text-slate-400'
                        }`}
                      >
                        {step.description}
                      </span>
                    </div>
                  </Link>

                  {idx < steps.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 -mx-0.5" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
};
