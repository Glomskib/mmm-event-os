import { Hero } from "@/components/layout/hero";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";
import { AidStationsClient } from "./aid-stations-client";

export const metadata = { title: "Aid Stations | Admin" };

export default async function AidStationsPage() {
  const org = await getCurrentOrg();
  if (!org) return <p className="p-8 text-center">Organization not found.</p>;

  const db = createUntypedAdminClient();

  const [{ data: stations }, { data: events }] = await Promise.all([
    db
      .from("aid_stations")
      .select("*")
      .eq("org_id", org.id)
      .order("mile_marker"),
    db
      .from("events")
      .select("id, title")
      .eq("org_id", org.id)
      .eq("status", "published"),
  ]);

  return (
    <>
      <Hero title="Aid Stations" subtitle="Manage rest stops and support points" />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AidStationsClient orgId={org.id} stations={stations ?? []} events={events ?? []} />
      </section>
    </>
  );
}
