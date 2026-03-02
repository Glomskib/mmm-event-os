import { Hero } from "@/components/layout/hero";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentOrg } from "@/lib/org";
import {
  isVotingOpen,
  JERSEY_VOTE_YEAR,
  JERSEY_VOTE_CUTOFF_UTC,
} from "@/lib/jersey-voting";
import { EventCountdown } from "@/components/event/event-countdown";
import { VoteClient, type DesignWithStats } from "@/components/jersey/vote-client";

export const metadata = {
  title: "Vote for the 2026 HHH Jersey | Making Miles Matter",
};

async function castVoteAction(
  designId: string
): Promise<{ ok: boolean; error?: string }> {
  "use server";

  const year = JERSEY_VOTE_YEAR;
  if (!isVotingOpen(year)) {
    return { ok: false, error: "Voting is closed." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be logged in to vote." };

  const org = await getCurrentOrg();
  if (!org) return { ok: false, error: "Org not found." };

  const admin = createAdminClient();

  // Verify design exists and is active
  const { data: design } = await admin
    .from("jersey_designs")
    .select("id, year")
    .eq("id", designId)
    .eq("active", true)
    .single();

  if (!design) return { ok: false, error: "Design not found." };
  if (design.year !== year) return { ok: false, error: "Design is not for the current year." };

  // Delete any existing vote for this user+year, then insert new vote
  await admin.from("jersey_votes").delete().eq("user_id", user.id).eq("year", year);

  const { error } = await admin.from("jersey_votes").insert({
    org_id: org.id,
    design_id: designId,
    user_id: user.id,
    year,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export default async function JerseyVotePage() {
  const year = JERSEY_VOTE_YEAR;
  const votingOpen = isVotingOpen(year);
  const admin = createAdminClient();
  const supabase = await createClient();

  // Fetch active designs for this year
  const { data: rawDesigns } = await admin
    .from("jersey_designs")
    .select("id, title, description, image_url")
    .eq("year", year)
    .eq("active", true)
    .order("created_at", { ascending: true });

  // Fetch all votes for this year (to compute counts)
  const { data: allVotes } = await admin
    .from("jersey_votes")
    .select("design_id")
    .eq("year", year);

  const voteCounts = new Map<string, number>();
  for (const v of allVotes ?? []) {
    if (!v.design_id) continue;
    voteCounts.set(v.design_id, (voteCounts.get(v.design_id) ?? 0) + 1);
  }
  const totalVotes = (allVotes ?? []).length;

  // Fetch current user's vote
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let userVoteDesignId: string | null = null;
  if (user) {
    const { data: userVote } = await admin
      .from("jersey_votes")
      .select("design_id")
      .eq("user_id", user.id)
      .eq("year", year)
      .maybeSingle();
    userVoteDesignId = userVote?.design_id ?? null;
  }

  // Build designs with stats
  const designs: DesignWithStats[] = (rawDesigns ?? []).map((d) => {
    const count = voteCounts.get(d.id) ?? 0;
    return {
      id: d.id,
      title: d.title,
      description: d.description ?? null,
      image_url: d.image_url,
      voteCount: count,
      pct: totalVotes > 0 ? (count / totalVotes) * 100 : 0,
    };
  });

  return (
    <>
      <Hero
        title="Help Choose the 2026 HHH Jersey"
        subtitle={
          votingOpen
            ? "Vote for your favorite design — voting closes May 1, 2026 at midnight ET."
            : "Voting is closed. Here are the final results."
        }
      />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        {/* Countdown — only while voting is open */}
        {votingOpen && (
          <div className="space-y-2">
            <p className="text-center text-sm font-medium text-muted-foreground">
              Voting closes in
            </p>
            <EventCountdown eventDate={JERSEY_VOTE_CUTOFF_UTC} />
            <p className="text-center text-xs text-muted-foreground">
              May 1, 2026 at 11:59 PM Eastern Time
            </p>
          </div>
        )}

        {/* Vote grid */}
        <VoteClient
          designs={designs}
          userVoteDesignId={userVoteDesignId}
          votingOpen={votingOpen}
          totalVotes={totalVotes}
          year={year}
          isAuthenticated={!!user}
          castVote={castVoteAction}
        />
      </section>
    </>
  );
}
