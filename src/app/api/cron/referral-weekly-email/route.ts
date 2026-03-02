import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";
import { MILESTONE_TIERS } from "@/lib/referrals";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const resend = new Resend(process.env.RESEND_API_KEY);

  // --- Run milestone check inline ---
  const { data: allEntries } = await admin
    .from("referral_leaderboard_v")
    .select("user_id, referral_count");

  let milestonesAwarded = 0;
  for (const entry of allEntries ?? []) {
    if (!entry.user_id || entry.referral_count == null) continue;
    for (const tier of MILESTONE_TIERS) {
      if (entry.referral_count >= tier.count) {
        const { error: insertError } = await admin
          .from("referral_rewards")
          .insert({
            user_id: entry.user_id,
            tier: tier.tier,
            source_count: entry.referral_count,
          });
        if (!insertError) milestonesAwarded++;
        // 23505 (unique_violation) = already unlocked, ignore
      }
    }
  }

  // --- Build top-10 HTML ---
  const { data: top10 } = await admin
    .from("referral_leaderboard_v")
    .select("*")
    .order("rank", { ascending: true })
    .limit(10);

  const top10Html = `
    <table style="width:100%;border-collapse:collapse;font-family:sans-serif;">
      <tr style="background:#f3f4f6;">
        <th style="padding:8px;text-align:left;">Rank</th>
        <th style="padding:8px;text-align:left;">Name</th>
        <th style="padding:8px;text-align:right;">Referrals</th>
      </tr>
      ${(top10 ?? [])
        .map(
          (e) => `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:8px;">${e.rank ?? "—"}</td>
          <td style="padding:8px;">${e.full_name ?? "Anonymous"}</td>
          <td style="padding:8px;text-align:right;">${e.referral_count ?? 0}</td>
        </tr>`
        )
        .join("")}
    </table>
  `;

  // --- Fetch all referrers with their codes + profiles ---
  const { data: referrers } = await admin
    .from("referral_leaderboard_v")
    .select("*");

  // Get emails from profiles
  const userIds = (referrers ?? [])
    .map((r) => r.user_id)
    .filter((id): id is string => id !== null);
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, email")
    .in("id", userIds.length > 0 ? userIds : ["__none__"]);

  const emailMap = new Map(
    (profiles ?? []).map((p) => [p.id, p.email])
  );

  // --- Send personalized emails sequentially ---
  let sent = 0;
  const errors: string[] = [];

  for (const referrer of referrers ?? []) {
    if (!referrer.user_id || referrer.referral_count == null) continue;
    const email = emailMap.get(referrer.user_id);
    if (!email) continue;

    const count = referrer.referral_count;
    const nextTier = MILESTONE_TIERS.find((t) => count < t.count);
    const nextHint = nextTier
      ? `You're ${nextTier.count - count} referral${nextTier.count - count === 1 ? "" : "s"} away from <strong>${nextTier.label}</strong> (${nextTier.reward})!`
      : "You've unlocked every milestone. You're a legend!";

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://makingmilesmatter.org";
    const referralLink = `${siteUrl}/events?ref=${referrer.code}`;

    try {
      await resend.emails.send({
        from: "Making Miles Matter <noreply@makingmilesmatter.org>",
        to: email,
        subject: `Your Referral Update — Rank #${referrer.rank ?? "—"}`,
        html: `
          <h2>Weekly Referral Update</h2>
          <p>Hi ${referrer.full_name ?? "there"},</p>
          <p>You're currently <strong>#${referrer.rank ?? "—"}</strong> on the leaderboard with <strong>${count}</strong> referral${count === 1 ? "" : "s"}.</p>
          <p>${nextHint}</p>
          <h3>Top 10 Leaderboard</h3>
          ${top10Html}
          <p style="margin-top:24px;">
            <strong>Your referral link:</strong><br/>
            <a href="${referralLink}">${referralLink}</a>
          </p>
          <br/>
          <p>— Making Miles Matter</p>
        `,
      });
      sent++;
    } catch (err) {
      errors.push(`${email}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return NextResponse.json({
    ok: true,
    milestonesAwarded,
    emailsSent: sent,
    emailErrors: errors.length,
  });
}
