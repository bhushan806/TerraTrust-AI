/**
 * providers.tsx — Pure React component module.
 *
 * Exports ONLY the AppProviders component so Vite Fast Refresh works correctly.
 * Hooks (useAuth, useScope) are in providers-hooks.ts to satisfy the rule that
 * non-component exports must not share a file with component exports.
 */
import React, { useState, ReactNode, useMemo } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client/queryClient';
import { ToastProvider } from '@/components/feedback/Toast';
import { UserRole } from '@/types/domain';
import { AuthContextState, ScopeContextState } from '@/types/ui';
import { sessionManager } from '@/lib/auth/session';
import { mockBranches, mockUsers } from '@/mocks/fixtures/users';
import { AuthContext, ScopeContext } from './providers-context';

export const AppProviders: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Authentication State
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(() => {
    return sessionManager.getDemoRole() || 'LOAN_OFFICER';
  });

  const [hasToken, setHasToken] = useState<boolean>(() => {
    return !!sessionManager.getToken();
  });

  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(false);

  // Active Scope State
  const [activeBranchId, setActiveBranchId] = useState<string>(() => {
    return sessionManager.getScopeBranch() || mockBranches[0].id;
  });

  const currentBranch = useMemo(() => {
    return mockBranches.find((b) => b.id === activeBranchId) || mockBranches[0];
  }, [activeBranchId]);

  const activeUser = useMemo(() => {
    if (!hasToken) return null;
    const userMatch = mockUsers.find((u) => u.role === currentUserRole) || mockUsers[0];
    return {
      id: userMatch.id,
      name: userMatch.display_name,
      email: userMatch.email,
      role: currentUserRole,
      institutionId: userMatch.institution_id,
      branchId: activeBranchId,
    };
  }, [hasToken, currentUserRole, activeBranchId]);

  const authValue = useMemo<AuthContextState>(() => ({
    user: activeUser,
    isAuthenticated: hasToken,
    isLoading: isLoadingAuth,
    login: async () => {
      setIsLoadingAuth(true);
      await new Promise((r) => setTimeout(r, 400));
      const mockToken = `tt-sess-${Date.now()}`;
      sessionManager.setToken(mockToken);
      setHasToken(true);
      setIsLoadingAuth(false);
    },
    logout: async () => {
      sessionManager.clearAll();
      setHasToken(false);
      window.location.href = '/login';
    },
    switchRoleForDemo: (role: UserRole) => {
      sessionManager.setDemoRole(role);
      setCurrentUserRole(role);
    },
  }), [activeUser, hasToken, isLoadingAuth]);

  const scopeValue = useMemo<ScopeContextState>(() => ({
    institutionId: 'inst-9901',
    institutionName: 'Apex Rural Credit Bank of India',
    branchId: currentBranch.id,
    branchName: currentBranch.name,
    region: currentBranch.region,
    availableBranches: mockBranches.map((b) => ({ id: b.id, name: b.name, region: b.region })),
    setBranch: (id: string) => {
      sessionManager.setScopeBranch(id);
      setActiveBranchId(id);
    },
  }), [currentBranch]);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthContext.Provider value={authValue}>
          <ScopeContext.Provider value={scopeValue}>
            {children}
          </ScopeContext.Provider>
        </AuthContext.Provider>
      </ToastProvider>
    </QueryClientProvider>
  );
};

// ---------------------------------------------------------------------------
// Re-export hooks from the dedicated hooks module so existing
// import { useAuth } from '@/app/providers' paths keep working unchanged.
// ---------------------------------------------------------------------------
export { useAuth, useScope } from './providers-hooks';
