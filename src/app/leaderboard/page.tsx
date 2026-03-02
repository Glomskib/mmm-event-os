import { Hero } from "@/components/layout/hero";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrg } from "@/lib/org";
import { LeaderboardTable } from "./leaderboard-table";
import { UserRankCard } from "./user-rank-card";

export const metadata = { title: "Referral Leaderboard | MMM Event OS" };

export const revalidate = 60;

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const org = await getCurrentOrg();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch top 25 from leaderboard view
  const { data: topEntries } = await supabase
    .from("referral_leaderboard_v")
    .select("*")
    .eq("org_id", org?.id ?? "")
    .order("rank", { ascending: true })
    .limit(25);

  // Fetch logged-in user's referral code + stats
  let userCode: string | null = null;
  let userRank: number | null = null;
  let userCount = 0;
  let unlockedTiers: string[] = [];

  if (user) {
    // Parallel fetch: user's code, leaderboard entry, and rewards
    const [{ data: codeRow }, { data: userEntry }, { data: rewards }] =
      await Promise.all([
        supabase
          .from("referral_codes")
          .select("code")
          .eq("user_id", user.id)
          .eq("org_id", org?.id ?? "")
          .single(),
        supabase
          .from("referral_leaderboard_v")
          .select("*")
          .eq("user_id", user.id)
          .eq("org_id", org?.id ?? "")
          .single(),
        supabase
          .from("referral_rewards")
          .select("tier")
          .eq("user_id", user.id),
      ]);

    userCode = codeRow?.code ?? null;

    if (userEntry) {
      userRank = userEntry.rank ?? null;
      userCount = userEntry.referral_count ?? 0;
    }

    unlockedTiers = (rewards ?? []).map((r) => r.tier);
  }

  return (
    <>
      <Hero
        title="Referral Leaderboard"
        subtitle="Share your link, earn rewards, climb the ranks."
      />

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Leaderboard table — wider column */}
          <div className="lg:col-span-3">
            <LeaderboardTable
              entries={topEntries ?? []}
              currentUserId={user?.id ?? null}
            />
          </div>

          {/* User's card — narrower column */}
          <div className="lg:col-span-2">
            {userCode ? (
              <UserRankCard
                data={{
                  code: userCode,
                  referralCount: userCount,
                  rank: userRank,
                  unlockedTiers,
                }}
              />
            ) : (
              <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
                <p>Sign in to get your referral link and track your progress.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
