import { Hero } from "@/components/layout/hero";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";
import { LogisticsClient } from "./logistics-client";

export const metadata = { title: "Logistics | Admin" };

export default async function LogisticsPage() {
  const org = await getCurrentOrg();
  if (!org) return <p className="p-8 text-center">Organization not found.</p>;

  const db = createUntypedAdminClient();

  const [{ data: items }, { data: events }] = await Promise.all([
    db
      .from("event_logistics_items")
      .select("*")
      .eq("org_id", org.id)
      .order("sort_order"),
    db
      .from("events")
      .select("id, title, date")
      .eq("org_id", org.id)
      .eq("status", "published")
      .order("date", { ascending: true }),
  ]);

  return (
    <>
      <Hero title="Event Logistics" subtitle="Checklist and operational items" />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <LogisticsClient
          orgId={org.id}
          items={items ?? []}
          events={events ?? []}
        />
      </section>
    </>
  );
}
