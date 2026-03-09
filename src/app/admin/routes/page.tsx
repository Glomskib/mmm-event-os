import { Hero } from "@/components/layout/hero";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";
import { validateEmbedHtml } from "@/lib/embed-sanitize";
import { RoutesEditorClient, type OccurrenceRouteItem } from "./routes-editor-client";

export const metadata = { title: "Route Editor | Admin" };

async function updateOccurrenceRoute(formData: FormData) {
  "use server";

  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing occurrence id");

  const org = await getCurrentOrg();
  if (!org) throw new Error("Org not found");

  const rawEmbed = (formData.get("route_embed_html") as string) || null;
  const embedError = validateEmbedHtml(rawEmbed);
  if (embedError) throw new Error(`Route embed invalid: ${embedError}`);

  const admin = createAdminClient();

  const { error } = await admin
    .from("ride_occurrences")
    .update({
      route_ridewithgps_url:
        (formData.get("route_ridewithgps_url") as string) || null,
      route_strava_url: (formData.get("route_strava_url") as string) || null,
      route_embed_html: rawEmbed,
    })
    .eq("id", id)
    .eq("org_id", org.id);

  if (error) throw new Error(error.message);
}

export default async function AdminRoutesPage() {
  const org = await getCurrentOrg();
  if (!org) return <p>Org not found</p>;

  const admin = createAdminClient();

  const today = new Date().toISOString().split("T")[0];
  const eightWeeksOut = new Date();
  eightWeeksOut.setDate(eightWeeksOut.getDate() + 56);
  const eightWeeksStr = eightWeeksOut.toISOString().split("T")[0];

  const { data: occurrences } = await admin
    .from("ride_occurrences")
    .select("id, date, route_ridewithgps_url, route_strava_url, route_embed_html, ride_series(title)")
    .eq("org_id", org.id)
    .gte("date", today)
    .lte("date", eightWeeksStr)
    .eq("cancelled", false)
    .order("date", { ascending: true });

  const items: OccurrenceRouteItem[] = (occurrences ?? []).map((occ) => {
    const sr = occ.ride_series as { title?: string } | null;
    const displayDate = new Date(occ.date + "T00:00:00").toLocaleDateString(
      "en-US",
      { weekday: "short", month: "short", day: "numeric" }
    );
    return {
      id: occ.id,
      date: occ.date,
      displayDate,
      seriesTitle: sr?.title ?? "Ride",
      route_ridewithgps_url: occ.route_ridewithgps_url ?? null,
      route_strava_url: occ.route_strava_url ?? null,
      route_embed_html: occ.route_embed_html ?? null,
    };
  });

  return (
    <>
      <Hero
        title="Route Editor"
        subtitle="Set per-occurrence route URLs and embed maps for the next 8 weeks"
      />

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="mb-6 text-sm text-muted-foreground">
          Occurrence-level overrides take priority over the series defaults.
          Leave fields blank to fall back to the series route.
        </p>
        <RoutesEditorClient
          occurrences={items}
          updateAction={updateOccurrenceRoute}
        />
      </section>
    </>
  );
}
