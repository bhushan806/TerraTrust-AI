/**
 * TerraTrust-AI — Session and Token Storage Manager
 */

import { UserRole } from '@/types/domain';

const TOKEN_KEY = 'terratrust_token';
const DEMO_ROLE_KEY = 'terratrust_demo_role';
const SCOPE_BRANCH_KEY = 'terratrust_scope_branch';

export const sessionManager = {
  getToken(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken(token: string): void {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {}
  },
  getDemoRole(): UserRole | null {
    try {
      return (sessionStorage.getItem(DEMO_ROLE_KEY) as UserRole) || null;
    } catch {
      return null;
    }
  },
  setDemoRole(role: UserRole): void {
    try {
      sessionStorage.setItem(DEMO_ROLE_KEY, role);
    } catch {}
  },
  getScopeBranch(): string | null {
    try {
      return sessionStorage.getItem(SCOPE_BRANCH_KEY) || null;
    } catch {
      return null;
    }
  },
  setScopeBranch(branchId: string): void {
    try {
      sessionStorage.setItem(SCOPE_BRANCH_KEY, branchId);
    } catch {}
  },
  clearAll(): void {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(DEMO_ROLE_KEY);
      sessionStorage.removeItem(SCOPE_BRANCH_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
  },
};
