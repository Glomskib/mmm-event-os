import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPrice } from "@/lib/pricing";
import {
  waiverVersion,
  waiverHash,
} from "@/content/waiver/mmm_waiver_2026_v1";

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { event_id, distance, referralCode } = body;

  if (!event_id || !distance) {
    return NextResponse.json(
      { error: "event_id and distance are required." },
      { status: 400 }
    );
  }

  // Look up the event
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, org_id, title, status")
    .eq("id", event_id)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  if (event.status !== "published") {
    return NextResponse.json(
      { error: "Event is not open for registration." },
      { status: 400 }
    );
  }

  // Get current user (optional — guest checkout allowed)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Capture waiver metadata from request headers
  const waiverIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const waiverUserAgent = request.headers.get("user-agent") || "unknown";
  const waiverAcceptedAt = new Date().toISOString();

  const price = getPrice(event.title, distance);
  const isFree = price === 0;

  const admin = createAdminClient();

  const { data: reg, error: regError } = await admin
    .from("registrations")
    .insert({
      org_id: event.org_id,
      event_id: event.id,
      user_id: user?.id || null,
      distance,
      amount: price,
      status: isFree ? "free" : "pending",
      referral_code: referralCode || null,
      email: user?.email || null,
      waiver_accepted: true,
      waiver_accepted_at: waiverAcceptedAt,
      waiver_ip: waiverIp,
      waiver_user_agent: waiverUserAgent,
      waiver_version: waiverVersion,
      waiver_text_hash: waiverHash,
    })
    .select("id")
    .single();

  if (regError || !reg) {
    console.error("Failed to create registration:", regError);
    return NextResponse.json(
      { error: "Failed to create registration." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    registration_id: reg.id,
    is_free: isFree,
  });
}
