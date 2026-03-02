/** Derive a URL-safe slug from an event title. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Resolve the canonical URL slug for a given event title.
 * Uses the same slugify() that powers /events/[slug] routing,
 * so any code that needs to look up an event by slug stays consistent.
 */
export function resolveEventSlug(eventTitle: string): string {
  return slugify(eventTitle);
}
