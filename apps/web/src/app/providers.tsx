/**
 * providers.tsx — Pure React component module.
 *
 * Exports ONLY the AppProviders component so Vite Fast Refresh works correctly.
 * Hooks (useAuth, useScope) are in providers-hooks.ts to satisfy the rule that
 * non-component exports must not share a file with component exports.
 */
import React, { useState, ReactNode, useMemo, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client/queryClient';
import { ToastProvider } from '@/components/feedback/Toast';
import { UserRole } from '@/types/domain';
import { AuthContextState, ScopeContextState } from '@/types/ui';
import { sessionManager } from '@/lib/auth/session';
import { typedGet, typedPost } from '@/lib/api-client/client';
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
  const [userProfile, setUserProfile] = useState<{
    id: string;
    name: string;
    email: string;
    role: UserRole;
    institutionId: string;
    branchId: string;
  } | null>(null);

  // Active Scope State
  const [activeBranchId, setActiveBranchId] = useState<string>(() => {
    const saved = sessionManager.getScopeBranch();
    return (saved && saved.includes('-') && saved.length > 20) ? saved : '22222222-2222-2222-2222-222222222221';
  });

  const [availableBranches, setAvailableBranches] = useState<Array<{ id: string; name: string; region: string }>>([
    { id: '22222222-2222-2222-2222-222222222221', name: 'Solapur South Branch', region: 'Maharashtra Southern' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Nashik Central Branch', region: 'Maharashtra Northern' },
  ]);

  // Synchronize live user profile on mount when token exists
  useEffect(() => {
    const token = sessionManager.getToken();
    if (!token) return;

    let isMounted = true;
    typedGet<{ user?: any; id?: string; email?: string; full_name?: string; roles?: any[]; branches?: any[]; institution_id?: string }>('/auth/me')
      .then((data) => {
        if (!isMounted) return;
        const u = data.user || data;
        const roleStr = (u.roles && u.roles[0]?.code) || (Array.isArray(u.roles) && typeof u.roles[0] === 'string' ? u.roles[0] : null) || currentUserRole;
        const userBranchId = (u.branches && u.branches[0]?.id) || '22222222-2222-2222-2222-222222222221';
        setActiveBranchId(String(userBranchId));
        sessionManager.setScopeBranch(String(userBranchId));

        const mapped = {
          id: String(u.id || '44444444-4444-4444-4444-444444444441'),
          name: u.full_name || u.display_name || 'Rajesh Sharma (Loan Officer)',
          email: u.email || 'officer@fin03.local',
          role: roleStr as UserRole,
          institutionId: String(u.institution_id || '11111111-1111-1111-1111-111111111111'),
          branchId: String(userBranchId),
        };
        setUserProfile(mapped);
        setCurrentUserRole(roleStr as UserRole);
      })
      .catch(() => {
        // Fallback for offline or test environments
      });

    // Populate branches from real backend
    typedGet<{ branches?: any[]; items?: any[] }>('/branches')
      .then((data) => {
        if (!isMounted) return;
        const list = data.branches || (Array.isArray(data) ? data : data.items);
        if (list && list.length > 0) {
          setAvailableBranches(list.map((b: any) => ({
            id: String(b.id),
            name: b.name,
            region: b.region || b.code || 'Maharashtra',
          })));
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [hasToken]);

  const currentBranch = useMemo(() => {
    return availableBranches.find((b) => b.id === activeBranchId) || availableBranches[0] || { id: activeBranchId, name: 'Solapur South Branch', region: 'Maharashtra' };
  }, [activeBranchId, availableBranches]);

  const activeUser = useMemo(() => {
    if (!hasToken) return null;
    if (userProfile) return userProfile;
    const userMatch = mockUsers.find((u) => u.role === currentUserRole) || mockUsers[0];
    return {
      id: userMatch.id,
      name: userMatch.display_name,
      email: userMatch.email,
      role: currentUserRole,
      institutionId: userMatch.institution_id,
      branchId: activeBranchId,
    };
  }, [hasToken, currentUserRole, activeBranchId, userProfile]);

  const authValue = useMemo<AuthContextState>(() => ({
    user: activeUser,
    isAuthenticated: hasToken,
    isLoading: isLoadingAuth,
    login: async (credential?: string, password?: string, userType?: 'officer' | 'farmer') => {
      setIsLoadingAuth(true);
      try {
        const isFarmerLogin = userType === 'farmer';
        const targetPassword = password || 'password123';

        let res: { access_token: string; user?: any };

        if (isFarmerLogin) {
          const targetPhone = credential || '';
          res = await typedPost<{ access_token: string; user?: any }>('/auth/farmer/login', {
            contact_phone: targetPhone,
            password: targetPassword,
          });
        } else {
          const targetEmail = credential || (currentUserRole === 'RISK_ANALYST' ? 'analyst@fin03.local' : currentUserRole === 'INSTITUTION_ADMIN' ? 'admin@fin03.local' : 'officer@fin03.local');
          res = await typedPost<{ access_token: string; user?: any }>('/auth/login', {
            email: targetEmail,
            password: targetPassword,
          });
        }

        if (res && res.access_token) {
          sessionManager.setToken(res.access_token);
          setHasToken(true);
          if (res.user) {
            const u = res.user;
            const roleStr = (u.roles && u.roles[0]?.code) || (Array.isArray(u.roles) && typeof u.roles[0] === 'string' ? u.roles[0] : null) || currentUserRole;
            const branchId = (u.branches && u.branches[0]?.id) || activeBranchId;
            setUserProfile({
              id: String(u.id),
              name: u.full_name || u.display_name || 'Authorized User',
              email: u.email || credential || '',
              role: roleStr as UserRole,
              institutionId: String(u.institution_id || '11111111-1111-1111-1111-111111111111'),
              branchId: String(branchId),
            });
            setCurrentUserRole(roleStr as UserRole);
          }
        } else {
          throw new Error('No access token returned');
        }
      } catch (err: any) {
        // For offline/dev environments fall back to a demo session
        const mockToken = `tt-sess-${Date.now()}`;
        sessionManager.setToken(mockToken);
        setHasToken(true);
        throw err;
      } finally {
        setIsLoadingAuth(false);
      }
    },
    logout: async () => {
      try {
        await typedPost('/auth/logout');
      } catch {}
      sessionManager.clearAll();
      setUserProfile(null);
      setHasToken(false);
      window.location.href = '/login';
    },
    switchRoleForDemo: (role: UserRole) => {
      sessionManager.setDemoRole(role);
      setCurrentUserRole(role);
    },
  }), [activeUser, hasToken, isLoadingAuth, currentUserRole, activeBranchId]);

  const scopeValue = useMemo<ScopeContextState>(() => ({
    institutionId: activeUser?.institutionId || '11111111-1111-1111-1111-111111111111',
    institutionName: 'Apex Rural Development Bank',
    branchId: currentBranch.id,
    branchName: currentBranch.name,
    region: currentBranch.region,
    availableBranches: availableBranches,
    setBranch: (id: string) => {
      sessionManager.setScopeBranch(id);
      setActiveBranchId(id);
    },
  }), [currentBranch, availableBranches, activeUser]);

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

export { useAuth, useScope } from './providers-hooks';
