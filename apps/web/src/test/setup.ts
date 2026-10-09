/**
 * TerraTrust-AI — Vitest Test Setup
 *
 * Runs before all test suites:
 * - Imports jest-dom matchers for DOM assertions
 * - Mocks browser APIs not available in jsdom
 * - Configures global test utilities
 */

import '@testing-library/jest-dom';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

/* ── Auto-cleanup after each test ────────────────────────── */
afterEach(() => {
  cleanup();
});

/* ── Mock ResizeObserver (not available in jsdom) ─────────── */
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

/* ── Mock IntersectionObserver ─────────────────────────────── */
global.IntersectionObserver = class IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
} as unknown as typeof IntersectionObserver;

/* ── Mock window.matchMedia ────────────────────────────────── */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

/* ── Mock sessionStorage ───────────────────────────────────── */
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true,
});

/* ── Suppress noisy console errors in tests ────────────────── */
const originalError = console.error;
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    const msg = args[0];
    // Suppress React prop-type warnings and act() warnings in tests
    if (
      typeof msg === 'string' &&
      (msg.includes('Warning: An update to') ||
       msg.includes('Warning: ReactDOM.render') ||
       msg.includes('act('))
    ) {
      return;
    }
    originalError(...args);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  sessionStorageMock.clear();
});

/* ── Accessibility testing ─────────────────────────────────── */
// Use runAxeAudit() and runAxeSmoke() from '@/test/accessibility.ts'
// for component-level accessibility verification (WCAG 2.2 AA).
