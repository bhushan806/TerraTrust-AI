import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Sprout, ShieldCheck, Mail, Lock, Phone, User as UserIcon, Building2, AlertCircle } from 'lucide-react';
import { IMAGERY_ASSETS } from '@/lib/assets/imagery';
import { apiClient } from '@/lib/api-client/client';

export const RegisterPage: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const isFarmer = type === 'farmer';
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (type !== 'farmer' && type !== 'officer') {
      navigate('/register/farmer', { replace: true });
    }
  }, [type, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isFarmer) {
        await apiClient.post('/auth/farmer/register', {
          display_name: formData.name,
          contact_phone: formData.phone,
          password: formData.password,
        });
        setSuccess('Farmer registered successfully! You can now log in.');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        await apiClient.post('/auth/officer/register', {
          full_name: formData.name,
          email: formData.email,
          password: formData.password,
        });
        setSuccess('Officer registered successfully! Pending approval from administration.');
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      <div className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-slate-900 p-6 text-center relative overflow-hidden">
             <div className="absolute inset-0 z-0">
               <img src={IMAGERY_ASSETS.satelliteParcel} alt="Background" className="w-full h-full object-cover opacity-20" />
             </div>
             <div className="relative z-10">
               <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md mb-4">
                  <Sprout className="w-6 h-6" />
               </div>
               <h2 className="text-2xl font-bold text-white">Join TerraTrust AI</h2>
               <p className="text-emerald-100 mt-1 text-sm">
                 Register as a {isFarmer ? 'Farmer' : 'Loan Officer'}
               </p>
             </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex justify-center mb-6">
              <div className="inline-flex bg-slate-100 p-1 rounded-lg">
                <Link
                  to="/register/farmer"
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    isFarmer ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Farmer
                </Link>
                <Link
                  to="/register/officer"
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    !isFarmer ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Loan Officer
                </Link>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-lg flex gap-2 items-center">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-lg flex gap-2 items-center">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <p>{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {isFarmer ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition"
                      placeholder="1234567890"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Institutional Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition"
                      placeholder="officer@institution.com"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-none transition"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-colors flex justify-center items-center"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Register'}
              </button>
            </form>

            <div className="text-center mt-6 text-sm text-slate-600">
              Already have an account? <Link to="/login" className="text-emerald-600 font-bold hover:underline">Log in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
