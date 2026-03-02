import { Hero } from "@/components/layout/hero";
import { createAdminClient } from "@/lib/supabase/admin";
import { HhhLeaderboardClient } from "./hhh-leaderboard-client";

export const metadata = { title: "HHH Legacy Leaderboard | Making Miles Matter" };

export const revalidate = 300; // 5 minutes

export default async function HhhLegacyLeaderboardPage() {
  const admin = createAdminClient();

  const { data: entries } = await admin
    .from("hhh_legacy_leaderboard_v")
    .select("*")
    .order("total_miles", { ascending: false })
    .limit(100);

  const rows = (entries ?? []).filter((r) => (r.total_miles ?? 0) > 0);

  return (
    <>
      <Hero
        title="HHH Legacy Miles Board"
        subtitle="Lifetime Hancock Horizontal Hundred miles — 1974 to present"
      />

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <HhhLeaderboardClient rows={rows} />
      </section>
    </>
  );
}
