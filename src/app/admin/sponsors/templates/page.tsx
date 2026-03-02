import { Hero } from "@/components/layout/hero";
import { getCurrentOrg } from "@/lib/org";
import { createAdminClient } from "@/lib/supabase/admin";
import { TemplatesClient } from "./templates-client";

export const metadata = { title: "Sponsor Templates | Admin | MMM Event OS" };

export default async function SponsorTemplatesPage() {
  const org = await getCurrentOrg();
  if (!org) return <p className="p-8 text-center">Organization not found.</p>;

  const db = createAdminClient();
  const { data: templates } = await db
    .from("sponsor_email_templates")
    .select("*")
    .eq("org_id", org.id)
    .order("name");

  return (
    <>
      <Hero
        title="Email Templates"
        subtitle="Manage reusable sponsor outreach templates"
      />
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <TemplatesClient
          orgId={org.id}
          templates={templates ?? []}
        />
      </section>
    </>
  );
}
