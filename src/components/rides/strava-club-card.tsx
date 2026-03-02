import { sanitizeIframeEmbed } from "@/lib/embed-sanitize";
import { ExternalLink } from "lucide-react";

interface StravaClubCardProps {
  joinUrl: string;
  /** Optional iframe embed HTML for the Strava club widget. Sanitized before use. */
  embedHtml?: string | null;
}

/** Strava club join CTA with optional widget embed. */
export function StravaClubCard({ joinUrl, embedHtml }: StravaClubCardProps) {
  const safeEmbed = embedHtml
    ? sanitizeIframeEmbed(embedHtml, ["strava.com"])
    : null;

  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
      style={{ borderColor: "var(--brand-border)" }}
    >
      {/* Header stripe */}
      <div
        className="px-5 py-4"
        style={{ backgroundColor: "var(--brand-navy)" }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--brand-orange)" }}
        >
          Community
        </p>
        <h3 className="mt-1 text-lg font-bold text-white">
          Making Miles Matter — Strava Club
        </h3>
        <p className="mt-0.5 text-sm text-white/70">
          Join our club to see everyone&apos;s rides and stay connected.
        </p>
      </div>

      {/* Optional widget embed */}
      {safeEmbed && (
        <div
          className="[&_iframe]:h-[300px] [&_iframe]:w-full [&_iframe]:border-0"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: safeEmbed }}
        />
      )}

      {/* Join CTA */}
      <div className="px-5 py-4">
        <a
          href={joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--brand-orange)" }}
        >
          <ExternalLink className="h-4 w-4" />
          Join Club on Strava
        </a>
      </div>
    </div>
  );
}
