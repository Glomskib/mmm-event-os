import { Hero } from "@/components/layout/hero";
import { getCurrentOrg } from "@/lib/org";
import { createAdminClient } from "@/lib/supabase/admin";
import { FilmsClient } from "./films-client";
import { addFilm, toggleFilmActive, deleteFilm } from "./actions";

export const metadata = { title: "Wheels & Reels | Admin" };

export default async function WheelsAndReelsAdminPage() {
  const org = await getCurrentOrg();
  if (!org) return <p className="p-8 text-center">Organization not found.</p>;

  const db = createAdminClient();
  const { data: films } = await db
    .from("films")
    .select("id, title, description, trailer_url, poster_url, active, created_at")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <Hero
        title="Wheels & Reels"
        subtitle="Manage films and video content for the public page."
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <FilmsClient
          films={films ?? []}
          orgId={org.id}
          addFilmAction={addFilm}
          toggleFilmActiveAction={toggleFilmActive}
          deleteFilmAction={deleteFilm}
        />
      </section>
    </>
  );
}
