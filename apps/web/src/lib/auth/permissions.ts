/**
 * TerraTrust-AI — Role-Based Access Control (RBAC) Permissions
 */

import { UserRole } from '@/types/domain';

export type AppFeature =
  | 'VIEW_DASHBOARD'
  | 'VIEW_BORROWERS'
  | 'MANAGE_BORROWERS'
  | 'VIEW_FARMS'
  | 'CREATE_LOAN_APPLICATION'
  | 'VIEW_LOAN_APPLICATIONS'
  | 'VIEW_CLIMATE_INTELLIGENCE'
  | 'VIEW_YIELD_PREDICTION'
  | 'VIEW_INCOME_ANALYSIS'
  | 'CREATE_ASSESSMENT'
  | 'VIEW_ASSESSMENT_DETAIL'
  | 'VIEW_RISK_EXPLANATIONS'
  | 'RUN_SCENARIOS'
  | 'VIEW_RISK_TIMELINE'
  | 'DOWNLOAD_REPORTS'
  | 'MANAGE_USERS'
  | 'VIEW_DATA_SOURCE_HEALTH'
  | 'ACCESS_DEFERRED_FEATURES';

export const ROLE_PERMISSIONS: Record<UserRole, AppFeature[]> = {
  LOAN_OFFICER: [
    'VIEW_DASHBOARD',
    'VIEW_BORROWERS',
    'MANAGE_BORROWERS',
    'VIEW_FARMS',
    'CREATE_LOAN_APPLICATION',
    'VIEW_LOAN_APPLICATIONS',
    'VIEW_CLIMATE_INTELLIGENCE',
    'VIEW_YIELD_PREDICTION',
    'VIEW_INCOME_ANALYSIS',
    'CREATE_ASSESSMENT',
    'VIEW_ASSESSMENT_DETAIL',
    'VIEW_RISK_EXPLANATIONS',
    'VIEW_RISK_TIMELINE',
    'DOWNLOAD_REPORTS',
  ],
  RISK_ANALYST: [
    'VIEW_DASHBOARD',
    'VIEW_BORROWERS',
    'VIEW_FARMS',
    'VIEW_LOAN_APPLICATIONS',
    'VIEW_CLIMATE_INTELLIGENCE',
    'VIEW_YIELD_PREDICTION',
    'VIEW_INCOME_ANALYSIS',
    'CREATE_ASSESSMENT',
    'VIEW_ASSESSMENT_DETAIL',
    'VIEW_RISK_EXPLANATIONS',
    'RUN_SCENARIOS',
    'VIEW_RISK_TIMELINE',
    'DOWNLOAD_REPORTS',
  ],
  INSTITUTION_ADMIN: [
    'VIEW_DASHBOARD',
    'MANAGE_USERS',
    'VIEW_DATA_SOURCE_HEALTH',
  ],
  PLATFORM_OPERATOR: [
    'VIEW_DATA_SOURCE_HEALTH',
  ],
};

export function hasPermission(
  role: UserRole | null | undefined,
  feature: AppFeature
): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(feature) : false;
}

export function canAccessRoute(
  role: UserRole | null | undefined,
  pathname: string
): boolean {
  if (!role) return false;

  const cleanPath = pathname.split('?')[0].replace(/\/+$/, '') || '/';

  if (cleanPath === '/') {
    return hasPermission(role, 'VIEW_DASHBOARD');
  }

  if (cleanPath === '/borrowers' || cleanPath.startsWith('/borrowers/')) {
    if (cleanPath.endsWith('/timeline')) {
      return hasPermission(role, 'VIEW_RISK_TIMELINE');
    }
    return hasPermission(role, 'VIEW_BORROWERS');
  }

  if (cleanPath === '/loan-applications/new') {
    return hasPermission(role, 'CREATE_LOAN_APPLICATION');
  }

  if (cleanPath.startsWith('/loan-applications')) {
    return hasPermission(role, 'VIEW_LOAN_APPLICATIONS');
  }

  if (cleanPath === '/assessments/new') {
    return hasPermission(role, 'CREATE_ASSESSMENT');
  }

  if (cleanPath.includes('/scenarios')) {
    return hasPermission(role, 'RUN_SCENARIOS');
  }

  if (cleanPath.includes('/explanations')) {
    return hasPermission(role, 'VIEW_RISK_EXPLANATIONS');
  }

  if (cleanPath.includes('/report')) {
    return hasPermission(role, 'DOWNLOAD_REPORTS');
  }

  if (cleanPath.startsWith('/assessments')) {
    return hasPermission(role, 'VIEW_ASSESSMENT_DETAIL');
  }

  if (cleanPath === '/admin/users' || cleanPath.startsWith('/admin/users/')) {
    return hasPermission(role, 'MANAGE_USERS');
  }

  if (cleanPath === '/admin/data-sources' || cleanPath.startsWith('/admin/data-sources/')) {
    return hasPermission(role, 'VIEW_DATA_SOURCE_HEALTH');
  }

  if (cleanPath.startsWith('/farms')) {
    return hasPermission(role, 'VIEW_FARMS');
  }

  if (cleanPath.startsWith('/climate')) {
    return hasPermission(role, 'VIEW_CLIMATE_INTELLIGENCE');
  }

  if (cleanPath.startsWith('/yield')) {
    return hasPermission(role, 'VIEW_YIELD_PREDICTION');
  }

  if (cleanPath.startsWith('/income')) {
    return hasPermission(role, 'VIEW_INCOME_ANALYSIS');
  }

  return true;
}
