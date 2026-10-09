import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  UserPlus,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DetailCard } from '@/components/data-display/DetailCard';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { SearchField } from '@/components/forms/SearchField';
import { SelectField } from '@/components/forms/SelectField';
import { LoadingState } from '@/components/feedback/LoadingState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { useToast } from '@/components/feedback/Toast';
import { formatDate } from '@/lib/formatters/date';
import { ROLE_PERMISSIONS } from '@/lib/auth/permissions';
import { typedGet, typedPatch } from '@/lib/api-client/client';
import { queryKeys } from '@/lib/query-client/query-keys';
import { User, UserRole } from '@/types/domain';

export const UserAdminPage: React.FC = () => {
  const queryClientTanstack = useQueryClient();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Role Change Confirmation Modal State
  const [selectedUserForRoleChange, setSelectedUserForRoleChange] = useState<User | null>(null);
  const [pendingNewRole, setPendingNewRole] = useState<UserRole | null>(null);

  const usersQuery = useQuery({
    queryKey: queryKeys.users({ search, roleFilter }),
    queryFn: () => typedGet<{ users: User[]; total: number }>('/users'),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: UserRole }) =>
      typedPatch<{ user: User }>(`/users/${userId}/roles`, { role: newRole }),
    onSuccess: (data) => {
      queryClientTanstack.invalidateQueries({ queryKey: ['users'] });
      showToast({
        type: 'success',
        title: 'User Role Updated',
        message: `${data.user.display_name} role modified to ${data.user.role}. Audit event recorded.`,
      });
      setSelectedUserForRoleChange(null);
      setPendingNewRole(null);
    },
    onError: (err: any) => {
      showToast({
        type: 'error',
        title: 'Role Update Failed',
        message: err.message || 'Unable to update user privileges on backend.',
      });
    },
  });

  const handleInitiateRoleChange = (user: User, newRole: UserRole) => {
    if (user.role === newRole) return;
    setSelectedUserForRoleChange(user);
    setPendingNewRole(newRole);
  };

  const users = usersQuery.data?.users || [];
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.display_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.id.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institution User Administration"
        subtitle="Manage loan officer, risk analyst, and administrator access privileges with strict audit logging."
        breadcrumbs={[
          { label: 'Administration', href: '/admin/users' },
          { label: 'Users', current: true },
        ]}
        badge={<StatusBadge variant="BACKEND_AUTHORITATIVE" label="RBAC ENFORCED" size="md" />}
      />

      {/* Search & Filter Toolbar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <SearchField
            placeholder="Search by name, email, or user identifier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
          />
        </div>
        <div>
          <SelectField
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter by Institutional Role"
          >
            <option value="ALL">All Roles</option>
            <option value="LOAN_OFFICER">Loan Officer</option>
            <option value="RISK_ANALYST">Risk Analyst</option>
            <option value="INSTITUTION_ADMIN">Institution Admin</option>
            <option value="PLATFORM_OPERATOR">Platform Operator</option>
          </SelectField>
        </div>
      </div>

      {/* Users Table */}
      {usersQuery.isLoading ? (
        <LoadingState message="Loading directory users and permission scopes..." />
      ) : usersQuery.isError ? (
        <ErrorState error={usersQuery.error} onRetry={() => usersQuery.refetch()} />
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 uppercase text-neutral-600 font-semibold tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3.5">User / Subject</th>
                  <th scope="col" className="px-4 py-3.5">Email</th>
                  <th scope="col" className="px-4 py-3.5">Current Role</th>
                  <th scope="col" className="px-4 py-3.5">Status</th>
                  <th scope="col" className="px-4 py-3.5">Assigned Branches</th>
                  <th scope="col" className="px-4 py-3.5 text-right">Modify Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-neutral-900 text-sm">{u.display_name}</div>
                      <span className="font-mono text-[11px] text-neutral-400">{u.id}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-neutral-700">{u.email}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        variant={
                          u.role === 'INSTITUTION_ADMIN'
                            ? 'HIGH_RISK'
                            : u.role === 'RISK_ANALYST'
                            ? 'MODEL_OUTPUT'
                            : 'PRODUCTION'
                        }
                        label={u.role.replace('_', ' ')}
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge variant="HEALTHY" label={u.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-neutral-600">
                      {u.branches.join(', ')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleInitiateRoleChange(u, e.target.value as UserRole)}
                        className="text-xs font-semibold px-2 py-1 bg-white border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-700"
                      >
                        <option value="LOAN_OFFICER">Loan Officer</option>
                        <option value="RISK_ANALYST">Risk Analyst</option>
                        <option value="INSTITUTION_ADMIN">Institution Admin</option>
                        <option value="PLATFORM_OPERATOR">Platform Operator</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mandatory Role Change Confirmation Modal (Section 4 & 21) */}
      {selectedUserForRoleChange && pendingNewRole && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2 text-rose-800">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-neutral-900">
                  Confirm Privilege Role Escalation / Transition
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedUserForRoleChange(null);
                  setPendingNewRole(null);
                }}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User & Role Impact Details */}
            <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200 space-y-2 text-xs">
              <div className="flex justify-between border-b border-neutral-200 pb-1">
                <span className="text-neutral-500">Target User:</span>
                <span className="font-bold text-neutral-900">{selectedUserForRoleChange.display_name}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-200 pb-1">
                <span className="text-neutral-500">Identifier (UUID):</span>
                <span className="font-mono text-neutral-700">{selectedUserForRoleChange.id}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-200 pb-1">
                <span className="text-neutral-500">Current Role:</span>
                <span className="font-semibold text-neutral-800">{selectedUserForRoleChange.role}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-200 pb-1">
                <span className="text-neutral-500">New Role Requested:</span>
                <span className="font-bold text-primary-900 bg-primary-100 px-1.5 py-0.5 rounded">
                  {pendingNewRole}
                </span>
              </div>
            </div>

            {/* Permission Impact Disclosure */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-neutral-800 uppercase tracking-wider block text-[11px]">
                Authorized Capability Impact:
              </span>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 space-y-1">
                <p className="font-semibold">New Authorized Features for {pendingNewRole}:</p>
                <div className="flex flex-wrap gap-1 text-[11px] pt-1">
                  {ROLE_PERMISSIONS[pendingNewRole].map((feat) => (
                    <span key={feat} className="bg-white border border-blue-200 px-1.5 py-0.5 rounded font-mono">
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Warning */}
            <p className="text-xs text-neutral-600 leading-relaxed">
              This action requires backend permission verification. Frontend role checks do not constitute an authoritative authorization boundary.
            </p>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedUserForRoleChange(null);
                  setPendingNewRole(null);
                }}
                className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg text-xs font-semibold hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  updateRoleMutation.mutate({
                    userId: selectedUserForRoleChange.id,
                    newRole: pendingNewRole,
                  })
                }
                disabled={updateRoleMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-900 text-white rounded-lg text-xs font-bold hover:bg-primary-800 disabled:opacity-50"
              >
                {updateRoleMutation.isPending ? (
                  <span>Applying Backend Update...</span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authorize & Confirm Role Change</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
