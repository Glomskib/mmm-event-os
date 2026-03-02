import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MILESTONE_TIERS, MILESTONE_TICKET_MAP, assertMilestoneTickets } from "@/lib/referrals";
import { createLogger } from "@/lib/logger";

const log = createLogger("cron:referral-milestones");

// Fail fast if ticket map drifts from the documented program
assertMilestoneTickets();

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timer = log.timed("execute");
  const admin = createAdminClient();

  // Fetch all referrers from the leaderboard view (include org_id for raffle entries)
  const { data: entries, error } = await admin
    .from("referral_leaderboard_v")
    .select("user_id, referral_count, org_id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let awarded = 0;
  let raffleTicketsCreated = 0;

  for (const entry of entries ?? []) {
    if (!entry.user_id || !entry.org_id || entry.referral_count == null) continue;
    for (const tier of MILESTONE_TIERS) {
      if (entry.referral_count >= tier.count) {
        const { data: reward, error: insertError } = await admin
          .from("referral_rewards")
          .insert({
            user_id: entry.user_id,
            tier: tier.tier,
            source_count: entry.referral_count,
          })
          .select("id")
          .single();

        if (insertError) {
          // 23505 = unique_violation → already unlocked, skip
          if (insertError.code !== "23505") {
            console.error(
              `Failed to insert reward for ${entry.user_id}/${tier.tier}:`,
              insertError.message
            );
          }
        } else {
          awarded++;

          // Create raffle entry for newly awarded milestone (skip perk-only tiers)
          const tickets = MILESTONE_TICKET_MAP[tier.tier] ?? 0;
          if (tickets > 0) {
            const sourceId = `referral_reward:${reward.id}`;

            const { error: raffleError } = await admin
              .from("raffle_entries")
              .insert({
                org_id: entry.org_id,
                user_id: entry.user_id,
                source: "referral",
                source_id: sourceId,
                tickets_count: tickets,
                note: `${tier.label} milestone (${tier.count} referrals) — ${tickets} ticket${tickets > 1 ? "s" : ""}`,
              });

            if (raffleError && raffleError.code !== "23505") {
              console.error(
                `Failed to insert raffle entry for ${entry.user_id}/${tier.tier}:`,
                raffleError.message
              );
            } else if (!raffleError) {
              raffleTicketsCreated += tickets;
            }
          }
        }
      }
    }
  }

  timer.end({ awarded, raffleTicketsCreated });

  return NextResponse.json({ ok: true, awarded, raffleTicketsCreated });
}
