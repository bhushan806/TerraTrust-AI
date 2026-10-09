/**
 * TerraTrust-AI — Number, Percentage, and Score Formatters
 */

export interface NumberOptions {
  showPositiveSign?: boolean;
}

export function formatNumber(
  value: number | null | undefined,
  precision: number = 2,
  options?: NumberOptions
): string {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }

  const sign = options?.showPositiveSign && value > 0 ? '+' : '';
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });

  return `${sign}${formatted}`;
}

export function formatInteger(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }
  return Math.round(value).toLocaleString('en-US');
}

export interface PercentOptions {
  isRatio?: boolean;
  showSign?: boolean;
}

export function formatPercent(
  value: number | null | undefined,
  precision: number = 1,
  options?: PercentOptions
): string {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }

  const num = options?.isRatio ? value * 100 : value;
  const sign = options?.showSign && num > 0 ? '+' : '';
  return `${sign}${num.toFixed(precision)}%`;
}

export function formatScore(
  value: number | null | undefined,
  max: number = 100
): string {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }
  return `${Math.round(value)} / ${max}`;
}
