import { Hero } from "@/components/layout/hero";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";
import { RidesEditorClient } from "./rides-editor-client";

export const metadata = { title: "Rides | Admin | MMM Event OS" };

async function updateSeries(formData: FormData) {
  "use server";

  const id = formData.get("id") as string;
  if (!id) throw new Error("Missing series id");

  const org = await getCurrentOrg();
  if (!org) throw new Error("Org not found");

  const admin = createAdminClient();

  const { error } = await admin
    .from("ride_series")
    .update({
      meet_location: (formData.get("meet_location") as string) || null,
      route_ridewithgps_url:
        (formData.get("route_ridewithgps_url") as string) || null,
      route_strava_url: (formData.get("route_strava_url") as string) || null,
      route_wahoo_url: (formData.get("route_wahoo_url") as string) || null,
      notes: (formData.get("notes") as string) || null,
    })
    .eq("id", id)
    .eq("org_id", org.id);

  if (error) throw new Error(error.message);
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
    ...s,
    dayName: DAY_NAMES[s.day_of_week] ?? `Day ${s.day_of_week}`,
  }));

  return (
    <>
      <Hero
        title="Ride Series Editor"
        subtitle="Edit meet locations, routes, and notes for weekly emails"
      />

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <RidesEditorClient series={seriesList} updateAction={updateSeries} />
      </section>
    </>
  );
}
