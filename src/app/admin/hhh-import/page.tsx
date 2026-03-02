import { requireAdmin } from "@/lib/require-admin";
import { Hero } from "@/components/layout/hero";
import { HhhImportClient } from "./hhh-import-client";

export const metadata = { title: "HHH Import | Admin" };

export default async function HhhImportPage() {
  await requireAdmin();

  return (
    <>
      <Hero
        title="HHH Shopify Import"
        subtitle="Import rider registrations from a Shopify order CSV"
      />

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <HhhImportClient />
      </section>
    </>
  );
}
