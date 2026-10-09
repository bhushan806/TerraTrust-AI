/**
 * providers-hooks.ts — Pure hook module (no React components).
 *
 * Separated from providers.tsx so Vite Fast Refresh can correctly distinguish
 * between component exports (providers.tsx) and non-component hook exports here.
 * This eliminates the "useAuth export is incompatible" HMR warning.
 */
import { useContext } from 'react';
import type { AuthContextState, ScopeContextState } from '@/types/ui';
import { AuthContext, ScopeContext } from './providers-context';

export function useAuth(): AuthContextState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AppProviders');
  return ctx;
}

export function useScope(): ScopeContextState {
  const ctx = useContext(ScopeContext);
  if (!ctx) throw new Error('useScope must be used within AppProviders');
  return ctx;
}
