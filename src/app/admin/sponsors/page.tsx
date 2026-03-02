import { Hero } from "@/components/layout/hero";
import { getCurrentOrg } from "@/lib/org";
import { createAdminClient } from "@/lib/supabase/admin";
import { SponsorsClient } from "./sponsors-client";

export const metadata = { title: "Sponsors | Admin | MMM Event OS" };

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

  // Then fetch contacts + interactions in parallel
  const [{ data: contacts }, { data: interactions }] =
    sponsorIds.length > 0
      ? await Promise.all([
          db.from("sponsor_contacts").select("*").in("sponsor_id", sponsorIds),
          db
            .from("sponsor_interactions")
            .select("*")
            .in("sponsor_id", sponsorIds)
            .order("occurred_at", { ascending: false }),
        ])
      : [{ data: [] }, { data: [] }];

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
        />
      </section>
    </>
  );
}
