/**
 * TerraTrust-AI — Data Freshness Evaluator
 */

import { FreshnessState } from '@/types/domain';
import { StatusBadgeVariant } from '@/types/ui';

export type FreshnessBadgeVariant = Extract<StatusBadgeVariant, 'HEALTHY' | 'PENDING' | 'STALE' | 'PARTIAL' | 'FAILED'>;

export interface FreshnessResult {
  state: FreshnessState;
  badgeVariant: FreshnessBadgeVariant;
  hoursElapsed?: number;
  label: string;
  explanation: string;
}

export function evaluateFreshness(
  timestamp: string | null | undefined,
  thresholdHours: number = 24,
  sourceName?: string
): FreshnessResult {
  const sourceLabel = sourceName ? ` from ${sourceName}` : '';

  if (!timestamp) {
    return {
      state: 'UNKNOWN',
      badgeVariant: 'PARTIAL',
      label: 'Unknown',
      explanation: `No timestamp recorded${sourceLabel}.`,
    };
  }

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return {
      state: 'UNKNOWN',
      badgeVariant: 'PARTIAL',
      label: 'Invalid timestamp',
      explanation: `Invalid date format provided${sourceLabel}.`,
    };
  }

  const now = Date.now();
  const diffMs = now - date.getTime();
  const hoursElapsed = Math.max(0, diffMs / (1000 * 60 * 60));

  if (hoursElapsed > thresholdHours) {
    return {
      state: 'STALE',
      badgeVariant: 'STALE',
      hoursElapsed,
      label: 'Stale',
      explanation: `Data${sourceLabel} is ${Math.round(hoursElapsed)}h old (exceeds ${thresholdHours}h SLA).`,
    };
  }

  if (hoursElapsed >= thresholdHours * 0.75) {
    return {
      state: 'AGING',
      badgeVariant: 'PENDING',
      hoursElapsed,
      label: 'Aging',
      explanation: `Data${sourceLabel} is ${Math.round(hoursElapsed)}h old (approaching ${thresholdHours}h SLA).`,
    };
  }

  return {
    state: 'FRESH',
    badgeVariant: 'HEALTHY',
    hoursElapsed,
    label: 'Fresh',
    explanation: `Data${sourceLabel} is updated (${Math.round(hoursElapsed)}h old within ${thresholdHours}h SLA).`,
  };
}
