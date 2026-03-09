import { Hero } from "@/components/layout/hero";
import { getCurrentOrg } from "@/lib/org";
import { SocialFormClient } from "./social-form-client";

export const metadata = { title: "Social Drafts | Admin" };

export default async function SocialPage() {
  const org = await getCurrentOrg();
  if (!org) return <p>Org not found</p>;

  return (
    <>
      <Hero
        title="Social Post Builder"
        subtitle="Create drafts and route them through approvals"
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SocialFormClient orgId={org.id} />
      </section>
    </>
  );
}
