import { Hero } from "@/components/layout/hero";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";
import { DeliverablesClient } from "./deliverables-client";

export const metadata = { title: "Sponsor Deliverables | Admin" };

export default async function SponsorDeliverablesPage() {
  const org = await getCurrentOrg();
  if (!org) return <p className="p-8 text-center">Organization not found.</p>;

  const db = createUntypedAdminClient();

  const [{ data: deliverables }, { data: sponsors }, { data: events }] = await Promise.all([
    db.from("sponsorship_deliverables").select("*").eq("org_id", org.id).order("due_date"),
    db.from("sponsors").select("id, name, tier, status").eq("org_id", org.id).order("name"),
    db.from("events").select("id, title").eq("org_id", org.id).eq("status", "published"),
  ]);

  return (
    <>
      <Hero title="Sponsor Deliverables" subtitle="Track what you owe sponsors" />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DeliverablesClient
          orgId={org.id}
          deliverables={deliverables ?? []}
          sponsors={sponsors ?? []}
          events={events ?? []}
        />
      </section>
    </>
  );
}
