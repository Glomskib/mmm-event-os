import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/event-slug";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://makingmilesmatter.com";

  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("title, slug, created_at")
    .eq("status", "published");

  const eventPages = (events ?? []).map((e) => ({
    url: `${baseUrl}/events/${e.slug ?? slugify(e.title)}`,
    lastModified: e.created_at ? new Date(e.created_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/rides`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/donate`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/volunteer`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/sponsors`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/faq`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/wheels-and-reels`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/leaderboard`,
      changeFrequency: "daily",
      priority: 0.6,
    },
    ...eventPages,
  ];
}
