import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers';
import {
  Sprout,
  ShieldCheck,
  Lock,
  AlertCircle,
  RotateCcw,
  Building2,
  CheckCircle2,
  Satellite,
  TrendingUp,
  Activity,
  ArrowRight,
  BadgeCheck,
} from 'lucide-react';
import { initiateOidcLogin } from '@/lib/auth/oidc';
import { UserRole } from '@/types/domain';
import { IMAGERY_ASSETS } from '@/lib/assets/imagery';

export const LoginPage: React.FC<LoginPageProps> = () => {
  const { login, switchRoleForDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [selectedDemoRole, setSelectedDemoRole] = useState<UserRole>('LOAN_OFFICER');

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setAuthError(null);
      await initiateOidcLogin();
      switchRoleForDemo(selectedDemoRole);
      await login();
      navigate(from, { replace: true });
    } catch (err: any) {
      setAuthError(
        'Unable to complete institutional identity sign-in. The identity provider may be temporarily unavailable or the authorization request expired.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (role: UserRole) => {
    try {
      setIsLoading(true);
      setAuthError(null);
      switchRoleForDemo(role);
      await login();
      navigate(from, { replace: true });
    } catch (err: any) {
      setAuthError('Error initiating demo session.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans selection:bg-primary-900 selection:text-white">
      {/* Skip Link for Accessibility */}
      <a
        href="#login-card"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-900 focus:text-white focus:rounded-md text-xs font-bold"
      >
        Skip to sign-in form
      </a>

      {/* LEFT COLUMN: Modern Enterprise Sign-In Card */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-16">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-900 to-primary-700 text-white flex items-center justify-center shadow-md">
              <Sprout className="w-5 h-5 text-emerald-300" aria-hidden="true" />
            </div>
            <div>
              <div className="text-base font-extrabold text-slate-900 tracking-tight font-display flex items-center gap-1.5">
                <span>TerraTrust</span>
                <span className="text-[11px] bg-primary-100 text-primary-900 font-bold px-1.5 py-0.2 rounded-full">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Agri-Credit & Climate Risk Intelligence</p>
            </div>
          </div>

          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-700 shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-primary-800" />
            <span>Apex Rural Credit Bank</span>
          </div>
        </div>

        {/* Center: Sign-In Card Form */}
        <div id="login-card" className="my-auto max-w-md w-full mx-auto py-8 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Institutional Single Sign-On (OIDC)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
              Enterprise Bank Sign In
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Agricultural lending and climate-risk intelligence for responsible, data-backed financial decisions.
            </p>
          </div>

          {/* Error Banner */}
          {authError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2 animate-fade-in"
            >
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Authentication Failure</span>
              </div>
              <p>{authError}</p>
              <button
                type="button"
                onClick={handleSignIn}
                className="inline-flex items-center gap-1.5 font-bold text-rose-800 underline hover:no-underline pt-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Sign-In</span>
              </button>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-primary-900 to-primary-800 hover:from-primary-950 hover:to-primary-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-700 disabled:opacity-50 transition-all duration-200 transform active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authorizing via Banking Federation...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Sign In with Institutional SSO</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>

            {/* Quick Demo Access Switcher */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Quick Demo Evaluation Roles
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                  Instant Access
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Switch user permissions to evaluate specific persona workflows:
              </p>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { role: 'LOAN_OFFICER' as UserRole, label: 'Loan Officer', desc: 'Field & App Review' },
                  { role: 'RISK_ANALYST' as UserRole, label: 'Risk Analyst', desc: 'Models & Scenarios' },
                  { role: 'INSTITUTION_ADMIN' as UserRole, label: 'Admin', desc: 'Users & Compliance' },
                  { role: 'PLATFORM_OPERATOR' as UserRole, label: 'Operator', desc: 'Telemetry & Gateways' },
                ].map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => handleQuickDemoLogin(item.role)}
                    className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-primary-50/50 hover:border-primary-300 text-left transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-primary-900">
                        {item.label}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-primary-800 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Security & Cryptographic Notice */}
          <div className="p-3.5 rounded-xl bg-slate-100/70 border border-slate-200/80 space-y-2">
            <div className="flex items-start gap-2.5 text-xs text-slate-600">
              <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Passwords and institutional master keys are never collected, stored, or exposed on this application client. Secured by PKCE token binding.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>TerraTrust-AI v1.0.0 · RBI / NABARD Climate-Risk Prudential Compliant</span>
          <a
            href="#help"
            onClick={(e) => {
              e.preventDefault();
              alert('For SSO access issues or role provisioning, contact your Institution IT Security Administrator at sso-support@arcbi.bank');
            }}
            className="hover:text-slate-800 underline"
          >
            Technical Support
          </a>
        </div>
      </div>

      {/* RIGHT COLUMN: Cinematic Agri-Intelligence Visual Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 text-white flex-col justify-between p-12 overflow-hidden">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={IMAGERY_ASSETS.satelliteParcel}
            alt="Agricultural farmland survey aerial"
            className="w-full h-full object-cover opacity-35 filter saturate-150"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
          <div className="absolute inset-0 bg-radial-gradient from-transparent to-slate-950/90" />
        </div>

        {/* Top Floating Badge */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white">
            <Satellite className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sentinel-2 & ISRO Satellite Telemetry Feed Active</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Kharif 2026 Cycle Live</span>
          </div>
        </div>

        {/* Center Floating Cards Showcase */}
        <div className="relative z-10 my-auto max-w-lg space-y-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold font-display tracking-tight text-white leading-tight">
              Evidence-Based Credit for Modern Agriculture
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Replace subjective appraisal with real-time remote sensing, canal release telemetry, and verified yield risk forecasting.
            </p>
          </div>

          {/* Grid of Micro Telemetry Stats */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-emerald-300 font-semibold">
                <Activity className="w-3.5 h-3.5" />
                <span>Mean NDVI Vigor</span>
              </div>
              <div className="text-2xl font-bold font-tabular text-white">0.742</div>
              <p className="text-[11px] text-slate-300">+8.4% vs 5-year district normal</p>
            </div>

            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-blue-300 font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Portfolio Scoped</span>
              </div>
              <div className="text-2xl font-bold font-tabular text-white">₹28.4 Cr</div>
              <p className="text-[11px] text-slate-300">Sangli & Kolhapur Cane Hub</p>
            </div>
          </div>

          {/* Testimonial / Compliance Quote */}
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/30 backdrop-blur-md text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <BadgeCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero-Hallucination Policy Enforcement</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Every risk score, yield forecast, and credit contribution is strictly classified into Facts, Contributions, and Assumptions with verifiable data provenance.
            </p>
          </div>
        </div>

        {/* Bottom Institutional Seal */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-4">
          <span>Apex Rural Credit Bank of India · Institutional Gateway</span>
          <span className="font-mono">OAuth2.0 / PKCE 256</span>
        </div>
      </div>
    </div>
  );
};

type LoginPageProps = {};
export default LoginPage;
