import { Hero } from "@/components/layout/hero";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";
import { IncidentsClient } from "./incidents-client";

export const metadata = { title: "Incidents | Admin" };

export default async function IncidentsPage() {
  const org = await getCurrentOrg();
  if (!org) return <p className="p-8 text-center">Organization not found.</p>;

  const db = createUntypedAdminClient();

  const [{ data: incidents }, { data: events }] = await Promise.all([
    db
      .from("incident_reports")
      .select("*")
      .eq("org_id", org.id)
      .order("created_at", { ascending: false }),
    db
      .from("events")
      .select("id, title")
      .eq("org_id", org.id)
      .eq("status", "published"),
  ]);

  return (
    <>
      <Hero title="Incident Reports" subtitle="Track and resolve issues" />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <IncidentsClient
          orgId={org.id}
          incidents={incidents ?? []}
          events={events ?? []}
        />
      </section>
    </>
  );
}
