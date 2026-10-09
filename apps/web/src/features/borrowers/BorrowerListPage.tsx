import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Filter,
  RotateCcw,
  ArrowRight,
  Eye,
  Tractor,
  User,
  ShieldCheck,
  X,
  Phone,
  Mail,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/data-display/DataTable';
import { Pagination } from '@/components/data-display/Pagination';
import { SearchField } from '@/components/forms/SearchField';
import { SelectField } from '@/components/forms/SelectField';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useToast } from '@/components/feedback/Toast';
import { formatDate } from '@/lib/formatters/date';
import { typedGet, typedPost } from '@/lib/api-client/client';
import { queryKeys } from '@/lib/query-client/query-keys';
import { Borrower } from '@/types/domain';
import { ColumnDef } from '@/types/ui';
import { useScope } from '@/app/providers';

export const BorrowerListPage: React.FC = () => {
  const scope = useScope();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Filters state persisted in component state
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [cropFilter, setCropFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [sortBy, setSortBy] = useState('display_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Registration Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formRef, setFormRef] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formBranchId, setFormBranchId] = useState(scope.branchId);

  const queryParams = new URLSearchParams({
    branch_id: scope.branchId,
    page: String(page),
    page_size: String(pageSize),
    search,
    risk_status: riskFilter,
    primary_crop: cropFilter,
    sort_by: sortBy,
    sort_order: sortOrder,
  }).toString();

  const borrowersQuery = useQuery({
    queryKey: queryKeys.borrowers({ branchId: scope.branchId, page, search, riskFilter, cropFilter }),
    queryFn: () => typedGet<{ borrowers: Borrower[]; total: number; totalPages: number }>(`/borrowers?${queryParams}`),
  });

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setRiskFilter('ALL');
    setCropFilter('ALL');
    setPage(1);
  };

  const handleOpenRegister = () => {
    setFormName('');
    setFormRef(`KCC-${Math.floor(100000 + Math.random() * 900000)}`);
    setFormPhone('');
    setFormEmail('');
    setFormBranchId(scope.branchId);
    setRegisterError(null);
    setIsRegisterOpen(true);
  };

  const handleCreateBorrower = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formRef.trim()) {
      setRegisterError('Please provide both farmer legal name and external reference ID.');
      return;
    }

    try {
      setRegisterLoading(true);
      setRegisterError(null);
      const res = await typedPost<{ id: string; display_name: string; external_ref: string }>('/borrowers', {
        branch_id: formBranchId,
        display_name: formName.trim(),
        external_ref: formRef.trim(),
        contact_phone: formPhone.trim() || null,
        contact_email: formEmail.trim() || null,
      });

      showToast({
        type: 'success',
        title: 'Farmer Profile Registered',
        message: `Registered ${res.display_name} (${res.external_ref}) successfully in PostgreSQL.`,
      });

      queryClient.invalidateQueries({ queryKey: ['borrowers'] });
      setIsRegisterOpen(false);
      navigate(`/borrowers/${res.id}`);
    } catch (err: any) {
      setRegisterError(err?.message || 'Failed to register farmer. Please verify uniqueness of Farmer ID.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const borrowers = borrowersQuery.data?.borrowers || [];
  const total = borrowersQuery.data?.total || 0;
  const totalPages = borrowersQuery.data?.totalPages || 1;

  // Table Columns
  const columns: ColumnDef<Borrower>[] = [
    {
      key: 'display_name',
      header: 'Agricultural Borrower',
      sortable: true,
      cell: (b) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-900 to-primary-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
            {b.display_name.charAt(0)}
          </div>
          <div>
            <Link
              to={`/borrowers/${b.id}`}
              className="font-bold text-sm text-slate-900 hover:text-primary-800 hover:underline"
            >
              {b.display_name}
            </Link>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{b.contact_phone || b.external_ref}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'external_ref',
      header: 'Identifier (KCC)',
      cell: (b) => (
        <span className="font-mono text-xs text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded">
          {b.external_ref}
        </span>
      ),
    },
    {
      key: 'branch_name',
      header: 'Location / Branch',
      cell: (b) => (
        <div>
          <span className="text-xs text-slate-800 font-medium block">{b.branch_name || scope.branchName}</span>
          <span className="text-[11px] text-slate-400">{b.region || scope.region}</span>
        </div>
      ),
    },
    {
      key: 'primary_crop',
      header: 'Primary Crop',
      cell: (b) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
          {b.primary_crop || 'Multicrop'}
        </span>
      ),
    },
    {
      key: 'risk_status',
      header: 'Risk Classification',
      cell: (b) => (
        <StatusBadge
          variant={
            b.risk_status === 'LOW'
              ? 'HEALTHY'
              : b.risk_status === 'HIGH' || b.risk_status === 'CRITICAL'
              ? 'HIGH_RISK'
              : b.risk_status === 'UNASSESSED'
              ? 'PD_UNAVAILABLE'
              : 'PENDING'
          }
          label={`${b.risk_status || 'UNASSESSED'} RISK`}
          size="sm"
        />
      ),
    },
    {
      key: 'last_assessed_at',
      header: 'Latest Assessment',
      cell: (b) => (
        <span className="font-tabular text-xs text-slate-600">
          {b.last_assessed_at ? formatDate(b.last_assessed_at) : 'Not Assessed'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (b) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/borrowers/${b.id}`}
            aria-label={`View profile of ${b.display_name}`}
            className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-700 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <Link
            to={`/borrowers/${b.id}/timeline`}
            aria-label={`View assessment timeline of ${b.display_name}`}
            className="px-2.5 py-1 text-xs font-bold text-primary-900 bg-primary-50 hover:bg-primary-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-700 transition-colors"
          >
            Timeline
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agricultural Borrower Directory"
        subtitle={`Search and evaluate farm borrowers, land parcels, and historical credit risk assessments.`}
        breadcrumbs={[{ label: 'Borrowers', current: true }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleOpenRegister}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-800 to-emerald-700 text-white rounded-xl text-xs font-bold hover:from-emerald-900 hover:to-emerald-800 shadow-md transition-all active:scale-[0.99]"
            >
              <Plus className="w-4 h-4 text-emerald-200" />
              <span>Register New Farmer</span>
            </button>
            <Link
              to="/admin/users"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 shadow-2xs"
            >
              <span>Branch: Admin Users</span>
            </Link>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2">
            <SearchField
              placeholder="Search by borrower name, KCC ID, or phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              onClear={() => setSearch('')}
            />
          </div>

          <div>
            <SelectField
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by Risk Status"
            >
              <option value="ALL">All Risk Classifications</option>
              <option value="LOW">Low Risk</option>
              <option value="MODERATE">Moderate Risk</option>
              <option value="HIGH">High Risk</option>
              <option value="CRITICAL">Critical Risk</option>
              <option value="UNASSESSED">Unassessed</option>
            </SelectField>
          </div>

          <div>
            <SelectField
              value={cropFilter}
              onChange={(e) => {
                setCropFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by Primary Crop"
            >
              <option value="ALL">All Primary Crops</option>
              <option value="Sugarcane">Sugarcane</option>
              <option value="Soybean">Soybean</option>
              <option value="Cotton">Cotton</option>
              <option value="Wheat">Wheat</option>
            </SelectField>
          </div>
        </div>

        {(search || riskFilter !== 'ALL' || cropFilter !== 'ALL') && (
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-500 font-tabular">
              Filters active. Showing matches for "{search || 'All'}"
            </span>
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 font-bold text-rose-700 hover:text-rose-900 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Table or Error State */}
      {borrowersQuery.isError ? (
        <ErrorState
          error={borrowersQuery.error}
          onRetry={() => borrowersQuery.refetch()}
        />
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            data={borrowers}
            keyExtractor={(b) => b.id}
            isLoading={borrowersQuery.isLoading}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            caption="Scoped Agricultural Borrower Directory"
            emptyState={
              <EmptyState
                title="No agricultural borrowers found"
                description="No borrower records matched your active search query or filter constraints."
                action={{
                  label: 'Register First Farmer',
                  onClick: handleOpenRegister,
                  icon: <Plus className="w-4 h-4" />,
                }}
              />
            }
            renderMobileCard={(b) => (
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {b.display_name.charAt(0)}
                    </div>
                    <div>
                      <Link to={`/borrowers/${b.id}`} className="font-bold text-slate-900 hover:underline">
                        {b.display_name}
                      </Link>
                      <p className="text-xs text-slate-500 font-mono">{b.external_ref}</p>
                    </div>
                  </div>
                  <StatusBadge
                    variant={
                      b.risk_status === 'LOW'
                        ? 'HEALTHY'
                        : b.risk_status === 'HIGH' || b.risk_status === 'CRITICAL'
                        ? 'HIGH_RISK'
                        : 'PENDING'
                    }
                    label={b.risk_status || 'PENDING'}
                    size="sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Primary Crop</span>
                    <span className="font-bold text-slate-800">{b.primary_crop || 'Multicrop'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Branch</span>
                    <span className="font-bold text-slate-800">{b.branch_name || scope.branchName}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-400 font-tabular">
                    Assessed: {b.last_assessed_at ? formatDate(b.last_assessed_at) : 'N/A'}
                  </span>
                  <Link
                    to={`/borrowers/${b.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary-800 hover:underline"
                  >
                    <span>Inspect Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      {/* Register New Farmer Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Register New Farmer</h3>
                  <p className="text-[11px] text-slate-500">Add an agricultural borrower to the institutional registry</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBorrower} className="p-6 space-y-4">
              {registerError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  <div>{registerError}</div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 block">Farmer Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dnyaneshwar Babanrao Shinde"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">KCC / Farmer ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KCC-MH-2026-104"
                    value={formRef}
                    onChange={(e) => setFormRef(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Assigned Branch</label>
                  <select
                    value={formBranchId}
                    onChange={(e) => setFormBranchId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                  >
                    {scope.availableBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98234 56789"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="farmer@example.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary-700"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  disabled={registerLoading}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="px-4 py-2 rounded-xl bg-primary-900 text-white text-xs font-bold hover:bg-primary-950 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {registerLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Confirm Registration</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
