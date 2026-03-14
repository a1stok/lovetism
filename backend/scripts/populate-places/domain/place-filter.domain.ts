/**
 * Place filtering: chain detection, quality thresholds.
 */
import { CHAIN_BLACKLIST } from '../config/chains';
import { calculatePriority, type PriorityResult } from './scoring.domain';

const MIN_RATING = 3.3;
const MIN_REVIEW_COUNT = 10;
const MIN_PRIORITY_SCORE = 2;

export function isChain(name: string): boolean {
  const lower = name.toLowerCase();
  return CHAIN_BLACKLIST.some((chain) => lower.includes(chain));
}

export interface QualityFilterResult {
  shouldProcess: boolean;
  priority: PriorityResult | null;
}

export function evaluateQualityFilter(place: {
  rating: number | null;
  userRatingCount: number | null;
  name: string;
}): QualityFilterResult {
  const rating = place.rating ?? 0;
  const count = place.userRatingCount ?? 0;

  if (rating < MIN_RATING || count < MIN_REVIEW_COUNT) {
    return { shouldProcess: false, priority: null };
  }
  if (isChain(place.name)) {
    return { shouldProcess: false, priority: null };
  }

  const priority = calculatePriority({ rating: place.rating, userRatingCount: place.userRatingCount });
  if (!priority || priority.score < MIN_PRIORITY_SCORE) {
    return { shouldProcess: false, priority: null };
  }

  return { shouldProcess: true, priority };
}

export function shouldRunGemini(priorityScore: number): boolean {
  return priorityScore >= 4;
}
