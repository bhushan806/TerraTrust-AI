/**
 * TerraTrust-AI — RBAC Permissions Unit Tests
 *
 * Tests for the hasPermission and canAccessRoute functions.
 * Validates role-based access control boundaries.
 */

import { describe, it, expect } from 'vitest';
import { hasPermission, canAccessRoute, ROLE_PERMISSIONS, AppFeature } from '@/lib/auth/permissions';
import { UserRole } from '@/types/domain';

/* ─────────────────────────────────────────────
   hasPermission — basic role → feature matrix
───────────────────────────────────────────── */
describe('hasPermission', () => {
  it('returns false for null role', () => {
    expect(hasPermission(null, 'VIEW_DASHBOARD')).toBe(false);
  });

  it('returns false for undefined role', () => {
    expect(hasPermission(undefined, 'VIEW_DASHBOARD')).toBe(false);
  });

  /* LOAN_OFFICER */
  describe('LOAN_OFFICER', () => {
    const role: UserRole = 'LOAN_OFFICER';

    it('can VIEW_DASHBOARD', () => {
      expect(hasPermission(role, 'VIEW_DASHBOARD')).toBe(true);
    });

    it('can VIEW_BORROWERS', () => {
      expect(hasPermission(role, 'VIEW_BORROWERS')).toBe(true);
    });

    it('can MANAGE_BORROWERS', () => {
      expect(hasPermission(role, 'MANAGE_BORROWERS')).toBe(true);
    });

    it('can CREATE_LOAN_APPLICATION', () => {
      expect(hasPermission(role, 'CREATE_LOAN_APPLICATION')).toBe(true);
    });

    it('can CREATE_ASSESSMENT', () => {
      expect(hasPermission(role, 'CREATE_ASSESSMENT')).toBe(true);
    });

    it('can VIEW_RISK_EXPLANATIONS', () => {
      expect(hasPermission(role, 'VIEW_RISK_EXPLANATIONS')).toBe(true);
    });

    it('CANNOT RUN_SCENARIOS (analyst-only)', () => {
      expect(hasPermission(role, 'RUN_SCENARIOS')).toBe(false);
    });

    it('CANNOT MANAGE_USERS (admin-only)', () => {
      expect(hasPermission(role, 'MANAGE_USERS')).toBe(false);
    });

    it('CANNOT VIEW_DATA_SOURCE_HEALTH (admin/operator)', () => {
      expect(hasPermission(role, 'VIEW_DATA_SOURCE_HEALTH')).toBe(false);
    });
  });

  /* RISK_ANALYST */
  describe('RISK_ANALYST', () => {
    const role: UserRole = 'RISK_ANALYST';

    it('can VIEW_DASHBOARD', () => {
      expect(hasPermission(role, 'VIEW_DASHBOARD')).toBe(true);
    });

    it('can RUN_SCENARIOS', () => {
      expect(hasPermission(role, 'RUN_SCENARIOS')).toBe(true);
    });

    it('can VIEW_RISK_EXPLANATIONS', () => {
      expect(hasPermission(role, 'VIEW_RISK_EXPLANATIONS')).toBe(true);
    });

    it('can DOWNLOAD_REPORTS', () => {
      expect(hasPermission(role, 'DOWNLOAD_REPORTS')).toBe(true);
    });

    it('CANNOT MANAGE_BORROWERS (loan officer only)', () => {
      expect(hasPermission(role, 'MANAGE_BORROWERS')).toBe(false);
    });

    it('CANNOT CREATE_LOAN_APPLICATION (loan officer only)', () => {
      expect(hasPermission(role, 'CREATE_LOAN_APPLICATION')).toBe(false);
    });

    it('CANNOT MANAGE_USERS (admin-only)', () => {
      expect(hasPermission(role, 'MANAGE_USERS')).toBe(false);
    });
  });

  /* INSTITUTION_ADMIN */
  describe('INSTITUTION_ADMIN', () => {
    const role: UserRole = 'INSTITUTION_ADMIN';

    it('can VIEW_DASHBOARD', () => {
      expect(hasPermission(role, 'VIEW_DASHBOARD')).toBe(true);
    });

    it('can MANAGE_USERS', () => {
      expect(hasPermission(role, 'MANAGE_USERS')).toBe(true);
    });

    it('can VIEW_DATA_SOURCE_HEALTH', () => {
      expect(hasPermission(role, 'VIEW_DATA_SOURCE_HEALTH')).toBe(true);
    });

    it('CANNOT VIEW_BORROWERS (operational role)', () => {
      expect(hasPermission(role, 'VIEW_BORROWERS')).toBe(false);
    });

    it('CANNOT CREATE_ASSESSMENT (operational role)', () => {
      expect(hasPermission(role, 'CREATE_ASSESSMENT')).toBe(false);
    });

    it('CANNOT RUN_SCENARIOS (analyst only)', () => {
      expect(hasPermission(role, 'RUN_SCENARIOS')).toBe(false);
    });

    it('CANNOT DOWNLOAD_REPORTS (operational roles only)', () => {
      expect(hasPermission(role, 'DOWNLOAD_REPORTS')).toBe(false);
    });
  });

  /* PLATFORM_OPERATOR */
  describe('PLATFORM_OPERATOR', () => {
    const role: UserRole = 'PLATFORM_OPERATOR';

    it('can VIEW_DATA_SOURCE_HEALTH', () => {
      expect(hasPermission(role, 'VIEW_DATA_SOURCE_HEALTH')).toBe(true);
    });

    it('CANNOT VIEW_DASHBOARD (restricted role)', () => {
      expect(hasPermission(role, 'VIEW_DASHBOARD')).toBe(false);
    });

    it('CANNOT VIEW_BORROWERS', () => {
      expect(hasPermission(role, 'VIEW_BORROWERS')).toBe(false);
    });

    it('CANNOT MANAGE_USERS (admin-only)', () => {
      expect(hasPermission(role, 'MANAGE_USERS')).toBe(false);
    });

    it('CANNOT CREATE_ASSESSMENT', () => {
      expect(hasPermission(role, 'CREATE_ASSESSMENT')).toBe(false);
    });
  });
});

/* ─────────────────────────────────────────────
   canAccessRoute — pathname-based routing guards
───────────────────────────────────────────── */
describe('canAccessRoute', () => {
  it('returns false for null role', () => {
    expect(canAccessRoute(null, '/')).toBe(false);
  });

  describe('LOAN_OFFICER route access', () => {
    const role: UserRole = 'LOAN_OFFICER';

    it('can access / (dashboard)', () => {
      expect(canAccessRoute(role, '/')).toBe(true);
    });

    it('can access /borrowers', () => {
      expect(canAccessRoute(role, '/borrowers')).toBe(true);
    });

    it('can access /borrowers/:id', () => {
      expect(canAccessRoute(role, '/borrowers/brw-001')).toBe(true);
    });

    it('can access /borrowers/:id/timeline', () => {
      expect(canAccessRoute(role, '/borrowers/brw-001/timeline')).toBe(true);
    });

    it('can access /loan-applications/new', () => {
      expect(canAccessRoute(role, '/loan-applications/new')).toBe(true);
    });

    it('can access /assessments/new', () => {
      expect(canAccessRoute(role, '/assessments/new')).toBe(true);
    });

    it('CANNOT access /assessments/:id/scenarios', () => {
      expect(canAccessRoute(role, '/assessments/asm-001/scenarios')).toBe(false);
    });

    it('CANNOT access /admin/users', () => {
      expect(canAccessRoute(role, '/admin/users')).toBe(false);
    });

    it('CANNOT access /admin/data-sources', () => {
      expect(canAccessRoute(role, '/admin/data-sources')).toBe(false);
    });
  });

  describe('RISK_ANALYST route access', () => {
    const role: UserRole = 'RISK_ANALYST';

    it('can access /assessments/:id/scenarios', () => {
      expect(canAccessRoute(role, '/assessments/asm-001/scenarios')).toBe(true);
    });

    it('can access /assessments/:id/explanations', () => {
      expect(canAccessRoute(role, '/assessments/asm-001/explanations')).toBe(true);
    });

    it('can access /assessments/:id/report', () => {
      expect(canAccessRoute(role, '/assessments/asm-001/report')).toBe(true);
    });

    it('CANNOT access /loan-applications/new', () => {
      expect(canAccessRoute(role, '/loan-applications/new')).toBe(false);
    });
  });

  describe('INSTITUTION_ADMIN route access', () => {
    const role: UserRole = 'INSTITUTION_ADMIN';

    it('can access /admin/users', () => {
      expect(canAccessRoute(role, '/admin/users')).toBe(true);
    });

    it('can access /admin/data-sources', () => {
      expect(canAccessRoute(role, '/admin/data-sources')).toBe(true);
    });

    it('CANNOT access /borrowers', () => {
      expect(canAccessRoute(role, '/borrowers')).toBe(false);
    });
  });

  describe('PLATFORM_OPERATOR route access', () => {
    const role: UserRole = 'PLATFORM_OPERATOR';

    it('can access /admin/data-sources', () => {
      expect(canAccessRoute(role, '/admin/data-sources')).toBe(true);
    });

    it('CANNOT access /', () => {
      expect(canAccessRoute(role, '/')).toBe(false);
    });

    it('CANNOT access /admin/users', () => {
      expect(canAccessRoute(role, '/admin/users')).toBe(false);
    });
  });
});

/* ─────────────────────────────────────────────
   ROLE_PERMISSIONS — structural integrity
───────────────────────────────────────────── */
describe('ROLE_PERMISSIONS structural checks', () => {
  it('defines permissions for all 4 roles', () => {
    const roles: UserRole[] = ['LOAN_OFFICER', 'RISK_ANALYST', 'INSTITUTION_ADMIN', 'PLATFORM_OPERATOR'];
    roles.forEach((role) => {
      expect(ROLE_PERMISSIONS[role]).toBeDefined();
      expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
    });
  });

  it('all permission arrays contain only valid AppFeature strings', () => {
    const validFeatures: AppFeature[] = [
      'VIEW_DASHBOARD', 'VIEW_BORROWERS', 'MANAGE_BORROWERS', 'VIEW_FARMS',
      'CREATE_LOAN_APPLICATION', 'VIEW_LOAN_APPLICATIONS', 'VIEW_CLIMATE_INTELLIGENCE',
      'VIEW_YIELD_PREDICTION', 'VIEW_INCOME_ANALYSIS', 'CREATE_ASSESSMENT',
      'VIEW_ASSESSMENT_DETAIL', 'VIEW_RISK_EXPLANATIONS', 'RUN_SCENARIOS',
      'VIEW_RISK_TIMELINE', 'DOWNLOAD_REPORTS', 'MANAGE_USERS',
      'VIEW_DATA_SOURCE_HEALTH', 'ACCESS_DEFERRED_FEATURES',
    ];

    Object.values(ROLE_PERMISSIONS).forEach((permissions) => {
      permissions.forEach((feature) => {
        expect(validFeatures).toContain(feature);
      });
    });
  });

  it('no role has duplicate permissions', () => {
    Object.entries(ROLE_PERMISSIONS).forEach(([role, permissions]) => {
      const unique = new Set(permissions);
      expect(unique.size).toBe(permissions.length);
    });
  });

  it('LOAN_OFFICER has more permissions than INSTITUTION_ADMIN (operational coverage)', () => {
    expect(ROLE_PERMISSIONS['LOAN_OFFICER'].length).toBeGreaterThan(
      ROLE_PERMISSIONS['INSTITUTION_ADMIN'].length
    );
  });

  it('PLATFORM_OPERATOR has the fewest permissions (minimal access)', () => {
    const minLength = Math.min(
      ...Object.values(ROLE_PERMISSIONS).map((p) => p.length)
    );
    expect(ROLE_PERMISSIONS['PLATFORM_OPERATOR'].length).toBe(minLength);
  });
});
