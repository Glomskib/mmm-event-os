/**
 * Per-event incentive banner configuration.
 * Each entry maps a title pattern to deadline + perks for the banner.
 * eventSlug derived via slugify() to stay in sync with /events/[slug] routing.
 */

import { slugify } from "./event-slug";

export interface IncentiveConfig {
  pattern: RegExp;
  title: string;
  deadline: string; // ISO date
  perks: string[];
  eventSlug: string;
}

export const INCENTIVE_CONFIGS: IncentiveConfig[] = [
  {
    pattern: /Houghton Hundred/i,
    title: "Early-Bird Pricing Ends Soon",
    deadline: "2026-05-01T23:59:59",
    perks: [
      "Lock in 2026 pricing before rates increase",
      "Free 15-mile distance included",
      "Referral rewards: earn raffle tickets for every friend you bring",
    ],
    eventSlug: slugify("Houghton Hundred"),
  },
  {
    pattern: /Fun Friday Fifty/i,
    title: "Register Early — Limited Slots",
    deadline: "2026-06-01T23:59:59",
    perks: [
      "$35 flat entry — all skill levels welcome",
      "Post-ride cookout included",
      "Refer a friend for bonus raffle entries",
    ],
    eventSlug: slugify("Fun Friday Fifty"),
  },
];

export function getIncentiveForEvent(
  eventTitle: string
): IncentiveConfig | null {
  for (const config of INCENTIVE_CONFIGS) {
    if (config.pattern.test(eventTitle)) return config;
  }
  return null;
}
