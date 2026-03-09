import { requireAdmin } from "@/lib/require-admin";
import { CampaignEditor } from "../campaign-editor";

export const metadata = { title: "New Campaign | Admin" };

export default async function NewCampaignPage() {
  await requireAdmin();
  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold">Create Campaign</h1>
      <CampaignEditor />
    </section>
  );
}
