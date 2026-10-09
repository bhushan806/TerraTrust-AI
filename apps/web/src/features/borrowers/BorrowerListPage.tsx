import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Filter, RotateCcw, ArrowRight, Eye, Tractor, User, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DataTable } from '@/components/data-display/DataTable';
import { Pagination } from '@/components/data-display/Pagination';
import { SearchField } from '@/components/forms/SearchField';
import { SelectField } from '@/components/forms/SelectField';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { formatDate } from '@/lib/formatters/date';
import { typedGet } from '@/lib/api-client/client';
import { queryKeys } from '@/lib/query-client/query-keys';
import { Borrower } from '@/types/domain';
import { ColumnDef } from '@/types/ui';
import { useScope } from '@/app/providers';

export const BorrowerListPage: React.FC = () => {
  const scope = useScope();

  // Filters state persisted in component state
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [cropFilter, setCropFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [sortBy, setSortBy] = useState('display_name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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
              className="font-bold text-slate-900 hover:text-primary-800 hover:underline block leading-snug"
            >
              {b.display_name}
            </Link>
            <span className="text-[11px] text-slate-500 font-mono">{b.phone}</span>
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
          <span className="text-xs text-slate-800 font-medium block">{b.branch_name}</span>
          <span className="text-[11px] text-slate-400">{b.region}</span>
        </div>
      ),
    },
    {
      key: 'primary_crop',
      header: 'Primary Crop',
      cell: (b) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
          {b.primary_crop}
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
          label={`${b.risk_status} RISK`}
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
            <Link
              to="/borrowers/bor-1001"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary-900 text-white rounded-xl text-xs font-bold hover:bg-primary-950 shadow-2xs transition-colors"
            >
              <span>Next: Borrower Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
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
              <option value="Onion">Onion</option>
              <option value="Maize">Maize</option>
              <option value="Grapes">Grapes</option>
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
                  label: 'Clear Filter Criteria',
                  onClick: handleClearFilters,
                  icon: <RotateCcw className="w-4 h-4" />,
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
                    label={b.risk_status}
                    size="sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Primary Crop</span>
                    <span className="font-bold text-slate-800">{b.primary_crop}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Branch</span>
                    <span className="font-bold text-slate-800">{b.branch_name}</span>
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
    </div>
  );
};
