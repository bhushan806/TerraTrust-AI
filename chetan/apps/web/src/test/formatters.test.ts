/**
 * TerraTrust-AI — Formatter Unit Tests
 *
 * Tests for currency, number, percentage, area, yield, rainfall,
 * temperature, and freshness formatting utilities.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatCurrency } from '@/lib/formatters/currency';
import { formatNumber, formatInteger, formatPercent, formatScore } from '@/lib/formatters/number';
import {
  formatArea,
  formatYield,
  formatRainfall,
  formatTemperature,
  formatSoilMoisture,
  formatNdvi,
  formatCommodityPrice,
} from '@/lib/formatters/units';
import { evaluateFreshness } from '@/lib/formatters/freshness';

/* ─────────────────────────────────────────────
   Currency Formatter
───────────────────────────────────────────── */
describe('formatCurrency', () => {
  it('returns em-dash for null', () => {
    expect(formatCurrency(null)).toBe('—');
  });

  it('returns em-dash for undefined', () => {
    expect(formatCurrency(undefined)).toBe('—');
  });

  it('returns em-dash for NaN', () => {
    expect(formatCurrency(NaN)).toBe('—');
  });

  it('formats small amounts in INR without compact mode', () => {
    const result = formatCurrency(50000, 'INR');
    expect(result).toMatch(/₹|50,000|50000/);
  });

  it('formats lakhs in compact mode (100000)', () => {
    const result = formatCurrency(100000, 'INR', { compact: true });
    expect(result).toContain('Lakh');
    expect(result).toContain('₹');
  });

  it('formats crores in compact mode (10000000)', () => {
    const result = formatCurrency(10000000, 'INR', { compact: true });
    expect(result).toContain('Cr');
    expect(result).toContain('₹');
  });

  it('formats crores with precision', () => {
    const result = formatCurrency(15000000, 'INR', { compact: true, precision: 2 });
    expect(result).toContain('1.50');
    expect(result).toContain('Cr');
  });

  it('formats thousands in compact mode (5000)', () => {
    const result = formatCurrency(5000, 'INR', { compact: true });
    expect(result).toContain('k');
  });

  it('formats zero correctly', () => {
    const result = formatCurrency(0);
    expect(result).not.toBe('—');
    expect(result).toMatch(/0|₹/);
  });

  it('formats negative amounts', () => {
    const result = formatCurrency(-500000, 'INR', { compact: true });
    expect(result).toContain('Lakh');
  });
});

/* ─────────────────────────────────────────────
   Number Formatter
───────────────────────────────────────────── */
describe('formatNumber', () => {
  it('returns em-dash for null', () => {
    expect(formatNumber(null)).toBe('—');
  });

  it('returns em-dash for undefined', () => {
    expect(formatNumber(undefined)).toBe('—');
  });

  it('returns em-dash for NaN', () => {
    expect(formatNumber(NaN)).toBe('—');
  });

  it('formats with default precision of 2', () => {
    const result = formatNumber(1234.567);
    expect(result).toMatch(/1,234\.57|1234\.57/);
  });

  it('formats with precision 0', () => {
    const result = formatNumber(1234.5, 0);
    expect(result).toMatch(/1,235|1235/);
  });

  it('adds positive sign when requested and value is positive', () => {
    const result = formatNumber(10.5, 1, { showPositiveSign: true });
    expect(result).toMatch(/\+10\.5|\+10,5/);
  });

  it('does not add positive sign for zero', () => {
    const result = formatNumber(0, 2, { showPositiveSign: true });
    expect(result).not.toContain('+');
  });

  it('does not add positive sign for negatives', () => {
    const result = formatNumber(-5.3, 1, { showPositiveSign: true });
    expect(result).not.toMatch(/^\+/);
  });
});

describe('formatInteger', () => {
  it('rounds and formats an integer', () => {
    const result = formatInteger(1234);
    expect(result).toMatch(/1,234|1234/);
  });

  it('rounds decimals to nearest integer', () => {
    const result = formatInteger(1234.8);
    expect(result).toMatch(/1,235|1235/);
  });

  it('returns em-dash for null', () => {
    expect(formatInteger(null)).toBe('—');
  });
});

describe('formatPercent', () => {
  it('returns em-dash for null', () => {
    expect(formatPercent(null)).toBe('—');
  });

  it('formats percentage with default precision', () => {
    const result = formatPercent(72.4);
    expect(result).toBe('72.4%');
  });

  it('handles ratio (isRatio: true)', () => {
    const result = formatPercent(0.724, 1, { isRatio: true });
    expect(result).toBe('72.4%');
  });

  it('shows sign for positive values when requested', () => {
    const result = formatPercent(5.2, 1, { showSign: true });
    expect(result).toMatch(/\+5\.2%/);
  });

  it('does not show sign for negatives', () => {
    const result = formatPercent(-3.1, 1, { showSign: true });
    expect(result).not.toMatch(/^\+/);
    expect(result).toContain('-');
  });
});

describe('formatScore', () => {
  it('returns em-dash for null', () => {
    expect(formatScore(null)).toBe('—');
  });

  it('rounds and formats score out of 100 by default', () => {
    const result = formatScore(73.8);
    expect(result).toBe('74 / 100');
  });

  it('formats score with custom max', () => {
    const result = formatScore(7.5, 10);
    expect(result).toBe('8 / 10');
  });
});

/* ─────────────────────────────────────────────
   Unit Formatters
───────────────────────────────────────────── */
describe('formatArea', () => {
  it('returns em-dash for null', () => {
    expect(formatArea(null)).toBe('—');
  });

  it('formats area in hectares (default)', () => {
    const result = formatArea(12.5);
    expect(result).toContain('ha');
    expect(result).toContain('12.50');
  });

  it('formats area in acres', () => {
    const result = formatArea(30.75, 'acres');
    expect(result).toContain('acres');
    expect(result).toContain('30.75');
  });
});

describe('formatYield', () => {
  it('returns em-dash for null', () => {
    expect(formatYield(null)).toBe('—');
  });

  it('includes default unit', () => {
    const result = formatYield(18.5);
    expect(result).toContain('quintals/ha');
  });

  it('accepts custom unit', () => {
    const result = formatYield(4.2, 'MT/ha');
    expect(result).toContain('MT/ha');
  });
});

describe('formatRainfall', () => {
  it('returns em-dash for null', () => {
    expect(formatRainfall(null)).toBe('—');
  });

  it('appends mm unit', () => {
    const result = formatRainfall(82.3);
    expect(result).toContain('mm');
  });
});

describe('formatTemperature', () => {
  it('returns em-dash for null', () => {
    expect(formatTemperature(null)).toBe('—');
  });

  it('appends °C unit', () => {
    const result = formatTemperature(28.5);
    expect(result).toContain('°C');
  });
});

describe('formatSoilMoisture', () => {
  it('returns em-dash for null', () => {
    expect(formatSoilMoisture(null)).toBe('—');
  });

  it('appends % symbol', () => {
    const result = formatSoilMoisture(65.2);
    expect(result).toContain('%');
  });
});

describe('formatNdvi', () => {
  it('returns em-dash for null', () => {
    expect(formatNdvi(null)).toBe('—');
  });

  it('formats to 3 decimal places by default', () => {
    const result = formatNdvi(0.7823456);
    expect(result).toMatch(/0\.782/);
  });
});

describe('formatCommodityPrice', () => {
  it('returns em-dash for null', () => {
    expect(formatCommodityPrice(null)).toBe('—');
  });

  it('formats with INR symbol and per quintal', () => {
    const result = formatCommodityPrice(2200);
    expect(result).toContain('₹');
    expect(result).toContain('quintal');
    expect(result).toContain('2,200');
  });

  it('uses USD symbol for USD currency', () => {
    const result = formatCommodityPrice(50, 'USD', 'bushel');
    expect(result).toContain('USD');
    expect(result).toContain('bushel');
  });
});

/* ─────────────────────────────────────────────
   Freshness Evaluator
───────────────────────────────────────────── */
describe('evaluateFreshness', () => {
  it('returns UNKNOWN state for null timestamp', () => {
    const result = evaluateFreshness(null);
    expect(result.state).toBe('UNKNOWN');
    expect(result.badgeVariant).toBe('PARTIAL');
  });

  it('returns UNKNOWN state for undefined timestamp', () => {
    const result = evaluateFreshness(undefined);
    expect(result.state).toBe('UNKNOWN');
  });

  it('returns UNKNOWN state for invalid timestamp string', () => {
    const result = evaluateFreshness('not-a-date');
    expect(result.state).toBe('UNKNOWN');
    expect(result.label).toContain('Invalid');
  });

  it('returns FRESH state for recent timestamps (within 75% threshold)', () => {
    // 6 hours ago, threshold = 24h (75% = 18h) → FRESH
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const result = evaluateFreshness(sixHoursAgo, 24);
    expect(result.state).toBe('FRESH');
    expect(result.badgeVariant).toBe('HEALTHY');
  });

  it('returns AGING state for timestamps approaching threshold (75-100%)', () => {
    // 20 hours ago, threshold = 24h (75% = 18h) → AGING
    const twentyHoursAgo = new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString();
    const result = evaluateFreshness(twentyHoursAgo, 24);
    expect(result.state).toBe('AGING');
    expect(result.badgeVariant).toBe('PENDING');
  });

  it('returns STALE state for timestamps beyond threshold', () => {
    // 30 hours ago, threshold = 24h → STALE
    const thirtyHoursAgo = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString();
    const result = evaluateFreshness(thirtyHoursAgo, 24);
    expect(result.state).toBe('STALE');
    expect(result.badgeVariant).toBe('STALE');
    expect(result.hoursElapsed).toBeGreaterThanOrEqual(30);
  });

  it('includes hoursElapsed in result', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const result = evaluateFreshness(twoHoursAgo, 24);
    expect(result.hoursElapsed).toBeGreaterThanOrEqual(1);
    expect(result.hoursElapsed).toBeLessThanOrEqual(3);
  });

  it('includes source name in explanation', () => {
    const recentTs = new Date(Date.now() - 1000).toISOString();
    const result = evaluateFreshness(recentTs, 24, 'NASA MODIS');
    expect(result.explanation).toContain('NASA MODIS');
  });

  it('handles custom threshold correctly', () => {
    // 3 hours ago with threshold=2h → STALE
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const result = evaluateFreshness(threeHoursAgo, 2);
    expect(result.state).toBe('STALE');
  });
});
