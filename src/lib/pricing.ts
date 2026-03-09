/**
 * Event pricing configuration.
 * Maps event title patterns → distance → price in cents.
 */

type PricingRule = {
  pattern: RegExp;
  prices: Record<string, number>;
  defaultPrice?: number;
};

const PRICING_RULES: PricingRule[] = [
  {
    pattern: /Hancock Horizontal Hundred 2026/i,
    prices: {
      "15 miles": 0,
      "30 miles": 4899,
      "62 miles": 6499,
      "100 miles": 7499,
    },
  },
  {
    pattern: /Findlay Further Fondo/i,
    prices: {
      "62 miles": 3500,
    },
  },
  {
    pattern: /Wheels .* Reels/i,
    defaultPrice: 1000,
    prices: {
      "General Admission": 1000,
    },
  },
];

/** Fallback price when no rule matches (cents). */
const FALLBACK_PRICE = 5000;

/**
 * Resolve the price in cents for a given event title + distance.
 * Returns 0 for free-tier distances.
 */
export function getPrice(eventTitle: string, distance: string): number {
  for (const rule of PRICING_RULES) {
    if (rule.pattern.test(eventTitle)) {
      if (distance in rule.prices) return rule.prices[distance];
      if (rule.defaultPrice !== undefined) return rule.defaultPrice;
      return FALLBACK_PRICE;
    }
  }
  return FALLBACK_PRICE;
}

/**
 * Get available distances with prices for an event.
 * Returns array of { distance, price } sorted by price ascending.
 */
export function getDistances(
  eventTitle: string
): { distance: string; price: number }[] {
  for (const rule of PRICING_RULES) {
    if (rule.pattern.test(eventTitle)) {
      const entries = Object.entries(rule.prices);
      if (entries.length > 0) {
        return entries
          .map(([distance, price]) => ({ distance, price }))
          .sort((a, b) => a.price - b.price);
      }
      return [];
    }
  }
  return [];
}
