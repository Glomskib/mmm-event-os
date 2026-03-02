/**
 * Marketing-specific incentive banners for event pages.
 * Maps event title patterns to promotional copy + deadlines.
 */

export interface MarketingIncentive {
  pattern: RegExp;
  /** Canonical slug derived from representative title via slugify(). */
  eventSlug: string;
  title: string;
  perks: string[];
  deadlineIso: string;
}

export const MARKETING_INCENTIVES: MarketingIncentive[] = [
  {
    pattern: /Findlay Further Fondo/i,
    eventSlug: "findlay-further-fondo",
    title: "Register by April 1 → Get 1 FREE raffle ticket (Main Raffle)",
    perks: [
      "1 FREE raffle ticket just for registering early",
      "$35 flat entry — all skill levels welcome",
      "Post-ride cookout included",
    ],
    deadlineIso: "2026-04-01T23:59:59",
  },
  {
    pattern: /Hancock Horizontal Hundred/i,
    eventSlug: "hancock-horizontal-hundred",
    title:
      "Register by May 31 → FREE custom HHH socks + 5 raffle entries (Main Raffle)",
    perks: [
      "FREE custom HHH socks",
      "5 raffle entries in the Main Raffle",
      "Free 15-mile distance included",
    ],
    deadlineIso: "2026-05-31T23:59:59",
  },
];

export function getMarketingIncentive(
  eventTitle: string
): MarketingIncentive | null {
  for (const incentive of MARKETING_INCENTIVES) {
    if (incentive.pattern.test(eventTitle)) return incentive;
  }
  return null;
}
