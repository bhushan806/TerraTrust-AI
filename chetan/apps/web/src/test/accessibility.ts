/**
 * TerraTrust-AI — Accessibility Test Helpers
 *
 * Provides utilities for running axe-core accessibility audits
 * during component and integration tests.
 *
 * Target: WCAG 2.2 AA
 *
 * Uses axe-core directly (no jest-axe dependency required).
 */

import axe, { RunOptions, AxeResults } from 'axe-core';
import { expect } from 'vitest';

/* ── Axe configuration for WCAG 2.2 AA ─────────────────── */
const axeRuleConfig: RunOptions = {
  rules: {
    // Enforce AA color contrast (stricter than A)
    'color-contrast': { enabled: true },
    // Require alt text on all images
    'image-alt': { enabled: true },
    // Require form labels
    label: { enabled: true },
    // Require unique IDs
    'duplicate-id': { enabled: true },
    // Require main landmark
    'landmark-one-main': { enabled: true },
    // Require valid ARIA attributes
    'aria-allowed-attr': { enabled: true },
    // Require ARIA roles to have required properties
    'aria-required-attr': { enabled: true },
    // Require buttons to have accessible names
    'button-name': { enabled: true },
    // Require links to have accessible names
    'link-name': { enabled: true },
    // Require heading hierarchy
    'heading-order': { enabled: true },
    // No positive tabindex
    tabindex: { enabled: true },
  },
};

/**
 * Returns a human-readable summary of axe violations for debug output.
 * Useful in test failure messages.
 */
export function formatAxeViolations(results: AxeResults): string {
  if (results.violations.length === 0) return 'No accessibility violations found.';

  return results.violations
    .map((v) => {
      const nodes = v.nodes
        .map(
          (n) =>
            `  HTML: ${n.html.substring(0, 200)}\n  Fix: ${
              n.failureSummary?.substring(0, 300) ?? 'N/A'
            }`
        )
        .join('\n');
      return `[${v.impact?.toUpperCase() ?? 'UNKNOWN'}] ${v.id}: ${v.description}\n${nodes}`;
    })
    .join('\n\n');
}

/**
 * Runs an axe accessibility audit on a given container element.
 * Throws Vitest-compatible assertion errors for violations.
 *
 * @param container - The DOM element to audit (typically rendered component)
 * @returns axe results object for further inspection if needed
 *
 * @example
 * const { container } = render(<MyComponent />);
 * await runAxeAudit(container);
 */
export async function runAxeAudit(
  container: Element | HTMLElement
): Promise<AxeResults> {
  const results = await axe.run(container, axeRuleConfig);
  if (results.violations.length > 0) {
    const summary = formatAxeViolations(results);
    expect.fail(`Accessibility violations found (WCAG 2.2 AA):\n\n${summary}`);
  }
  return results;
}

/**
 * A minimal axe config for quick smoke tests.
 * Checks the most critical accessibility rules only.
 */
export async function runAxeSmoke(
  container: Element | HTMLElement
): Promise<void> {
  const results = await axe.run(container, {
    rules: {
      'color-contrast': { enabled: true },
      'image-alt': { enabled: true },
      label: { enabled: true },
      'button-name': { enabled: true },
      'link-name': { enabled: true },
    },
  });

  if (results.violations.length > 0) {
    const summary = formatAxeViolations(results);
    expect.fail(`Accessibility smoke test failed:\n\n${summary}`);
  }
}
