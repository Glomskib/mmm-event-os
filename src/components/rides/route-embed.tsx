import { sanitizeIframeEmbed } from "@/lib/embed-sanitize";
import { Navigation } from "lucide-react";

interface RouteEmbedProps {
  /** Raw iframe HTML from DB. Sanitized before rendering. */
  routeEmbedHtml?: string | null;
  /** Fallback link URL if no embed is present. */
  routeUrl?: string | null;
  /** Accessible label for the embed container. */
  title?: string;
}

/**
 * Renders a responsive route embed iframe, or falls back to a "View Route" link.
 * Sanitizes embed HTML server-side — never renders unsanitized content.
 */
export function RouteEmbed({ routeEmbedHtml, routeUrl, title }: RouteEmbedProps) {
  const safeHtml = routeEmbedHtml ? sanitizeIframeEmbed(routeEmbedHtml) : null;

  if (safeHtml) {
    return (
      <div
        className="w-full overflow-hidden rounded-xl border border-border shadow-sm"
        aria-label={title ?? "Route map"}
      >
        {/* Force the rebuilt iframe to fill the container */}
        <div
          className="[&_iframe]:h-[400px] [&_iframe]:w-full [&_iframe]:border-0 sm:[&_iframe]:h-[500px]"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      </div>
    );
  }

  if (routeUrl) {
    return (
      <a
        href={routeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
      >
        <Navigation className="h-4 w-4" />
        View Route
      </a>
    );
  }

  return null;
}
