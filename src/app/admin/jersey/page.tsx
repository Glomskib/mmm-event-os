import { Hero } from "@/components/layout/hero";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";
import { JERSEY_VOTE_YEAR } from "@/lib/jersey-voting";
import {
  JerseyAdminClient,
  type DesignRow,
} from "./jersey-admin-client";

export const metadata = { title: "Jersey Voting | Admin" };

async function createDesign(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  "use server";

  const org = await getCurrentOrg();
  if (!org) return { ok: false, error: "Org not found." };

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const year = parseInt(formData.get("year") as string, 10);
  const image_url = (formData.get("image_url") as string)?.trim();

  if (!title) return { ok: false, error: "Title is required." };
  if (!image_url) return { ok: false, error: "Image URL is required." };
  if (!year || year < 2020 || year > 2099) return { ok: false, error: "Invalid year." };

  const admin = createAdminClient();
  const { error } = await admin.from("jersey_designs").insert({
    org_id: org.id,
    series_key: "hhh",
    year,
    title,
    description,
    image_url,
    active: true,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function toggleActive(
  id: string,
  active: boolean
): Promise<{ ok: boolean; error?: string }> {
  "use server";

  const org = await getCurrentOrg();
  if (!org) return { ok: false, error: "Org not found." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("jersey_designs")
    .update({ active })
    .eq("id", id)
    .eq("org_id", org.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function deleteDesign(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  "use server";

  const org = await getCurrentOrg();
  if (!org) return { ok: false, error: "Org not found." };

  const admin = createAdminClient();

  // Safety check: refuse if votes exist
  const { count } = await admin
    .from("jersey_votes")
    .select("id", { count: "exact", head: true })
    .eq("design_id", id);

  if ((count ?? 0) > 0) {
    return { ok: false, error: "Cannot delete a design that has votes." };
  }

  const { error } = await admin
    .from("jersey_designs")
    .delete()
    .eq("id", id)
    .eq("org_id", org.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export default async function AdminJerseyPage() {
  const org = await getCurrentOrg();
  if (!org) return <p>Org not found</p>;

  const admin = createAdminClient();

  // Fetch all designs for this year (including inactive)
  const { data: designs } = await admin
    .from("jersey_designs")
    .select("id, title, description, image_url, year, active, created_at")
    .eq("org_id", org.id)
    .eq("year", JERSEY_VOTE_YEAR)
    .order("created_at", { ascending: true });

  // Fetch vote counts
  const { data: votes } = await admin
    .from("jersey_votes")
    .select("design_id")
    .eq("year", JERSEY_VOTE_YEAR);

  const voteCounts = new Map<string, number>();
  for (const v of votes ?? []) {
    if (!v.design_id) continue;
    voteCounts.set(v.design_id, (voteCounts.get(v.design_id) ?? 0) + 1);
  }

  const totalVotes = (votes ?? []).length;

  const rows: DesignRow[] = (designs ?? [])
    .map((d) => ({
      id: d.id,
      title: d.title,
      description: d.description ?? null,
      image_url: d.image_url,
      year: d.year,
      active: d.active,
      created_at: d.created_at,
      voteCount: voteCounts.get(d.id) ?? 0,
    }))
    .sort((a, b) => b.voteCount - a.voteCount);

  return (
    <>
      <Hero
        title="Jersey Voting"
        subtitle={`Manage designs and results for the ${JERSEY_VOTE_YEAR} HHH jersey vote`}
      />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <JerseyAdminClient
          designs={rows}
          totalVotes={totalVotes}
          createAction={createDesign}
          toggleActiveAction={toggleActive}
          deleteAction={deleteDesign}
        />
      </section>
    </>
  );
}
