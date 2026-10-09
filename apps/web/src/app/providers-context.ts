/**
 * providers-context.ts
 *
 * Contains only React context objects (no components, no hooks).
 * Separated from providers.tsx so Vite Fast Refresh can correctly
 * track component exports vs non-component exports independently.
 */
import { createContext } from 'react';
import type { AuthContextState, ScopeContextState } from '@/types/ui';

export const AuthContext = createContext<AuthContextState | null>(null);
export const ScopeContext = createContext<ScopeContextState | null>(null);
