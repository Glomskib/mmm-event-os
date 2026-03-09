import { Hero } from "@/components/layout/hero";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";
import { validateEmbedHtml } from "@/lib/embed-sanitize";
import { RidesEditorClient } from "./rides-editor-client";

export const metadata = { title: "Rides | Admin" };

async function updateSeries(formData: FormData) {
  "use server";

  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing series id");

  const org = await getCurrentOrg();
  if (!org) throw new Error("Org not found");

  const admin = createAdminClient();

  const rawEmbed = (formData.get("route_embed_html") as string) || null;
  const embedError = validateEmbedHtml(rawEmbed);
  if (embedError) throw new Error(`Route embed invalid: ${embedError}`);

  const { error } = await admin
    .from("ride_series")
    .update({
      meet_location: (formData.get("meet_location") as string) || null,
      route_ridewithgps_url:
        (formData.get("route_ridewithgps_url") as string) || null,
      route_strava_url: (formData.get("route_strava_url") as string) || null,
      route_wahoo_url: (formData.get("route_wahoo_url") as string) || null,
      route_embed_html: rawEmbed,
      notes: (formData.get("notes") as string) || null,
    })
    .eq("id", id)
    .eq("org_id", org.id);

  if (error) throw new Error(error.message);
}

/**
 * Create occurrences for the next 8 weeks for a given ride_series.
 * Skips dates that already have an occurrence.
 */
async function createOccurrencesFor8Weeks(seriesId: string): Promise<{ created: number }> {
  "use server";

  const org = await getCurrentOrg();
  if (!org) throw new Error("Org not found");

  const admin = createAdminClient();

  const { data: s } = await admin
    .from("ride_series")
    .select("id, org_id, day_of_week")
    .eq("id", seriesId)
    .eq("org_id", org.id)
    .single();

  if (!s) throw new Error("Series not found");

  // Generate next 8 occurrences on the correct day of week
  const today = new Date();
  const dates: string[] = [];
  const cursor = new Date(today);
  // advance to the next occurrence of day_of_week
  while (cursor.getDay() !== s.day_of_week) {
    cursor.setDate(cursor.getDate() + 1);
  }
  for (let i = 0; i < 8; i++) {
    dates.push(cursor.toISOString().split("T")[0]);
    cursor.setDate(cursor.getDate() + 7);
  }

  // Find already-existing occurrences for those dates
  const { data: existing } = await admin
    .from("ride_occurrences")
    .select("date")
    .eq("series_id", seriesId)
    .in("date", dates);

  const existingDates = new Set((existing ?? []).map((e) => e.date));
  const toInsert = dates
    .filter((d) => !existingDates.has(d))
    .map((d) => ({
      org_id: s.org_id,
      series_id: s.id,
      date: d,
      cancelled: false,
    }));

  if (toInsert.length > 0) {
    const { error } = await admin.from("ride_occurrences").insert(toInsert);
    if (error) throw new Error(error.message);
  }

  return { created: toInsert.length };
}

/**
 * Duplicate the most recent occurrence of a series to next week.
 * Inherits note/location/route overrides from the most recent past occurrence.
 */
async function duplicateToNextWeek(seriesId: string): Promise<{ date: string }> {
  "use server";

  const org = await getCurrentOrg();
  if (!org) throw new Error("Org not found");

  const admin = createAdminClient();

  // Get the most recent occurrence (could be past or future)
  const { data: latest } = await admin
    .from("ride_occurrences")
    .select("*")
    .eq("series_id", seriesId)
    .eq("org_id", org.id)
    .order("date", { ascending: false })
    .limit(1)
    .single();

  if (!latest) throw new Error("No existing occurrences to duplicate");

  // Target date = latest.date + 7 days
  const baseDate = new Date(latest.date + "T00:00:00");
  baseDate.setDate(baseDate.getDate() + 7);
  const newDate = baseDate.toISOString().split("T")[0];

  // Check if occurrence already exists for that date
  const { data: existing } = await admin
    .from("ride_occurrences")
    .select("id")
    .eq("series_id", seriesId)
    .eq("date", newDate)
    .limit(1);

  if (existing && existing.length > 0) {
    return { date: newDate }; // already exists, no-op
  }

  const { error } = await admin.from("ride_occurrences").insert({
    org_id: org.id,
    series_id: seriesId,
    date: newDate,
    cancelled: false,
    note: latest.note ?? null,
    meet_location: latest.meet_location ?? null,
    route_ridewithgps_url: latest.route_ridewithgps_url ?? null,
    route_strava_url: latest.route_strava_url ?? null,
    route_wahoo_url: latest.route_wahoo_url ?? null,
    route_embed_html: latest.route_embed_html ?? null,
    notes: latest.notes ?? null,
  });

  if (error) throw new Error(error.message);
  return { date: newDate };
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default async function AdminRidesPage() {
  const org = await getCurrentOrg();
  if (!org) return <p>Org not found</p>;

  const admin = createAdminClient();

  const { data: series } = await admin
    .from("ride_series")
    .select("*")
    .eq("org_id", org.id)
    .order("day_of_week", { ascending: true });

  const seriesList = (series ?? []).map((s) => ({
    id: s.id,
    title: s.title,
    dayName: DAY_NAMES[s.day_of_week] ?? `Day ${s.day_of_week}`,
    time: s.time,
    difficulty: s.difficulty as "easy" | "moderate" | "hard",
    meet_location: s.meet_location ?? null,
    route_ridewithgps_url: s.route_ridewithgps_url ?? null,
    route_strava_url: s.route_strava_url ?? null,
    route_wahoo_url: s.route_wahoo_url ?? null,
    route_embed_html: s.route_embed_html ?? null,
    notes: s.notes ?? null,
  }));

  return (
    <>
      <Hero
        title="Ride Series Editor"
        subtitle="Edit meet locations, routes, and notes for weekly emails"
      />

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <RidesEditorClient
          series={seriesList}
          updateAction={updateSeries}
          createOccurrencesAction={createOccurrencesFor8Weeks}
          duplicateToNextWeekAction={duplicateToNextWeek}
        />
      </section>
    </>
  );
}
