import React from 'react';
import { Link } from 'react-router-dom';
import {
  Leaf,
  Shield,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  Droplets,
  CloudSun,
  Database,
  Cpu,
  BarChart3,
  Award,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const trustPartners = [
    { name: 'NABARD', badge: 'National Bank for Agriculture', verified: true },
    { name: 'State Bank of India', badge: 'Rural Agri-Credit', verified: true },
    { name: 'RBI Prudential', badge: 'Climate Framework', verified: true },
    { name: 'ISRO Telemetry', badge: 'Earth Observation', verified: true },
    { name: 'NASA SMAP', badge: 'Soil Moisture 30cm', verified: true },
    { name: 'IMD India', badge: 'High-Res Rain Grid', verified: true },
  ];

  const bentoFeatures = [
    {
      icon: CloudSun,
      iconCircleBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      tag: 'Satellite Telemetry',
      title: 'Climate Intelligence & Satellite IoT',
      description:
        'Hyper-local IMD precipitation grids, Sentinel-2 canopy NDVI, canal rotation telemetry, and heatwave indices unified into a single authoritative agronomic view.',
      accent: 'emerald',
      highlightBadge: 'Real-time',
    },
    {
      icon: TrendingUp,
      iconCircleBg: 'bg-teal-500/15 border-teal-500/30 text-teal-400',
      tag: 'Predictive ML',
      title: 'Extra Trees Yield Prediction',
      description:
        'Benchmarked ML model (R² = 0.9917) estimates future harvest yields across Sugarcane, Cotton, and Soybean using 5-year soil moisture, temperature, and crop vigor signals.',
      accent: 'teal',
      highlightBadge: 'R² = 0.9917',
    },
    {
      icon: Shield,
      iconCircleBg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400',
      tag: 'Prudential Underwriting',
      title: 'Composite Credit Risk Engine',
      description:
        'Multi-pillar credit score integrating verified 7/12 land parcel titles, borrower debt service coverage (DSCR), and climate exposure bands with gated probability-of-default.',
      accent: 'indigo',
      highlightBadge: 'RBI Compliant',
    },
    {
      icon: Droplets,
      iconCircleBg: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
      tag: 'NASA SMAP Data',
      title: 'Soil Moisture & Root-Zone Sensors',
      description:
        'Global SMAP satellite radar telemetry measured at 30cm root-zone depth cross-referenced with local canal dam releases to flag drought stress weeks before harvest loss.',
      accent: 'blue',
      highlightBadge: '30cm Depth',
    },
    {
      icon: Database,
      iconCircleBg: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
      tag: 'Audit Verification',
      title: 'Immutable Decision Audit Trails',
      description:
        'Cryptographically timestamped credit assessment reports, reproducible ML feature weights, and strict role-based access control built for institutional banking audits.',
      accent: 'purple',
      highlightBadge: 'PDF Generation',
    },
    {
      icon: Cpu,
      iconCircleBg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
      tag: 'Stress Testing',
      title: 'Climate Stress Simulator',
      description:
        'Simulate extreme weather shocks—such as 45-day monsoonal dry spells or 42°C heatwaves—to stress-test borrower repayment capacity before issuing credit approval.',
      accent: 'amber',
      highlightBadge: 'Scenario Lab',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      {/* ── 1. Glassmorphism Sticky Navbar ── */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/30">
                <Leaf size={22} className="stroke-[2.5]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                  TerraTrust <span className="text-emerald-400">AI</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">
                  Agri-Credit & Climate Risk
                </span>
              </div>
            </div>

            {/* Nav Actions */}
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
              >
                Sign In
              </Link>
              <Link
                to="/login?mode=register&role=officer"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── 2. Hero Section ── */}
      <main className="flex-grow">
        <section className="relative overflow-hidden min-h-[90vh] flex items-center py-20">
          {/* Background image with darkened multi-layer overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&q=80&w=2000"
              alt="Indian agricultural farmland drone view"
              className="w-full h-full object-cover scale-105"
            />
            {/* Darkened overlay for maximum text contrast and legibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/95 via-slate-950/90 to-slate-950" />
            <div className="absolute inset-0 bg-emerald-950/30 mix-blend-multiply" />
            {/* Ambient emerald radial light glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            {/* Real-time status pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-bold text-emerald-400 mb-8 backdrop-blur-md shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Kharif 2026 · Live Satellite Telemetry & Yield Models Active</span>
            </div>

            {/* Massive Bold Headline */}
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white tracking-tight leading-[1.04] mb-8 max-w-5xl">
              Climate-Aware
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
                Agricultural Credit
              </span>
              <br />
              Risk Intelligence
            </h1>

            {/* Supporting Pitch */}
            <p className="text-lg sm:text-2xl text-slate-300 max-w-3xl leading-relaxed mb-12 font-normal">
              Empower agricultural lenders with real-time Sentinel-2 satellite canopy indexes,
              NASA root-zone soil telemetry, and audited ML yield forecasts tailored for Indian rural banks.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-5 mb-16 max-w-xl">
              <Link
                to="/login?mode=register&role=farmer"
                className="inline-flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-4 rounded-xl text-base font-extrabold shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <Leaf size={20} className="stroke-[2.5]" />
                <span>I am a Farmer</span>
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/login?mode=register&role=officer"
                className="inline-flex items-center justify-center gap-3 border-2 border-white text-white hover:bg-white hover:text-slate-950 px-8 py-4 rounded-xl text-base font-extrabold transition-all duration-200 hover:scale-105 active:scale-95 backdrop-blur-md shadow-lg shadow-black/20"
              >
                <Shield size={20} className="stroke-[2.5]" />
                <span>I am a Loan Officer</span>
              </Link>
            </div>

            {/* Trusted By Logo Cloud */}
            <div className="pt-8 border-t border-white/10 max-w-5xl">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-4 flex items-center gap-2">
                <span>Trusted by Indian rural banking ecosystem & data authorities</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {trustPartners.map((item) => (
                  <div
                    key={item.name}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-200 text-center group"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      {item.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. Platform Features: 3-Column Bento Grid ── */}
        <section className="py-28 bg-slate-950 border-t border-slate-900 relative">
          {/* Subtle grid background pattern */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase tracking-widest mb-4">
                Platform Architecture
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Everything your credit committee needs to lend with confidence
              </h2>
              <p className="mt-4 text-slate-400 text-base sm:text-lg">
                Purpose-built for agricultural credit underwriting under RBI Prudential Climate Guidelines.
              </p>
            </div>

            {/* 3-Column Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bentoFeatures.map((f) => (
                <div
                  key={f.title}
                  className="group relative bg-slate-900/60 border border-slate-800/80 rounded-2xl p-7 backdrop-blur-sm hover:border-emerald-500/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-950/50 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Subtle hover gradient illumination */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  <div>
                    {/* Top Row: Colored Circle Icon + Pill Tag */}
                    <div className="flex items-center justify-between mb-6">
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center border ${f.iconCircleBg} shadow-sm group-hover:scale-110 transition-transform duration-200`}
                      >
                        <f.icon size={26} className="stroke-[2.2]" />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-800/90 text-slate-300 border border-slate-700/80">
                        {f.highlightBadge}
                      </span>
                    </div>

                    {/* Title & Tag */}
                    <span className="text-xs font-semibold text-emerald-400 block mb-1.5">
                      {f.tag}
                    </span>
                    <h3 className="text-xl font-bold text-white mb-3 tracking-tight group-hover:text-emerald-300 transition-colors">
                      {f.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {f.description}
                    </p>
                  </div>

                  {/* Micro action / metric indicator */}
                  <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono text-[11px]">Production Validated</span>
                    <ArrowRight size={14} className="text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-slate-950 font-bold">
              <Leaf size={18} />
            </div>
            <span className="font-bold text-slate-300">TerraTrust AI</span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">Agricultural Credit Risk & Climate Intelligence</span>
          </div>
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} TerraTrust AI · RBI Climate-Risk & Sustainable Lending Compliant
          </p>
        </div>
      </footer>
    </div>
  );
};
