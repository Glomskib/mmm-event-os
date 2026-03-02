import { createAdminClient } from "@/lib/supabase/admin";

/** Derive a URL-safe slug from an event title. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Resolve the canonical URL slug for a given event title.
 * Checks events.slug in the DB first; falls back to slugify() if not set.
 * Server-only (requires DB access).
 */
export async function resolveEventSlug(eventTitle: string): Promise<string> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("events")
      .select("slug")
      .eq("title", eventTitle)
      .limit(1)
      .maybeSingle();
    if (data?.slug) return data.slug;
  } catch {
    // fall through to slugify
  }
  return slugify(eventTitle);
}
