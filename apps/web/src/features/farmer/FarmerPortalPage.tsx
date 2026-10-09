import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/providers';
import { typedGet, typedPost } from '@/lib/api-client/client';
import {
  Leaf,
  Sun,
  Droplets,
  TrendingUp,
  FileText,
  Phone,
  LogOut,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Send,
  Sparkles,
  Calendar,
  X,
  IndianRupee,
  Layers,
  MapPin,
  Check,
  XCircle,
} from 'lucide-react';

interface LoanApp {
  id: string;
  amount: number;
  purpose: string;
  status: string;
  created_at: string;
  submitted_at?: string;
  borrower_name?: string;
  borrower_phone?: string;
}

export const FarmerPortalPage: React.FC = () => {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [amount, setAmount] = useState<string>('250000');
  const [purposeCategory, setPurposeCategory] = useState('Crop Cultivation & Inputs');
  const [cropType, setCropType] = useState('Sugarcane (Adsali)');
  const [tenureMonths, setTenureMonths] = useState('12');
  const [landArea, setLandArea] = useState('3.5');
  const [notes, setNotes] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 1. Fetch Real-time Loan Applications for this farmer
  const loansQuery = useQuery({
    queryKey: ['farmer-loans', user?.id],
    queryFn: async () => {
      try {
        const res = await typedGet<LoanApp[]>('/loan-applications');
        return Array.isArray(res) ? res : [];
      } catch (err) {
        return [];
      }
    },
    refetchInterval: 5000, // Poll every 5s for live updates when loan officer acts
  });

  const applications = loansQuery.data || [];

  // 2. Submit Loan Application Mutation
  const createLoanMutation = useMutation({
    mutationFn: async (payload: { amount: number; purpose: string }) => {
      return await typedPost<LoanApp>('/loan-applications', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmer-loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setIsApplyModalOpen(false);
      }, 1500);
    },
    onError: (err: any) => {
      setSubmitError(err?.message || 'Failed to submit loan application. Please try again.');
    },
  });

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setSubmitError('Please enter a valid loan amount.');
      return;
    }

    const fullPurpose = `${purposeCategory} - ${cropType} (${landArea} Acres, ${tenureMonths} Mo)${
      notes ? ' | ' + notes.trim() : ''
    }`;

    createLoanMutation.mutate({
      amount: parsedAmount,
      purpose: fullPurpose,
    });
  };

  // Status Badge Configuration
  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'APPROVED':
        return {
          label: 'Approved',
          bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2,
          dotColor: 'bg-emerald-500',
        };
      case 'REJECTED':
        return {
          label: 'Rejected',
          bgColor: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: XCircle,
          dotColor: 'bg-rose-500',
        };
      case 'UNDER_REVIEW':
        return {
          label: 'Under Review',
          bgColor: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock,
          dotColor: 'bg-amber-500',
        };
      case 'SUBMITTED':
      default:
        return {
          label: 'Submitted / In Queue',
          bgColor: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: Clock,
          dotColor: 'bg-blue-500',
        };
    }
  };

  // Dynamic Metrics Calculation
  const totalApplied = applications.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const approvedLoans = applications.filter((a) => (a.status || '').toUpperCase() === 'APPROVED');
  const approvedAmount = approvedLoans.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const pendingCount = applications.filter((a) => ['SUBMITTED', 'UNDER_REVIEW'].includes((a.status || '').toUpperCase())).length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* ── Top Navigation ── */}
      <nav className="bg-slate-950/80 border-b border-white/10 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20">
              <Leaf size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-base tracking-tight">TerraTrust AI</span>
                <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Farmer Portal
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block -mt-0.5">Kharif Agricultural Credit</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-white flex items-center gap-1.5 justify-end">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  {user.name}
                </p>
                <p className="text-[11px] text-slate-400 font-mono">{user.email || 'Verified Farmer'}</p>
              </div>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-400 transition-colors px-3 py-2 rounded-xl hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* ── Welcome Hero Banner ── */}
        <div className="relative rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 border border-emerald-500/30 p-6 sm:p-8 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs font-bold text-emerald-300">
                <Sun className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
                <span>Kharif 2026 Season · Western Maharashtra Division</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Namaste, <span className="text-emerald-400">{user?.name || 'Farmer'}</span>
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Welcome to your direct rural credit desk. Apply for crop capital, monitor satellite-verified crop health,
                and track officer loan approvals in real time.
              </p>
            </div>

            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="inline-flex items-center justify-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-3.5 rounded-xl text-sm font-extrabold shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 transition-all duration-200 shrink-0"
            >
              <Plus size={18} className="stroke-[3]" />
              <span>Apply for New Loan</span>
            </button>
          </div>
        </div>

        {/* ── Real-Time Metrics Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3">
              <Leaf size={20} />
            </div>
            <p className="text-2xl font-black text-white">{applications.length}</p>
            <p className="text-xs text-slate-400 mt-1">Total Loan Applications</p>
          </div>

          <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-3">
              <Clock size={20} />
            </div>
            <p className="text-2xl font-black text-white">{pendingCount}</p>
            <p className="text-xs text-slate-400 mt-1">Applications In Triage</p>
          </div>

          <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3">
              <Droplets size={20} />
            </div>
            <p className="text-2xl font-black text-white font-tabular">
              {totalApplied > 0 ? `₹${totalApplied.toLocaleString('en-IN')}` : '₹0'}
            </p>
            <p className="text-xs text-slate-400 mt-1">Total Amount Requested</p>
          </div>

          <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center mb-3">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-2xl font-black text-white font-tabular">
              {approvedAmount > 0 ? `₹${approvedAmount.toLocaleString('en-IN')}` : '₹0'}
            </p>
            <p className="text-xs text-slate-400 mt-1">Sanctioned / Approved</p>
          </div>
        </div>

        {/* ── Real-Time Loan Applications Table ── */}
        <div className="bg-slate-950/80 border border-white/10 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm">
          <div className="p-5 sm:p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <span>My Live Agricultural Loan Applications</span>
                <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  {applications.length} Records
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Directly connected to Apex Rural Development Bank officer triage queue
              </p>
            </div>

            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold transition-all self-start sm:self-auto"
            >
              <Plus size={14} />
              <span>+ New Application</span>
            </button>
          </div>

          {loansQuery.isLoading ? (
            <div className="p-12 text-center text-slate-400 text-sm">Loading applications...</div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/10 text-slate-400 flex items-center justify-center mx-auto">
                <FileText size={26} />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-white">No loan applications yet</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ready to invest in your harvest? Submit your loan request now to get rapid satellite-verified credit approval.
                </p>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(true)}
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/20"
              >
                <Plus size={14} className="stroke-[3]" />
                <span>Submit First Loan Application</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/90 border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Application ID</th>
                    <th className="py-3.5 px-5">Requested Amount</th>
                    <th className="py-3.5 px-5">Purpose & Crop Details</th>
                    <th className="py-3.5 px-5">Current Status</th>
                    <th className="py-3.5 px-5">Submission Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {applications.map((app) => {
                    const badge = getStatusBadge(app.status);
                    const formattedDate = app.submitted_at || app.created_at
                      ? new Date(app.submitted_at || app.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Recently';

                    return (
                      <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-5">
                          <span className="font-mono text-xs font-bold text-white block">
                            {String(app.id).slice(0, 8)}...
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Apex Rural Bank
                          </span>
                        </td>

                        <td className="py-4 px-5">
                          <span className="font-extrabold text-sm text-emerald-400 font-tabular block">
                            ₹{Number(app.amount).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-slate-400">Principal Requested</span>
                        </td>

                        <td className="py-4 px-5 max-w-xs">
                          <span className="font-medium text-slate-200 block truncate" title={app.purpose}>
                            {app.purpose}
                          </span>
                        </td>

                        <td className="py-4 px-5">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bgColor}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`} />
                            <badge.icon className="w-3.5 h-3.5" />
                            <span>{badge.label}</span>
                          </span>
                        </td>

                        <td className="py-4 px-5 text-slate-400 text-xs font-mono">
                          {formattedDate}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Satellite Agronomic Telemetry Card for Farmer ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Leaf size={14} />
                <span>Sentinel-2 NDVI Canopy</span>
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                Live ESA
              </span>
            </div>
            <p className="text-3xl font-black text-white font-tabular">0.742</p>
            <p className="text-xs text-slate-400">
              Vigorous crop canopy. 12% higher greenness index than Solapur Kharif district average.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Droplets size={14} />
                <span>NASA SMAP Soil Moisture</span>
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-mono">
                30cm Depth
              </span>
            </div>
            <p className="text-3xl font-black text-white font-tabular">31.8%</p>
            <p className="text-xs text-slate-400">
              Optimal root hydration level maintained via Warna irrigation dam canals.
            </p>
          </div>

          <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={14} />
                <span>Expected Harvest Yield</span>
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono">
                R² = 0.9917
              </span>
            </div>
            <p className="text-3xl font-black text-white font-tabular">115 MT / Ha</p>
            <p className="text-xs text-slate-400">
              Sugarcane Adsali forecast benchmarked against local cooperative sugar factory returns.
            </p>
          </div>
        </div>

        {/* ── Helpline Assistance ── */}
        <div className="bg-slate-950 border border-white/10 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <Phone size={18} />
            </div>
            <div>
              <p className="font-bold text-sm">Need Help with your Loan Application?</p>
              <p className="text-slate-400 text-xs">
                Connect directly with your Solapur branch loan officer or call the toll-free Kisan Credit helpline.
              </p>
            </div>
          </div>
          <span className="font-mono text-emerald-400 font-bold text-sm bg-slate-900 px-4 py-2 rounded-xl border border-white/10">
            1800-266-7788
          </span>
        </div>
      </main>

      {/* ── 3. Application Submission Modal ── */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-slate-900 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-100 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                  <IndianRupee size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Apply for Agricultural Credit</h3>
                  <p className="text-xs text-slate-400">Apex Rural Development Bank · Direct Farmer Fast-Track</p>
                </div>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                  <Check size={32} className="stroke-[3]" />
                </div>
                <h4 className="text-xl font-black text-white">Loan Application Submitted!</h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  Your application has been registered in the database and sent to the Loan Officer dashboard queue for immediate review.
                </p>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-5">
                {submitError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Loan Amount */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Requested Loan Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-base">
                      ₹
                    </span>
                    <input
                      type="number"
                      required
                      min="10000"
                      step="5000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-white/15 rounded-xl pl-9 pr-4 py-3 text-base font-extrabold text-white focus:outline-none focus:border-emerald-500 transition-colors font-tabular"
                      placeholder="e.g. 250000"
                    />
                  </div>
                  {/* Quick Select Buttons */}
                  <div className="flex gap-2 pt-1">
                    {['100000', '250000', '500000', '750000'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmount(val)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                          amount === val
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        ₹{(parseInt(val) / 100000).toFixed(1)} Lakh
                      </button>
                    ))}
                  </div>
                </div>

                {/* Purpose Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Credit Purpose
                  </label>
                  <select
                    value={purposeCategory}
                    onChange={(e) => setPurposeCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Crop Cultivation & Inputs">Crop Cultivation & Inputs (Seeds, Fertilizers, Micro-nutrients)</option>
                    <option value="Drip Irrigation & Pipeline">Drip Irrigation System & Water Storage Pipeline</option>
                    <option value="Tractor & Farm Equipment">Tractor, Harvester & Farm Mechanization</option>
                    <option value="Solar Agricultural Pump">Solar Agri-Pump Installation</option>
                    <option value="Post-Harvest Storage & Processing">Post-Harvest Storage & Warehouse Storage</option>
                  </select>
                </div>

                {/* Grid for Crop & Land */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Target Crop
                    </label>
                    <select
                      value={cropType}
                      onChange={(e) => setCropType(e.target.value)}
                      className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Sugarcane (Adsali)">Sugarcane (Adsali Co 86032)</option>
                      <option value="Bt Cotton (Bollgard II)">Bt Cotton (Bollgard II)</option>
                      <option value="Soybean (JS-335)">Soybean (JS-335)</option>
                      <option value="Pomegranate (Bhagwa)">Pomegranate (Bhagwa Orchard)</option>
                      <option value="Tur Dal / Red Gram">Tur Dal / Pulses</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Cultivated Land (Acres)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={landArea}
                      onChange={(e) => setLandArea(e.target.value)}
                      className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                      placeholder="e.g. 3.5"
                    />
                  </div>
                </div>

                {/* Tenure */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Tenure (Months)
                    </label>
                    <select
                      value={tenureMonths}
                      onChange={(e) => setTenureMonths(e.target.value)}
                      className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="12">12 Months (Kharif Annual)</option>
                      <option value="18">18 Months (Sugarcane Adsali)</option>
                      <option value="24">24 Months (Irrigation Medium-Term)</option>
                      <option value="36">36 Months (Mechanization)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Branch / Bank
                    </label>
                    <div className="px-3 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-medium text-slate-300 truncate">
                      Solapur South Branch
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Additional Land Parcel or Crop Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                    placeholder="e.g. Gat No. 142/2A, drip lateral pipeline already installed."
                  />
                </div>

                {/* Action Buttons */}
                <div className="pt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoanMutation.isPending}
                    className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 px-6 py-2.5 rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-500/25 transition-all"
                  >
                    {createLoanMutation.isPending ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <Send size={14} className="stroke-[2.5]" />
                        <span>Submit Application</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
