/**
 * Place scoring domain logic.
 * Bayesian average + priority calculation for quality filtering.
 */

export function bayesianScore(rating: number, reviewCount: number): number {
  const C = 50;
  const m = 4.0;
  return (C * m + reviewCount * rating) / (C + reviewCount);
}

export interface PriorityResult {
  score: number;
  bayesian: number;
  isHiddenGem: boolean;
}

export function calculatePriority(place: {
  rating: number | null;
  userRatingCount: number | null;
}): PriorityResult | null {
  const rating = place.rating ?? 0;
  const count = place.userRatingCount ?? 0;

  if (rating < 3.3 || count < 10) return null;

  const bayes = bayesianScore(rating, count);
  if (bayes < 3.4) return null;

  let score = ((bayes - 3.4) / 1.4) * 7;

  if (rating >= 4.4 && count < 200) score += 2;
  if (rating >= 4.7 && count < 25) score -= 2;
  if (count >= 1000) score += 1;

  const isHiddenGem = rating >= 4.4 && count < 200;

  return {
    score: Math.max(0, Math.min(10, parseFloat(score.toFixed(1)))),
    bayesian: parseFloat(bayes.toFixed(2)),
    isHiddenGem,
  };
}

const TYPE_PRIORITY: { google: string; mine: string }[] = [
  { google: 'cafe', mine: 'cafe' },
  { google: 'coffee_shop', mine: 'cafe' },
  { google: 'bakery', mine: 'cafe' },
  { google: 'wine_bar', mine: 'bar' },
  { google: 'cocktail_bar', mine: 'bar' },
  { google: 'jazz_club', mine: 'bar' },
  { google: 'bar', mine: 'bar' },
  { google: 'night_club', mine: 'nightlife' },
  { google: 'comedy_club', mine: 'nightlife' },
  { google: 'restaurant', mine: 'restaurant' },
  { google: 'ice_cream_shop', mine: 'dessert' },
  { google: 'brewery', mine: 'brewery' },
  { google: 'distillery', mine: 'brewery' },
  { google: 'park', mine: 'park' },
  { google: 'botanical_garden', mine: 'park' },
  { google: 'museum', mine: 'culture' },
  { google: 'art_gallery', mine: 'culture' },
  { google: 'performing_arts_theater', mine: 'culture' },
  { google: 'movie_theater', mine: 'activity' },
  { google: 'bowling_alley', mine: 'activity' },
  { google: 'escape_room', mine: 'activity' },
  { google: 'spa', mine: 'wellness' },
  { google: 'book_store', mine: 'shop' },
];

export function getPrimaryType(googleTypes: string[] | null | undefined): string {
  if (!googleTypes?.length) return 'other';
  for (const map of TYPE_PRIORITY) {
    if (googleTypes.includes(map.google)) return map.mine;
  }
  return 'other';
}

/** Places API (New) returns priceLevel as string enum; DB expects 1-4. */
export function normalizePriceLevel(
  value: number | string | null | undefined
): number {
  if (typeof value === 'number' && value >= 1 && value <= 4) return value;
  if (typeof value === 'string') {
    const map: Record<string, number> = {
      PRICE_LEVEL_FREE: 1,
      PRICE_LEVEL_INEXPENSIVE: 1,
      PRICE_LEVEL_MODERATE: 2,
      PRICE_LEVEL_EXPENSIVE: 3,
      PRICE_LEVEL_VERY_EXPENSIVE: 4,
    };
    return map[value] ?? 2;
  }
  return 2;
}

export function getBudgetInfo(priceLevel: number | null | undefined): {
  category: string;
  min: number;
  max: number;
} {
  const map: Record<number, { category: string; min: number; max: number }> = {
    1: { category: 'budget', min: 0, max: 15 },
    2: { category: 'moderate', min: 15, max: 40 },
    3: { category: 'upscale', min: 40, max: 80 },
    4: { category: 'luxury', min: 80, max: 200 },
  };
  return map[priceLevel ?? 2] ?? map[2];
}

export function isLateNight(openingHours: unknown): boolean {
  const hours = openingHours as { periods?: Array<{ close?: { time?: string } }> } | undefined;
  if (!hours?.periods) return false;
  return hours.periods.some((p) => {
    const closeTime = parseInt(p.close?.time ?? '0000', 10);
    return closeTime < 600 || closeTime >= 2300;
  });
}
