import { Hero } from "@/components/layout/hero";
import { getCurrentOrg } from "@/lib/org";
import { createUntypedAdminClient as createAdminClient } from "@/lib/supabase/admin";
import { SponsorsClient } from "./sponsors-client";

export const metadata = { title: "Sponsors | Admin" };

/** Pipeline fundraising goal in dollars */
export const PIPELINE_GOAL_DOLLARS = 10_000;

export default async function AdminSponsorsPage() {
  const org = await getCurrentOrg();
  if (!org) return <p className="p-8 text-center">Organization not found.</p>;

  const db = createAdminClient();

  // Fetch sponsors first to get IDs
  const { data: sponsors } = await db
    .from("sponsors")
    .select("*")
    .eq("org_id", org.id)
    .order("name");

  const sponsorIds = (sponsors ?? []).map((s) => s.id);

  // Fetch contacts, interactions, and templates in parallel
  const [{ data: contacts }, { data: interactions }, { data: templates }] =
    await Promise.all([
      sponsorIds.length > 0
        ? db
            .from("sponsor_contacts")
            .select("*")
            .in("sponsor_id", sponsorIds)
        : Promise.resolve({ data: [] }),
      sponsorIds.length > 0
        ? db
            .from("sponsor_interactions")
            .select("*")
            .in("sponsor_id", sponsorIds)
            .order("occurred_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      db
        .from("sponsor_email_templates")
        .select("id, name, subject, body_markdown, tags")
        .eq("org_id", org.id)
        .order("name"),
    ]);

  // Compute pipeline totals (committed + paid statuses)
  const pipelineTotal = (sponsors ?? [])
    .filter((s) => s.status === "committed" || s.status === "paid")
    .reduce((sum, s) => sum + (s.committed_amount ?? 0), 0);

  return (
    <>
      <Hero
        title="Sponsor CRM"
        subtitle="Track sponsors, outreach, and commitments"
      />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SponsorsClient
          orgId={org.id}
          sponsors={sponsors ?? []}
          contacts={contacts ?? []}
          interactions={interactions ?? []}
          templates={templates ?? []}
          pipelineTotal={pipelineTotal}
          pipelineGoal={PIPELINE_GOAL_DOLLARS}
        />
      </section>
    </>
  );
}
