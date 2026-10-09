/**
 * TerraTrust-AI — Currency Formatter
 */

export interface CurrencyOptions {
  compact?: boolean;
  precision?: number;
}

export function formatCurrency(
  amount: number | null | undefined,
  currency: string = 'INR',
  options?: CurrencyOptions
): string {
  if (amount == null || Number.isNaN(amount)) {
    return '—';
  }

  const { compact = false, precision } = options || {};
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : `${currency} `;

  if (compact && currency === 'INR') {
    if (absAmount >= 10000000) {
      const cr = absAmount / 10000000;
      const prec = precision !== undefined ? precision : cr % 1 === 0 ? 0 : 2;
      return `${isNegative ? '-' : ''}${symbol}${cr.toFixed(prec)} Cr`;
    }
    if (absAmount >= 100000) {
      const lakh = absAmount / 100000;
      const prec = precision !== undefined ? precision : lakh % 1 === 0 ? 0 : 2;
      return `${isNegative ? '-' : ''}${symbol}${lakh.toFixed(prec)} Lakh`;
    }
    if (absAmount >= 1000) {
      const k = absAmount / 1000;
      const prec = precision !== undefined ? precision : k % 1 === 0 ? 0 : 1;
      return `${isNegative ? '-' : ''}${symbol}${k.toFixed(prec)}k`;
    }
  }

  const prec = precision !== undefined ? precision : 0;
  const formatted = absAmount.toLocaleString('en-IN', {
    minimumFractionDigits: prec,
    maximumFractionDigits: prec,
  });

  return `${isNegative ? '-' : ''}${symbol}${formatted}`;
}
