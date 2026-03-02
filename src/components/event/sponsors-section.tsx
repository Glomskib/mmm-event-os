import type { SponsorRow } from "@/lib/media";
import { ExternalLink } from "lucide-react";

interface SponsorsSectionProps {
  sponsors: SponsorRow[];
}

/** Grid of active (committed/paid) event sponsors. */
export function SponsorsSection({ sponsors }: SponsorsSectionProps) {
  if (sponsors.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">Our Sponsors</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {sponsors.map((sponsor) => (
          <SponsorCard key={sponsor.id} sponsor={sponsor} />
        ))}
      </div>
    </div>
  );
}

function SponsorCard({ sponsor }: { sponsor: SponsorRow }) {
  const inner = (
    <div className="flex h-full min-h-[72px] items-center justify-center rounded-lg border border-border bg-card px-4 py-3 text-center transition-colors hover:bg-muted/50">
      <div>
        <p className="text-sm font-medium text-foreground">{sponsor.name}</p>
        {sponsor.website && (
          <p className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
            <ExternalLink className="h-2.5 w-2.5" />
            {new URL(sponsor.website).hostname.replace(/^www\./, "")}
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
