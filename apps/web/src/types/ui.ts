import { ReactNode } from 'react';
import { UserRole } from './domain';

export type StatusBadgeVariant =
  | 'PRODUCTION'
  | 'ILLUSTRATIVE'
  | 'STALE'
  | 'PARTIAL'
  | 'PENDING'
  | 'FAILED'
  | 'PD_UNAVAILABLE'
  | 'MODEL_OUTPUT'
  | 'USER_ASSUMPTION'
  | 'BACKEND_AUTHORITATIVE'
  | 'PROVIDER_UNAVAILABLE'
  | 'HEALTHY'
  | 'HIGH_RISK';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  total: number;
}

export interface BorrowerFilterState {
  search: string;
  region: string;
  branchId: string;
  riskStatus: string;
  assessmentStatus: string;
  primaryCrop: string;
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  durationMs?: number;
}

export interface ScopeContextState {
  institutionId: string;
  institutionName: string;
  branchId: string;
  branchName: string;
  region: string;
  availableBranches: Array<{ id: string; name: string; region: string }>;
  setBranch: (branchId: string) => void;
}

export interface AuthContextState {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    institutionId: string;
    branchId: string;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credential?: string, password?: string, userType?: 'officer' | 'farmer') => Promise<void>;
  logout: () => Promise<void>;
  switchRoleForDemo: (role: UserRole) => void;
}

export interface ColumnDef<T> {
  key: string;
  header: string | ReactNode;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
  align?: 'left' | 'center' | 'right';
}
