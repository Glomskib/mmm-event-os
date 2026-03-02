/**
 * Sponsor tier hierarchy — ordered from most to least prominent.
 * Used for grouping and rendering in SponsorsSection and admin UI.
 */
export const SPONSOR_TIERS = [
  "title",
  "presenting",
  "platinum",
  "gold",
  "silver",
  "community",
] as const;

export type SponsorTier = (typeof SPONSOR_TIERS)[number];

/** Per-tier display configuration for SponsorsSection. */
export const TIER_CONFIG: Record<
  SponsorTier,
  {
    label: string;
    /** Tailwind grid-cols classes for the sponsor grid */
    gridClass: string;
    /** Minimum card height */
    cardMinHeight: string;
    /** Name text class */
    nameClass: string;
    /** Whether to show the hostname below the name */
    showWebsite: boolean;
  }
> = {
  title: {
    label: "Title Sponsor",
    gridClass: "grid-cols-1",
    cardMinHeight: "min-h-[120px]",
    nameClass: "text-xl font-bold",
    showWebsite: true,
  },
  presenting: {
    label: "Presenting Sponsors",
    gridClass: "grid-cols-1 sm:grid-cols-2",
    cardMinHeight: "min-h-[96px]",
    nameClass: "text-base font-semibold",
    showWebsite: true,
  },
  platinum: {
    label: "Platinum Sponsors",
    gridClass: "grid-cols-2 sm:grid-cols-3",
    cardMinHeight: "min-h-[72px]",
    nameClass: "text-sm font-medium",
    showWebsite: true,
  },
  gold: {
    label: "Gold Sponsors",
    gridClass: "grid-cols-2 sm:grid-cols-4",
    cardMinHeight: "min-h-[64px]",
    nameClass: "text-sm font-medium",
    showWebsite: false,
  },
  silver: {
    label: "Silver Sponsors",
    gridClass: "grid-cols-3 sm:grid-cols-4",
    cardMinHeight: "min-h-[52px]",
    nameClass: "text-xs font-medium",
    showWebsite: false,
  },
  community: {
    label: "Community Sponsors",
    gridClass: "grid-cols-3 sm:grid-cols-4",
    cardMinHeight: "min-h-[52px]",
    nameClass: "text-xs font-medium",
    showWebsite: false,
  },
};
