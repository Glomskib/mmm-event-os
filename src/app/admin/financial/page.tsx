import { Hero } from "@/components/layout/hero";
import { createUntypedAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";
import { FinancialClient } from "./financial-client";

export const metadata = { title: "Financial Summary | Admin" };

export default async function FinancialPage() {
  const org = await getCurrentOrg();
  if (!org) return <p className="p-8 text-center">Organization not found.</p>;

  const db = createUntypedAdminClient();

  const [{ data: summaries }, { data: events }] = await Promise.all([
    db.from("financial_summary").select("*").eq("org_id", org.id).order("created_at", { ascending: false }),
    db.from("events").select("id, title, date").eq("org_id", org.id).order("date", { ascending: true }),
  ]);

  return (
    <>
      <Hero title="Financial Summary" subtitle="Event P&L and expense tracking" />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <FinancialClient orgId={org.id} summaries={summaries ?? []} events={events ?? []} />
      </section>
    </>
  );
}
