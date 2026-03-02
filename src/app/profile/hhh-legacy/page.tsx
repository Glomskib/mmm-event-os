import { redirect } from "next/navigation";
import { Hero } from "@/components/layout/hero";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { HhhLegacyClient } from "./hhh-legacy-client";
import Link from "next/link";

export const metadata = { title: "HHH Legacy Miles | MMM Event OS" };

export default async function HhhLegacyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/profile/hhh-legacy");

  const admin = createAdminClient();

  // Fetch user profile for display name
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  // Fetch existing legacy entries
  const { data: legacyRows } = await admin
    .from("hhh_legacy_entries")
    .select("year, miles")
    .eq("user_id", user.id)
    .order("year", { ascending: true });

  const legacyMap = new Map<number, number>(
    (legacyRows ?? []).map((r) => [r.year, r.miles])
  );
  const legacyMilesTotal = [...legacyMap.values()].reduce((s, m) => s + m, 0);

  // Fetch HHH auto registrations (series_key='hhh', year >= 2025, paid or free)
  const { data: autoRegs } = await admin
    .from("registrations")
    .select("distance, status, event_id, events!inner(title, date, series_key)")
    .eq("user_id", user.id)
    .eq("events.series_key", "hhh")
    .in("status", ["paid", "free"]);

  const hhhAutoRegs = (autoRegs ?? [])
    .map((r) => {
      const ev = r.events as { title: string; date: string; series_key: string };
      const year = new Date(ev.date).getFullYear();
      const milesMatch = r.distance?.match(/(\d+)/);
      const miles = milesMatch ? parseInt(milesMatch[1], 10) : 0;
      return { title: ev.title, year, distance: r.distance ?? "", status: r.status, miles };
    })
    .filter((r) => r.year >= 2025);

  const autoMilesTotal = hhhAutoRegs.reduce((s, r) => s + r.miles, 0);
  const totalMiles = legacyMilesTotal + autoMilesTotal;

  return (
    <>
      <Hero
        title="HHH Legacy Miles"
        subtitle={profile?.full_name ?? profile?.email ?? "Your lifetime HHH miles"}
      />

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center gap-3">
          <Link
            href="/profile"
            className="text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            ← Profile
          </Link>
          <span className="text-muted-foreground/40">|</span>
          <Link
            href="/hhh-legacy"
            className="text-sm text-primary hover:underline"
          >
            View Leaderboard
          </Link>
        </div>

        <HhhLegacyClient
          legacyEntries={Object.fromEntries(legacyMap)}
          autoRegistrations={hhhAutoRegs}
          legacyMilesTotal={legacyMilesTotal}
          autoMilesTotal={autoMilesTotal}
          totalMiles={totalMiles}
        />
      </section>
    </>
  );
}
