export const MILESTONE_TIERS = [
  { count: 3, tier: "bronze", label: "Bronze Referrer", reward: "MMM Sticker Pack" },
  { count: 5, tier: "silver", label: "Silver Referrer", reward: "MMM Water Bottle" },
  { count: 10, tier: "gold", label: "Gold Referrer", reward: "MMM T-Shirt" },
  { count: 15, tier: "platinum", label: "Platinum Referrer", reward: "MMM Jersey" },
  { count: 25, tier: "diamond", label: "Diamond Referrer", reward: "Free Event Entry" },
  { count: 35, tier: "legend", label: "Legend", reward: "VIP Experience" },
] as const;

export type MilestoneTier = (typeof MILESTONE_TIERS)[number];

/** Raffle tickets awarded per milestone tier */
export const MILESTONE_TICKET_MAP: Record<string, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 5,
  diamond: 8,
  legend: 10,
};

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
