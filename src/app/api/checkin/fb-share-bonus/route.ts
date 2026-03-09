import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/org";

/**
 * POST /api/checkin/fb-share-bonus
 * Awards 1 bonus raffle ticket for sharing a check-in on Facebook.
 * Idempotent: uses source_id "fb_share:{checkin_id}" to prevent duplicates.
 */
export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { checkinId } = await request.json();

  if (!checkinId || typeof checkinId !== "string") {
    return NextResponse.json(
      { error: "checkinId is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Verify the checkin belongs to this user
  const { data: checkin, error: checkinErr } = await admin
    .from("checkins")
    .select("id, org_id, user_id")
    .eq("id", checkinId)
    .eq("user_id", profile.id)
    .single();

  if (checkinErr || !checkin) {
    return NextResponse.json(
      { error: "Check-in not found" },
      { status: 404 }
    );
  }

  const sourceId = `fb_share:${checkinId}`;

  // Check if bonus already claimed
  const { data: existing } = await admin
    .from("raffle_entries")
    .select("id")
    .eq("source_id", sourceId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ already_claimed: true, tickets: 0 });
  }

  // Insert bonus raffle entry
  const { error: insertErr } = await admin.from("raffle_entries").insert({
    org_id: checkin.org_id,
    user_id: checkin.user_id,
    source: "bonus" as const,
    source_id: sourceId,
    tickets_count: 1,
    note: "Facebook share bonus",
    checkin_id: checkinId,
  });

  if (insertErr) {
    // Handle unique constraint violation (idempotent)
    if (insertErr.message.includes("duplicate")) {
      return NextResponse.json({ already_claimed: true, tickets: 0 });
    }
    console.error("[fb-share-bonus] insert error:", insertErr);
    return NextResponse.json(
      { error: "Failed to award bonus" },
      { status: 500 }
    );
  }

  return NextResponse.json({ already_claimed: false, tickets: 1 });
}
