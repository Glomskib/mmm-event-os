export const MILESTONE_TIERS = [
  { count: 3, tier: "bronze", label: "Bronze Referrer", reward: "MMM Sticker Pack" },
  { count: 5, tier: "silver", label: "Silver Referrer", reward: "MMM Water Bottle" },
  { count: 10, tier: "gold", label: "Gold Referrer", reward: "MMM T-Shirt" },
  { count: 15, tier: "platinum", label: "Platinum Referrer", reward: "MMM Jersey" },
  { count: 25, tier: "diamond", label: "Diamond Referrer", reward: "Free Event Entry" },
  { count: 35, tier: "legend", label: "Legend", reward: "VIP Experience" },
] as const;

export type MilestoneTier = (typeof MILESTONE_TIERS)[number];

/**
 * Raffle tickets awarded per milestone tier (stackable).
 *
 * MMM Program:
 *   3 refs  → +1  (cumulative 1)
 *   5 refs  → +2  (cumulative 3)
 *  10 refs  → +5  (cumulative 8)
 *  15 refs  → +10 (cumulative 18)
 *  25 refs  → perk only, 0 tickets
 *  35 refs  → perk only, 0 tickets
 */
export const MILESTONE_TICKET_MAP: Record<string, number> = {
  bronze: 1,
  silver: 2,
  gold: 5,
  platinum: 10,
  diamond: 0,
  legend: 0,
};

/** Verify ticket map matches the documented MMM program totals. */
export function assertMilestoneTickets() {
  const expected: [string, number, number][] = [
    // [tier, per-tier tickets, cumulative]
    ["bronze", 1, 1],
    ["silver", 2, 3],
    ["gold", 5, 8],
    ["platinum", 10, 18],
    ["diamond", 0, 18],
    ["legend", 0, 18],
  ];
  let cumulative = 0;
  for (const [tier, perTier, expectedCumulative] of expected) {
    const actual = MILESTONE_TICKET_MAP[tier];
    if (actual !== perTier) {
      throw new Error(
        `MILESTONE_TICKET_MAP mismatch: ${tier} expected ${perTier}, got ${actual}`
      );
    }
    cumulative += actual;
    if (cumulative !== expectedCumulative) {
      throw new Error(
        `Cumulative mismatch at ${tier}: expected ${expectedCumulative}, got ${cumulative}`
      );
    }
  }
}

export function getMilestoneProgress(count: number) {
  const unlocked = MILESTONE_TIERS.filter((t) => count >= t.count);
  const nextTier = MILESTONE_TIERS.find((t) => count < t.count) ?? null;

  return {
    unlocked,
    nextTier,
    progress: nextTier
      ? {
          current: count,
          target: nextTier.count,
          pct: Math.round((count / nextTier.count) * 100),
        }
      : { current: count, target: count, pct: 100 },
  };
}
