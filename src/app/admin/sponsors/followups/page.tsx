import { Hero } from "@/components/layout/hero";
import { getCurrentOrg } from "@/lib/org";
import { createUntypedAdminClient as createAdminClient } from "@/lib/supabase/admin";
import { FollowupsClient } from "./followups-client";

export const metadata = { title: "Sponsor Follow-ups | Admin" };

export default async function SponsorFollowupsPage() {
  const org = await getCurrentOrg();
  if (!org) return <p className="p-8 text-center">Organization not found.</p>;

  const db = createAdminClient();

  const sevenDaysOut = new Date();
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);

  // Fetch sponsors with a followup date set (any date — we bucket client-side)
  const { data: sponsors } = await db
    .from("sponsors")
    .select("id, name, status, next_followup_at, committed_amount, notes")
    .eq("org_id", org.id)
    .not("next_followup_at", "is", null)
    .not("status", "in", '("declined","paid")')
    .order("next_followup_at", { ascending: true });

  // Fetch primary contacts
  const sponsorIds = (sponsors ?? []).map((s) => s.id);
  const { data: contacts } =
    sponsorIds.length > 0
      ? await db
          .from("sponsor_contacts")
          .select("id, sponsor_id, name, email, phone")
          .in("sponsor_id", sponsorIds)
      : { data: [] };

  // Fetch templates for quick draft
  const { data: templates } = await db
    .from("sponsor_email_templates")
    .select("id, name, subject")
    .eq("org_id", org.id)
    .order("name");

  return (
    <>
      <Hero
        title="Follow-ups"
        subtitle="Overdue and upcoming sponsor touchpoints"
      />
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <FollowupsClient
          sponsors={sponsors ?? []}
          contacts={contacts ?? []}
          templates={templates ?? []}
        />
      </section>
    </>
  );
}
