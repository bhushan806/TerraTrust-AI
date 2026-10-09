/**
 * TerraTrust-AI — Agricultural Unit Formatters
 */

export function formatArea(
  area: number | null | undefined,
  unit: string = 'ha'
): string {
  if (area == null || Number.isNaN(area)) {
    return '—';
  }
  return `${area.toFixed(2)} ${unit}`;
}

export function formatYield(
  value: number | null | undefined,
  unit: string = 'quintals/ha'
): string {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }
  return `${value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} ${unit}`;
}

export function formatRainfall(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }
  return `${value.toFixed(1)} mm`;
}

export function formatTemperature(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }
  return `${value.toFixed(1)}°C`;
}

export function formatSoilMoisture(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }
  return `${value.toFixed(1)}%`;
}

export function formatNdvi(
  value: number | null | undefined,
  precision: number = 3
): string {
  if (value == null || Number.isNaN(value)) {
    return '—';
  }
  return value.toFixed(precision);
}

export function formatCommodityPrice(
  price: number | null | undefined,
  currency: string = 'INR',
  unit: string = 'quintal'
): string {
  if (price == null || Number.isNaN(price)) {
    return '—';
  }
  const symbol = currency === 'INR' ? '₹' : `${currency} `;
  const formattedPrice = price.toLocaleString('en-IN');
  return `${symbol}${formattedPrice} / ${unit}`;
}
