import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/database.types";

export type MediaAsset =
  Database["public"]["Tables"]["media_assets"]["Row"];

export type MediaPlacement = Database["public"]["Enums"]["media_placement"];
export type MediaKind = Database["public"]["Enums"]["media_kind"];

export type GroupedMedia = {
  hero: MediaAsset[];
  gallery: MediaAsset[];
  section: MediaAsset[];
  banner: MediaAsset[];
  hero_secondary: MediaAsset[];
  route_preview: MediaAsset[];
  testimonial: MediaAsset[];
  inline_section: MediaAsset[];
  background_loop: MediaAsset[];
  sponsor_showcase: MediaAsset[];
};

const fetchEventMedia = unstable_cache(
  async (eventId: string): Promise<MediaAsset[]> => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("media_assets")
      .select("*")
      .eq("entity_type", "event")
      .eq("entity_id", eventId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    return (data ?? []) as MediaAsset[];
  },
  ["event-media"],
  { revalidate: 60 }
);

export async function getEventMedia(eventId: string): Promise<GroupedMedia> {
  const all = await fetchEventMedia(eventId);
  return {
    hero: all.filter((a) => a.placement === "hero"),
    gallery: all.filter((a) => a.placement === "gallery"),
    section: all.filter((a) => a.placement === "section"),
    banner: all.filter((a) => a.placement === "banner"),
    hero_secondary: all.filter((a) => a.placement === "hero_secondary"),
    route_preview: all.filter((a) => a.placement === "route_preview"),
    testimonial: all.filter((a) => a.placement === "testimonial"),
    inline_section: all.filter((a) => a.placement === "inline_section"),
    background_loop: all.filter((a) => a.placement === "background_loop"),
    sponsor_showcase: all.filter((a) => a.placement === "sponsor_showcase"),
  };
}

export async function getHeroMedia(eventId: string): Promise<MediaAsset | null> {
  const { hero } = await getEventMedia(eventId);
  return hero[0] ?? null;
}

export async function getGalleryMedia(eventId: string): Promise<MediaAsset[]> {
  const { gallery } = await getEventMedia(eventId);
  return gallery;
}

/** Fetch all assets for an entity (admin use — bypasses is_active filter). */
export async function getAllEntityMedia(entityId: string): Promise<MediaAsset[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("media_assets")
    .select("*")
    .eq("entity_id", entityId)
    .order("placement", { ascending: true })
    .order("sort_order", { ascending: true });
  return (data ?? []) as MediaAsset[];
}

export type SponsorRow =
  Database["public"]["Tables"]["sponsors"]["Row"];

const fetchActiveSponsors = unstable_cache(
  async (orgId: string): Promise<SponsorRow[]> => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("sponsors")
      .select("*")
      .eq("org_id", orgId)
      .in("status", ["committed", "paid"])
      .order("name", { ascending: true });
    return (data ?? []) as SponsorRow[];
  },
  ["active-sponsors"],
  { revalidate: 300 }
);

export async function getActiveSponsors(orgId: string): Promise<SponsorRow[]> {
  return fetchActiveSponsors(orgId);
}
