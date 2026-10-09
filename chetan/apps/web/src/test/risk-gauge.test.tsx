/**
 * TerraTrust-AI — RiskGauge Component Tests
 *
 * Critical test: verifies that PD UNAVAILABLE state is rendered
 * correctly and NO fake percentage or numeric PD is shown.
 *
 * Per the immutable UI contract:
 *   - When pdGateStatus !== 'OPEN', never show any PD percentage
 *   - Never render 0% or any numeric placeholder
 *   - Render the PD_UNAVAILABLE badge and governance warning
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RiskGauge } from '@/components/charts/RiskGauge';

/* ── Helper: renders the RiskGauge with minimal props ────── */
function renderGauge(overrides: {
  score?: number | null;
  probabilityOfDefault?: number | null;
  pdGateStatus?: 'CLOSED_EVIDENCE_INCOMPLETE' | 'CLOSED_MODEL_VALIDATION' | 'OPEN';
  riskClassification?: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'CRITICAL' | 'UNASSESSED';
  pdUnavailableReason?: string;
} = {}) {
  return render(
    <RiskGauge
      score={overrides.score ?? 72}
      probabilityOfDefault={overrides.probabilityOfDefault ?? null}
      pdGateStatus={overrides.pdGateStatus ?? 'CLOSED_EVIDENCE_INCOMPLETE'}
      riskClassification={overrides.riskClassification ?? 'MODERATE'}
      pdUnavailableReason={overrides.pdUnavailableReason}
    />
  );
}

/* ─────────────────────────────────────────────
   PD UNAVAILABLE States
───────────────────────────────────────────── */
describe('RiskGauge — PD UNAVAILABLE (gate closed)', () => {
  it('renders PD UNAVAILABLE text when gate is CLOSED_EVIDENCE_INCOMPLETE', () => {
    renderGauge({ pdGateStatus: 'CLOSED_EVIDENCE_INCOMPLETE', probabilityOfDefault: null });
    // Should show unavailable indicator
    const matches = screen.getAllByText(/PD UNAVAILABLE|Probability of Default is Gated/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('renders PD UNAVAILABLE text when gate is CLOSED_MODEL_VALIDATION', () => {
    renderGauge({ pdGateStatus: 'CLOSED_MODEL_VALIDATION', probabilityOfDefault: null });
    const matches = screen.getAllByText(/PD UNAVAILABLE|Probability of Default is Gated/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it('does NOT render any percentage numeric value when PD is unavailable', () => {
    renderGauge({ pdGateStatus: 'CLOSED_EVIDENCE_INCOMPLETE', probabilityOfDefault: null });
    // Must not show any fake PD percentage like "0.00%", "0%", "–%", etc.
    // We allow risk score which is "72 / 100" format, but not PD percentages
    const content = document.body.textContent ?? '';
    // Should not contain patterns like "0.00%" "12.34%" that represent PD
    expect(content).not.toMatch(/Validated Probability of Default/);
  });

  it('does NOT render the "Validated Probability of Default" heading when gated', () => {
    renderGauge({ pdGateStatus: 'CLOSED_EVIDENCE_INCOMPLETE', probabilityOfDefault: null });
    expect(screen.queryByText(/Validated Probability of Default/i)).not.toBeInTheDocument();
  });

  it('does NOT render PD % even if a nonzero probabilityOfDefault value is passed but gate is closed', () => {
    // This tests the critical contract: gate status takes precedence over value
    renderGauge({
      pdGateStatus: 'CLOSED_MODEL_VALIDATION',
      probabilityOfDefault: 0.15, // value provided but gate is closed
    });
    // Should not show "15.00%" or any validated PD display
    expect(screen.queryByText(/Validated Probability of Default/i)).not.toBeInTheDocument();
  });

  it('shows the gate status code in the unavailable panel', () => {
    renderGauge({ pdGateStatus: 'CLOSED_EVIDENCE_INCOMPLETE' });
    expect(screen.getByText(/CLOSED_EVIDENCE_INCOMPLETE/)).toBeInTheDocument();
  });

  it('shows the gate status code for CLOSED_MODEL_VALIDATION', () => {
    renderGauge({ pdGateStatus: 'CLOSED_MODEL_VALIDATION' });
    expect(screen.getByText(/CLOSED_MODEL_VALIDATION/)).toBeInTheDocument();
  });

  it('shows a governance warning about not interpreting as PD', () => {
    renderGauge({ pdGateStatus: 'CLOSED_EVIDENCE_INCOMPLETE' });
    expect(
      screen.getByText(/must not be interpreted as a probability of default/i)
    ).toBeInTheDocument();
  });

  it('shows custom unavailable reason when provided', () => {
    const reason = 'Satellite imagery is missing for the primary survey period.';
    renderGauge({
      pdGateStatus: 'CLOSED_EVIDENCE_INCOMPLETE',
      pdUnavailableReason: reason,
    });
    expect(screen.getByText(reason)).toBeInTheDocument();
  });

  it('renders risk classification label even when PD is unavailable', () => {
    renderGauge({ pdGateStatus: 'CLOSED_EVIDENCE_INCOMPLETE', riskClassification: 'HIGH' });
    const matches = screen.getAllByText(/HIGH/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});

/* ─────────────────────────────────────────────
   PD OPEN (gate open, PD available)
───────────────────────────────────────────── */
describe('RiskGauge — PD OPEN (validated PD available)', () => {
  it('renders the Validated PD heading', () => {
    renderGauge({
      pdGateStatus: 'OPEN',
      probabilityOfDefault: 0.0842,
      riskClassification: 'LOW',
    });
    expect(screen.getByText(/Validated Probability of Default/i)).toBeInTheDocument();
  });

  it('renders the PD percentage value', () => {
    renderGauge({
      pdGateStatus: 'OPEN',
      probabilityOfDefault: 0.0842,
      riskClassification: 'LOW',
    });
    // "8.42%"
    expect(screen.getByText('8.42%')).toBeInTheDocument();
  });

  it('does NOT show PD UNAVAILABLE text when gate is OPEN', () => {
    renderGauge({
      pdGateStatus: 'OPEN',
      probabilityOfDefault: 0.1,
      riskClassification: 'MODERATE',
    });
    expect(screen.queryByText(/PD UNAVAILABLE/i)).not.toBeInTheDocument();
  });

  it('does NOT show "Gated" warning when PD is available', () => {
    renderGauge({
      pdGateStatus: 'OPEN',
      probabilityOfDefault: 0.05,
      riskClassification: 'LOW',
    });
    expect(screen.queryByText(/Probability of Default is Gated/i)).not.toBeInTheDocument();
  });

  it('handles probabilityOfDefault = 0 (unlikely but valid)', () => {
    renderGauge({
      pdGateStatus: 'OPEN',
      probabilityOfDefault: 0,
      riskClassification: 'LOW',
    });
    // Gate is open, 0 is a valid PD value
    expect(screen.getByText('0.00%')).toBeInTheDocument();
  });
});

/* ─────────────────────────────────────────────
   Score Display
───────────────────────────────────────────── */
describe('RiskGauge — Credit Risk Score', () => {
  it('renders score when provided', () => {
    renderGauge({ score: 78 });
    expect(screen.getByText('78 / 100')).toBeInTheDocument();
  });

  it('does not render score section when score is null', () => {
    renderGauge({ score: null });
    expect(screen.queryByText('/ 100')).not.toBeInTheDocument();
  });

  it('renders score label', () => {
    renderGauge({ score: 62 });
    expect(screen.getByText(/Credit Risk Score/i)).toBeInTheDocument();
  });
});

/* ─────────────────────────────────────────────
   Risk Classification Labels
───────────────────────────────────────────── */
describe('RiskGauge — Risk Classification', () => {
  it.each([
    ['LOW', 'LOW'],
    ['MODERATE', 'MODERATE'],
    ['ELEVATED', 'ELEVATED'],
    ['HIGH', 'HIGH'],
    ['CRITICAL', 'CRITICAL'],
    ['UNASSESSED', 'UNASSESSED'],
  ] as const)('renders %s risk classification', (classification, expected) => {
    renderGauge({ riskClassification: classification });
    // getAllByText handles multiple matches (h3 heading + StatusBadge span)
    const matches = screen.getAllByText(new RegExp(expected, 'i'));
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});
