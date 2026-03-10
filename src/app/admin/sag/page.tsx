import { Hero } from "@/components/layout/hero";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";
import { SagClient } from "./sag-client";

export const metadata = { title: "SAG Vehicles | Admin" };

export default async function SagPage() {
  const org = await getCurrentOrg();
  if (!org) return <p className="p-8 text-center">Organization not found.</p>;

  const db = createUntypedAdminClient();

  const [{ data: vehicles }, { data: events }] = await Promise.all([
    db.from("sag_assignments").select("*").eq("org_id", org.id).order("created_at"),
    db.from("events").select("id, title").eq("org_id", org.id).eq("status", "published"),
  ]);

  return (
    <>
      <Hero title="SAG Vehicles" subtitle="Support and gear vehicle assignments" />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SagClient orgId={org.id} vehicles={vehicles ?? []} events={events ?? []} />
      </section>
    </>
  );
}
