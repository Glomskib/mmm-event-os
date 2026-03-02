import type { SponsorRow } from "@/lib/media";
import { SPONSOR_TIERS, TIER_CONFIG, type SponsorTier } from "@/lib/sponsor-tiers";
import { ExternalLink } from "lucide-react";

interface SponsorsSectionProps {
  sponsors: SponsorRow[];
}

function safeHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Tiered grid of active sponsors, grouped by tier in hierarchy order. */
export function SponsorsSection({ sponsors }: SponsorsSectionProps) {
  if (sponsors.length === 0) return null;

  // Group by tier, preserving hierarchy order and sorting within by display_order
  const groups = SPONSOR_TIERS.map((tier) => ({
    tier,
    sponsors: sponsors
      .filter((s) => (s.tier ?? "community") === tier)
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
  })).filter((g) => g.sponsors.length > 0);

  const hasMultipleTiers = groups.length > 1;

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold text-foreground">Our Sponsors</h2>

      {groups.map(({ tier, sponsors: group }) => {
        const cfg = TIER_CONFIG[tier as SponsorTier];
        return (
          <div key={tier} className="space-y-2">
            {hasMultipleTiers && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {cfg.label}
              </p>
            )}
            <div className={`grid gap-3 ${cfg.gridClass}`}>
              {group.map((sponsor) => (
                <SponsorCard
                  key={sponsor.id}
                  sponsor={sponsor}
                  tier={tier as SponsorTier}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SponsorCard({
  sponsor,
  tier,
}: {
  sponsor: SponsorRow;
  tier: SponsorTier;
}) {
  const cfg = TIER_CONFIG[tier];
  const hostname = sponsor.website ? safeHostname(sponsor.website) : null;

  const inner = (
    <div
      className={`flex h-full ${cfg.cardMinHeight} items-center justify-center rounded-lg border border-border bg-card px-4 py-3 text-center transition-colors hover:bg-muted/50`}
    >
      <div>
        <p className={`${cfg.nameClass} text-foreground leading-tight`}>
          {sponsor.name}
        </p>
        {cfg.showWebsite && hostname && (
          <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
            <ExternalLink className="h-2.5 w-2.5" />
            {hostname}
          </p>
        )}
      </div>
    </div>
  );

  if (sponsor.website) {
    return (
      <a
        href={sponsor.website}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {inner}
      </a>
    );
  }

  return <div>{inner}</div>;
}
