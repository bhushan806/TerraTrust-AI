import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/app/providers';
import { apiClient } from '@/lib/api-client/client';
import {
  Sprout,
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Building2,
  ArrowRight,
  Phone,
  User as UserIcon,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { UserRole } from '@/types/domain';

export const LoginPage: React.FC = () => {
  const { login, switchRoleForDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const from = (location.state as any)?.from?.pathname || '/officer';

  const roleParam = searchParams.get('role');
  const modeParam = searchParams.get('mode');

  const [authMode, setAuthMode] = useState<'signin' | 'register'>(
    modeParam === 'register' ? 'register' : 'signin'
  );
  const [isFarmer, setIsFarmer] = useState(roleParam === 'farmer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('officer@fin03.local');
  const [phone, setPhone] = useState('+91 98220 44129');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (roleParam === 'farmer') setIsFarmer(true);
    if (roleParam === 'officer') setIsFarmer(false);
    if (modeParam === 'register') setAuthMode('register');
    if (modeParam === 'login') setAuthMode('signin');
  }, [roleParam, modeParam]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);
    setSuccessMsg(null);

    // Validation
    if (authMode === 'register' && !name.trim()) {
      setAuthError('Please enter your full name.');
      return;
    }
    if (isFarmer && (!phone || !password)) {
      setAuthError('Please provide your phone number and password.');
      return;
    }
    if (!isFarmer && (!email || !password)) {
      setAuthError('Please provide your email and account password.');
      return;
    }

    setIsLoading(true);

    try {
      if (authMode === 'register') {
        if (isFarmer) {
          // 1. Register farmer in backend database
          await apiClient.post('/auth/farmer/register', {
            display_name: name.trim(),
            contact_phone: phone.trim(),
            password: password,
          });
          setSuccessMsg('Account created successfully! Logging you in...');
          // 2. Automatically log in with issued token
          await login(phone.trim(), password, 'farmer');
          navigate('/farmer', { replace: true });
        } else {
          // Register officer
          await apiClient.post('/auth/officer/register', {
            full_name: name.trim(),
            email: email.trim(),
            password: password,
          });
          setSuccessMsg('Officer account registered successfully! You can now sign in.');
          setAuthMode('signin');
        }
      } else {
        // Sign in mode
        await login(isFarmer ? phone.trim() : email.trim(), password, isFarmer ? 'farmer' : 'officer');
        navigate(isFarmer ? '/farmer' : from, { replace: true });
      }
    } catch (err: any) {
      const errorDetail =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Authentication failed. Please verify credentials.';
      setAuthError(errorDetail);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPreset = (presetEmail: string, roleRole: UserRole) => {
    setIsFarmer(false);
    setAuthMode('signin');
    setEmail(presetEmail);
    setPassword('password123');
    switchRoleForDemo(roleRole);
    setAuthError(null);
    setSuccessMsg(null);
  };

  const handleFarmerPreset = () => {
    setIsFarmer(true);
    setAuthMode('signin');
    setPhone('+91 98220 44129');
    setPassword('password123');
    setAuthError(null);
    setSuccessMsg(null);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* ── LEFT SIDE: 50% Clean White Form Container ── */}
      <div className="w-full lg:w-1/2 min-h-screen bg-white flex flex-col justify-between p-6 sm:p-12 lg:p-16">
        {/* Top Header: Logo */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:bg-emerald-500 transition-colors">
              <Sprout className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-slate-900 font-display flex items-center gap-1">
                TerraTrust <span className="text-emerald-600">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Agricultural Credit Platform
              </span>
            </div>
          </Link>

          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs font-semibold text-slate-600">
            <Building2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Apex Rural Bank</span>
          </div>
        </div>

        {/* Center: Auth Box */}
        <div className="my-auto max-w-md w-full mx-auto py-8 space-y-6">
          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">
              {authMode === 'signin' ? 'Sign In' : 'Create Account'}
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed font-normal">
              {authMode === 'signin'
                ? 'Access real-time agronomic telemetry and climate credit risk underwriting.'
                : isFarmer
                ? 'Register your agricultural profile for instant credit risk evaluation.'
                : 'Register institutional officer credentials for credit committee review.'}
            </p>
          </div>

          {/* Mode Switcher Tabs: Sign In vs Create Account */}
          <div className="flex border-b border-slate-200 pb-1 gap-6 text-sm font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setAuthError(null);
                setSuccessMsg(null);
              }}
              className={`pb-2 border-b-2 transition-all ${
                authMode === 'signin'
                  ? 'border-emerald-600 text-emerald-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setAuthError(null);
                setSuccessMsg(null);
              }}
              className={`pb-2 border-b-2 transition-all ${
                authMode === 'register'
                  ? 'border-emerald-600 text-emerald-900'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Sleek Pill-Shaped Toggle for "Farmer" vs. "Loan Officer" */}
          <div className="bg-slate-100 p-1 rounded-full flex max-w-sm mx-auto border border-slate-200/80 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setIsFarmer(false);
                setAuthError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 px-4 rounded-full text-xs font-bold transition-all duration-200 ${
                !isFarmer
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Loan Officer
            </button>
            <button
              type="button"
              onClick={() => {
                setIsFarmer(true);
                setAuthError(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 px-4 rounded-full text-xs font-bold transition-all duration-200 ${
                isFarmer
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Farmer
            </button>
          </div>

          {/* Notifications */}
          {authError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in-50">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{authError}</p>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5 animate-in fade-in-50">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{successMsg}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name in Register Mode */}
            {authMode === 'register' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isFarmer ? 'e.g. Rameshwar Tukaram Patil' : 'e.g. Rajesh Sharma'}
                    required
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Phone (Farmer) or Email (Officer) */}
            {isFarmer ? (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98220 44129"
                    required
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@fin03.local"
                    required
                    className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Solid Emerald Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl shadow-md shadow-emerald-600/25 text-sm font-extrabold text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 disabled:opacity-50 transition-all duration-200 hover:scale-[1.01] active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>{authMode === 'signin' ? 'Sign In' : 'Register & Continue'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Authorized Personas (In Sign In mode) */}
          {authMode === 'signin' && (
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Quick Authorized Personas
              </span>
              <div className="flex flex-wrap gap-2">
                {!isFarmer ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleQuickPreset('officer@fin03.local', 'LOAN_OFFICER')}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-900 border border-slate-200 transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Loan Officer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPreset('analyst@fin03.local', 'RISK_ANALYST')}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-900 border border-slate-200 transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>Risk Analyst</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPreset('admin@fin03.local', 'INSTITUTION_ADMIN')}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-900 border border-slate-200 transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      <span>Branch Admin</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleFarmerPreset}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-900 border border-slate-200 transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Suresh Patil (Farmer Demo)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Toggle bottom link */}
          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            {authMode === 'signin' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setAuthError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-emerald-700 font-bold hover:underline"
                >
                  Create an account here
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setAuthError(null);
                    setSuccessMsg(null);
                  }}
                  className="text-emerald-700 font-bold hover:underline"
                >
                  Sign in here
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bottom footer text */}
        <p className="text-[11px] text-slate-400 text-center sm:text-left">
          &copy; {new Date().getFullYear()} TerraTrust AI · RBI Climate-Risk & Sustainable Lending Compliant
        </p>
      </div>

      {/* ── RIGHT SIDE: 50% Visual Landscape with Dark Overlay & High-Impact Headline ── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 text-white flex-col justify-between p-12 lg:p-16 overflow-hidden">
        {/* Background photo */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=2000"
            alt="Agricultural farmland drone view"
            className="w-full h-full object-cover scale-105"
          />
          {/* Dark gradient overlay from top to bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/40" />
          <div className="absolute inset-0 bg-emerald-950/20 mix-blend-multiply" />
        </div>

        {/* Top badge */}
        <div className="relative z-10 flex items-center gap-2">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs font-bold text-emerald-300 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Kharif 2026 Telemetry Live</span>
          </span>
        </div>

        {/* Inspiring Headline & Subtitle */}
        <div className="relative z-10 my-auto max-w-lg space-y-4">
          <h2 className="text-3xl sm:text-5xl font-black text-white font-display tracking-tight leading-tight">
            Climate-Aware Credit Assessment
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Empowering agricultural lenders with Sentinel-2 satellite canopy indexes, NASA root-zone soil moisture telemetry, and validated ML crop yield forecasting.
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-300">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 font-medium">
              <CheckCircle2 size={12} className="text-emerald-400" />
              Sentinel-2 NDVI
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 font-medium">
              <CheckCircle2 size={12} className="text-emerald-400" />
              NASA SMAP 30cm
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 backdrop-blur-md border border-white/10 font-medium">
              <CheckCircle2 size={12} className="text-emerald-400" />
              RBI Compliant
            </span>
          </div>
        </div>

        {/* Bottom subtext */}
        <div className="relative z-10 text-xs text-slate-400 border-t border-white/10 pt-4 flex items-center justify-between">
          <span>Apex Rural Development Bank · Maharashtra Division</span>
          <span className="font-mono text-emerald-400">v2.4 Production</span>
        </div>
      </div>
    </div>
  );
};
