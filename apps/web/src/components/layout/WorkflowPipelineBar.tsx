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
  FileText,
  ChevronDown,
  Check,
  Workflow,
} from 'lucide-react';

interface Step {
  id: number;
  name: string;
  tooltip: string;
  path: string;
  icon: React.ReactNode;
  matches: (pathname: string) => boolean;
}

export const WorkflowPipelineBar: React.FC = () => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);

  const steps: Step[] = [
    {
      id: 1,
      name: 'Login',
      tooltip: 'OIDC SSO Authentication',
      path: '/login',
      icon: <Lock className="w-3.5 h-3.5" />,
      matches: (p) => p.startsWith('/login'),
    },
    {
      id: 2,
      name: 'Dashboard',
      tooltip: 'Portfolio & Telemetry Overview',
      path: '/officer',
      icon: <LayoutDashboard className="w-3.5 h-3.5" />,
      matches: (p) => p === '/officer' || p === '/officer/',
    },
    {
      id: 3,
      name: 'Borrowers',
      tooltip: 'Directory & Triage Queue',
      path: '/officer/borrowers',
      icon: <Users className="w-3.5 h-3.5" />,
      matches: (p) => p === '/officer/borrowers',
    },
    {
      id: 4,
      name: 'Profile',
      tooltip: 'Borrower KYC & Land Title 7/12',
      path: '/officer/borrowers/bor-1001',
      icon: <User className="w-3.5 h-3.5" />,
      matches: (p) => p.startsWith('/officer/borrowers/') && !p.includes('/timeline'),
    },
    {
      id: 5,
      name: 'Farm/Crop',
      tooltip: 'Farm Parcel & Field Soil IoT',
      path: '/officer/crop-cycles/cycle-301',
      icon: <Sprout className="w-3.5 h-3.5" />,
      matches: (p) =>
        (p.startsWith('/officer/farms/') || p.startsWith('/officer/crop-cycles/')) &&
        !p.includes('/climate') &&
        !p.includes('/yield') &&
        !p.includes('/income'),
    },
    {
      id: 6,
      name: 'Climate',
      tooltip: 'Sentinel-2 NDVI & Rain Telemetry',
      path: '/officer/crop-cycles/cycle-301/climate',
      icon: <CloudSun className="w-3.5 h-3.5" />,
      matches: (p) => p.includes('/climate') || p.includes('/yield') || p.includes('/income'),
    },
    {
      id: 7,
      name: 'Risk',
      tooltip: 'Credit Risk Scoring & Gated PD',
      path: '/officer/assessments/asm-701',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      matches: (p) =>
        (p.startsWith('/officer/assessments/') && !p.includes('/report')) ||
        p.startsWith('/officer/loan-applications/'),
    },
    {
      id: 8,
      name: 'Report',
      tooltip: 'Immutable PDF Audit Decision',
      path: '/officer/assessments/asm-701/report',
      icon: <FileText className="w-3.5 h-3.5" />,
      matches: (p) => p.includes('/report'),
    },
  ];

  const activeStep = steps.find((s) => s.matches(location.pathname)) || steps[1];

  return (
    <aside
      aria-label="Agricultural Credit Decision Workflow Guide"
      className="mb-6 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all duration-200"
    >
      {/* Top Header Bar */}
      <div className="px-5 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <Workflow className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className="font-bold text-slate-900 text-xs tracking-tight">
            Credit Workflow
          </span>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Step {activeStep.id} of {steps.length}: {activeStep.name}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title={isExpanded ? 'Collapse Stepper' : 'Expand Stepper'}
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Stepper Steps — Sleek Horizontal Connected Line with Numbered / Checkmark Circles */}
      {isExpanded && (
        <div className="px-4 py-4 bg-white overflow-x-auto">
          <div className="flex items-center justify-between min-w-[620px] max-w-4xl mx-auto px-2">
            {steps.map((step, idx) => {
              const isCurrent = step.id === activeStep.id;
              const isPassed = step.id < activeStep.id;
              const isLast = idx === steps.length - 1;

              return (
                <React.Fragment key={step.id}>
                  {/* Step Item */}
                  <Link
                    to={step.path}
                    title={`${step.name}: ${step.tooltip}`}
                    className="group relative flex flex-col items-center gap-2 focus:outline-none"
                  >
                    {/* Circle */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-200 ${
                        isCurrent
                          ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_14px_rgba(16,185,129,0.45)] ring-4 ring-emerald-500/20 scale-105'
                          : isPassed
                          ? 'bg-slate-900 border-slate-900 text-white shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-400 group-hover:border-slate-300 group-hover:text-slate-600'
                      }`}
                    >
                      {isPassed ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                      ) : (
                        <span>{step.id}</span>
                      )}
                    </div>

                    {/* Step Label — Clean and un-cluttered */}
                    <span
                      className={`text-xs font-bold transition-colors ${
                        isCurrent
                          ? 'text-emerald-700 font-extrabold'
                          : isPassed
                          ? 'text-slate-800'
                          : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    >
                      {step.name}
                    </span>
                  </Link>

                  {/* Sleek Horizontal Connector Line */}
                  {!isLast && (
                    <div
                      className={`flex-1 h-0.5 mx-2 rounded-full transition-colors duration-300 ${
                        step.id < activeStep.id ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    />
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
