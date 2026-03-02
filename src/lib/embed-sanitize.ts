/**
 * Embed HTML sanitizer.
 *
 * Allowlists only iframe embeds from explicitly permitted hosts.
 * Rebuilds the iframe from scratch — only safe attributes survive.
 * Returns null if the input is invalid, disallowed, or contains script tags.
 */

export const ROUTE_EMBED_ALLOWED_HOSTS = ["ridewithgps.com", "strava.com"];

/**
 * Sanitize an iframe embed HTML snippet.
 *
 * Rules:
 *  - Must contain `<iframe`
 *  - Must NOT contain `<script`
 *  - `src` must be https and hostname must end with an allowedHost
 *  - All attributes are stripped and rebuilt (only src, dimensions, safe flags)
 *  - `loading="lazy"` and `referrerpolicy="no-referrer-when-downgrade"` are enforced
 *
 * @returns A clean `<iframe ...></iframe>` string, or null if invalid.
 */
export function sanitizeIframeEmbed(
  html: string,
  allowedHosts: string[] = ROUTE_EMBED_ALLOWED_HOSTS
): string | null {
  if (!html?.trim()) return null;

  // Hard reject: any script tag → reject immediately
  if (/<script/i.test(html)) return null;

  // Must be an iframe embed
  if (!/<iframe/i.test(html)) return null;

  // Extract the src attribute
  const srcMatch = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(html);
  if (!srcMatch) return null;

  let srcUrl: URL;
  try {
    srcUrl = new URL(srcMatch[1]);
  } catch {
    return null;
  }

  // Only allow https
  if (srcUrl.protocol !== "https:") return null;

  // Check host against allowlist
  const allowed = allowedHosts.some(
    (h) => srcUrl.hostname === h || srcUrl.hostname.endsWith("." + h)
  );
  if (!allowed) return null;

  // Rebuild a clean iframe — no inherited attributes
  return (
    `<iframe` +
    ` src="${srcUrl.href}"` +
    ` width="100%"` +
    ` height="500"` +
    ` frameborder="0"` +
    ` loading="lazy"` +
    ` referrerpolicy="no-referrer-when-downgrade"` +
    ` allowfullscreen` +
    `></iframe>`
  );
}

/**
 * Validate embed HTML for saving (admin side).
 * Returns an error message string, or null if valid.
 */
export function validateEmbedHtml(
  html: string | null | undefined,
  allowedHosts: string[] = ROUTE_EMBED_ALLOWED_HOSTS
): string | null {
  if (!html?.trim()) return null; // empty is fine

  if (/<script/i.test(html)) {
    return "Embed HTML must not contain script tags.";
  }

  if (!/<iframe/i.test(html)) {
    return "Only iframe embeds are accepted.";
  }

  const result = sanitizeIframeEmbed(html, allowedHosts);
  if (!result) {
    return `Only iframes from ${allowedHosts.join(" or ")} are accepted.`;
  }

  return null; // valid
}
